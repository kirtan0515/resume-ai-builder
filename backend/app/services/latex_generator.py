def escape_latex(text: str) -> str:
    """Escape special LaTeX characters."""
    if not text:
        return ""
    replacements = {
        '&': r'\&',
        '%': r'\%',
        '$': r'\$',
        '#': r'\#',
        '_': r'\_',
        '{': r'\{',
        '}': r'\}',
        '~': r'\textasciitilde{}',
        '^': r'\textasciicircum{}',
    }
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    return text


def generate_latex_resume(profile: dict) -> str:
    """Generate LaTeX resume using the user's template format."""

    name = escape_latex(profile.get("name", ""))
    email = profile.get("email", "")
    phone = escape_latex(profile.get("phone", ""))
    location = escape_latex(profile.get("location", ""))
    linkedin = profile.get("linkedin", "")
    github = profile.get("github", "")
    website = profile.get("website", "")
    summary = escape_latex(profile.get("summary", ""))
    skills = profile.get("skills", [])
    experience = profile.get("experience", [])
    education = profile.get("education", [])
    projects = profile.get("projects", [])
    certifications = profile.get("certifications", [])

    # Build contact lines
    contact_line1 = []
    if phone:
        contact_line1.append(phone)
    if location:
        contact_line1.append(location)

    contact_line2 = []
    if email:
        contact_line2.append(f"\\href{{mailto:{email}}}{{{escape_latex(email)}}}")
    if linkedin:
        ln = linkedin.replace("https://", "").replace("http://", "")
        contact_line2.append(f"\\href{{https://{ln}}}{{{escape_latex(ln)}}}")
    if github:
        gh = github.replace("https://", "").replace("http://", "")
        contact_line2.append(f"\\href{{https://{gh}}}{{{escape_latex(gh)}}}")
    if website:
        ws = website.replace("https://", "").replace("http://", "")
        contact_line2.append(f"\\href{{https://{ws}}}{{{escape_latex(ws)}}}")

    # Start building LaTeX
    lines = [
        r"\documentclass{resume}",
        r"\usepackage[left=0.40in, top=0.22in, right=0.40in, bottom=0.22in]{geometry}",
        r"\usepackage{enumitem}",
        r"\usepackage[hidelinks]{hyperref}",
        r"\setlist[itemize]{noitemsep, topsep=0pt, parsep=0pt, partopsep=0pt, leftmargin=*}",
        r"\AtBeginDocument{\footnotesize}",
        r"\renewcommand{\baselinestretch}{0.94}",
        r"\setlength{\parskip}{0pt}",
        r"\setlength{\parindent}{0pt}",
        "",
        f"\\name{{{name.upper()}}}",
    ]

    if contact_line1:
        sep = " \\,\\,\\textbar\\,\\, "
        lines.append(f"\\address{{{sep.join(contact_line1)}}}")
    if contact_line2:
        sep = " \\,\\,\\textbar\\,\\, "
        lines.append(f"\\address{{{sep.join(contact_line2)}}}")

    lines.append("")
    lines.append(r"\begin{document}")
    lines.append("")

    # Summary
    if summary:
        lines.append(r"\begin{rSection}{SUMMARY}")
        lines.append(summary)
        lines.append(r"\end{rSection}")
        lines.append("")

    # Education
    if education:
        lines.append(r"\begin{rSection}{EDUCATION}")
        for edu in education:
            school = escape_latex(edu.get("school", ""))
            degree = escape_latex(edu.get("degree", ""))
            dates = escape_latex(edu.get("dates", ""))
            if degree and school:
                lines.append(f"\\textbf{{{degree}}}, {school} \\hfill {dates} \\\\")
            elif school:
                lines.append(f"\\textbf{{{school}}} \\hfill {dates} \\\\")
            coursework = edu.get("coursework", "")
            if coursework:
                lines.append(f"Relevant Coursework: {escape_latex(coursework)}")
        lines.append(r"\end{rSection}")
        lines.append("")

    # Skills
    if skills:
        lines.append(r"\begin{rSection}{TECHNICAL SKILLS}")
        # Group skills or just list them
        if isinstance(skills, list):
            skills_text = ", ".join([escape_latex(s) for s in skills])
            lines.append(f"\\textbf{{Skills:}} {skills_text}")
        lines.append(r"\end{rSection}")
        lines.append("")

    # Certifications
    if certifications:
        lines.append(r"\begin{rSection}{CERTIFICATIONS}")
        cert_list = []
        for cert in certifications:
            if isinstance(cert, str):
                cert_list.append(escape_latex(cert))
            elif isinstance(cert, dict):
                cert_list.append(escape_latex(cert.get("name", "")))
        sep = " \\,\\,\\textbar\\,\\, "
        lines.append(sep.join(cert_list))
        lines.append(r"\end{rSection}")
        lines.append("")

    # Projects
    if projects:
        lines.append(r"\begin{rSection}{PROJECTS}")
        for proj in projects:
            title = escape_latex(proj.get("title", ""))
            tech = escape_latex(proj.get("tech", ""))
            header = f"\\textbf{{{title}}}"
            if tech:
                header += f" \\hfill \\textit{{{tech}}}"
            lines.append(header)
            bullets = proj.get("bullets", [])
            if bullets:
                lines.append(r"\begin{itemize}")
                for b in bullets:
                    if b.strip():
                        lines.append(f"\\item {escape_latex(b)}")
                lines.append(r"\end{itemize}")
            lines.append("")
        lines.append(r"\end{rSection}")
        lines.append("")

    # Experience
    if experience:
        lines.append(r"\begin{rSection}{EXPERIENCE}")
        for exp in experience:
            title = escape_latex(exp.get("title", ""))
            company = escape_latex(exp.get("company", ""))
            dates = escape_latex(exp.get("dates", ""))
            loc = escape_latex(exp.get("location", ""))

            lines.append(f"\\textbf{{{title}}} \\hfill {dates} \\\\")
            if company:
                lines.append(f"{company} \\hfill \\textit{{{loc}}}")

            bullets = exp.get("bullets", [])
            if bullets:
                lines.append(r"\begin{itemize}")
                for b in bullets:
                    if b.strip():
                        lines.append(f"\\item {escape_latex(b)}")
                lines.append(r"\end{itemize}")
            lines.append("")
        lines.append(r"\end{rSection}")
        lines.append("")

    lines.append(r"\end{document}")

    return "\n".join(lines)
