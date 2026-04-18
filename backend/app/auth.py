import os
from fastapi import HTTPException, Request
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
ADMIN_EMAIL = "kirtan.patel0515@gmail.com"

FREE_LIFETIME_LIMIT = int(os.getenv("FREE_LIFETIME_LIMIT", "2"))
ANALYZE_ENABLED = os.getenv("ANALYZE_ENABLED", "true").lower() == "true"
MAX_GLOBAL_ANALYSES_PER_DAY = int(os.getenv("MAX_GLOBAL_ANALYSES_PER_DAY", "500"))

_supabase: Client = None


def get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise RuntimeError("Supabase credentials not configured")
        _supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _supabase


def verify_token(request: Request) -> dict:
    """Extract and verify Supabase JWT from Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required. Please sign in.")

    token = auth_header.split(" ", 1)[1]

    try:
        sb = get_supabase()
        user_response = sb.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired session. Please sign in again.")
        return user_response.user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed. Please sign in.")


def get_or_create_user_record(user) -> dict:
    """Get user record from our users table, create if not exists."""
    sb = get_supabase()
    email = user.email

    result = sb.table("users").select("*").eq("id", user.id).execute()

    if result.data:
        return result.data[0]

    # Determine role
    role = "admin" if email == ADMIN_EMAIL else "free"

    new_user = {
        "id": user.id,
        "email": email,
        "role": role,
        "lifetime_analyses": 0,
        "daily_analyses": 0,
        "last_analysis_date": None,
    }
    sb.table("users").insert(new_user).execute()
    return new_user


def check_access(user_record: dict, ip: str) -> None:
    """
    Enforce access control. Raises HTTPException if denied.
    Order: kill switch → admin bypass → role check → limits
    """
    # 1. Kill switch
    if not ANALYZE_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="Analysis is temporarily unavailable. Please try again later."
        )

    role = user_record.get("role", "free")

    # 2. Admin bypass — no limits
    if role == "admin":
        return

    # 3. Blocked users
    if role == "blocked":
        raise HTTPException(
            status_code=403,
            detail="Your account has been suspended. Contact support@resumeaihub.com."
        )

    # 4. Free users — check lifetime limit
    if role == "free":
        lifetime = user_record.get("lifetime_analyses", 0)
        if lifetime >= FREE_LIFETIME_LIMIT:
            raise HTTPException(
                status_code=402,
                detail=f"Free trial exhausted. You've used your {FREE_LIFETIME_LIMIT} free analyses. Upgrade to Pro for unlimited access."
            )

    # 5. Paid users — check daily limit (generous)
    if role == "paid":
        daily = user_record.get("daily_analyses", 0)
        if daily >= 50:
            raise HTTPException(
                status_code=429,
                detail="Daily limit reached. Resets at midnight UTC."
            )


def record_usage(user_id: str, email: str, ip: str, user_agent: str) -> None:
    """Increment usage counters after a successful analysis."""
    from datetime import date
    sb = get_supabase()
    today = str(date.today())

    result = sb.table("users").select("*").eq("id", user_id).execute()
    if not result.data:
        return

    record = result.data[0]
    last_date = record.get("last_analysis_date")
    daily = record.get("daily_analyses", 0)

    # Reset daily count if new day
    if last_date != today:
        daily = 0

    sb.table("users").update({
        "lifetime_analyses": record.get("lifetime_analyses", 0) + 1,
        "daily_analyses": daily + 1,
        "last_analysis_date": today,
        "last_ip": ip,
        "last_user_agent": user_agent[:500] if user_agent else "",
    }).eq("id", user_id).execute()

    # Log to usage_logs table
    sb.table("usage_logs").insert({
        "user_id": user_id,
        "email": email,
        "ip": ip,
        "user_agent": user_agent[:500] if user_agent else "",
    }).execute()
