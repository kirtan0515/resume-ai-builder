from io import BytesIO
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from app.schemas import ResumeData


def generate_resume_pdf(resume: ResumeData) -> bytes:
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=LETTER,
        rightMargin=0.55 * inch,
        leftMargin=0.55 * inch,
        topMargin=0.45 * inch,
        bottomMargin=0.45 * inch,
    )

    styles = getSampleStyleSheet()

    name_style = ParagraphStyle(
        "NameStyle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        alignment=1,
        spaceAfter=6,
    )

    contact_style = ParagraphStyle(
        "ContactStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=11,
        alignment=1,
        textColor=colors.black,
        spaceAfter=8,
    )

    section_style = ParagraphStyle(
        "SectionStyle",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=12,
        textColor=colors.black,
        spaceBefore=6,
        spaceAfter=4,
    )

    body_style = ParagraphStyle(
        "BodyStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=11,
        spaceAfter=3,
    )

    bullet_style = ParagraphStyle(
        "BulletStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=11,
        leftIndent=10,
        bulletIndent=0,
        spaceAfter=2,
    )

    entry_title_style = ParagraphStyle(
        "EntryTitleStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=11,
        spaceAfter=2,
    )

    story = []

    story.append(Paragraph(resume.name, name_style))

    contact_parts = [
        resume.contact.phone,
        resume.contact.email,
        resume.contact.location,
        resume.contact.linkedin,
        resume.contact.github,
    ]
    contact_line = " | ".join([item for item in contact_parts if item])
    story.append(Paragraph(contact_line, contact_style))
    story.append(Spacer(1, 4))

    if resume.summary:
        story.append(Paragraph("SUMMARY", section_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.black))
        story.append(Spacer(1, 3))
        story.append(Paragraph(resume.summary, body_style))

    if resume.skills:
        story.append(Paragraph("SKILLS", section_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.black))
        story.append(Spacer(1, 3))
        story.append(Paragraph(", ".join(resume.skills), body_style))

    if resume.experience:
        story.append(Paragraph("EXPERIENCE", section_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.black))
        story.append(Spacer(1, 3))

        for exp in resume.experience:
            header = f"{exp.title} | {exp.company} | {exp.dates}"
            story.append(Paragraph(header, entry_title_style))
            for bullet in exp.bullets:
                story.append(Paragraph(bullet, bullet_style, bulletText="•"))

    if resume.projects:
        story.append(Paragraph("PROJECTS", section_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.black))
        story.append(Spacer(1, 3))

        for proj in resume.projects:
            header = proj.title
            if proj.tech:
                header += f" | {proj.tech}"
            story.append(Paragraph(header, entry_title_style))
            for bullet in proj.bullets:
                story.append(Paragraph(bullet, bullet_style, bulletText="•"))

    if resume.education:
        story.append(Paragraph("EDUCATION", section_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.black))
        story.append(Spacer(1, 3))

        for edu in resume.education:
            line = f"{edu.school} | {edu.degree} | {edu.dates}"
            story.append(Paragraph(line, body_style))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes