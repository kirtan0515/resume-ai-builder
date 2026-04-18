from pydantic import BaseModel
from typing import List


class ResumeRequest(BaseModel):
    resume_text: str
    job_description: str


class AnalysisResult(BaseModel):
    detected_domain: str
    overall_match_score: int
    ats_keyword_score: int
    domain_relevance_score: int
    experience_alignment_score: int
    impact_score: int
    strengths: List[str]
    weaknesses: List[str]
    brutal_feedback: List[str]
    tailored_summary: str
    missing_keywords_must_have: List[str]
    missing_keywords_nice_to_have: List[str]
    recruiter_concerns: List[str]
    top_fixes: List[str]
    improved_bullets: List[str]


class ReportRequest(BaseModel):
    analysis: AnalysisResult
