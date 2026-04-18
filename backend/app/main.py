import os
from datetime import datetime
from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.schemas import ResumeRequest, ReportRequest
from app.services.ai_service import generate_resume_feedback
from app.services.pdf_service import extract_text_from_pdf
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
        verdict = a.get("screening_verdict", "N/A")
        verdict_reasons = a.get("verdict_reasons", [])

        lines = [
            "=" * 60, "RESUME IMPROVEMENT REPORT", "ResumeAI Hub — resumeaihub.com", "=" * 60, "",
            f"DOMAIN:   {a.get('detected_domain', 'N/A')}",
            f"VERDICT:  {verdict}", "",
            "SCORES", "-" * 40,
            f"Overall Match:          {a.get('overall_match_score', 0)}/100",
            f"ATS Keywords:           {a.get('ats_keyword_score', 0)}/100",
            f"Domain Relevance:       {a.get('domain_relevance_score', 0)}/100",
            f"Experience Alignment:   {a.get('experience_alignment_score', 0)}/100",
            f"Impact Score:           {a.get('impact_score', 0)}/100",
        ]
        if verdict_reasons:
            lines += ["", "VERDICT REASONS", "-" * 40]
            for r in verdict_reasons:
                lines.append(f"  → {r}")
        lines += ["", "TAILORED SUMMARY", "-" * 40, a.get("tailored_summary", ""), ""]
        lines += ["STRENGTHS", "-" * 40]
        for s in a.get("strengths", []): lines.append(f"  ✓ {s}")
        lines += ["", "WEAKNESSES", "-" * 40]
        for w in a.get("weaknesses", []): lines.append(f"  ✗ {w}")
        lines += ["", "HONEST FEEDBACK", "-" * 40]
        for f in a.get("brutal_feedback", []): lines.append(f"  → {f}")
        lines += ["", "MUST-HAVE KEYWORDS MISSING", "-" * 40]
        must = a.get("missing_keywords_must_have", [])
        lines.append("  " + ", ".join(must) if must else "  None identified")
        lines += ["", "NICE-TO-HAVE KEYWORDS MISSING", "-" * 40]
        nice = a.get("missing_keywords_nice_to_have", [])
        lines.append("  " + ", ".join(nice) if nice else "  None identified")
        lines += ["", "RECRUITER CONCERNS", "-" * 40]
        for c in a.get("recruiter_concerns", []): lines.append(f"  ⚠ {c}")
        lines += ["", "TOP FIXES — DO THESE FIRST", "-" * 40]
        for i, fix in enumerate(a.get("top_fixes", []), 1): lines.append(f"  {i}. {fix}")
        lines += ["", "IMPROVED BULLET EXAMPLES", "-" * 40]
        for b in a.get("improved_bullets", []): lines.append(f"  • {b}")
        lines += ["", "=" * 60, "ResumeAI Hub — resumeaihub.com", "=" * 60]

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
