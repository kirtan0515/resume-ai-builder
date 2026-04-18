import Navbar from "../components/Navbar";

export default function LandingPage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="hero-badge">✦ AI-Powered · ATS-Optimized · Free to Try</div>
          <h1 className="lp-h1">AI Resume Analyzer That Gets You Shortlisted</h1>
          <p className="lp-sub">
            Upload your resume, paste a job description, and get instant ATS scoring,
            keyword gap detection, recruiter-level feedback, and exactly what to fix —
            in under 60 seconds.
          </p>
          <div className="lp-cta-row">
            <a href="/dashboard" className="btn-primary lp-cta-main">Try Free Analysis →</a>
            <a href="/pricing" className="btn-outline">See Pricing</a>
          </div>
          <p className="lp-cta-note">No credit card required · 2 free analyses</p>
        </div>
      </section>

      {/* Social proof bar */}
      <div className="lp-proof-bar">
        <span>🎓 Used by students and job seekers</span>
        <span>⚡ Powered by GPT-4o + RAG</span>
        <span>🎯 ATS-optimized feedback</span>
        <span>📊 5 score dimensions</span>
      </div>

      {/* Features */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-section-label">Features</div>
          <h2 className="lp-h2">Everything you need to get past the ATS</h2>
          <div className="lp-features-grid">
            {[
              { icon: "📊", title: "ATS Match Score", desc: "See exactly how well your resume matches the job description across 5 dimensions." },
              { icon: "🔍", title: "Keyword Gap Detection", desc: "Find must-have and nice-to-have keywords you're missing before a recruiter sees your resume." },
              { icon: "💬", title: "Recruiter Feedback", desc: "Get honest, direct feedback written like a senior recruiter — not a chatbot." },
              { icon: "🔧", title: "Top Fix Suggestions", desc: "Prioritized list of exactly what to change, in order of impact." },
              { icon: "📈", title: "Version Comparison", desc: "Re-analyze after edits and see your score improve in real time." },
              { icon: "🎯", title: "Domain-Aware AI", desc: "Adapts evaluation for tech, healthcare, business, marketing, and more." },
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
          <div className="lp-section-label">How It Works</div>
          <h2 className="lp-h2">Three steps to a stronger resume</h2>
          <div className="lp-steps">
            {[
              { n: "1", title: "Upload Your Resume", desc: "Drop a PDF or paste your resume text. We extract and analyze the content automatically." },
              { n: "2", title: "Paste the Job Description", desc: "Add the job posting you're targeting. Our AI compares your resume against it in detail." },
              { n: "3", title: "Get AI-Powered Feedback", desc: "Receive scores, keyword gaps, recruiter concerns, top fixes, and improved bullet examples." },
            ].map((s, i) => (
              <div key={i} className="lp-step">
                <div className="lp-step-number">{s.n}</div>
                <div className="lp-step-title">{s.title}</div>
                <div className="lp-step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-section-label">Pricing</div>
          <h2 className="lp-h2">Simple, transparent pricing</h2>
          <div className="lp-pricing-row">
            <div className="lp-plan">
              <div className="lp-plan-name">Free</div>
              <div className="lp-plan-price">$0</div>
              <ul className="lp-plan-features">
                <li>✓ 2 lifetime analyses</li>
                <li>✓ Full analysis dashboard</li>
                <li>✓ ATS score + keyword gaps</li>
                <li>✓ Top fix suggestions</li>
              </ul>
              <a href="/dashboard" className="btn-outline lp-plan-btn">Get Started Free</a>
            </div>
            <div className="lp-plan lp-plan-pro">
              <div className="lp-plan-badge">Most Popular</div>
              <div className="lp-plan-name">Pro</div>
              <div className="lp-plan-price">$9<span>/mo</span></div>
              <ul className="lp-plan-features">
                <li>✓ Unlimited analyses</li>
                <li>✓ Download improvement report</li>
                <li>✓ Version comparison</li>
                <li>✓ Advanced AI feedback</li>
                <li>✓ Priority processing</li>
              </ul>
              <a href="/pricing" className="btn-primary lp-plan-btn">Upgrade to Pro</a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="lp-final-cta">
        <h2 className="lp-h2">Ready to improve your resume?</h2>
        <p className="lp-sub" style={{ marginBottom: "32px" }}>
          Start free. No credit card. Get your first analysis in under a minute.
        </p>
        <a href="/dashboard" className="btn-primary lp-cta-main">Start Free Analysis →</a>
      </section>
    </>
  );
}
