import os
from dotenv import load_dotenv

load_dotenv()


def generate_outcome_insights(applications: list) -> dict:
    """Analyze application outcomes to find patterns that lead to interviews."""

    if len(applications) < 3:
        return {"insight": "Add more applications with outcomes to see patterns.", "patterns": [], "recommendations": []}

    # Separate by outcome
    interviews = [a for a in applications if a.get("status") in ("interview", "offer")]
    rejections = [a for a in applications if a.get("status") == "rejected"]
    pending = [a for a in applications if a.get("status") == "applied"]

    # Score analysis
    interview_scores = [a.get("match_score", 0) for a in interviews if a.get("match_score")]
    rejection_scores = [a.get("match_score", 0) for a in rejections if a.get("match_score")]
    all_scores = [a.get("match_score", 0) for a in applications if a.get("match_score")]

    avg_interview_score = round(sum(interview_scores) / len(interview_scores)) if interview_scores else 0
    avg_rejection_score = round(sum(rejection_scores) / len(rejection_scores)) if rejection_scores else 0
    avg_all_score = round(sum(all_scores) / len(all_scores)) if all_scores else 0

    # Interview rate
    total_decided = len(interviews) + len(rejections)
    interview_rate = round(len(interviews) / total_decided * 100) if total_decided > 0 else 0

    # Score threshold analysis
    high_score_apps = [a for a in applications if a.get("match_score", 0) >= 70]
    high_score_interviews = [a for a in high_score_apps if a.get("status") in ("interview", "offer")]
    high_score_rate = round(len(high_score_interviews) / len(high_score_apps) * 100) if high_score_apps else 0

    low_score_apps = [a for a in applications if 0 < a.get("match_score", 0) < 70]
    low_score_interviews = [a for a in low_score_apps if a.get("status") in ("interview", "offer")]
    low_score_rate = round(len(low_score_interviews) / len(low_score_apps) * 100) if low_score_apps else 0

    # Company patterns
    companies_applied = {}
    for a in applications:
        comp = a.get("company", "Unknown")
        if comp not in companies_applied:
            companies_applied[comp] = {"total": 0, "interviews": 0}
        companies_applied[comp]["total"] += 1
        if a.get("status") in ("interview", "offer"):
            companies_applied[comp]["interviews"] += 1

    best_companies = sorted(
        [(k, v) for k, v in companies_applied.items() if v["interviews"] > 0],
        key=lambda x: x[1]["interviews"] / x[1]["total"],
        reverse=True
    )[:5]

    # Build patterns
    patterns = []
    if avg_interview_score > avg_rejection_score and interview_scores:
        patterns.append(f"Applications that got interviews had an average match score of {avg_interview_score}% vs {avg_rejection_score}% for rejections.")

    if high_score_rate > low_score_rate:
        patterns.append(f"Jobs with 70%+ match score have a {high_score_rate}% interview rate vs {low_score_rate}% for lower scores.")

    if best_companies:
        top = best_companies[0]
        patterns.append(f"You have the best response rate from {top[0]} ({top[1]['interviews']}/{top[1]['total']} got interviews).")

    if interview_rate > 0:
        patterns.append(f"Your overall interview rate is {interview_rate}% ({len(interviews)} interviews from {total_decided} decided applications).")

    # Recommendations
    recommendations = []
    if avg_interview_score > 0:
        recommendations.append(f"Focus on roles where your match score is {avg_interview_score}% or higher — that's your sweet spot for getting callbacks.")

    if high_score_rate > low_score_rate * 1.5:
        recommendations.append("Prioritize quality over quantity. High-match applications convert significantly better than spray-and-pray.")

    if len(pending) > len(interviews) + len(rejections):
        recommendations.append(f"You have {len(pending)} pending applications. Follow up on ones older than 2 weeks.")

    if not recommendations:
        recommendations.append("Keep tracking outcomes. More data = better insights.")

    # Scoring calibration
    calibration = None
    if interview_scores and rejection_scores:
        threshold = round((avg_interview_score + avg_rejection_score) / 2)
        calibration = {
            "sweet_spot_score": avg_interview_score,
            "danger_zone_below": threshold,
            "message": f"Based on your data, aim for {avg_interview_score}%+ match scores. Below {threshold}% rarely converts to interviews."
        }

    return {
        "total_applications": len(applications),
        "total_interviews": len(interviews),
        "total_rejections": len(rejections),
        "total_pending": len(pending),
        "interview_rate": interview_rate,
        "avg_interview_score": avg_interview_score,
        "avg_rejection_score": avg_rejection_score,
        "high_score_interview_rate": high_score_rate,
        "low_score_interview_rate": low_score_rate,
        "patterns": patterns,
        "recommendations": recommendations,
        "calibration": calibration,
        "best_companies": [{"company": c[0], "interviews": c[1]["interviews"], "total": c[1]["total"]} for c in best_companies],
    }
