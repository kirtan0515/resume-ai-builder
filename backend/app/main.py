from io import BytesIO

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.schemas import ResumeRequest, AnalyzeResponse, ResumeData
from app.services.ai_service import generate_resume_feedback
from app.services.pdf_generator import generate_resume_pdf
from app.services.pdf_service import extract_text_from_pdf
from app.services.resume_formatter import format_resume_data

app = FastAPI(title="Resume AI Builder API")

# ✅ CORS FIX (IMPORTANT)
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

# ✅ Health check
@app.get("/")
def root():
    return {"message": "Resume AI Builder backend is running"}


# ✅ Upload Resume
@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

        pdf_bytes = await file.read()
        extracted_text = extract_text_from_pdf(pdf_bytes)

        if not extracted_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from this PDF. Try another file."
            )

        return {
            "filename": file.filename,
            "resume_text": extracted_text
        }

    except HTTPException:
        raise
    except Exception as e:
        print("UPLOAD ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ✅ Analyze Resume
@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_resume(data: ResumeRequest):
    try:
        result = generate_resume_feedback(
            data.resume_text,
            data.job_description
        )
        return result
    except Exception as e:
        print("BACKEND ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ✅ Download PDF
@app.post("/download-pdf")
def download_pdf(data: ResumeData):
    try:
        formatted_data = format_resume_data(data)
        pdf_bytes = generate_resume_pdf(formatted_data)

        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=optimized_resume.pdf"
            }
        )

    except Exception as e:
        print("PDF ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))