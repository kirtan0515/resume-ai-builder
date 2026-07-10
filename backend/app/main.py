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

import httpx

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
        result = generate_resume_feedback(data.resume_text, data.job_description, user_id=user.id)
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


# ── 2FA Verification (QuantumTrust MFA) ───────────────────

MFA_REQUIRED_EMAILS = ["kpatel@semsolutionsllc.com"]

@app.post("/auth/verify-2fa")
async def verify_2fa(request: Request):
    """Verify a TOTP code via QuantumTrust MFA API."""
    user = verify_token(request)
    body = await request.json()
    email = body.get("email", "")
    code = body.get("code", "")

    if not email or not code:
        raise HTTPException(status_code=400, detail="Email and code are required.")

    # Only enforce for specific users
    if email.lower() not in [e.lower() for e in MFA_REQUIRED_EMAILS]:
        return {"valid": True, "message": "2FA not required for this user."}

    qt_api_url = os.getenv("QUANTUMTRUST_API_URL", "")
    qt_api_key = os.getenv("QUANTUMTRUST_API_KEY", "")

    if not qt_api_url or not qt_api_key:
        raise HTTPException(status_code=500, detail="MFA service not configured.")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{qt_api_url}/mfa/verify",
                json={"email": email, "code": code},
                headers={"X-API-Key": qt_api_key},
            )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="MFA service error.")
        result = resp.json()
        return {"valid": result.get("valid", False)}
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Could not reach MFA service: {str(e)}")


@app.get("/auth/requires-2fa")
async def requires_2fa(request: Request):
    """Check if the current user requires 2FA verification."""
    user = verify_token(request)
    requires = user.email.lower() in [e.lower() for e in MFA_REQUIRED_EMAILS]
    return {"requires_2fa": requires}


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


# ── Outcome Insights ───────────────────────────────────────

from app.services.insights_service import generate_outcome_insights

@app.get("/applications/insights")
async def application_insights(request: Request):
    """Get AI-powered insights from application outcomes."""
    user = verify_token(request)
    sb = get_supabase()
    result = sb.table("applications").select("*").eq("user_id", user.id).execute()
    apps = result.data or []
    insights = generate_outcome_insights(apps)
    return insights


# ── ATS Simulator ──────────────────────────────────────────

from app.services.ats_simulator import simulate_ats_parsing

