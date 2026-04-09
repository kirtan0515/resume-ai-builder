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


class ContactInfo(BaseModel):
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""


class ExperienceItem(BaseModel):
    title: str
    company: str
    dates: str
    bullets: List[str] = []


class ProjectItem(BaseModel):
    title: str
    tech: str = ""
    bullets: List[str] = []


class EducationItem(BaseModel):
    school: str
    degree: str
    dates: str


class ResumeData(BaseModel):
    name: str
    contact: ContactInfo
    summary: str = ""
    skills: List[str] = []
    experience: List[ExperienceItem] = []
    projects: List[ProjectItem] = []
    education: List[EducationItem] = []


class AnalyzeResponse(BaseModel):
    analysis: ResumeResponse
    resume_data: ResumeData