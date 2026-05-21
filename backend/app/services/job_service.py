import os
import json
import httpx
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

APIFY_TOKEN = os.getenv("APIFY_TOKEN", "")
OPENAI_KEY = os.getenv("OPENAI_API_KEY", "")
client = OpenAI(api_key=OPENAI_KEY)

# LinkedIn Jobs Scraper actor on Apify
LINKEDIN_ACTOR_ID = "hMvNSpz3JnHgl5jkh"


async def scrape_jobs(query: str, location: str = "United States", limit: int = 20) -> list:
    """Scrape jobs from LinkedIn via Apify."""
    if not APIFY_TOKEN:
        raise RuntimeError("APIFY_TOKEN not configured")

    run_input = {
        "searchUrl": f"https://www.linkedin.com/jobs/search/?keywords={query}&location={location}",
        "maxItems": limit,
        "proxy": {"useApifyProxy": True},
    }

    async with httpx.AsyncClient(timeout=120) as http:
        # Start the actor run and wait for it to finish
        res = await http.post(
            f"https://api.apify.com/v2/acts/{LINKEDIN_ACTOR_ID}/run-sync-get-dataset-items",
            params={"token": APIFY_TOKEN},
            json=run_input,
        )

        if res.status_code != 200 and res.status_code != 201:
            # Fallback: try a simpler actor for Indeed
            return await scrape_jobs_fallback(query, location, limit)

        jobs = res.json()

    # Normalize the response
    normalized = []
    for job in jobs[:limit]:
        normalized.append({
            "title": job.get("title", ""),
            "company": job.get("companyName", job.get("company", "")),
            "location": job.get("location", ""),
            "description": job.get("description", "")[:3000],
            "url": job.get("link", job.get("url", "")),
            "posted": job.get("postedAt", job.get("publishedAt", "")),
        })

    return normalized


async def scrape_jobs_fallback(query: str, location: str, limit: int) -> list:
    """Fallback using a different Apify actor if LinkedIn one fails."""
    # Indeed scraper actor
    INDEED_ACTOR_ID = "hyne9gDiRa2JOa5Ib"

    run_input = {
        "position": query,
        "country": "US",
        "location": location,
        "maxItems": limit,
        "parseCompanyDetails": False,
    }

    async with httpx.AsyncClient(timeout=120) as http:
        res = await http.post(
            f"https://api.apify.com/v2/acts/{INDEED_ACTOR_ID}/run-sync-get-dataset-items",
            params={"token": APIFY_TOKEN},
            json=run_input,
        )

        if res.status_code not in (200, 201):
            return []

        jobs = res.json()

    normalized = []
    for job in jobs[:limit]:
        normalized.append({
            "title": job.get("positionName", job.get("title", "")),
            "company": job.get("company", ""),
            "location": job.get("location", ""),
            "description": job.get("description", "")[:3000],
            "url": job.get("url", ""),
            "posted": job.get("postedAt", ""),
        })

    return normalized


def score_job_match(resume_text: str, job: dict) -> dict:
    """Quick match score between resume and a single job."""
    prompt = f"""Compare this resume against the job posting. Return ONLY JSON.

Resume (summary):
{resume_text[:2000]}

Job:
Title: {job['title']}
Company: {job['company']}
Description: {job['description'][:1500]}

Return this exact JSON:
{{
  "match_score": 0,
  "verdict": "Strong fit | Good fit | Partial fit | Weak fit",
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"],
  "reason": "One sentence explaining the match"
}}

Rules:
- match_score: integer 0-100
- matched_skills: 2-5 skills from resume that match the job
- missing_skills: 2-4 key skills the job wants that aren't in the resume
- Be concise and accurate"""

    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are a job-resume matching assistant. Return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
    )

    content = response.choices[0].message.content.strip()
    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        result = {"match_score": 0, "verdict": "Unable to score", "matched_skills": [], "missing_skills": [], "reason": "Scoring failed"}

    result["title"] = job["title"]
    result["company"] = job["company"]
    result["location"] = job["location"]
    result["url"] = job["url"]
    result["posted"] = job.get("posted", "")

    return result


async def find_matching_jobs(resume_text: str, job_title: str, location: str = "United States", limit: int = 15) -> list:
    """Full pipeline: scrape jobs → score each → return ranked list."""
    # Scrape jobs
    jobs = await scrape_jobs(job_title, location, limit)

    if not jobs:
        return []

    # Score each job against the resume
    scored = []
    for job in jobs:
        if not job.get("description"):
            continue
        result = score_job_match(resume_text, job)
        scored.append(result)

    # Sort by match score descending
    scored.sort(key=lambda x: x.get("match_score", 0), reverse=True)

    return scored
