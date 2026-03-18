from pydantic import BaseModel
from typing import List


class ResumeRequest(BaseModel):
    resume_text: str
    job_description: str


class ResumeResponse(BaseModel):
    tailored_summary: str
    improved_bullets: List[str]
    missing_skills: List[str]
    match_score: int
