import Navbar from "../../../components/Navbar";

export const metadata = { title: "Subscription Canceled — ResumeAI Hub" };

export default function BillingCancel() {
  return (
    <>
      <Navbar />
      <div className="billing-page">
        <div className="billing-card">
          <div className="billing-icon">😔</div>
          <h1>Subscription Canceled</h1>
          <p>
            Your subscription has been canceled. You'll retain Pro access until the end
            of your current billing period, then your account will revert to the free tier.
          </p>
          <p style={{ marginTop: "12px" }}>
            Changed your mind? You can resubscribe anytime from the pricing page.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/dashboard" className="btn-primary">Go to Dashboard</a>
            <a href="/pricing" className="btn-outline">View Pricing</a>
          </div>
        </div>
      </div>
    </>
  );
}
