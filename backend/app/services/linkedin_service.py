import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def analyze_linkedin_vs_resume(linkedin_text: str, resume_text: str) -> dict:
    """Compare LinkedIn profile against resume for consistency and improvements."""

    prompt = f"""Compare this LinkedIn profile text against the resume. Find inconsistencies, gaps, and improvement opportunities.

LinkedIn Profile:
{linkedin_text[:2500]}

Resume:
{resume_text[:2500]}

Return ONLY this JSON:
{{
  "consistency_score": 0,
  "verdict": "Consistent | Minor gaps | Significant mismatches",
  "mismatches": [
    {{
      "area": "What's different",
      "linkedin_says": "What LinkedIn shows",
      "resume_says": "What resume shows",
      "recommendation": "Which to fix and how"
    }}
  ],
  "linkedin_improvements": [
    "Specific improvement for the LinkedIn profile"
  ],
  "resume_improvements": [
    "Specific improvement for the resume based on LinkedIn content"
  ],
  "missing_from_linkedin": [
    "Things on resume that should also be on LinkedIn"
  ],
  "missing_from_resume": [
    "Things on LinkedIn that could strengthen the resume"
  ],
  "overall_advice": "2-3 sentences of overall guidance"
}}

Rules:
- consistency_score: 0-100 (how well they align)
- Check: dates, job titles, company names, skills, education
- mismatches: specific factual differences (different dates, titles, etc.)
- Be specific — reference actual content from both
- linkedin_improvements: 3-5 specific suggestions
- resume_improvements: 2-4 suggestions based on LinkedIn content"""

    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are a career branding expert. Compare LinkedIn and resume for consistency. Return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
    )

    content = response.choices[0].message.content.strip()
    try:
        return json.loads(content)
    except:
        return json.loads(content.replace("```json", "").replace("```", "").strip())
