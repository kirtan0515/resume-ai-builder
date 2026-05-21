from io import BytesIO
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable


def generate_resume_from_profile(profile: dict, template: str = "classic") -> bytes:
    """Generate a polished PDF resume from profile data."""
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=LETTER,
        rightMargin=0.6 * inch,
        leftMargin=0.6 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
    )

    styles = getSampleStyleSheet()

    # Styles
    name_style = ParagraphStyle("Name", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=20, leading=24, alignment=1, spaceAfter=4)
    contact_style = ParagraphStyle("Contact", parent=styles["Normal"], fontName="Helvetica", fontSize=9, leading=11, alignment=1, textColor=colors.HexColor("#444444"), spaceAfter=10)
    section_style = ParagraphStyle("Section", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=10.5, leading=13, textColor=colors.HexColor("#1a1a1a"), spaceBefore=10, spaceAfter=4)
    body_style = ParagraphStyle("Body", parent=styles["Normal"], fontName="Helvetica", fontSize=9.5, leading=12, spaceAfter=3, textColor=colors.HexColor("#333333"))
    bullet_style = ParagraphStyle("Bullet", parent=styles["Normal"], fontName="Helvetica", fontSize=9.5, leading=12, leftIndent=12, bulletIndent=0, spaceAfter=2, textColor=colors.HexColor("#333333"))
    entry_style = ParagraphStyle("Entry", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9.5, leading=12, spaceAfter=2, textColor=colors.HexColor("#1a1a1a"))
    sub_entry_style = ParagraphStyle("SubEntry", parent=styles["Normal"], fontName="Helvetica-Oblique", fontSize=9, leading=11, textColor=colors.HexColor("#555555"), spaceAfter=3)

    story = []

    # Name
    name = profile.get("name", "")
    if name:
        story.append(Paragraph(name, name_style))

    # Contact line
    contact_parts = [
        profile.get("email", ""),
        profile.get("phone", ""),
        profile.get("location", ""),
        profile.get("linkedin", ""),
        profile.get("github", ""),
        profile.get("website", ""),
    ]
    contact_line = " | ".join([p for p in contact_parts if p])
    if contact_line:
        story.append(Paragraph(contact_line, contact_style))

    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc")))
    story.append(Spacer(1, 6))

    # Summary
    summary = profile.get("summary", "")
    if summary:
        story.append(Paragraph("PROFESSIONAL SUMMARY", section_style))
        story.append(Paragraph(summary, body_style))
        story.append(Spacer(1, 4))

    # Skills
    skills = profile.get("skills", [])
    if skills:
        story.append(Paragraph("SKILLS", section_style))
        story.append(HRFlowable(width="100%", thickness=0.3, color=colors.HexColor("#dddddd")))
        story.append(Spacer(1, 3))
        skills_text = ", ".join(skills) if isinstance(skills, list) else str(skills)
        story.append(Paragraph(skills_text, body_style))
        story.append(Spacer(1, 4))

    # Experience
    experience = profile.get("experience", [])
    if experience:
        story.append(Paragraph("EXPERIENCE", section_style))
        story.append(HRFlowable(width="100%", thickness=0.3, color=colors.HexColor("#dddddd")))
        story.append(Spacer(1, 3))
        for exp in experience:
            title = exp.get("title", "")
            company = exp.get("company", "")
            dates = exp.get("dates", "")
            header = f"{title}"
            if company:
                header += f" — {company}"
            story.append(Paragraph(header, entry_style))
            if dates:
                story.append(Paragraph(dates, sub_entry_style))
            for bullet in exp.get("bullets", []):
                if bullet.strip():
                    story.append(Paragraph(bullet, bullet_style, bulletText="•"))
            story.append(Spacer(1, 4))

    # Projects
    projects = profile.get("projects", [])
    if projects:
        story.append(Paragraph("PROJECTS", section_style))
        story.append(HRFlowable(width="100%", thickness=0.3, color=colors.HexColor("#dddddd")))
        story.append(Spacer(1, 3))
        for proj in projects:
            title = proj.get("title", "")
            tech = proj.get("tech", "")
            header = title
            if tech:
                header += f" | {tech}"
            story.append(Paragraph(header, entry_style))
            for bullet in proj.get("bullets", []):
                if bullet.strip():
                    story.append(Paragraph(bullet, bullet_style, bulletText="•"))
            story.append(Spacer(1, 4))

    # Education
    education = profile.get("education", [])
    if education:
        story.append(Paragraph("EDUCATION", section_style))
        story.append(HRFlowable(width="100%", thickness=0.3, color=colors.HexColor("#dddddd")))
        story.append(Spacer(1, 3))
        for edu in education:
            school = edu.get("school", "")
            degree = edu.get("degree", "")
            dates = edu.get("dates", "")
            header = f"{degree}" if degree else school
            if school and degree:
                header = f"{degree} — {school}"
            story.append(Paragraph(header, entry_style))
            if dates:
                story.append(Paragraph(dates, sub_entry_style))
            story.append(Spacer(1, 3))

    # Certifications
    certs = profile.get("certifications", [])
    if certs:
        story.append(Paragraph("CERTIFICATIONS", section_style))
        story.append(HRFlowable(width="100%", thickness=0.3, color=colors.HexColor("#dddddd")))
        story.append(Spacer(1, 3))
        for cert in certs:
            if isinstance(cert, str):
                story.append(Paragraph(cert, body_style))
            elif isinstance(cert, dict):
                story.append(Paragraph(f"{cert.get('name', '')} — {cert.get('issuer', '')}", body_style))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
