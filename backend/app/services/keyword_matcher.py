"""
Deterministic keyword extraction and matching.
This runs BEFORE the AI scoring to provide ground truth data
that the AI uses to calibrate its scores.
"""

import re


# Semantic equivalence groups — if any term in a group appears, all count as present
EQUIVALENCE_GROUPS = [
    {"python", "python3", "python 3"},
    {"javascript", "js", "typescript", "ts", "node.js", "nodejs", "node"},
    {"react", "reactjs", "react.js", "next.js", "nextjs"},
    {"aws", "amazon web services", "amazon cloud"},
    {"docker", "containerization", "containerized", "containers"},
    {"kubernetes", "k8s", "container orchestration"},
    {"ci/cd", "cicd", "ci cd", "github actions", "jenkins", "continuous integration", "continuous deployment"},
    {"rest api", "rest apis", "restful", "restful api", "api development", "api design"},
    {"fastapi", "fast api"},
    {"sql", "mysql", "postgresql", "postgres", "sqlite", "database queries"},
    {"nosql", "mongodb", "dynamodb", "redis", "cassandra"},
    {"machine learning", "ml", "deep learning", "neural networks"},
    {"ai", "artificial intelligence", "llm", "large language model", "gpt", "openai", "llm apis"},
    {"rag", "retrieval augmented generation", "retrieval-augmented", "vector search", "embeddings"},
    {"git", "github", "version control", "gitlab"},
    {"linux", "unix", "bash", "shell scripting"},
    {"agile", "scrum", "sprint", "kanban"},
    {"terraform", "infrastructure as code", "iac"},
    {"cloudwatch", "monitoring", "observability", "logging"},
    {"ec2", "virtual machines", "compute instances"},
    {"s3", "object storage", "blob storage"},
    {"graphql", "graph ql"},
    {"java", "jvm"},
    {"c++", "cpp", "c plus plus"},
    {"go", "golang"},
    {"rust", "rust lang"},
    {"vue", "vuejs", "vue.js"},
    {"angular", "angularjs"},
    {"flask", "django"},
    {"spring", "spring boot", "springboot"},
    {"nginx", "reverse proxy", "load balancer"},
    {"testing", "unit testing", "integration testing", "pytest", "jest", "tdd"},
]


def normalize(text: str) -> str:
    """Normalize text for comparison."""
    return re.sub(r'[^a-z0-9\s/+#.]', '', text.lower()).strip()


def extract_keywords_from_jd(job_description: str) -> dict:
    """Extract required and preferred keywords from a job description."""
    jd_lower = job_description.lower()

    # Split into required vs preferred sections
    required_section = ""
    preferred_section = ""

    # Common patterns for required vs preferred
    required_markers = ["required", "must have", "requirements", "qualifications", "minimum", "essential"]
    preferred_markers = ["preferred", "nice to have", "bonus", "plus", "desired", "ideally"]

    lines = jd_lower.split('\n')
    current_section = "required"  # default

    for line in lines:
        if any(m in line for m in preferred_markers):
            current_section = "preferred"
        elif any(m in line for m in required_markers):
            current_section = "required"

        if current_section == "required":
            required_section += line + " "
        else:
            preferred_section += line + " "

    if not required_section.strip():
        required_section = jd_lower

    return {
        "required_text": required_section,
        "preferred_text": preferred_section,
        "full_text": jd_lower,
    }


def find_skill_matches(resume_text: str, jd_sections: dict) -> dict:
    """Find which skills from the JD are present in the resume using semantic matching."""
    resume_lower = normalize(resume_text)
    jd_full = normalize(jd_sections["full_text"])

    # Extract all potential skills/keywords from the JD
    # Look for known tech terms and n-grams
    jd_keywords = set()
    resume_keywords = set()

    for group in EQUIVALENCE_GROUPS:
        # Check if any term in the group appears in the JD
        jd_has = any(normalize(term) in jd_full for term in group)
        if jd_has:
            # Use the first term as the canonical name
            canonical = sorted(group, key=len)[0]
            jd_keywords.add(canonical)

            # Check if any equivalent term appears in the resume
            resume_has = any(normalize(term) in resume_lower for term in group)
            if resume_has:
                resume_keywords.add(canonical)

    # Also do direct word matching for terms not in our groups
    # Extract capitalized words/phrases that look like tech terms
    tech_pattern = re.compile(r'\b[A-Z][a-zA-Z+#.]+(?:\s+[A-Z][a-zA-Z+#.]+)*\b')
    jd_techs = set(normalize(m) for m in tech_pattern.findall(jd_sections["full_text"]) if len(m) > 2)

    for tech in jd_techs:
        if tech and tech not in jd_keywords:
            jd_keywords.add(tech)
            if tech in resume_lower:
                resume_keywords.add(tech)

    matched = jd_keywords & resume_keywords
    missing = jd_keywords - resume_keywords

    # Calculate scores
    total = len(jd_keywords) if jd_keywords else 1
    ats_score = round(len(matched) / total * 100)

    return {
        "jd_keywords_found": len(jd_keywords),
        "resume_matches": len(matched),
        "matched_keywords": sorted(matched),
        "missing_keywords": sorted(missing),
        "ats_keyword_score_calculated": min(ats_score, 100),
        "coverage_percentage": round(len(matched) / total * 100) if total > 0 else 0,
    }


def get_matching_context(resume_text: str, job_description: str) -> str:
    """Generate a deterministic matching report to inject into the AI prompt."""
    jd_sections = extract_keywords_from_jd(job_description)
    matches = find_skill_matches(resume_text, jd_sections)

    if not matches["jd_keywords_found"]:
        return ""

    lines = [
        "DETERMINISTIC KEYWORD ANALYSIS (use these numbers for scoring):",
        f"- Keywords found in JD: {matches['jd_keywords_found']}",
        f"- Keywords matched in resume: {matches['resume_matches']}",
        f"- Coverage: {matches['coverage_percentage']}%",
        f"- Calculated ATS keyword score: {matches['ats_keyword_score_calculated']}/100",
        f"- Matched: {', '.join(matches['matched_keywords'][:15])}",
        f"- Missing: {', '.join(matches['missing_keywords'][:10])}",
        "",
        "IMPORTANT: Your ats_keyword_score should be close to the calculated score above.",
        "Do NOT deviate more than 10 points from this calculated value.",
        "If the resume matches 80% of keywords, ats_keyword_score must be 70-90, not 50-60.",
    ]

    return "\n".join(lines)
