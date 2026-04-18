"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";
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
    <>
      <Navbar />
      <div className="lp-section" style={{ paddingTop: "72px" }}>
        <div className="lp-section-inner">
          <div className="lp-section-label">Pricing</div>
          <h1 className="lp-h2">Simple, transparent pricing</h1>
          <p className="lp-sub" style={{ marginBottom: "48px" }}>
            Start free. Upgrade when you need more.
          </p>

          <div className="lp-pricing-row">
            <div className="lp-plan">
              <div className="lp-plan-name">Free</div>
              <div className="lp-plan-price">$0</div>
              <div className="lp-plan-period">forever</div>
              <ul className="lp-plan-features">
                <li>✓ 2 lifetime analyses</li>
                <li>✓ Full analysis dashboard</li>
                <li>✓ ATS match score</li>
                <li>✓ Keyword gap detection</li>
                <li>✓ Top fix suggestions</li>
                <li>✓ Screening verdict</li>
              </ul>
              <a href="/dashboard" className="btn-outline lp-plan-btn">Get Started Free</a>
            </div>

            <div className="lp-plan lp-plan-pro">
              <div className="lp-plan-badge">Most Popular</div>
              <div className="lp-plan-name">Pro</div>
              <div className="lp-plan-price">$9<span>/mo</span></div>
              <div className="lp-plan-period">billed monthly · cancel anytime</div>
              <ul className="lp-plan-features">
                <li>✓ Unlimited analyses</li>
                <li>✓ Everything in Free</li>
                <li>✓ Download improvement report</li>
                <li>✓ Version comparison</li>
                <li>✓ Advanced AI feedback</li>
                <li>✓ Priority processing</li>
                <li>✓ Early access to new features</li>
              </ul>
              <button
                className="btn-primary lp-plan-btn"
                onClick={handleUpgrade}
                disabled={loading}
              >
                {loading ? <><span className="spinner" /> Loading...</> : "Upgrade to Pro →"}
              </button>
            </div>
          </div>

          {/* Refund policy */}
          <div className="pricing-notice">
            <strong>Refund Policy:</strong> Due to the digital and AI-powered nature of this service,
            all purchases are final. We do not offer refunds after usage. Try the free tier before upgrading.
            You may cancel anytime — access continues until the end of your billing period.
          </div>

          {/* FAQ */}
          <div className="pricing-faq">
            <h3 className="pricing-faq-title">Frequently Asked Questions</h3>
            <div className="faq-grid">
              {[
                { q: "What counts as one analysis?", a: "Each time you click Analyze Resume, that uses one analysis. Uploading a PDF or editing text does not count." },
                { q: "Do free analyses expire?", a: "No. Your 2 free analyses are lifetime — they don't reset daily or monthly." },
                { q: "Can I cancel anytime?", a: "Yes. Cancel anytime from your dashboard. You'll keep Pro access until the end of your billing period." },
                { q: "What data do you store?", a: "We store your email and usage count. Resume text is processed in real time and not stored. See our Privacy Policy." },
              ].map((item, i) => (
                <div key={i} className="faq-item">
                  <div className="faq-q">{item.q}</div>
                  <div className="faq-a">{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
