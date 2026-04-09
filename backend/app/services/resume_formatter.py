from app.schemas import ResumeData


def clean_text(text: str) -> str:
    return " ".join(text.strip().split()) if text else ""


def format_resume_data(data: ResumeData) -> ResumeData:
    data.name = clean_text(data.name)
    data.summary = clean_text(data.summary)

    data.skills = [clean_text(skill) for skill in data.skills if clean_text(skill)]

    for exp in data.experience:
        exp.title = clean_text(exp.title)
        exp.company = clean_text(exp.company)
        exp.dates = clean_text(exp.dates)
        exp.bullets = [clean_text(b) for b in exp.bullets if clean_text(b)]

    for proj in data.projects:
        proj.title = clean_text(proj.title)
        proj.tech = clean_text(proj.tech)
        proj.bullets = [clean_text(b) for b in proj.bullets if clean_text(b)]

    for edu in data.education:
        edu.school = clean_text(edu.school)
        edu.degree = clean_text(edu.degree)
        edu.dates = clean_text(edu.dates)

    return data