import os
import json
from dotenv import load_dotenv
from openai import OpenAI
from app.utils.prompts import SYSTEM_PROMPT

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise ValueError("OPENAI_API_KEY is missing in backend/.env")

client = OpenAI(api_key=api_key)


def generate_resume_feedback(resume_text: str, job_description: str):
    user_prompt = f"""
Candidate Resume:
{resume_text}

Job Description:
{job_description}

Instructions:
1. Write a tailored professional summary
2. Rewrite 3 to 5 resume bullet points to better fit the role
3. Identify missing skills or keywords
4. Give a match score from 0 to 100
5. Return valid JSON only
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.3
    )

    content = response.choices[0].message.content

    parsed = json.loads(content)

    return {
        "tailored_summary": parsed.get("tailored_summary", ""),
        "improved_bullets": parsed.get("improved_bullets", []),
        "missing_skills": parsed.get("missing_skills", []),
        "match_score": int(parsed.get("match_score", 0)),
    }