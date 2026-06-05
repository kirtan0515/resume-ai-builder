export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <img src="/ResumeAIHublogo.svg" alt="ResumeAI Hub"
            style={{ height: "44px", width: "auto", marginBottom: "10px" }} />
          <p className="footer-brand-desc">
            AI-powered resume analysis that helps you understand why your resume works — or doesn't — for any role.
          </p>
        </div>
        <div className="footer-col">
          <div className="footer-col-title">Product</div>
          <a href="/dashboard">Dashboard</a>
          <a href="/pricing">Pricing</a>
          <a href="#how">How It Works</a>
        </div>
        <div className="footer-col">
          <div className="footer-col-title">Legal</div>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/disclaimer">Disclaimer</a>
        </div>
        <div className="footer-col">
          <div className="footer-col-title">Support</div>
          <a href="mailto:support@resumeaihub.com">Contact</a>
          <a href="mailto:support@resumeaihub.com">Billing Help</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} ResumeAI Hub</span>
        <span>Your resume is never publicly shared</span>
      </div>
    </footer>
  );
}
