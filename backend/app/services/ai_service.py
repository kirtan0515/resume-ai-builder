import os
import json
from dotenv import load_dotenv
from openai import OpenAI
from app.services.rag_service import RAGService

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
rag_service = RAGService()

SYSTEM_PROMPT = """You are a senior technical recruiter and resume strategist with 15 years of experience.

Your job is to evaluate resumes with brutal honesty — like a real recruiter deciding in 30 seconds.

DOMAIN-SPECIFIC EVALUATION RULES:

Software Engineering / Tech:
- Check: technical depth, specific tech stack match, project quality, system design exposure, cloud/DevOps, measurable impact
- Red flags: vague descriptions, no metrics, missing required stack, no projects, generic bullets

Healthcare / Nursing / Medical:
- Check: certifications (RN, BLS, ACLS, etc.), clinical hours, patient care experience, compliance knowledge, EMR systems
- Red flags: missing licensure, no clinical specifics, vague patient care descriptions

Business / Finance / Consulting:
- Check: KPIs, revenue impact, team leadership, stakeholder management, P&L ownership, specific metrics
- Red flags: no numbers, vague responsibilities, no ownership language

Marketing / Sales:
- Check: campaign results, revenue generated, conversion rates, tools (HubSpot, Salesforce), growth metrics
- Red flags: no metrics, vague "managed campaigns", no tools mentioned

Education:
- Check: student outcomes, curriculum development, teaching methods, grade levels, certifications
- Red flags: no outcomes, vague teaching descriptions

TONE RULES:
- Be direct and honest. Say "This resume will likely be rejected because..." not "You may want to consider..."
- Reference specific content from the resume
- Explain WHY something is weak, not just that it is
- Never be generic. Every piece of feedback must be specific to this resume and this job."""


def generate_resume_feedback(resume_text: str, job_description: str) -> dict:
    relevant_chunks = rag_service.retrieve_relevant_chunks(
        resume_text=resume_text,
        job_description=job_description,
        top_k=5,
    )
    retrieved_context = "\n\n".join(relevant_chunks) if relevant_chunks else ""

    prompt = f"""Analyze this resume against the job description. Be a real recruiter — honest, direct, specific.

Retrieved Resume Context (most relevant sections):
{retrieved_context}

Full Resume:
{resume_text}

Job Description:
{job_description}

Return ONLY this exact JSON structure, no markdown, no extra text:
{{
  "detected_domain": "Specific domain e.g. Software Engineering / Registered Nursing / Financial Analysis",
  "overall_match_score": 0,
  "ats_keyword_score": 0,
  "domain_relevance_score": 0,
  "experience_alignment_score": 0,
  "impact_score": 0,
  "screening_verdict": "Likely Shortlisted | Borderline | Likely Rejected",
  "verdict_reasons": [
    "Specific reason 1 why this verdict was given",
    "Specific reason 2",
    "Specific reason 3"
  ],
  "strengths": [
    "Specific strength referencing actual resume content",
    "Specific strength 2",
    "Specific strength 3"
  ],
  "weaknesses": [
    "Specific weakness — explain WHY it's weak for this role",
    "Specific weakness 2",
    "Specific weakness 3"
  ],
  "brutal_feedback": [
    "Direct statement: This resume will/won't work because...",
    "Direct statement 2",
    "Direct statement 3"
  ],
  "tailored_summary": "2-4 sentence professional summary written for this specific job",
  "missing_keywords_must_have": ["keyword1", "keyword2", "keyword3"],
  "missing_keywords_nice_to_have": ["keyword1", "keyword2"],
  "recruiter_concerns": [
    "Specific concern a recruiter would flag",
    "Specific concern 2"
  ],
  "top_fixes": [
    "Priority 1: Specific actionable fix with clear instruction",
    "Priority 2: Specific actionable fix",
    "Priority 3: Specific actionable fix",
    "Priority 4: Specific actionable fix",
    "Priority 5: Specific actionable fix"
  ],
  "improved_bullets": [
    "Strong rewritten bullet with metric: [Action] [what] [result/impact]",
    "Strong rewritten bullet 2",
    "Strong rewritten bullet 3",
    "Strong rewritten bullet 4"
  ]
}}

Scoring rules:
- overall_match_score >= 85 → screening_verdict = "Likely Shortlisted"
- overall_match_score 70-84 → screening_verdict = "Borderline"
- overall_match_score < 70 → screening_verdict = "Likely Rejected"
- All scores: integers 0-100
- strengths, weaknesses, brutal_feedback: 3-6 items each
- top_fixes: 5-8 items, ordered by priority
- improved_bullets: 4-8 items, must include metrics
- verdict_reasons: exactly 2-3 sharp, specific reasons
- Be specific — reference actual content from the resume and JD"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.3,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
    )

    content = response.choices[0].message.content.strip()

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        cleaned = content.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)
