from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.schemas import ResumeRequest, ReportRequest
from app.services.ai_service import generate_resume_feedback
from app.services.pdf_service import extract_text_from_pdf

app = FastAPI(title="ResumeAI Hub API")

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
    allow_credentials=False,
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
        print("UPLOAD ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze")
def analyze_resume(data: ResumeRequest):
    try:
        result = generate_resume_feedback(data.resume_text, data.job_description)
        if "analysis" in result and "detected_domain" not in result:
            result = result["analysis"]
        return result
    except Exception as e:
        print("ANALYZE ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/download-report")
def download_report(data: ReportRequest):
    try:
        a = data.analysis
        verdict = a.get("screening_verdict", "N/A")
        verdict_reasons = a.get("verdict_reasons", [])

        lines = [
            "=" * 60,
            "RESUME IMPROVEMENT REPORT",
            "ResumeAI Hub — resumeaihub.com",
            "=" * 60,
            "",
            f"DOMAIN:   {a.get('detected_domain', 'N/A')}",
            f"VERDICT:  {verdict}",
            "",
            "SCORES",
            "-" * 40,
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
        for s in a.get("strengths", []):
            lines.append(f"  ✓ {s}")

        lines += ["", "WEAKNESSES", "-" * 40]
        for w in a.get("weaknesses", []):
            lines.append(f"  ✗ {w}")

        lines += ["", "HONEST FEEDBACK", "-" * 40]
        for f in a.get("brutal_feedback", []):
            lines.append(f"  → {f}")

        lines += ["", "MUST-HAVE KEYWORDS MISSING", "-" * 40]
        must = a.get("missing_keywords_must_have", [])
        lines.append("  " + ", ".join(must) if must else "  None identified")

        lines += ["", "NICE-TO-HAVE KEYWORDS MISSING", "-" * 40]
        nice = a.get("missing_keywords_nice_to_have", [])
        lines.append("  " + ", ".join(nice) if nice else "  None identified")

        lines += ["", "RECRUITER CONCERNS", "-" * 40]
        for c in a.get("recruiter_concerns", []):
            lines.append(f"  ⚠ {c}")

        lines += ["", "TOP FIXES — DO THESE FIRST", "-" * 40]
        for i, fix in enumerate(a.get("top_fixes", []), 1):
            lines.append(f"  {i}. {fix}")

        lines += ["", "IMPROVED BULLET EXAMPLES", "-" * 40]
        for b in a.get("improved_bullets", []):
            lines.append(f"  • {b}")

        lines += ["", "=" * 60, "ResumeAI Hub — resumeaihub.com", "=" * 60]

        report_text = "\n".join(lines)

        return StreamingResponse(
            iter([report_text]),
            media_type="text/plain",
            headers={"Content-Disposition": "attachment; filename=resume-improvement-report.txt"}
        )
    except Exception as e:
        print("REPORT ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
