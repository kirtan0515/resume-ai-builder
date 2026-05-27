import os
from dotenv import load_dotenv
from app.auth import get_supabase

load_dotenv()


def get_learning_context() -> str:
    """
    Pull aggregate outcome data from all users' tracked applications
    to calibrate AI scoring. This makes the system learn from real results.

    Returns a text block to inject into the analysis prompt.
    """
    try:
        sb = get_supabase()

        # Get all applications with outcomes and scores
        result = sb.table("applications").select("title, company, status, match_score").execute()
        apps = result.data or []

        if len(apps) < 10:
            return ""  # Not enough data to learn from yet

        # Separate by outcome
        interviews = [a for a in apps if a.get("status") in ("interview", "offer") and a.get("match_score")]
        rejections = [a for a in apps if a.get("status") == "rejected" and a.get("match_score")]

        if not interviews or not rejections:
            return ""

        # Calculate real-world thresholds
        avg_interview_score = round(sum(a["match_score"] for a in interviews) / len(interviews))
        avg_rejection_score = round(sum(a["match_score"] for a in rejections) / len(rejections))

        # Score distribution
        interview_scores = sorted([a["match_score"] for a in interviews])
        min_interview_score = interview_scores[0] if interview_scores else 0
        p25_interview = interview_scores[len(interview_scores) // 4] if len(interview_scores) > 4 else min_interview_score

        # Role patterns — which titles get more interviews
        title_stats = {}
        for a in apps:
            title = a.get("title", "").lower().strip()
            if not title:
                continue
            if title not in title_stats:
                title_stats[title] = {"total": 0, "interviews": 0}
            title_stats[title]["total"] += 1
            if a.get("status") in ("interview", "offer"):
                title_stats[title]["interviews"] += 1

        # Top converting roles
        converting_roles = sorted(
            [(k, v) for k, v in title_stats.items() if v["total"] >= 2],
            key=lambda x: x[1]["interviews"] / x[1]["total"],
            reverse=True
        )[:5]

        # Build calibration context
        context_lines = [
            "CALIBRATION DATA (from real user outcomes on this platform):",
            f"- Applications that got interviews had an average match score of {avg_interview_score}%",
            f"- Applications that got rejected had an average match score of {avg_rejection_score}%",
            f"- The minimum score that ever got an interview was {min_interview_score}%",
            f"- 75% of successful applications scored above {p25_interview}%",
            f"- Total data points: {len(interviews)} interviews, {len(rejections)} rejections",
        ]

        if converting_roles:
            context_lines.append("- Roles with highest interview rates on this platform:")
            for role, stats in converting_roles[:3]:
                rate = round(stats["interviews"] / stats["total"] * 100)
                context_lines.append(f"  - {role}: {rate}% interview rate ({stats['interviews']}/{stats['total']})")

        context_lines.append("")
        context_lines.append("Use this calibration data to make your scoring more accurate.")
        context_lines.append("If the resume would score above the average interview threshold, lean toward a positive verdict.")
        context_lines.append("If below the average rejection threshold, be more cautious in your assessment.")

        return "\n".join(context_lines)

    except Exception as e:
        print(f"Learning context error: {e}")
        return ""


def get_user_learning_context(user_id: str) -> str:
    """
    Get personalized learning context for a specific user based on their own outcomes.
    """
    try:
        sb = get_supabase()
        result = sb.table("applications").select("*").eq("user_id", user_id).execute()
        apps = result.data or []

        if len(apps) < 3:
            return ""

        interviews = [a for a in apps if a.get("status") in ("interview", "offer")]
        rejections = [a for a in apps if a.get("status") == "rejected"]

        if not interviews and not rejections:
            return ""

        lines = ["PERSONAL CALIBRATION (from this user's tracked outcomes):"]

        if interviews:
            avg = round(sum(a.get("match_score", 0) for a in interviews if a.get("match_score")) / len([a for a in interviews if a.get("match_score")]))
            lines.append(f"- This user gets interviews when match score is around {avg}%+")
            companies = [a.get("company") for a in interviews if a.get("company")]
            if companies:
                lines.append(f"- Companies that responded positively: {', '.join(set(companies[:5]))}")

        if rejections:
            avg = round(sum(a.get("match_score", 0) for a in rejections if a.get("match_score")) / len([a for a in rejections if a.get("match_score")]))
            lines.append(f"- This user gets rejected when match score is around {avg}%")

        total = len(interviews) + len(rejections)
        if total > 0:
            rate = round(len(interviews) / total * 100)
            lines.append(f"- Overall interview rate: {rate}%")

        lines.append("")
        lines.append("Adjust your assessment based on this user's actual track record.")

        return "\n".join(lines)

    except Exception as e:
        print(f"User learning context error: {e}")
        return ""
