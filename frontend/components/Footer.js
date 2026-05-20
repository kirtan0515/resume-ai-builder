export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <img src="/ResumeAIHublogo.png" alt="ResumeAI Hub" style={{ height: "28px", width: "auto" }} />
        <div className="footer-links">
          <a href="/pricing">Pricing</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/disclaimer">Disclaimer</a>
          <a href="mailto:support@resumeaihub.com">Support</a>
        </div>
        <div className="footer-copy">
          © {new Date().getFullYear()} ResumeAI Hub · AI results are for guidance only ·{" "}
          support@resumeaihub.com
        </div>
      </div>
    </footer>
  );
}
