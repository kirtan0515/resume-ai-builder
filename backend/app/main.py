import os
from datetime import datetime
from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.schemas import ResumeRequest, ReportRequest, JobSearchRequest
from app.services.ai_service import generate_resume_feedback
from app.services.pdf_service import extract_text_from_pdf
from app.services.job_service import find_matching_jobs
from app.services.resume_only_service import analyze_resume_only
from app.services.stripe_service import (
    create_checkout_session,
    create_portal_session,
    cancel_subscription_at_period_end,
    construct_webhook_event,
)
from app.auth import verify_token, get_or_create_user_record, check_access, record_usage, get_supabase

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="ResumeAI Hub API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://resume-ai-builder-three.vercel.app",
        "https://resumeaihub.com",
        "https://www.resumeaihub.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "ResumeAI Hub API is running"}


@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
        pdf_bytes = await file.read()
        extracted_text = extract_text_from_pdf(pdf_bytes)
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from this PDF.")
        return {"filename": file.filename, "resume_text": extracted_text}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze")
@limiter.limit("20/hour")
async def analyze_resume(request: Request, data: ResumeRequest):
    user = verify_token(request)
    user_record = get_or_create_user_record(user)
    ip = get_remote_address(request)
    check_access(user_record, ip)

    try:
        result = generate_resume_feedback(data.resume_text, data.job_description)
        if "analysis" in result and "detected_domain" not in result:
            result = result["analysis"]

        user_agent = request.headers.get("user-agent", "")
        record_usage(user.id, user.email, ip, user_agent)
        result["_role"] = user_record.get("role", "free")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/download-report")
