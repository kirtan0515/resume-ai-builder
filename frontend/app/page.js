import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />

      {/* Hero */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-content">
          <div className="hero-eyebrow">AI-Powered Resume Intelligence</div>
          <h1>Know exactly why your resume gets rejected</h1>
          <p className="hero-sub">
            Evidence-based analysis with qualification matching, ATS keyword scoring,
            and prioritized fixes — powered by GPT-4o and semantic search.
          </p>
          <div className="hero-ctas">
            <a href="/dashboard" className="btn btn-lg btn-brand">Analyze My Resume</a>
            <a href="#how" className="btn btn-lg btn-outline-light">See How It Works</a>
          </div>
          <p className="hero-note">Free to try · No credit card required</p>
        </div>

        <div className="hero-preview">
          <div className="hero-preview-card">
            <div className="preview-header">
              <div className="preview-score">82<span>/100</span></div>
              <div className="preview-verdict">Competitive</div>
            </div>
            <div className="preview-bars">
              <div className="preview-bar-row">
                <span className="preview-bar-label">ATS Keywords</span>
                <div className="preview-bar-track"><div className="preview-bar-fill" style={{width:"78%",background:"var(--brand)"}} /></div>
              </div>
              <div className="preview-bar-row">
                <span className="preview-bar-label">Experience</span>
                <div className="preview-bar-track"><div className="preview-bar-fill" style={{width:"85%",background:"var(--green)"}} /></div>
              </div>
              <div className="preview-bar-row">
                <span className="preview-bar-label">Impact</span>
                <div className="preview-bar-track"><div className="preview-bar-fill" style={{width:"65%",background:"var(--yellow)"}} /></div>
              </div>
            </div>
            <div className="preview-tags">
              <span className="preview-tag">Python ✓</span>
              <span className="preview-tag">FastAPI ✓</span>
              <span className="preview-tag">AWS ✓</span>
              <span className="preview-tag preview-tag-red">Docker ✗</span>
              <span className="preview-tag preview-tag-red">CI/CD ✗</span>
            </div>
          </div>
        </div>
      </section>

      {/* Companies */}
      <section className="companies-section">
        <p className="companies-label">Built to help applicants target roles at top companies</p>
        <div className="companies-grid">
          {["Google", "Amazon", "Apple", "Microsoft", "Meta", "Netflix", "Tesla", "Nvidia", "OpenAI"].map(c => (
            <span key={c} className="company-name">{c}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="features-inner">
          <p className="section-eyebrow">Why ResumeAI Hub</p>
          <h2 className="section-title">More than a keyword checker</h2>
          <p className="section-sub">Evidence-based feedback that explains why something is weak and how to fix it truthfully.</p>
          <div className="features-grid">
            {[
              { n: "01", t: "ATS Keyword Matching", d: "Semantic matching that recognizes equivalent skills. FastAPI counts as REST APIs. RAG counts as AI integration." },
              { n: "02", t: "Qualification Tiering", d: "Clearly separates required vs preferred vs bonus qualifications so you know what actually matters." },
              { n: "03", t: "Evidence-Based Feedback", d: "Every weakness cites what we found or didn't find. No vague advice. No invented claims." },
              { n: "04", t: "Recruiter-Style Assessment", d: "Calibrated verdicts that match scores. A 78 never says rejected. A 45 never says strong match." },
              { n: "05", t: "Internship-Aware Scoring", d: "Student resumes evaluated against junior expectations. Projects and coursework count as valid experience." },
              { n: "06", t: "Prioritized Fix List", d: "Know exactly what to change first, why it matters for this role, and how to implement it truthfully." },
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-num">{f.n}</div>
                <div className="feature-title">{f.t}</div>
                <div className="feature-desc">{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-section" id="how">
        <div className="how-inner">
          <p className="section-eyebrow">How It Works</p>
          <h2 className="section-title">Three steps to a stronger resume</h2>
          <div className="how-steps">
            <div className="how-step">
              <div className="how-step-num">1</div>
              <div className="how-step-title">Upload your resume</div>
              <div className="how-step-desc">Drop a PDF or paste text. We extract content using semantic search to find the most relevant sections.</div>
            </div>
            <div className="how-step">
              <div className="how-step-num">2</div>
              <div className="how-step-title">Paste the job description</div>
              <div className="how-step-desc">Add the role you're targeting. Our AI compares qualifications, keywords, and experience alignment.</div>
            </div>
            <div className="how-step">
              <div className="how-step-num">3</div>
              <div className="how-step-title">Get evidence-based feedback</div>
              <div className="how-step-desc">Receive scores, qualification coverage, prioritized fixes, and truthful improvement suggestions.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust stats */}
      <section className="trust-section">
        <p className="section-eyebrow">Built for Trust</p>
        <h2 className="section-title">Honest analysis, not generic advice</h2>
        <div className="trust-grid">
          <div className="trust-item"><div className="trust-value">6</div><div className="trust-label">Score Dimensions</div></div>
          <div className="trust-item"><div className="trust-value">GPT-4o</div><div className="trust-label">AI Model</div></div>
          <div className="trust-item"><div className="trust-value">RAG</div><div className="trust-label">Semantic Search</div></div>
          <div className="trust-item"><div className="trust-value">ATS</div><div className="trust-label">Optimized</div></div>
        </div>
        <div className="security-note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          Your resume is processed securely and never publicly shared
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing-section">
        <div className="pricing-inner">
          <p className="section-eyebrow">Pricing</p>
          <h2 className="section-title">Start free, upgrade when ready</h2>
          <div className="pricing-grid">
            <div className="plan-card">
              <div className="plan-name">Free</div>
              <div className="plan-price">$0</div>
              <div className="plan-period">2 lifetime analyses</div>
              <ul className="plan-features">
                <li>Full analysis dashboard</li>
                <li>ATS score + keyword gaps</li>
                <li>Qualification matching</li>
                <li>Top fix suggestions</li>
              </ul>
              <a href="/dashboard" className="btn btn-md btn-outline-light plan-btn">Get Started Free</a>
            </div>
            <div className="plan-card plan-card-pro">
              <div className="plan-badge">Pro</div>
              <div className="plan-name">Pro</div>
              <div className="plan-price">$9<span>/mo</span></div>
              <div className="plan-period">Unlimited · Cancel anytime</div>
              <ul className="plan-features">
                <li>Unlimited analyses</li>
                <li>Download improvement report</li>
                <li>Version comparison</li>
                <li>Tailored summary + improved bullets</li>
                <li>Priority processing</li>
              </ul>
              <a href="/pricing" className="btn btn-md btn-brand plan-btn">Upgrade to Pro</a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-section">
        <h2 className="section-title">Ready to improve your resume?</h2>
        <p className="section-sub">Get your first analysis free. Evidence-based. No invented claims.</p>
        <a href="/dashboard" className="btn btn-lg btn-brand" style={{position:"relative",zIndex:1}}>Analyze My Resume</a>
      </section>

      <Footer />
    </div>
  );
}