@app.post("/ats-simulate")
@limiter.limit("10/hour")
async def ats_simulate(request: Request, data: ResumeRequest):
    """Simulate ATS parsing of a resume."""
    user = verify_token(request)
    if not data.resume_text or len(data.resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text required.")
    try:
        result = simulate_ats_parsing(data.resume_text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── LinkedIn Analyzer ──────────────────────────────────────

from app.services.linkedin_service import analyze_linkedin_vs_resume

@app.post("/linkedin-analyze")
@limiter.limit("10/hour")
async def linkedin_analyze(request: Request):
    """Compare LinkedIn profile against resume. Pro/admin only."""
    user = verify_token(request)
    user_record = get_or_create_user_record(user)
    if user_record.get("role") not in ("paid", "admin"):
        raise HTTPException(status_code=402, detail="LinkedIn analysis is a Pro feature.")

    body = await request.json()
    linkedin_text = body.get("linkedin_text", "")
    resume_text = body.get("resume_text", "")

    if not linkedin_text or not resume_text:
        raise HTTPException(status_code=400, detail="Both LinkedIn text and resume text required.")

    try:
        result = analyze_linkedin_vs_resume(linkedin_text, resume_text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Salary Negotiation ─────────────────────────────────────

from app.services.salary_service import generate_salary_analysis

@app.post("/salary-analysis")
@limiter.limit("10/hour")
async def salary_analysis(request: Request):
    """Generate salary estimate and negotiation guidance. Pro/admin only."""
    user = verify_token(request)
    user_record = get_or_create_user_record(user)
    if user_record.get("role") not in ("paid", "admin"):
        raise HTTPException(status_code=402, detail="Salary analysis is a Pro feature.")

    body = await request.json()
    resume_text = body.get("resume_text", "")
    job_description = body.get("job_description", "")
    company_name = body.get("company_name", "")
    location = body.get("location", "")

    if not resume_text or not job_description:
        raise HTTPException(status_code=400, detail="Resume and job description required.")

    try:
        result = generate_salary_analysis(resume_text, job_description, company_name, location)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Ghost Job Detector ─────────────────────────────────────

from app.services.ghost_job_service import analyze_ghost_job

@app.post("/ghost-job-check")
@limiter.limit("15/hour")
async def ghost_job_check(request: Request):
    """Analyze if a job posting might be a ghost job."""
    user = verify_token(request)

    body = await request.json()
    job_description = body.get("job_description", "")
    company_name = body.get("company_name", "")
    posted_date = body.get("posted_date", "")
    url = body.get("url", "")

    if not job_description:
        raise HTTPException(status_code=400, detail="Job description required.")

    try:
        result = analyze_ghost_job(job_description, company_name, posted_date, url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Application Tracker ────────────────────────────────────

@app.get("/applications")
async def get_applications(request: Request):
    """Get all user's tracked applications."""
    user = verify_token(request)
    sb = get_supabase()
    result = sb.table("applications").select("*").eq("user_id", user.id).order("created_at", desc=True).execute()
    return {"applications": result.data or []}


@app.post("/applications")
async def add_application(request: Request):
    """Add a new job application to tracker."""
    user = verify_token(request)
    body = await request.json()

    title = body.get("title", "")
    company = body.get("company", "")
    if not title or not company:
        raise HTTPException(status_code=400, detail="Title and company are required.")

    sb = get_supabase()

    # Auto-score against saved resume if available
    match_score = 0
    profile_res = sb.table("resume_profiles").select("resume_text").eq("user_id", user.id).execute()
    if profile_res.data and profile_res.data[0].get("resume_text"):
        resume_text = profile_res.data[0]["resume_text"]
        jd = body.get("job_description", "")
        if jd and len(jd) > 50:
            # Quick score using GPT-4o
            try:
                from openai import OpenAI as OAI
                import json as j
                c = OAI(api_key=os.environ.get("OPENAI_API_KEY"))
                resp = c.chat.completions.create(
                    model="gpt-4o-mini",
                    temperature=0.1,
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": "Score resume-job fit. Return JSON: {\"score\": 0} where score is 0-100."},
                        {"role": "user", "content": f"Resume:\n{resume_text[:1500]}\n\nJob:\n{jd[:1000]}\n\nReturn {{\"score\": X}} only."},
                    ],
                )
                score_data = j.loads(resp.choices[0].message.content.strip())
                match_score = int(score_data.get("score", 0))
            except:
                pass

    app_data = {
        "user_id": user.id,
        "title": title,
        "company": company,
        "url": body.get("url", ""),
        "location": body.get("location", ""),
        "status": body.get("status", "applied"),
        "match_score": match_score,
        "notes": body.get("notes", ""),
        "applied_date": body.get("applied_date", None),
    }

    sb.table("applications").insert(app_data).execute()
    return {"saved": True, "match_score": match_score}


@app.patch("/applications/{app_id}")
async def update_application(request: Request, app_id: str):
    """Update application status or details."""
    user = verify_token(request)
    body = await request.json()
    sb = get_supabase()

    # Verify ownership
    existing = sb.table("applications").select("user_id").eq("id", app_id).execute()
    if not existing.data or existing.data[0]["user_id"] != user.id:
        raise HTTPException(status_code=404, detail="Application not found.")

    update_data = {}
    for field in ["title", "company", "url", "location", "status", "notes", "applied_date"]:
        if field in body:
            update_data[field] = body[field]

    if update_data:
        sb.table("applications").update(update_data).eq("id", app_id).execute()

    return {"updated": True}


@app.delete("/applications/{app_id}")
async def delete_application(request: Request, app_id: str):
    """Delete an application."""
    user = verify_token(request)
    sb = get_supabase()

    existing = sb.table("applications").select("user_id").eq("id", app_id).execute()
    if not existing.data or existing.data[0]["user_id"] != user.id:
        raise HTTPException(status_code=404, detail="Application not found.")

    sb.table("applications").delete().eq("id", app_id).execute()
    return {"deleted": True}


@app.get("/applications/stats")
async def application_stats(request: Request):
    """Get application statistics and insights."""
    user = verify_token(request)
    sb = get_supabase()
    result = sb.table("applications").select("*").eq("user_id", user.id).execute()
    apps = result.data or []

    total = len(apps)
    by_status = {}
    scores = []
    interview_scores = []

    for app in apps:
        status = app.get("status", "applied")
        by_status[status] = by_status.get(status, 0) + 1
        if app.get("match_score"):
            scores.append(app["match_score"])
            if status in ("interview", "offer"):
                interview_scores.append(app["match_score"])

    avg_score = round(sum(scores) / len(scores)) if scores else 0
    avg_interview_score = round(sum(interview_scores) / len(interview_scores)) if interview_scores else 0
    interview_rate = round((by_status.get("interview", 0) + by_status.get("offer", 0)) / total * 100) if total > 0 else 0

    return {
        "total": total,
        "by_status": by_status,
        "avg_match_score": avg_score,
        "avg_interview_score": avg_interview_score,
        "interview_rate": interview_rate,
        "insight": f"You get interviews {interview_rate}% of the time. Applications with 70%+ match score are {2 if avg_interview_score > avg_score else 1}x more likely to get callbacks." if total > 3 else "Add more applications to see insights.",
    }


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
        model="gpt-4o-mini",
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

    # Cost estimation — updated for all tools
    # GPT-4o: ~$0.03 per analysis, ~$0.05 per job search, ~$0.03 per interview/cover letter/salary
    # Apify: ~$0.02 per job search
    cost_per_analysis = 0.035
    cost_per_job_search = 0.07
    cost_per_tool_use = 0.03  # interview, cover letter, salary, linkedin, ats
    estimated_total_cost = total_analyses * cost_per_analysis
    estimated_daily_cost = total_daily * cost_per_analysis

    # Infrastructure costs (monthly)
    ec2_cost = 8.50  # t2.micro
    domain_cost = 1.00  # ~$12/year
    apify_cost = 5.00  # free tier
    infra_monthly = ec2_cost + domain_cost + apify_cost

    # Profit/loss
    monthly_profit = monthly_revenue - infra_monthly - (estimated_daily_cost * 30)

    # Projections
    users_needed_breakeven = max(1, round((infra_monthly + 10) / 9))  # $9/user
    projected_100_users = (100 * 0.05 * 9) - infra_monthly - (100 * 5 * cost_per_analysis)  # 5% conversion
    projected_500_users = (500 * 0.05 * 9) - infra_monthly - (500 * 5 * cost_per_analysis)
    projected_1000_users = (1000 * 0.05 * 9) - infra_monthly - (1000 * 5 * cost_per_analysis)

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
            "cost_per_tool_use_usd": cost_per_tool_use,
            "estimated_total_api_cost_usd": round(estimated_total_cost, 2),
            "estimated_daily_api_cost_usd": round(estimated_daily_cost, 2),
            "infra_monthly_usd": round(infra_monthly, 2),
            "monthly_revenue_usd": monthly_revenue,
            "estimated_monthly_profit_usd": round(monthly_profit, 2),
        },
        "projections": {
            "users_needed_breakeven": users_needed_breakeven,
            "profit_at_100_users": round(projected_100_users, 2),
            "profit_at_500_users": round(projected_500_users, 2),
            "profit_at_1000_users": round(projected_1000_users, 2),
            "conversion_rate_assumed": "5%",
            "avg_analyses_per_user_assumed": 5,
        },
        "all_users": [
            {
                "id": u.get("id"),
                "email": u.get("email"),
                "role": u.get("role"),
                "lifetime_analyses": u.get("lifetime_analyses", 0),
                "daily_analyses": u.get("daily_analyses", 0),
                "created_at": u.get("created_at"),
                "subscription_status": u.get("subscription_status"),
                "last_ip": u.get("last_ip"),
            }
            for u in sorted(users, key=lambda u: u.get("created_at", ""), reverse=True)
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


@app.patch("/admin/update-user-role")
async def admin_update_user_role(request: Request):
    """Owner-only: manually change a user's role."""
    user = verify_token(request)
    if user.email != OWNER_EMAIL:
        raise HTTPException(status_code=404, detail="Not found")

    body = await request.json()
    target_user_id = body.get("user_id")
    new_role = body.get("role")

    if not target_user_id or new_role not in ("free", "paid", "admin", "blocked"):
        raise HTTPException(status_code=400, detail="Valid user_id and role (free/paid/admin/blocked) required.")

    sb = get_supabase()
    sb.table("users").update({"role": new_role}).eq("id", target_user_id).execute()
    return {"updated": True, "user_id": target_user_id, "new_role": new_role}


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
