import os
import stripe
from dotenv import load_dotenv

load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
PRICE_ID = os.getenv("STRIPE_PRICE_ID")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://www.resumeaihub.com")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")


def create_checkout_session(user_id: str, email: str) -> str:
    """Create a Stripe Checkout session and return the URL."""
    # Get or create Stripe customer
    customers = stripe.Customer.list(email=email, limit=1)
    if customers.data:
        customer = customers.data[0]
    else:
        customer = stripe.Customer.create(
            email=email,
            metadata={"supabase_user_id": user_id}
        )

    session = stripe.checkout.Session.create(
        customer=customer.id,
        payment_method_types=["card"],
        line_items=[{"price": PRICE_ID, "quantity": 1}],
        mode="subscription",
        success_url=f"{FRONTEND_URL}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{FRONTEND_URL}/pricing",
        metadata={"supabase_user_id": user_id},
        subscription_data={"metadata": {"supabase_user_id": user_id}},
    )
    return session.url


def create_portal_session(stripe_customer_id: str) -> str:
    """Create a Stripe Customer Portal session for managing subscription."""
    session = stripe.billing_portal.Session.create(
        customer=stripe_customer_id,
        return_url=f"{FRONTEND_URL}/dashboard",
    )
    return session.url


def cancel_subscription_at_period_end(subscription_id: str) -> dict:
    """Cancel subscription at end of current billing period."""
    sub = stripe.Subscription.modify(
        subscription_id,
        cancel_at_period_end=True,
    )
    return {"status": sub.status, "cancel_at_period_end": sub.cancel_at_period_end}


def construct_webhook_event(payload: bytes, sig_header: str):
    """Verify and construct Stripe webhook event."""
    return stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)
