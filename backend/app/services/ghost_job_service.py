import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def analyze_ghost_job(job_description: str, company_name: str = "", posted_date: str = "", url: str = "") -> dict:
    """Analyze whether a job posting might be a ghost job."""

    prompt = f"""You are a job market analyst specializing in detecting ghost jobs (fake or inactive job postings).

Analyze this job posting for signs it might be a ghost job.

Job Description:
{job_description[:3000]}

Company: {company_name or "Not specified"}
Posted Date: {posted_date or "Not specified"}
URL: {url or "Not specified"}

Return ONLY this JSON:
{{
  "ghost_probability": 0,
  "verdict": "Likely Real | Possibly Ghost | Likely Ghost",
  "red_flags": [
    "Specific red flag found in this posting"
  ],
  "green_flags": [
    "Specific sign this is a real posting"
  ],
  "analysis": "2-3 sentence explanation of the assessment",
  "recommendations": [
    "What the applicant should do based on this analysis"
  ]
}}

Ghost job indicators to check:
- Extremely broad/vague requirements (trying to collect resumes, not fill a role)
- Unrealistic combination of skills (senior + entry-level pay, or 10 technologies)
- No specific team, project, or manager mentioned
- Posted for a very long time (60+ days)
- Company has many similar listings simultaneously
- "Urgently hiring" but posted months ago
- No clear reporting structure or growth path
- Requirements that no single person could meet
- Salary range is suspiciously wide (e.g., $50k-$150k)
- Generic company description with no specifics

Green flags (likely real):
- Specific team or project mentioned
- Clear reporting structure
- Reasonable and focused requirements
- Specific tech stack (not everything)
- Recent posting date
- Named hiring manager
- Clear interview process mentioned

Rules:
- ghost_probability: 0-100 (0 = definitely real, 100 = definitely ghost)
- red_flags: 2-5 specific observations from THIS posting
- green_flags: 1-4 positive signs
- Be specific — reference actual content from the posting
- verdict must match probability:
  - 0-30: Likely Real
  - 31-60: Possibly Ghost
  - 61-100: Likely Ghost"""

    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are a job market analyst detecting ghost jobs. Be evidence-based. Return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
    )

    content = response.choices[0].message.content.strip()
    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        result = json.loads(content.replace("```json", "").replace("```", "").strip())

    # Ensure verdict matches probability
    prob = result.get("ghost_probability", 0)
    if prob <= 30:
        result["verdict"] = "Likely Real"
    elif prob <= 60:
        result["verdict"] = "Possibly Ghost"
    else:
        result["verdict"] = "Likely Ghost"

    return result
