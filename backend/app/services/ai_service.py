import os
import json
from dotenv import load_dotenv
from openai import OpenAI
from app.services.rag_service import RAGService

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
rag_service = RAGService()

SYSTEM_PROMPT = """You are an expert recruiter, resume strategist, and ATS evaluator.

Your job:
- Detect the domain from the job description
- Evaluate the resume honestly against the job
- Provide specific, actionable feedback
- Return ONLY valid JSON

Adapt evaluation based on industry:
- Tech → stack, projects, systems, APIs, cloud, measurable impact
- Healthcare → certifications, licenses, clinical experience, patient care, compliance
- Business/Finance → metrics, ownership, results, ROI, leadership
- Marketing/Sales → campaigns, growth, conversions, pipeline, revenue
- Education → outcomes, curriculum, teaching methods, student results

Do NOT be generic. Do NOT be overly polite. Be specific and useful.
Think like a senior recruiter giving real feedback."""


def generate_resume_feedback(resume_text: str, job_description: str) -> dict:
    relevant_chunks = rag_service.retrieve_relevant_chunks(
        resume_text=resume_text,
        job_description=job_description,
        top_k=5,
    )
    retrieved_context = "\n\n".join(relevant_chunks) if relevant_chunks else ""

    prompt = f"""Analyze the following resume against the job description.

Retrieved Resume Context (most relevant sections):
{retrieved_context}

Full Resume:
{resume_text}

Job Description:
{job_description}

Return ONLY this JSON structure, no markdown:
{{
  "detected_domain": "e.g. Software Engineering / Healthcare / Finance / Marketing",
  "overall_match_score": 0,
  "ats_keyword_score": 0,
  "domain_relevance_score": 0,
  "experience_alignment_score": 0,
  "impact_score": 0,
  "strengths": [
    "Specific strength 1",
    "Specific strength 2",
    "Specific strength 3"
  ],
  "weaknesses": [
    "Specific weakness 1",
    "Specific weakness 2",
    "Specific weakness 3"
  ],
  "brutal_feedback": [
    "Direct honest observation 1",
    "Direct honest observation 2",
    "Direct honest observation 3"
  ],
  "tailored_summary": "2-4 sentence professional summary tailored to this specific job",
  "missing_keywords_must_have": ["keyword1", "keyword2"],
  "missing_keywords_nice_to_have": ["keyword1", "keyword2"],
  "recruiter_concerns": [
    "Concern a recruiter would flag 1",
    "Concern a recruiter would flag 2"
  ],
  "top_fixes": [
    "Specific actionable fix 1",
    "Specific actionable fix 2",
    "Specific actionable fix 3",
    "Specific actionable fix 4",
    "Specific actionable fix 5"
  ],
  "improved_bullets": [
    "Rewritten achievement bullet 1",
    "Rewritten achievement bullet 2",
    "Rewritten achievement bullet 3",
    "Rewritten achievement bullet 4"
  ]
}}

Rules:
- All scores: integers 0-100
- strengths, weaknesses, brutal_feedback: 3-6 items each
- top_fixes: 5-8 items
- improved_bullets: 4-8 items
- Be specific — reference actual content from the resume and JD
- Explain WHY something is weak, not just that it is
- Adapt all feedback to the detected domain"""

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
