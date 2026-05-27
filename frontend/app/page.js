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
          <div className="hero-eyebrow">11 AI Career Tools · One Platform</div>
          <h1>The AI career platform that actually gets you hired</h1>
          <p className="hero-sub">
            Resume analysis, job matching, interview prep, salary negotiation, ghost job detection,
            and more — all powered by GPT-4o with real outcome-based learning.
          </p>
          <div className="hero-ctas">
            <a href="/dashboard" className="btn btn-lg btn-brand">Start Free Analysis</a>
            <a href="#tools" className="btn btn-lg btn-outline-light">See All Tools</a>
          </div>
          <p className="hero-note">Free to try · No credit card · 2 free analyses</p>
        </div>

        <div className="hero-preview">
          <div className="hero-preview-card">
            <div className="preview-header">
              <div className="preview-score">82<span>/100</span></div>
              <div className="preview-verdict">Competitive</div>
            </div>
            <div className="preview-bars">
              <div className="preview-bar-row"><span className="preview-bar-label">ATS Keywords</span><div className="preview-bar-track"><div className="preview-bar-fill" style={{width:"78%",background:"var(--brand)"}} /></div></div>
              <div className="preview-bar-row"><span className="preview-bar-label">Experience</span><div className="preview-bar-track"><div className="preview-bar-fill" style={{width:"85%",background:"var(--green)"}} /></div></div>
              <div className="preview-bar-row"><span className="preview-bar-label">Impact</span><div className="preview-bar-track"><div className="preview-bar-fill" style={{width:"65%",background:"var(--yellow)"}} /></div></div>
              <div className="preview-bar-row"><span className="preview-bar-label">Qualifications</span><div className="preview-bar-track"><div className="preview-bar-fill" style={{width:"90%",background:"var(--green)"}} /></div></div>
            </div>
            <div className="preview-tags">
              <span className="preview-tag">Python ✓</span>
              <span className="preview-tag">FastAPI ✓</span>
              <span className="preview-tag">AWS ✓</span>
              <span className="preview-tag preview-tag-red">Docker ✗</span>
              <span className="preview-tag preview-tag-red">K8s ✗</span>
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

      {/* All Tools Showcase */}
      <section className="features-section" id="tools">
        <div className="features-inner">
          <p className="section-eyebrow">Complete Career Toolkit</p>
          <h2 className="section-title">11 AI tools. One subscription.</h2>
          <p className="section-sub">Everything you need from application to offer — in one platform.</p>

          <div className="features-grid">
            {[
              { n: "01", t: "Resume Analysis", d: "Instant quality score + targeted job match analysis with evidence-based feedback and qualification tiering." },
              { n: "02", t: "ATS Simulator", d: "See how your resume looks after ATS processing. Find formatting issues before they cost you interviews." },
              { n: "03", t: "Smart Job Matching", d: "AI finds real job openings and scores each one against your resume. Know your chances before applying." },
              { n: "04", t: "Application Tracker", d: "Track every application with AI scoring. See patterns: which roles and scores lead to interviews." },
              { n: "05", t: "Interview Prep", d: "Personalized questions based on YOUR resume + the job. Practice mode scores your answers in real time." },
              { n: "06", t: "Cover Letter AI", d: "Generate cover letters that reference your actual experience. Choose tone. Copy with one click." },
              { n: "07", t: "Salary Negotiation", d: "Get salary ranges, negotiation scripts, and counter-offer strategies based on role, company, and location." },
              { n: "08", t: "Ghost Job Detector", d: "Check if a posting is real or just collecting resumes. Stop wasting time on fake listings." },
              { n: "09", t: "LinkedIn Analyzer", d: "Compare your LinkedIn vs resume. Find mismatches before recruiters do. Get improvement suggestions." },
              { n: "10", t: "Resume Builder", d: "Build from your profile data. Export as PDF or LaTeX. Auto-fill from uploaded resume." },
              { n: "11", t: "Self-Improving AI", d: "The system learns from real outcomes. More users = more accurate scoring for everyone." },
              { n: "12", t: "Outcome Insights", d: "See which match scores actually lead to interviews. Data-driven patterns from your own applications." },
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

      {/* Demo Screenshots Section */}
      <section className="how-section" id="demo">
        <div className="how-inner" style={{ maxWidth: "1000px" }}>
          <p className="section-eyebrow">See It In Action</p>
          <h2 className="section-title">What you get in seconds</h2>

          <div className="demo-grid">
            {/* Demo card 1 - Score */}
            <div className="demo-card">
              <div className="demo-card-label">Resume Score</div>
              <div className="demo-card-content">
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "50%", border: "3px solid var(--green)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "800", color: "var(--green)" }}>82</div>
                  <div><div style={{ fontSize: "14px", fontWeight: "700", color: "var(--green)" }}>Competitive with gaps</div><div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Software Engineering</div></div>
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", lineHeight: "1.6" }}>Strong technical alignment but missing 2 required keywords. Add Docker and CI/CD experience.</div>
              </div>
            </div>

            {/* Demo card 2 - Job Match */}
            <div className="demo-card">
              <div className="demo-card-label">Job Matching</div>
              <div className="demo-card-content">
                <div style={{ marginBottom: "10px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "white" }}>Senior SWE — Google</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>Mountain View, CA</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <span style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px", background: "rgba(16,185,129,0.15)", color: "var(--green)" }}>Python ✓</span>
                    <span style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px", background: "rgba(16,185,129,0.15)", color: "var(--green)" }}>APIs ✓</span>
                  </div>
                  <span style={{ fontSize: "18px", fontWeight: "800", color: "var(--brand)" }}>76%</span>
                </div>
              </div>
            </div>

            {/* Demo card 3 - Interview */}
            <div className="demo-card">
              <div className="demo-card-label">Interview Prep</div>
              <div className="demo-card-content">
                <div style={{ fontSize: "13px", fontWeight: "600", color: "white", marginBottom: "8px" }}>"Tell me about a time you optimized a system..."</div>
                <div style={{ fontSize: "11px", color: "var(--brand)", marginBottom: "6px" }}>BEHAVIORAL</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", lineHeight: "1.5" }}>Reference your RAG pipeline project — mention the 3x speed improvement...</div>
              </div>
            </div>

            {/* Demo card 4 - Ghost Check */}
            <div className="demo-card">
              <div className="demo-card-label">Ghost Job Check</div>
              <div className="demo-card-content">
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid var(--green)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "800", color: "var(--green)" }}>18%</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--green)" }}>Likely Real</div>
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Specific team mentioned, reasonable requirements, recent posting.</div>
              </div>
            </div>

            {/* Demo card 5 - Salary */}
            <div className="demo-card">
              <div className="demo-card-label">Salary Intel</div>
              <div className="demo-card-content">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Low</div><div style={{ fontSize: "14px", fontWeight: "700", color: "var(--yellow)" }}>$95k</div></div>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Mid</div><div style={{ fontSize: "16px", fontWeight: "800", color: "var(--brand)" }}>$125k</div></div>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>High</div><div style={{ fontSize: "14px", fontWeight: "700", color: "var(--green)" }}>$155k</div></div>
                </div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Your position: Mid range</div>
              </div>
            </div>

            {/* Demo card 6 - Tracker */}
            <div className="demo-card">
              <div className="demo-card-label">Application Tracker</div>
              <div className="demo-card-content">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div><div style={{ fontSize: "20px", fontWeight: "800", color: "white" }}>24</div><div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Applied</div></div>
                  <div><div style={{ fontSize: "20px", fontWeight: "800", color: "var(--green)" }}>38%</div><div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Interview Rate</div></div>
                  <div><div style={{ fontSize: "20px", fontWeight: "800", color: "var(--brand)" }}>72</div><div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Avg Score</div></div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--brand)" }}>70%+ match scores get 3x more callbacks</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="trust-section">
        <p className="section-eyebrow">How It Works</p>
        <h2 className="section-title">Three steps to more interviews</h2>
        <div className="trust-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", maxWidth: "900px" }}>
          <div className="trust-item" style={{ textAlign: "left", padding: "28px" }}>
            <div className="trust-value" style={{ fontSize: "20px" }}>1</div>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "white", margin: "8px 0" }}>Upload resume</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: "1.5" }}>Drop a PDF or paste text. Your resume is saved and used across all tools automatically.</div>
          </div>
          <div className="trust-item" style={{ textAlign: "left", padding: "28px" }}>
            <div className="trust-value" style={{ fontSize: "20px" }}>2</div>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "white", margin: "8px 0" }}>Choose your tool</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: "1.5" }}>Score your resume, find jobs, prep for interviews, check salary ranges, or detect ghost jobs.</div>
          </div>
          <div className="trust-item" style={{ textAlign: "left", padding: "28px" }}>
            <div className="trust-value" style={{ fontSize: "20px" }}>3</div>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "white", margin: "8px 0" }}>Get smarter over time</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: "1.5" }}>Track outcomes. The AI learns from real results and calibrates scoring for better accuracy.</div>
          </div>
        </div>
        <div className="security-note" style={{ marginTop: "32px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          Your resume is processed securely and never publicly shared
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing-section">
        <div className="pricing-inner">
          <p className="section-eyebrow">Pricing</p>
          <h2 className="section-title">One plan. All 11 tools.</h2>
          <div className="pricing-grid">
            <div className="plan-card">
              <div className="plan-name">Free</div>
              <div className="plan-price">$0</div>
              <div className="plan-period">2 lifetime analyses</div>
              <ul className="plan-features">
                <li>Resume quality score</li>
                <li>ATS compatibility check</li>
                <li>Ghost job detector</li>
                <li>Application tracker</li>
                <li>Suggested job titles</li>
              </ul>
              <a href="/dashboard" className="btn btn-md btn-outline-light plan-btn">Get Started Free</a>
            </div>
            <div className="plan-card plan-card-pro">
              <div className="plan-badge">Pro</div>
              <div className="plan-name">Pro</div>
              <div className="plan-price">$9<span>/mo</span></div>
              <div className="plan-period">All 11 tools · Cancel anytime</div>
              <ul className="plan-features">
                <li>Unlimited resume analyses</li>
                <li>Smart job matching + scoring</li>
                <li>AI Interview Prep + practice mode</li>
                <li>Cover Letter Generator</li>
                <li>Salary Negotiation AI</li>
                <li>LinkedIn vs Resume Analyzer</li>
                <li>Resume Builder (PDF + LaTeX)</li>
                <li>Outcome-based learning</li>
                <li>Download improvement reports</li>
              </ul>
              <a href="/pricing" className="btn btn-md btn-brand plan-btn">Upgrade to Pro</a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-section">
        <h2 className="section-title">Ready to land more interviews?</h2>
        <p className="section-sub">11 AI tools. Evidence-based. Self-improving. Start free.</p>
        <a href="/dashboard" className="btn btn-lg btn-brand" style={{position:"relative",zIndex:1}}>Start Free Analysis</a>
      </section>

      <Footer />
    </div>
  );
}
