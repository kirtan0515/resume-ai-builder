from pydantic import BaseModel
from typing import List, Optional, Any, Dict


class ResumeRequest(BaseModel):
    resume_text: str
    job_description: str


class ReportRequest(BaseModel):
    analysis: Dict[str, Any]


class JobSearchRequest(BaseModel):
    resume_text: str
    job_title: str
    location: str = "United States"
