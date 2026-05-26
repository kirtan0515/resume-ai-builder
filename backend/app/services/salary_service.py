import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_salary_analysis(resume_text: str, job_description: str, company_name: str = "", location: str = "") -> dict:
    """Generate salary estimate and negotiation guidance."""

    prompt = f"""You are a compensation analyst and negotiation coach.
Based on the candidate's resume, the job description, company, and location, provide salary intelligence.

Resume:
{resume_text[:2500]}

Job Description:
{job_description[:2000]}

Company: {company_name or "Not specified"}
Location: {location or "Not specified"}

Return ONLY this JSON:
{{
  "estimated_range": {{
    "low": 0,
    "mid": 0,
    "high": 0,
    "currency": "USD"
  }},
  "candidate_position": "Below range | Low end | Mid range | High end | Above range",
  "position_reasoning": "Why the candidate falls at this point in the range based on their experience",
  "factors_increasing": [
    "Factor that could push salary higher for this candidate"
  ],
  "factors_decreasing": [
    "Factor that could limit salary for this candidate"
  ],
  "negotiation_script": "A 3-4 sentence script the candidate can use when asked about salary expectations",
  "counter_offer_script": "What to say if the initial offer is below the mid range",
  "tips": [
    "Specific negotiation tip for this role/company",
    "Tip 2",
    "Tip 3"
  ],
  "market_context": "1-2 sentences about the current market for this type of role"
}}

Rules:
- Salary estimates should be annual, in USD
- Be realistic based on the role level, location, and company size
- candidate_position should reflect their actual experience level
- negotiation_script should sound natural, not robotic
- tips should be specific to this role, not generic advice
- If location is a major tech hub, adjust accordingly
- If company is FAANG/big tech, adjust range upward"""

    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.3,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are a compensation analyst. Provide realistic salary estimates and negotiation guidance. Return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
    )

    content = response.choices[0].message.content.strip()
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return json.loads(content.replace("```json", "").replace("```", "").strip())
