import re
import json
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def simulate_ats_parsing(resume_text: str) -> dict:
    """Simulate how an ATS system would parse and interpret a resume."""

    # Step 1: Strip formatting (simulate ATS text extraction)
    stripped = strip_formatting(resume_text)

    # Step 2: Check for common ATS issues
    issues = check_ats_issues(resume_text)

    # Step 3: AI analysis of parsability
    ai_analysis = analyze_ats_compatibility(resume_text)

    return {
        "parsed_text_preview": stripped[:1500],
        "character_count": len(stripped),
        "word_count": len(stripped.split()),
        "issues": issues,
        "ats_score": ai_analysis.get("ats_score", 0),
        "sections_detected": ai_analysis.get("sections_detected", []),
        "parsing_warnings": ai_analysis.get("parsing_warnings", []),
        "formatting_tips": ai_analysis.get("formatting_tips", []),
        "verdict": ai_analysis.get("verdict", ""),
    }


def strip_formatting(text: str) -> str:
    """Simulate ATS text extraction — strip special chars, normalize whitespace."""
    # Remove common formatting artifacts
    text = re.sub(r'[•●○◦▪▸►→‣⁃]', '- ', text)
    text = re.sub(r'[│┃|]', ' ', text)
    text = re.sub(r'[\t]+', ' ', text)
    text = re.sub(r'[ ]{3,}', '  ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def check_ats_issues(text: str) -> list:
    """Check for common ATS parsing problems."""
    issues = []

    # Check for tables (pipes, tabs indicating columns)
    if text.count('|') > 5:
        issues.append({"severity": "high", "issue": "Table-like formatting detected", "fix": "ATS systems often can't parse tables. Use simple lists instead."})

    # Check for special characters
    special_chars = re.findall(r'[^\x00-\x7F]', text)
    if len(special_chars) > 10:
        issues.append({"severity": "medium", "issue": f"Found {len(special_chars)} special/unicode characters", "fix": "Some ATS systems strip non-ASCII characters. Use standard bullets (- or *) instead of fancy ones."})

    # Check for headers
    common_headers = ["experience", "education", "skills", "summary", "projects", "certifications"]
    found_headers = [h for h in common_headers if h.lower() in text.lower()]
    missing_headers = [h for h in common_headers[:4] if h not in found_headers]
    if missing_headers:
        issues.append({"severity": "medium", "issue": f"Missing standard section headers: {', '.join(missing_headers)}", "fix": "Use standard section headers (EXPERIENCE, EDUCATION, SKILLS, SUMMARY) so ATS can categorize your content."})

    # Check length
    words = len(text.split())
    if words < 200:
        issues.append({"severity": "high", "issue": "Resume is very short", "fix": "Most ATS-optimized resumes are 400-800 words. Add more detail to your experience and projects."})
    elif words > 1200:
        issues.append({"severity": "low", "issue": "Resume is quite long", "fix": "Consider condensing to 1-2 pages. Recruiters spend 6-10 seconds on initial scan."})

    # Check for dates
    date_patterns = re.findall(r'\b(20\d{2}|19\d{2})\b', text)
    if len(date_patterns) < 2:
        issues.append({"severity": "medium", "issue": "Few dates detected", "fix": "Include clear date ranges for each role (e.g., Jan 2023 – Present). ATS uses dates to calculate experience length."})

    # Check for contact info
    has_email = bool(re.search(r'[\w.-]+@[\w.-]+\.\w+', text))
    has_phone = bool(re.search(r'[\d\-\(\)\+\s]{10,}', text))
    if not has_email:
        issues.append({"severity": "high", "issue": "No email address detected", "fix": "Include your email at the top. ATS needs this to create your candidate profile."})
    if not has_phone:
        issues.append({"severity": "medium", "issue": "No phone number detected", "fix": "Include a phone number for recruiter contact."})

    return issues


def analyze_ats_compatibility(resume_text: str) -> dict:
    """Use AI to analyze ATS compatibility."""
    prompt = f"""Analyze this resume for ATS (Applicant Tracking System) compatibility.

Resume:
{resume_text[:3000]}

Return ONLY this JSON:
{{
  "ats_score": 0,
  "sections_detected": ["section names the ATS would identify"],
  "parsing_warnings": ["specific parsing issues an ATS would have"],
  "formatting_tips": ["specific tips to improve ATS compatibility"],
  "verdict": "ATS-Ready | Mostly Compatible | Needs Fixes | Likely Rejected by ATS"
}}

Rules:
- ats_score: 0-100 (how well this resume would parse in a typical ATS)
- sections_detected: what an ATS would identify as sections
- parsing_warnings: 2-4 specific issues
- formatting_tips: 3-5 actionable tips
- Be specific to THIS resume"""

    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are an ATS expert. Analyze resume parsing compatibility. Return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
    )

    content = response.choices[0].message.content.strip()
    try:
        return json.loads(content)
    except:
        return json.loads(content.replace("```json", "").replace("```", "").strip())
