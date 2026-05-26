import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_cover_letter(resume_text: str, job_description: str, company_name: str = "", tone: str = "professional") -> dict:
    """Generate a personalized cover letter based on resume and JD."""

    tone_instruction = {
        "professional": "Write in a professional, confident tone. Formal but not stiff.",
        "conversational": "Write in a warm, conversational tone. Friendly but still professional.",
        "enthusiastic": "Write with genuine enthusiasm and energy. Show excitement for the role.",
    }.get(tone, "Write in a professional, confident tone.")

    prompt = f"""Write a cover letter for this candidate applying to this job.

Resume:
{resume_text[:3000]}

Job Description:
{job_description[:2000]}

Company: {company_name or "the company"}

{tone_instruction}

Return ONLY this JSON:
{{
  "cover_letter": "The full cover letter text (3-4 paragraphs, 250-350 words)",
  "subject_line": "Email subject line for the application",
  "opening_hook": "The first sentence — should be compelling and specific",
  "key_connections": [
    "Specific connection between resume and JD that the letter highlights",
    "Connection 2",
    "Connection 3"
  ],
  "closing_cta": "The call-to-action sentence at the end"
}}

Rules:
- The cover letter MUST reference specific experience from the resume
- Connect candidate's actual achievements to the job requirements
- Never invent experience or metrics not in the resume
- Do NOT use generic phrases like "I am writing to express my interest"
- Open with something specific about the role or company
- Each paragraph should serve a purpose:
  1. Hook + why this role
  2. Most relevant experience/achievement
  3. Additional value + culture fit
  4. Closing + call to action
- Keep it under 350 words
- Make it sound human, not AI-generated"""

    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0.4,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are an expert cover letter writer. Write compelling, specific cover letters that reference actual candidate experience. Return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
    )

    content = response.choices[0].message.content.strip()
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return json.loads(content.replace("```json", "").replace("```", "").strip())
