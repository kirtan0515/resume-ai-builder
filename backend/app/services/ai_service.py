import os
import json
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_resume_feedback(resume_text: str, job_description: str) -> dict:
    prompt = f"""
You are an expert resume optimizer and career assistant.

Given a candidate resume and a target job description, return ONLY valid JSON.

Your response must follow this exact structure:

{{
  "analysis": {{
    "tailored_summary": "2-4 sentence professional summary tailored to the job",
    "improved_bullets": [
      "Strong rewritten bullet 1",
      "Strong rewritten bullet 2",
      "Strong rewritten bullet 3"
    ],
    "missing_skills": [
      "Skill 1",
      "Skill 2",
      "Skill 3"
    ],
    "match_score": 78
  }},
  "resume_data": {{
    "name": "",
    "contact": {{
      "email": "",
      "phone": "",
      "location": "",
      "linkedin": "",
      "github": ""
    }},
    "summary": "Tailored professional summary here",
    "skills": ["Skill A", "Skill B", "Skill C"],
    "experience": [
      {{
        "title": "Relevant Title",
        "company": "Company Name",
        "dates": "Dates here",
        "bullets": [
          "Achievement-focused bullet 1",
          "Achievement-focused bullet 2",
          "Achievement-focused bullet 3"
        ]
      }}
    ],
    "projects": [
      {{
        "title": "Relevant Project",
        "tech": "Python, FastAPI, React, AWS",
        "bullets": [
          "Project bullet 1",
          "Project bullet 2"
        ]
      }}
    ],
    "education": [
      {{
        "school": "School Name",
        "degree": "Degree Name",
        "dates": "Dates here"
      }}
    ]
  }}
}}

Rules:
- Return ONLY JSON, no markdown.
- Keep match_score between 0 and 100.
- Use concise, ATS-friendly language.
- Rewrite bullets to be stronger and more targeted.
- Infer reasonable resume structure from the resume text.
- If a field is missing, use an empty string or empty list.
- Do not invent fake companies unless clearly implied by the resume.
- Keep resume_data useful enough for direct PDF generation.

Resume:
{resume_text}

Job Description:
{job_description}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.4,
        messages=[
            {
                "role": "system",
                "content": "You are a precise resume optimization assistant that returns only valid JSON."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
    )

    content = response.choices[0].message.content.strip()

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # fallback cleanup in case model wraps JSON in markdown
        cleaned = content.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)