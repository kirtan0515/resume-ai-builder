import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def analyze_resume_only(resume_text: str) -> dict:
    """Analyze a resume without a job description — general quality assessment."""

    prompt = f"""Analyze this resume as a career coach. No job description is provided.
Evaluate the resume's overall quality, identify the candidate's domain, level, and suggest roles they'd be qualified for.

Resume:
{resume_text}

Return ONLY this JSON:
{{
  "detected_domain": "e.g. Software Engineering / Data Science / Healthcare / Business",
  "candidate_level": "student | junior | mid | senior",
  "overall_quality_score": 0,
  "scores": {{
    "clarity_score": 0,
    "impact_score": 0,
    "technical_depth_score": 0,
    "ats_readiness_score": 0,
    "presentation_score": 0
  }},
  "verdict": "Strong resume | Good with room to improve | Needs significant work | Weak — major gaps",
  "verdict_explanation": "2-3 sentences explaining the overall quality",
  "suggested_job_titles": [
    "Job title 1 the candidate is qualified for",
    "Job title 2",
    "Job title 3",
    "Job title 4",
    "Job title 5"
  ],
  "key_skills_detected": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "strengths": [
    {{"point": "Strength", "evidence": "What we found"}}
  ],
  "weaknesses": [
    {{"point": "Weakness", "evidence": "What's missing or unclear", "suggestion": "How to fix"}}
  ],
  "top_improvements": [
    "Specific improvement 1",
    "Specific improvement 2",
    "Specific improvement 3",
    "Specific improvement 4",
    "Specific improvement 5"
  ],
  "search_queries": [
    "Best search query 1 for job boards based on this resume",
    "Best search query 2",
    "Best search query 3"
  ]
}}

Rules:
- overall_quality_score: 0-100 based on resume quality alone (not job fit)
- All sub-scores: 0-100
- suggested_job_titles: 3-6 realistic titles based on actual experience
- search_queries: 2-4 optimized search strings for LinkedIn/Indeed
- key_skills_detected: 4-8 main skills found
- strengths: 2-4 with evidence
- weaknesses: 2-4 with evidence and suggestion
- top_improvements: 3-6 specific actionable items
- Do NOT invent experience. Only reference what is in the resume.
- Verdict must match the score band:
  - 80+: Strong resume
  - 65-79: Good with room to improve
  - 45-64: Needs significant work
  - below 45: Weak — major gaps"""

    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are an evidence-based resume coach. Evaluate resume quality honestly. Return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
    )

    content = response.choices[0].message.content.strip()
    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        cleaned = content.replace("```json", "").replace("```", "").strip()
        result = json.loads(cleaned)

    # Ensure verdict matches score
    score = result.get("overall_quality_score", 0)
    if score >= 80:
        result["verdict"] = "Strong resume"
    elif score >= 65:
        result["verdict"] = "Good with room to improve"
    elif score >= 45:
        result["verdict"] = "Needs significant work"
    else:
        result["verdict"] = "Weak — major gaps"

    return result
