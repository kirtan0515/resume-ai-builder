import Navbar from "../../../components/Navbar";

export const metadata = { title: "Subscription Active — ResumeAI Hub" };

export default function BillingSuccess() {
  return (
    <>
      <Navbar />
      <div className="billing-page">
        <div className="billing-card">
          <div className="billing-icon">🎉</div>
          <h1>You're now on Pro!</h1>
          <p>Your subscription is active. You now have unlimited resume analyses.</p>
          <div className="billing-features">
            <div className="billing-feature">✓ Unlimited analyses</div>
            <div className="billing-feature">✓ Download improvement reports</div>
            <div className="billing-feature">✓ Version comparison</div>
            <div className="billing-feature">✓ Advanced AI feedback</div>
          </div>
          <a href="/dashboard" className="btn-primary" style={{ margin: "0 auto" }}>
            Go to Dashboard →
          </a>
        </div>
      </div>
    </>
  );
}