async def download_report(request: Request, data: ReportRequest):
    verify_token(request)
    try:
        a = data.analysis
        verdict = a.get("verdict", a.get("screening_verdict", "N/A"))

        lines = [
            "=" * 60, "RESUME IMPROVEMENT REPORT", "ResumeAI Hub — resumeaihub.com", "=" * 60, "",
            f"DOMAIN:   {a.get('detected_domain', 'N/A')}",
            f"LEVEL:    {a.get('candidate_level', 'N/A')}",
            f"VERDICT:  {verdict}", "",
            "SCORES", "-" * 40,
            f"Overall Match:          {a.get('overall_match_score', 0)}/100",
            f"ATS Keywords:           {a.get('ats_keyword_score', 0)}/100",
            f"Domain Relevance:       {a.get('domain_relevance_score', 0)}/100",
            f"Experience Alignment:   {a.get('experience_alignment_score', 0)}/100",
            f"Impact Score:           {a.get('impact_score', 0)}/100",
            f"Qualification Coverage: {a.get('qualification_coverage_score', 0)}/100",
        ]

        if a.get("verdict_explanation"):
            lines += ["", "VERDICT EXPLANATION", "-" * 40, a.get("verdict_explanation")]

        if a.get("internship_note") and a.get("internship_note") != "null":
            lines += ["", f"NOTE: {a.get('internship_note')}"]

        qa = a.get("qualification_analysis", {})
        if qa:
            lines += ["", "QUALIFICATION ANALYSIS", "-" * 40]
            if qa.get("required_met"):
                lines.append(f"  Required (met):      {', '.join(qa['required_met'])}")
            if qa.get("required_missing"):
                lines.append(f"  Required (missing):  {', '.join(qa['required_missing'])}")
            if qa.get("preferred_met"):
                lines.append(f"  Preferred (met):     {', '.join(qa['preferred_met'])}")
            if qa.get("preferred_missing"):
                lines.append(f"  Preferred (missing): {', '.join(qa['preferred_missing'])}")
            if qa.get("bonus_present"):
                lines.append(f"  Bonus present:       {', '.join(qa['bonus_present'])}")

        lines += ["", "TAILORED SUMMARY", "-" * 40, a.get("tailored_summary", ""), ""]

        lines += ["STRENGTHS", "-" * 40]
        for s in a.get("strengths", []):
            if isinstance(s, dict):
                lines.append(f"  ✓ {s.get('point', '')}")
                if s.get("evidence"):
                    lines.append(f"    Evidence: {s['evidence']}")
            else:
                lines.append(f"  ✓ {s}")

        lines += ["", "WEAKNESSES", "-" * 40]
        for w in a.get("weaknesses", []):
            if isinstance(w, dict):
                lines.append(f"  ✗ {w.get('point', '')}")
                if w.get("evidence"):
                    lines.append(f"    Evidence: {w['evidence']}")
                if w.get("suggestion"):
                    lines.append(f"    Suggestion: {w['suggestion']}")
            else:
                lines.append(f"  ✗ {w}")

        lines += ["", "COACH FEEDBACK", "-" * 40]
        for f in a.get("coach_feedback", a.get("brutal_feedback", [])):
            lines.append(f"  → {f}")

        lines += ["", "REQUIRED KEYWORDS MISSING", "-" * 40]
        req = a.get("missing_keywords_required", a.get("missing_keywords_must_have", []))
        lines.append("  " + ", ".join(req) if req else "  None identified")

        lines += ["", "PREFERRED KEYWORDS MISSING", "-" * 40]
        pref = a.get("missing_keywords_preferred", a.get("missing_keywords_nice_to_have", []))
        lines.append("  " + ", ".join(pref) if pref else "  None identified")

        lines += ["", "TOP FIXES", "-" * 40]
        for item in a.get("top_fixes", []):
            if isinstance(item, dict):
                lines.append(f"  {item.get('priority', '')}. {item.get('fix', '')}")
                if item.get("why"):
                    lines.append(f"     Why: {item['why']}")
                if item.get("how"):
                    lines.append(f"     How: {item['how']}")
            else:
                lines.append(f"  • {item}")

        lines += ["", "IMPROVED BULLET EXAMPLES", "-" * 40]
        for b in a.get("improved_bullets", []):
            if isinstance(b, dict):
                if b.get("original"):
                    lines.append(f"  Before: {b['original']}")
                lines.append(f"  After:  {b.get('improved', '')}")
                lines.append("")
            else:
                lines.append(f"  • {b}")

        lines += ["=" * 60, "ResumeAI Hub — resumeaihub.com", "=" * 60]

        return StreamingResponse(
            iter(["\n".join(lines)]),
            media_type="text/plain",
            headers={"Content-Disposition": "attachment; filename=resume-improvement-report.txt"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/me")
async def get_me(request: Request):
    user = verify_token(request)
    user_record = get_or_create_user_record(user)
    return {
        "email": user.email,
        "role": user_record.get("role", "free"),
        "lifetime_analyses": user_record.get("lifetime_analyses", 0),
        "daily_analyses": user_record.get("daily_analyses", 0),
        "subscription_status": user_record.get("subscription_status"),
        "current_period_end": user_record.get("current_period_end"),
        "stripe_customer_id": user_record.get("stripe_customer_id"),
    }


# ── Resume-Only Analysis ──────────────────────────────────

@app.post("/analyze-resume-only")
@limiter.limit("20/hour")
async def analyze_resume_only_endpoint(request: Request, data: ResumeRequest):
    """Analyze resume without a job description — general quality + suggested titles."""
    user = verify_token(request)
    user_record = get_or_create_user_record(user)
    ip = get_remote_address(request)
    check_access(user_record, ip)

    try:
        result = analyze_resume_only(data.resume_text)

        user_agent = request.headers.get("user-agent", "")
        record_usage(user.id, user.email, ip, user_agent)
        result["_role"] = user_record.get("role", "free")
        return result
    except HTTPException:
        raise
    except Exception as e:
        print("RESUME-ONLY ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ── Job Matching ──────────────────────────────────────────

@app.post("/find-jobs")
@limiter.limit("5/hour")
async def find_jobs(request: Request, data: JobSearchRequest):
    """Find and score matching jobs for the user's resume. Pro only."""
    user = verify_token(request)
    user_record = get_or_create_user_record(user)

    # Pro/admin only
    role = user_record.get("role", "free")
    if role not in ("paid", "admin"):
        raise HTTPException(status_code=402, detail="Job matching is a Pro feature. Upgrade to access.")

    try:
        results = await find_matching_jobs(
            resume_text=data.resume_text,
            job_title=data.job_title,
            location=data.location,
            limit=15,
        )
        return results
    except Exception as e:
        print("JOB SEARCH ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ── Cover Letter Generator ────────────────────────────────

from app.services.cover_letter_service import generate_cover_letter

@app.post("/generate-cover-letter")
@limiter.limit("10/hour")
async def cover_letter_endpoint(request: Request):
    """Generate a personalized cover letter. Pro/admin only."""
    user = verify_token(request)
    user_record = get_or_create_user_record(user)

    role = user_record.get("role", "free")
    if role not in ("paid", "admin"):
        raise HTTPException(status_code=402, detail="Cover letter generation is a Pro feature.")

    body = await request.json()
    resume_text = body.get("resume_text", "")
    job_description = body.get("job_description", "")
    company_name = body.get("company_name", "")
    tone = body.get("tone", "professional")

    if not resume_text or not job_description:
        raise HTTPException(status_code=400, detail="Resume text and job description are required.")

    try:
        result = generate_cover_letter(resume_text, job_description, company_name, tone)
        return result
    except Exception as e:
        print("COVER LETTER ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ── Interview Prep ────────────────────────────────────────

from app.services.interview_service import generate_interview_questions, score_interview_answer

@app.post("/interview-prep")
@limiter.limit("10/hour")
async def interview_prep(request: Request, data: ResumeRequest):
    """Generate personalized interview questions. Pro/admin only."""
    user = verify_token(request)
    user_record = get_or_create_user_record(user)

    role = user_record.get("role", "free")
    if role not in ("paid", "admin"):
        raise HTTPException(status_code=402, detail="Interview prep is a Pro feature.")

    if not data.job_description:
        raise HTTPException(status_code=400, detail="Job description is required for interview prep.")

    try:
        result = generate_interview_questions(data.resume_text, data.job_description)
        return result
    except Exception as e:
        print("INTERVIEW PREP ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/score-answer")
@limiter.limit("20/hour")
async def score_answer_endpoint(request: Request):
    """Score a practice interview answer. Pro/admin only."""
    user = verify_token(request)
    user_record = get_or_create_user_record(user)

    role = user_record.get("role", "free")
    if role not in ("paid", "admin"):
        raise HTTPException(status_code=402, detail="Answer scoring is a Pro feature.")

    body = await request.json()
    question = body.get("question", "")
    answer = body.get("answer", "")
    job_description = body.get("job_description", "")

    if not question or not answer:
        raise HTTPException(status_code=400, detail="Question and answer are required.")

    try:
        result = score_interview_answer(question, answer, job_description)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Resume Builder (Profile) ──────────────────────────────

from app.services.resume_builder_service import generate_resume_from_profile
from app.services.latex_generator import generate_latex_resume

@app.get("/profile")
async def get_profile(request: Request):
    """Get user's resume profile."""
    user = verify_token(request)
    sb = get_supabase()
    result = sb.table("resume_profiles").select("*").eq("user_id", user.id).execute()
    if result.data:
        return result.data[0]
    return {"empty": True}


@app.post("/profile")
async def save_profile(request: Request):
    """Save or update user's resume profile."""
    user = verify_token(request)
    body = await request.json()
    sb = get_supabase()

    # Check if profile exists
    existing = sb.table("resume_profiles").select("id").eq("user_id", user.id).execute()

    profile_data = {
        "user_id": user.id,
        "name": body.get("name", ""),
        "email": body.get("email", ""),
        "phone": body.get("phone", ""),
        "location": body.get("location", ""),
        "linkedin": body.get("linkedin", ""),
        "github": body.get("github", ""),
        "website": body.get("website", ""),
        "summary": body.get("summary", ""),
        "skills": body.get("skills", []),
        "experience": body.get("experience", []),
        "education": body.get("education", []),
        "projects": body.get("projects", []),
        "certifications": body.get("certifications", []),
        "template": body.get("template", "classic"),
        "resume_text": body.get("resume_text", ""),
    }

    if existing.data:
        sb.table("resume_profiles").update(profile_data).eq("user_id", user.id).execute()
    else:
        sb.table("resume_profiles").insert(profile_data).execute()

    return {"saved": True}


@app.post("/generate-resume-pdf")
async def generate_resume_pdf_endpoint(request: Request):
    """Generate PDF from user's profile. Pro/admin only."""
    user = verify_token(request)
    user_record = get_or_create_user_record(user)

    role = user_record.get("role", "free")
    if role not in ("paid", "admin"):
        raise HTTPException(status_code=402, detail="Resume PDF generation is a Pro feature.")

    sb = get_supabase()
    result = sb.table("resume_profiles").select("*").eq("user_id", user.id).execute()

    if not result.data:
        raise HTTPException(status_code=400, detail="No profile found. Save your profile first.")

    profile = result.data[0]

    try:
        pdf_bytes = generate_resume_from_profile(profile)
        return StreamingResponse(
            iter([pdf_bytes]),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=resume.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-resume-latex")
async def generate_resume_latex_endpoint(request: Request):
    """Generate LaTeX file from user's profile. Pro/admin only."""
    user = verify_token(request)
    user_record = get_or_create_user_record(user)

    role = user_record.get("role", "free")
    if role not in ("paid", "admin"):
        raise HTTPException(status_code=402, detail="LaTeX export is a Pro feature.")

    sb = get_supabase()
    result = sb.table("resume_profiles").select("*").eq("user_id", user.id).execute()

    if not result.data:
        raise HTTPException(status_code=400, detail="No profile found. Save your profile first.")

    profile = result.data[0]

    try:
        latex_content = generate_latex_resume(profile)
        return StreamingResponse(
            iter([latex_content.encode("utf-8")]),
            media_type="application/x-latex",
            headers={"Content-Disposition": "attachment; filename=resume.tex"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/auto-fill-profile")
async def auto_fill_profile(request: Request, data: ResumeRequest):
    """Extract structured profile data from resume text using AI."""
    user = verify_token(request)

    prompt = f"""Extract structured resume data from this text. Return ONLY valid JSON.

Resume:
{data.resume_text[:4000]}

Return this exact JSON structure:
{{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "linkedin": "",
  "github": "",
  "website": "",
  "summary": "",
  "skills": ["skill1", "skill2"],
  "experience": [
    {{"title": "", "company": "", "dates": "", "location": "", "bullets": [""]}}
  ],
  "education": [
    {{"school": "", "degree": "", "dates": "", "coursework": ""}}
  ],
  "projects": [
    {{"title": "", "tech": "", "bullets": [""]}}
  ],
  "certifications": ["cert1"]
}}

Rules:
- Extract exactly what is in the resume, do not invent anything
- If a field is not found, use empty string or empty array
- Keep bullet points as-is from the resume
- Skills should be individual items"""

    from openai import OpenAI as OAI
    import json as j
    c = OAI(api_key=os.environ.get("OPENAI_API_KEY"))
    resp = c.chat.completions.create(
        model="gpt-4o",
        temperature=0.1,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "Extract structured data from resumes. Return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
    )
    content = resp.choices[0].message.content.strip()
    try:
        return j.loads(content)
    except:
        return j.loads(content.replace("```json", "").replace("```", "").strip())


# ── Admin Analytics (OWNER ONLY) ──────────────────────────

OWNER_EMAIL = "kirtan.patel0515@gmail.com"

@app.get("/admin/analytics")
async def admin_analytics(request: Request):
    """Owner-only analytics. Hardcoded to kirtan.patel0515@gmail.com."""
    user = verify_token(request)

    # Double check: must be exact email AND admin role
    if user.email != OWNER_EMAIL:
        raise HTTPException(status_code=404, detail="Not found")

    user_record = get_or_create_user_record(user)
    if user_record.get("role") != "admin":
        raise HTTPException(status_code=404, detail="Not found")

    sb = get_supabase()

    # Get all users
    users_res = sb.table("users").select("*").execute()
    users = users_res.data or []

    total_users = len(users)
    paid_users = len([u for u in users if u.get("role") == "paid"])
    free_users = len([u for u in users if u.get("role") == "free"])
    blocked_users = len([u for u in users if u.get("role") == "blocked"])

    total_analyses = sum(u.get("lifetime_analyses", 0) for u in users)
    total_daily = sum(u.get("daily_analyses", 0) for u in users)

    # Revenue
    active_subs = len([u for u in users if u.get("subscription_status") == "active"])
    monthly_revenue = active_subs * 9

    # Cost estimation (per analysis)
    # GPT-4o: ~$0.03 per analysis, ~$0.05 per job search, embeddings: ~$0.001
    cost_per_analysis = 0.035
    cost_per_job_search = 0.06
    estimated_total_cost = total_analyses * cost_per_analysis
    estimated_daily_cost = total_daily * cost_per_analysis

    # Profit/loss
    monthly_profit = monthly_revenue - (estimated_total_cost * 2)  # rough monthly estimate

    # Recent usage logs
    logs_res = sb.table("usage_logs").select("*").order("created_at", desc=True).limit(30).execute()
    recent_logs = logs_res.data or []

    # Recent signups
    recent_users = sorted(users, key=lambda u: u.get("created_at", ""), reverse=True)[:15]

    # Unique IPs today
    today_ips = set()
    for log in recent_logs:
        if log.get("ip"):
            today_ips.add(log["ip"])

    return {
        "summary": {
            "total_users": total_users,
            "paid_users": paid_users,
            "free_users": free_users,
            "blocked_users": blocked_users,
            "active_subscriptions": active_subs,
            "monthly_revenue_usd": monthly_revenue,
            "total_analyses_all_time": total_analyses,
            "total_analyses_today": total_daily,
            "unique_ips_recent": len(today_ips),
        },
        "costs": {
            "cost_per_analysis_usd": cost_per_analysis,
            "cost_per_job_search_usd": cost_per_job_search,
            "estimated_total_cost_usd": round(estimated_total_cost, 2),
            "estimated_daily_cost_usd": round(estimated_daily_cost, 2),
            "monthly_revenue_usd": monthly_revenue,
            "estimated_monthly_profit_usd": round(monthly_profit, 2),
        },
        "recent_users": [
            {
                "email": u.get("email"),
                "role": u.get("role"),
                "lifetime_analyses": u.get("lifetime_analyses", 0),
                "daily_analyses": u.get("daily_analyses", 0),
                "created_at": u.get("created_at"),
                "subscription_status": u.get("subscription_status"),
                "last_ip": u.get("last_ip"),
            }
            for u in recent_users
        ],
        "recent_activity": [
            {
                "email": log.get("email"),
                "ip": log.get("ip"),
                "user_agent": (log.get("user_agent") or "")[:80],
                "created_at": log.get("created_at"),
            }
            for log in recent_logs
        ],
    }


# ── Stripe endpoints ──────────────────────────────────────

@app.post("/create-checkout-session")
async def create_checkout(request: Request):
    user = verify_token(request)
    try:
        url = create_checkout_session(user.id, user.email)
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/create-portal-session")
async def create_portal(request: Request):
    user = verify_token(request)
    user_record = get_or_create_user_record(user)
    customer_id = user_record.get("stripe_customer_id")
    if not customer_id:
        raise HTTPException(status_code=400, detail="No billing account found.")
    try:
        url = create_portal_session(customer_id)
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/cancel-subscription")
async def cancel_subscription(request: Request):
    user = verify_token(request)
    user_record = get_or_create_user_record(user)
    sub_id = user_record.get("stripe_subscription_id")
    if not sub_id:
        raise HTTPException(status_code=400, detail="No active subscription found.")
    try:
        result = cancel_subscription_at_period_end(sub_id)
        # Update Supabase
        get_supabase().table("users").update({
            "subscription_status": "canceling"
        }).eq("id", user.id).execute()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = construct_webhook_event(payload, sig_header)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")

    sb = get_supabase()
    event_type = event["type"]
    data = event["data"]["object"]

    def get_user_id(obj):
        return (obj.get("metadata") or {}).get("supabase_user_id")

    if event_type == "checkout.session.completed":
        user_id = get_user_id(data)
        customer_id = data.get("customer")
        sub_id = data.get("subscription")
        if user_id:
            sb.table("users").update({
                "stripe_customer_id": customer_id,
                "stripe_subscription_id": sub_id,
                "subscription_status": "active",
                "plan": "pro",
            }).eq("id", user_id).execute()
            # Only upgrade if not admin
            result = sb.table("users").select("role").eq("id", user_id).execute()
            if result.data and result.data[0]["role"] != "admin":
                sb.table("users").update({"role": "paid"}).eq("id", user_id).execute()

    elif event_type in ("customer.subscription.created", "customer.subscription.updated"):
        user_id = get_user_id(data)
        status = data.get("status")
        period_end = data.get("current_period_end")
        period_end_iso = datetime.utcfromtimestamp(period_end).isoformat() if period_end else None

        if user_id:
            update = {
                "stripe_subscription_id": data.get("id"),
                "subscription_status": status,
                "current_period_end": period_end_iso,
            }
            sb.table("users").update(update).eq("id", user_id).execute()

            # Set role based on status (never downgrade admin)
            result = sb.table("users").select("role").eq("id", user_id).execute()
            if result.data and result.data[0]["role"] != "admin":
                new_role = "paid" if status == "active" else "free"
                sb.table("users").update({"role": new_role}).eq("id", user_id).execute()

    elif event_type == "customer.subscription.deleted":
        user_id = get_user_id(data)
        if user_id:
            result = sb.table("users").select("role").eq("id", user_id).execute()
            if result.data and result.data[0]["role"] != "admin":
                sb.table("users").update({
                    "role": "free",
                    "subscription_status": "canceled",
                    "plan": "free",
                }).eq("id", user_id).execute()

    return {"received": True}
