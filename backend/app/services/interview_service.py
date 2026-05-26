import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_interview_questions(resume_text: str, job_description: str) -> dict:
    """Generate personalized interview questions + suggested answers based on resume and JD."""

    prompt = f"""You are a senior hiring manager preparing to interview a candidate.
Based on their resume and the job description, generate personalized interview questions
and suggest how the candidate should answer using their ACTUAL experience.

Resume:
{resume_text[:3000]}

Job Description:
{job_description[:2000]}

Return ONLY this JSON:
{{
  "role_summary": "1 sentence describing what this interview is for",
  "questions": [
    {{
      "question": "The interview question",
      "type": "behavioral | technical | situational | culture-fit",
      "why_asked": "Why the interviewer would ask this for THIS specific role",
      "suggested_answer": "How the candidate should answer using their actual resume experience — reference specific projects/roles",
      "key_points": ["Point to hit 1", "Point to hit 2", "Point to hit 3"]
    }}
  ],
  "tips": [
    "General interview tip specific to this role/company",
    "Tip 2",
    "Tip 3"
  ],
  "red_flags_to_avoid": [
    "Something the candidate should NOT say based on their background",
    "Red flag 2"
  ]
}}

Rules:
- Generate 8-12 questions
- Mix of behavioral, technical, situational, and culture-fit
- suggested_answer MUST reference actual content from the resume — never invent experience
- Questions should be specific to THIS job, not generic
- Include at least 2 questions about gaps or weaknesses visible in the resume
- key_points should be 2-4 concise talking points per question
- tips: 3-5 role-specific tips
- red_flags_to_avoid: 2-4 things to avoid saying"""

    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.3,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are an expert interview coach. Generate personalized interview prep based on the candidate's actual experience. Return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
    )

    content = response.choices[0].message.content.strip()
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return json.loads(content.replace("```json", "").replace("```", "").strip())


def score_interview_answer(question: str, answer: str, job_description: str) -> dict:
    """Score a user's practice interview answer."""

    prompt = f"""Score this interview answer for the given question and role.

Question: {question}
Candidate's Answer: {answer}
Job Context: {job_description[:1000]}

Return ONLY this JSON:
{{
  "score": 0,
  "verdict": "Excellent | Good | Needs improvement | Weak",
  "strengths": ["What was good about this answer"],
  "improvements": ["Specific way to improve this answer"],
  "better_version": "A stronger version of their answer using the same content but better structured"
}}

Rules:
- score: 0-100
- Be specific about what works and what doesn't
- better_version should use the SAME facts/experience, just presented better
- Do NOT invent new experience for the better_version"""

    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are an interview coach scoring practice answers. Return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
    )

    content = response.choices[0].message.content.strip()
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return json.loads(content.replace("```json", "").replace("```", "").strip())
