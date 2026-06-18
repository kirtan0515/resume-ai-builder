import os
import json
from dotenv import load_dotenv
from openai import OpenAI
from app.services.rag_service import RAGService
from app.services.learning_service import get_learning_context, get_user_learning_context
from app.services.keyword_matcher import get_matching_context

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
rag_service = RAGService()

SYSTEM_PROMPT = """You are an evidence-based resume coach and career advisor — not a harsh recruiter.

Your role is to give honest, fair, grounded feedback that helps candidates improve their resumes truthfully.

CORE PRINCIPLES:
1. EVIDENCE FIRST — every weakness must cite actual text from the resume or note its absence
2. NO INVENTED CLAIMS — never suggest fake metrics, fake collaboration, fake domain experience, or made-up achievements
3. SEMANTIC MATCHING — use equivalence groups when matching skills. Examples:
   - "LLM APIs" = "OpenAI API" = "GPT integration" = "AI-enabled backend" = "RAG pipeline" = "embeddings"
   - "Docker" = "containerization" = "container-based deployment"
   - "CI/CD" = "GitHub Actions" = "automated deployment pipeline"
   - "REST APIs" = "RESTful services" = "API development" = "FastAPI" = "Flask endpoints"
   - "ranking logic" = "comparison engine" = "algorithmic sorting" partially counts as "algorithm development"
   - "data analysis" = "pandas" = "numpy" = "statistical analysis" partially counts as "data science"
4. QUALIFICATION TIERING — clearly separate required vs preferred vs bonus qualifications
5. INTERNSHIP-AWARE — if the candidate appears to be a student or intern, evaluate project experience fairly
   - Do NOT penalize students for lacking full-time work experience
   - Projects, coursework, and internships are valid evidence
   - Compare against intern/junior expectations, not senior engineer standards
6. CALIBRATED SCORING — scores must match verdicts:
   - 85-100: "Strong match — well-positioned for this role"
   - 70-84: "Competitive with some gaps — strong candidate with areas to strengthen"
   - 55-69: "Partially aligned — relevant background but notable gaps to address"
   - 40-54: "Needs significant work — key requirements are missing or unclear"
   - below 40: "Significant mismatch — consider whether this role fits your current profile"
7. TONE — sound like a smart, fair coach. Never say "will be rejected" or "not qualified" unless the evidence is overwhelming. Prefer:
   - "this section could be stronger"
   - "consider adding evidence of X"
   - "this gap may raise questions"
   - "the JD emphasizes X but your resume doesn't clearly show it"

WHAT YOU MUST NEVER DO:
- Suggest adding metrics that aren't supported by the resume
- Claim the candidate lacks something that is present under a different name
- Use absolute language like "will be rejected" for borderline cases
- Invent collaboration, leadership, or domain experience not in the resume
- Give generic advice like "add more metrics" without citing what's already there"""


