from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import ResumeRequest, ResumeResponse
from app.services.ai_service import generate_resume_feedback

app = FastAPI(title="Resume AI Builder API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Resume AI Builder backend is running"}


@app.post("/analyze", response_model=ResumeResponse)
def analyze_resume(data: ResumeRequest):
    try:
        result = generate_resume_feedback(data.resume_text, data.job_description)
        return result
    except Exception as e:
        print("BACKEND ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))