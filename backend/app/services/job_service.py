import os
import json
import httpx
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

APIFY_TOKEN = os.getenv("APIFY_TOKEN", "")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def scrape_jobs(query: str, location: str = "United States", limit: int = 15) -> list:
    """Scrape jobs using Apify's Google Jobs Scraper (fast, reliable)."""
    if not APIFY_TOKEN:
        raise RuntimeError("APIFY_TOKEN not configured")

    # Use Google Jobs scraper — much faster than LinkedIn
    ACTOR_ID = "SpK6VjB0v1MBafMdG"  # Google Jobs Scraper

    run_input = {
        "queries": [f"{query} {location}"],
        "maxPagesPerQuery": 1,
        "csvFriendlyOutput": False,
    }

    async with httpx.AsyncClient(timeout=90) as http:
        res = await http.post(
            f"https://api.apify.com/v2/acts/{ACTOR_ID}/run-sync-get-dataset-items",
            params={"token": APIFY_TOKEN},
            json=run_input,
        )

        if res.status_code not in (200, 201):
            # Fallback: try Indeed scraper
            return await scrape_indeed_jobs(query, location, limit)

        jobs_raw = res.json()

    # Normalize
    normalized = []
    for job in jobs_raw[:limit]:
        normalized.append({
            "title": job.get("title", ""),
            "company": job.get("companyName", job.get("company", "")),
            "location": job.get("location", ""),
            "description": (job.get("description", "") or "")[:3000],
            "url": job.get("link", job.get("applyLink", job.get("url", ""))),
            "posted": job.get("postedAt", job.get("date", "")),
            "source": job.get("source", "Google Jobs"),
        })

    return [j for j in normalized if j["title"]]


async def scrape_indeed_jobs(query: str, location: str, limit: int) -> list:
    """Fallback: use Indeed scraper."""
    ACTOR_ID = "hMvNSpz3JnHgl5jkh"

    run_input = {
        "position": query,
        "country": "US",
        "location": location,
        "maxItems": limit,
    }

    async with httpx.AsyncClient(timeout=90) as http:
        res = await http.post(
            f"https://api.apify.com/v2/acts/{ACTOR_ID}/run-sync-get-dataset-items",
            params={"token": APIFY_TOKEN},
            json=run_input,
        )

        if res.status_code not in (200, 201):
            return []

        jobs_raw = res.json()

    normalized = []
    for job in jobs_raw[:limit]:
        normalized.append({
            "title": job.get("positionName", job.get("title", "")),
            "company": job.get("company", ""),
            "location": job.get("location", ""),
            "description": (job.get("description", "") or "")[:3000],
            "url": job.get("url", ""),
            "posted": job.get("postedAt", ""),
            "source": "Indeed",
        })

    return [j for j in normalized if j["title"]]


def score_jobs_batch(resume_text: str, jobs: list) -> list:
    """Score all jobs in a single GPT-4o call for speed and cost efficiency."""

    jobs_summary = ""
    for i, job in enumerate(jobs):
        jobs_summary += f"\n---JOB {i+1}---\nTitle: {job['title']}\nCompany: {job['company']}\nLocation: {job['location']}\nDescription: {job['description'][:800]}\n"

    prompt = f"""You are a job-resume matching expert. Score how well this candidate fits each job.

RESUME:
{resume_text[:2500]}

JOBS TO SCORE:
{jobs_summary}

For each job, return a JSON array with one object per job in order:
[
  {{
    "job_index": 1,
    "match_score": 0,
    "verdict": "Strong fit | Good fit | Partial fit | Weak fit",
    "why_good_fit": "1 sentence on why this is a good match",
    "key_gap": "1 sentence on the main gap or concern",
    "matched_skills": ["skill1", "skill2", "skill3"],
    "missing_skills": ["skill1", "skill2"]
  }}
]

Rules:
- match_score: 0-100 integer
- Be realistic — don't inflate scores
- matched_skills: 2-4 skills from resume that match
- missing_skills: 1-3 key gaps
- Sort your assessment by actual fit, not by order given"""

    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are a job matching expert. Return only valid JSON with a 'results' array."},
            {"role": "user", "content": prompt},
        ],
    )

    content = response.choices[0].message.content.strip()
    try:
        parsed = json.loads(content)
        scores = parsed if isinstance(parsed, list) else parsed.get("results", [])
    except json.JSONDecodeError:
        return []

    # Merge scores with job data
    results = []
    for i, job in enumerate(jobs):
        score_data = next((s for s in scores if s.get("job_index") == i + 1), None)
        if not score_data:
            score_data = scores[i] if i < len(scores) else {}

        results.append({
            "title": job["title"],
            "company": job["company"],
            "location": job["location"],
            "url": job["url"],
            "posted": job.get("posted", ""),
            "source": job.get("source", ""),
            "match_score": score_data.get("match_score", 0),
            "verdict": score_data.get("verdict", "Unable to score"),
            "why_good_fit": score_data.get("why_good_fit", ""),
            "key_gap": score_data.get("key_gap", ""),
            "matched_skills": score_data.get("matched_skills", []),
            "missing_skills": score_data.get("missing_skills", []),
        })

    # Sort by score
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results


def extract_job_title_from_resume(resume_text: str) -> str:
    """Use GPT-4o to extract the best job search query from a resume."""
    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.1,
        messages=[
            {"role": "system", "content": "Extract the single best job search query from this resume. Return ONLY the job title/search string, nothing else. Examples: 'Software Engineer', 'Data Analyst', 'Registered Nurse', 'Marketing Manager'. Be specific based on their actual experience level and domain."},
            {"role": "user", "content": f"Resume:\n{resume_text[:2000]}"},
        ],
    )
    return response.choices[0].message.content.strip().strip('"')


async def find_matching_jobs(resume_text: str, job_title: str = "", location: str = "United States", limit: int = 15) -> dict:
    """Full pipeline: extract query → scrape → batch score → return ranked list."""

    # Auto-extract search query if not provided
    search_query = job_title.strip()
    if not search_query:
        search_query = extract_job_title_from_resume(resume_text)

    # Scrape jobs
    jobs = await scrape_jobs(search_query, location, limit)

    if not jobs:
        return {"jobs": [], "query": search_query, "location": location}

    # Batch score all jobs in one GPT-4o call (faster + cheaper)
    scored = score_jobs_batch(resume_text, jobs)

    return {"jobs": scored, "query": search_query, "location": location}