def generate_resume_feedback(resume_text: str, job_description: str, user_id: str = "") -> dict:
    relevant_chunks = rag_service.retrieve_relevant_chunks(
        resume_text=resume_text,
        job_description=job_description,
        top_k=5,
    )
    retrieved_context = "\n\n".join(relevant_chunks) if relevant_chunks else ""

    # Get learning context from real outcome data
    learning_context = get_learning_context()
    user_context = get_user_learning_context(user_id) if user_id else ""

    # Get deterministic keyword matching (ground truth for scoring)
    keyword_context = get_matching_context(resume_text, job_description) if job_description else ""

    prompt = f"""Analyze this resume against the job description as a fair, evidence-based resume coach.

{keyword_context}

{learning_context}

{user_context}

Retrieved Resume Context (most relevant sections via semantic search):
{retrieved_context}

Full Resume:
{resume_text}

Job Description:
{job_description}

STEP 1 — Detect candidate level:
- Look for signals: "student", "intern", "BS/MS candidate", graduation year within 2 years, only project experience
- If student/intern: evaluate against junior/intern expectations, not senior standards

STEP 2 — Identify qualification tiers from the JD:
- Required: explicitly stated as required, must-have, or essential
- Preferred: stated as preferred, nice-to-have, or a plus
- Bonus: differentiators that would strengthen the application

STEP 3 — Match skills semantically:
- Use equivalence groups (see system prompt)
- If a skill is present under a different name or equivalent technology, count it as present
- Only flag as missing if genuinely absent after semantic matching

STEP 4 — Score calibration (CRITICAL — scores must reflect actual content):
- ats_keyword_score: Count how many required/preferred keywords from the JD appear in the resume (semantically). Score = (matched / total) * 100
- domain_relevance_score: How relevant is the candidate's domain experience to the job? Direct match = 80-100, adjacent = 50-79, unrelated = below 50
- experience_alignment_score: Does the level/type of experience match? Same role type = 80-100, transferable = 50-79, mismatch = below 50
- impact_score: Are achievements quantified with metrics, outcomes, or scale? 3+ metrics = 80-100, 1-2 = 50-79, none = below 50
- qualification_coverage_score: (required_met / total_required) * 70 + (preferred_met / total_preferred) * 30
- overall_match_score: weighted average = (ats_keyword * 0.25) + (domain_relevance * 0.20) + (experience_alignment * 0.25) + (impact * 0.15) + (qualification_coverage * 0.15)

IMPORTANT: If the resume has added specific keywords, metrics, or improvements that address the job requirements, the score MUST increase compared to a version without those additions. A resume that covers 8/10 required keywords MUST score higher on ats_keyword_score than one covering 5/10. Be mathematically consistent.

Return ONLY this exact JSON, no markdown:
{{
  "detected_domain": "Specific domain e.g. Software Engineering / Data Science / Healthcare",
  "candidate_level": "student | junior | mid | senior",
  "overall_match_score": 0,
  "ats_keyword_score": 0,
  "domain_relevance_score": 0,
  "experience_alignment_score": 0,
  "impact_score": 0,
  "qualification_coverage_score": 0,
  "verdict": "Strong match — well-positioned for this role | Competitive with some gaps — strong candidate with areas to strengthen | Partially aligned — relevant background but notable gaps to address | Needs significant work — key requirements are missing or unclear | Significant mismatch — consider whether this role fits your current profile",
  "verdict_explanation": "2-3 sentence explanation of the verdict that references specific evidence from the resume and JD",
  "internship_note": "null or a brief note if evaluated as student/intern e.g. Evaluated as a student candidate — project experience weighted appropriately",
  "qualification_analysis": {{
    "required_met": ["skill or qualification found in resume"],
    "required_missing": ["skill or qualification genuinely absent after semantic matching"],
    "preferred_met": ["preferred qualification found"],
    "preferred_missing": ["preferred qualification absent"],
    "bonus_present": ["differentiator found in resume"]
  }},
  "strengths": [
    {{
      "point": "Concise strength statement",
      "evidence": "Exact quote or paraphrase from resume that supports this"
    }}
  ],
  "weaknesses": [
    {{
      "point": "Concise weakness statement",
      "evidence": "What we found or did not find in the resume",
      "suggestion": "Truthful, specific suggestion for improvement — no invented claims"
    }}
  ],
  "coach_feedback": [
    "Measured, specific coaching observation 1 — references actual resume content",
    "Coaching observation 2",
    "Coaching observation 3"
  ],
  "tailored_summary": "2-4 sentence professional summary written for this specific job, based only on what is in the resume",
  "missing_keywords_required": ["keyword genuinely missing after semantic matching"],
  "missing_keywords_preferred": ["preferred keyword missing"],
  "top_fixes": [
    {{
      "priority": 1,
      "fix": "Specific actionable improvement",
      "why": "Why this matters for this specific role",
      "how": "Truthful way to implement this based on what is in the resume"
    }}
  ],
  "improved_bullets": [
    {{
      "original": "Original bullet from resume or null if new",
      "improved": "Rewritten bullet — only using information present in the resume, no invented metrics"
    }}
  ]
}}

Rules:
- candidate_level: detect from resume signals
- All scores: integers 0-100, calculated using the scoring formulas in STEP 4
- verdict must match the overall_match_score band exactly
- SCORING ACCURACY: Count actual keyword matches. If resume has 8/10 required keywords = ats_keyword_score of 80. If it has 5/10 = 50. Be mathematical, not impressionistic.
- IMPROVEMENT DETECTION: If a resume includes specific metrics, action verbs, relevant keywords, or quantified achievements, score it HIGHER than a generic resume. Every concrete improvement must move the score up.
- strengths: 2-5 items with evidence
- weaknesses: 2-5 items with evidence and suggestion
- coach_feedback: 2-4 measured observations (no harsh language)
- top_fixes: 3-6 items with priority, fix, why, how
- improved_bullets: 3-6 items
- NEVER invent metrics, collaboration, or domain experience not in the resume
- If a skill is present semantically, do NOT list it as missing"""

    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.1,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
    )

    content = response.choices[0].message.content.strip()

    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        cleaned = content.replace("```json", "").replace("```", "").strip()
        result = json.loads(cleaned)

    # Post-process: ensure verdict matches score band
    score = result.get("overall_match_score", 0)
    verdict_map = [
        (85, "Strong match — well-positioned for this role"),
        (70, "Competitive with some gaps — strong candidate with areas to strengthen"),
        (55, "Partially aligned — relevant background but notable gaps to address"),
        (40, "Needs significant work — key requirements are missing or unclear"),
        (0,  "Significant mismatch — consider whether this role fits your current profile"),
    ]
    for threshold, label in verdict_map:
        if score >= threshold:
            result["verdict"] = label
            break

    return result
