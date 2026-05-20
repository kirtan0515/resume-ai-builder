import Navbar from "../components/Navbar";

export default function LandingPage() {
  return (
    <div className="landing">
      <Navbar />

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <p className="lp-eyebrow">AI-Powered Resume Intelligence</p>
          <h1 className="lp-h1">Know exactly why your resume gets rejected — and how to fix it</h1>
          <p className="lp-sub">
            Upload your resume, paste a job description, and get evidence-based feedback
            with qualification matching, keyword gaps, and prioritized fixes.
          </p>
          <div className="lp-cta-row">
            <a href="/dashboard" className="btn-primary btn-cyan">Analyze My Resume</a>
            <a href="/pricing" className="btn-outline">View Pricing</a>
          </div>
          <p className="lp-cta-note">Free to try · No credit card required</p>
        </div>
      </section>

      {/* Proof bar */}
      <div className="lp-proof-bar">
        <div className="lp-proof-item">
          <span className="lp-proof-value">GPT-4o</span>
          <span className="lp-proof-label">AI Model</span>
        </div>
        <div className="lp-proof-item">
          <span className="lp-proof-value">6</span>
          <span className="lp-proof-label">Score Dimensions</span>
        </div>
        <div className="lp-proof-item">
          <span className="lp-proof-value">RAG</span>
          <span className="lp-proof-label">Semantic Search</span>
        </div>
        <div className="lp-proof-item">
          <span className="lp-proof-value">ATS</span>
          <span className="lp-proof-label">Optimized</span>
        </div>
      </div>

      {/* Features */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <p className="lp-section-label">What You Get</p>
          <h2 className="lp-h2">More than a keyword checker</h2>
          <div className="lp-features-grid">
            {[
              { icon: "01", title: "Qualification Matching", desc: "See which required, preferred, and bonus qualifications you meet — and which you're missing." },
              { icon: "02", title: "Evidence-Based Feedback", desc: "Every weakness cites what we found (or didn't find) in your resume. No vague advice." },
              { icon: "03", title: "Semantic Skill Matching", desc: "We recognize equivalent skills. 'FastAPI' counts as 'REST APIs'. 'RAG' counts as 'AI integration'." },
              { icon: "04", title: "Internship-Aware Scoring", desc: "Student resumes are evaluated fairly against junior expectations, not senior standards." },
              { icon: "05", title: "Prioritized Fix List", desc: "Know exactly what to change first, why it matters, and how to do it truthfully." },
              { icon: "06", title: "Calibrated Verdicts", desc: "Scores and verdicts always match. A 78 never says 'rejected'. A 45 never says 'strong match'." },
            ].map((f, i) => (
              <div key={i} className="lp-feature-card">
                <div className="lp-feature-icon">{f.icon}</div>
                <div className="lp-feature-title">{f.title}</div>
                <div className="lp-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="lp-section lp-section-alt">
        <div className="lp-section-inner">
          <p className="lp-section-label">How It Works</p>
          <h2 className="lp-h2">Three steps to a stronger resume</h2>
          <div className="lp-steps">
            <div className="lp-step">
              <div className="lp-step-number">1</div>
              <div className="lp-step-title">Upload your resume</div>
              <div className="lp-step-desc">Drop a PDF or paste text. We extract and analyze the content automatically using semantic search.</div>
            </div>
            <div className="lp-step">
              <div className="lp-step-number">2</div>
              <div className="lp-step-title">Paste the job description</div>
              <div className="lp-step-desc">Add the role you're targeting. Our AI compares qualifications, keywords, and experience alignment.</div>
            </div>
            <div className="lp-step">
              <div className="lp-step-number">3</div>
              <div className="lp-step-title">Get evidence-based feedback</div>
              <div className="lp-step-desc">Receive scores, qualification coverage, prioritized fixes, and truthful improvement suggestions.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <p className="lp-section-label">Pricing</p>
          <h2 className="lp-h2">Start free, upgrade when ready</h2>
          <div className="lp-pricing-row">
            <div className="lp-plan">
              <div className="lp-plan-name">Free</div>
              <div className="lp-plan-price">$0</div>
              <div className="lp-plan-period">2 lifetime analyses</div>
              <ul className="lp-plan-features">
                <li>Full analysis dashboard</li>
                <li>ATS score + keyword gaps</li>
                <li>Qualification matching</li>
                <li>Top fix suggestions</li>
              </ul>
              <a href="/dashboard" className="btn-outline lp-plan-btn">Get Started Free</a>
            </div>
            <div className="lp-plan lp-plan-pro">
              <div className="lp-plan-badge">Pro</div>
              <div className="lp-plan-name">Pro</div>
              <div className="lp-plan-price">$9<span>/mo</span></div>
              <div className="lp-plan-period">Unlimited · Cancel anytime</div>
              <ul className="lp-plan-features">
                <li>Unlimited analyses</li>
                <li>Download improvement report</li>
                <li>Version comparison</li>
                <li>Tailored summary + improved bullets</li>
                <li>Priority processing</li>
              </ul>
              <a href="/pricing" className="btn-primary btn-cyan lp-plan-btn">Upgrade to Pro</a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="lp-final-cta">
        <h2 className="lp-h2">Ready to improve your resume?</h2>
        <p className="lp-sub" style={{ marginBottom: "32px" }}>
          Get your first analysis free. Evidence-based. No invented claims.
        </p>
        <a href="/dashboard" className="btn-primary btn-cyan">Analyze My Resume</a>
      </section>
    </div>
  );
}
