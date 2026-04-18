export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="navbar-brand-dot" style={{ display: "inline-block" }} />
          ResumeAI Hub
        </div>
        <div className="footer-links">
          <a href="/pricing">Pricing</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/disclaimer">Disclaimer</a>
        </div>
        <div className="footer-copy">
          © {new Date().getFullYear()} ResumeAI Hub · AI results are for guidance only.
        </div>
      </div>
    </footer>
  );
}
