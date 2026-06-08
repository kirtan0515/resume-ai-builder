"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import API_URL from "../../lib/api";

export default function PricingPage() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  async function handleUpgrade() {
    if (!session) { window.location.href = "/dashboard"; return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/create-checkout-session`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Could not start checkout.");
    } catch { alert("Could not connect to backend."); }
    finally { setLoading(false); }
  }

  return (
    <div className="landing-page">
      <Navbar />

      <section className="pricing-section" style={{ paddingTop: "140px" }}>
        <div className="pricing-inner" style={{ maxWidth: "850px" }}>
          <p className="section-eyebrow">Pricing</p>
          <h1 className="section-title">Simple, transparent pricing</h1>
          <p className="section-sub">Start free. Upgrade when you need unlimited access and premium features.</p>

          <div className="pricing-grid">
            {/* Free */}
            <div className="plan-card">
              <div className="plan-name">Free</div>
              <div className="plan-price">$0</div>
              <div className="plan-period">3 lifetime analyses · forever free</div>
              <ul className="plan-features">
                <li>Resume quality score (no JD needed)</li>
                <li>Suggested job titles based on experience</li>
                <li>Key skills detection</li>
                <li>ATS readiness score</li>
                <li>Top improvement suggestions</li>
                <li>Score breakdown (clarity, impact, depth)</li>
              </ul>
              <a href="/dashboard" className="btn btn-md btn-outline-light plan-btn">Get Started Free</a>
            </div>

            {/* Pro */}
            <div className="plan-card plan-card-pro">
              <div className="plan-badge">Pro</div>
              <div className="plan-name">Pro</div>
              <div className="plan-price">$9<span>/mo</span></div>
              <div className="plan-period">Billed monthly · Cancel anytime</div>
              <ul className="plan-features">
                <li>Everything in Free</li>
                <li>Unlimited resume analyses</li>
                <li>Targeted job description matching</li>
                <li>Smart job search with fit scoring</li>
                <li>Qualification coverage (required/preferred/bonus)</li>
                <li>Evidence-based weakness analysis</li>
                <li>Tailored professional summary</li>
                <li>Improved bullet point examples</li>
                <li>Download improvement report</li>
                <li>Version comparison tracking</li>
              </ul>
              <button className="btn btn-md btn-brand plan-btn" onClick={handleUpgrade} disabled={loading}>
                {loading ? <><span className="spinner" /> Loading...</> : "Upgrade to Pro →"}
              </button>
            </div>
          </div>

          {/* What's included comparison */}
          <div className="pricing-notice">
            <strong>What counts as an analysis?</strong> Each time you click "Quick Score" or "Analyze Against Job Description" uses one analysis.
            Uploading a PDF, editing text, or browsing job results does not count. Job matching searches are unlimited for Pro users.
          </div>

          <div className="pricing-notice" style={{ marginTop: "12px" }}>
            <strong>Cancellation Policy:</strong> Cancel anytime from your dashboard. Your Pro access continues until the end of your current billing period.
            No partial refunds. Due to the AI-powered nature of this service, all purchases are final after usage.
          </div>

          <div className="pricing-notice" style={{ marginTop: "12px" }}>
            <strong>Billing:</strong> Charges may appear as "RESUMEAIHUB" on your statement. Subscriptions renew monthly until canceled.
          </div>

          {/* FAQ */}
          <div className="pricing-faq">
            <h3 className="pricing-faq-title">Frequently Asked Questions</h3>
            <div className="faq-grid">
              {[
                { q: "What's the difference between Quick Score and Targeted Analysis?", a: "Quick Score evaluates your resume's general quality without a job description — it gives you a quality score and suggests job titles. Targeted Analysis compares your resume against a specific job description for detailed match scoring." },
                { q: "How does Smart Job Matching work?", a: "Our AI extracts your skills and experience, searches real job boards, then scores each job against your resume. You see which jobs you're most likely to land." },
                { q: "Do free analyses expire?", a: "No. Your 3 free analyses are lifetime — they never reset. Once used, you'll need Pro for more." },
                { q: "Can I cancel anytime?", a: "Yes. Cancel from your dashboard. You keep Pro access until your billing period ends. No questions asked." },
                { q: "Is my resume data stored?", a: "No. Resume text is processed in real time via OpenAI's API and is not stored in our database. We only store your email and usage count." },
                { q: "What AI model do you use?", a: "GPT-4o by OpenAI — the most capable model available for structured analysis, combined with RAG (semantic search) for better context extraction." },
              ].map((item, i) => (
                <div key={i} className="faq-item">
                  <div className="faq-q">{item.q}</div>
                  <div className="faq-a">{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
