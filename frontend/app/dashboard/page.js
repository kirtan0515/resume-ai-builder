"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import ResumeForm from "../../components/ResumeForm";
import AuthModal from "../../components/AuthModal";
import Navbar from "../../components/Navbar";
import BillingPanel from "../../components/BillingPanel";

export default function Dashboard() {
  const [session, setSession] = useState(null);
  const [userMeta, setUserMeta] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserMeta(session.access_token);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserMeta(session.access_token);
        setShowAuth(false);
        setLoading(false);
      } else {
        setUserMeta(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserMeta(token) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001"}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUserMeta(await res.json());
    } catch {}
  }

  return (
    <div className="dashboard-page">
      <Navbar dark />

      <div className="dashboard-hero">
        <h1>Resume Intelligence Dashboard</h1>
        <p>Score your resume, get targeted feedback, or find matching jobs — all powered by GPT-4o.</p>
      </div>

      <main className="main-content">
        {loading ? (
          <div className="card" style={{ textAlign: "center", padding: "48px" }}>
            <span className="spinner" style={{ width: "24px", height: "24px", borderWidth: "3px" }} />
          </div>
        ) : session ? (
          <>
            <BillingPanel session={session} userMeta={userMeta} />

            {/* Tools Grid */}
            <div className="tools-grid">
              <a href="/dashboard" className="tool-card tool-card-active">
                <div className="tool-icon">◎</div>
                <div className="tool-name">Resume Analysis</div>
                <div className="tool-desc">3 free analyses</div>
              </a>
              <a href="/ats-check" className="tool-card">
                <div className="tool-icon">▣</div>
                <div className="tool-name">ATS Simulator</div>
                <div className="tool-desc">Free</div>
              </a>
              <a href="/ghost-check" className="tool-card">
                <div className="tool-icon">◌</div>
                <div className="tool-name">Ghost Check</div>
                <div className="tool-desc">Free</div>
              </a>
              <a href="/tracker" className="tool-card">
                <div className="tool-icon">▤</div>
                <div className="tool-name">Tracker</div>
                <div className="tool-desc">Free</div>
              </a>
              <a href="/interview" className="tool-card">
                <div className="tool-icon">◇</div>
                <div className="tool-name">Interview Prep</div>
                <div className="tool-desc">Pro</div>
              </a>
              <a href="/cover-letter" className="tool-card">
                <div className="tool-icon">▧</div>
                <div className="tool-name">Cover Letter</div>
                <div className="tool-desc">Pro</div>
              </a>
              <a href="/salary" className="tool-card">
                <div className="tool-icon">△</div>
                <div className="tool-name">Salary Intel</div>
                <div className="tool-desc">Pro</div>
              </a>
              <a href="/linkedin" className="tool-card">
                <div className="tool-icon">◈</div>
                <div className="tool-name">LinkedIn Check</div>
                <div className="tool-desc">Pro</div>
              </a>
              <a href="/builder" className="tool-card">
                <div className="tool-icon">▦</div>
                <div className="tool-name">Resume Builder</div>
                <div className="tool-desc">Pro export</div>
              </a>
              <a href="/profile" className="tool-card">
                <div className="tool-icon">○</div>
                <div className="tool-name">Profile</div>
                <div className="tool-desc">Free</div>
              </a>
            </div>

            <ResumeForm session={session} userMeta={userMeta} />
          </>
        ) : (
          <div className="card signin-prompt">
            <div className="signin-prompt-icon" style={{ fontSize: "52px", marginBottom: "20px" }}>◎</div>
            <h3 className="signin-prompt-title">Welcome to ResumeAI Hub</h3>
            <p className="signin-prompt-body">
              Sign in to access 11 AI career tools — resume scoring, job matching, interview prep, and more.
              Your first 3 analyses are free.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", marginTop: "8px" }}>
              <button className="btn btn-lg btn-brand" style={{ width: "100%", maxWidth: "300px" }} onClick={() => setShowAuth(true)}>
                Get Started Free
              </button>
              <p style={{ fontSize: "13px", color: "var(--dk-text-muted)" }}>No credit card required · 3 free analyses</p>
            </div>
            <div style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", maxWidth: "400px", margin: "24px auto 0" }}>
              <div style={{ background: "var(--dk-surface-2)", border: "1px solid var(--dk-border)", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--brand)" }}>Free</div>
                <div style={{ fontSize: "11px", color: "var(--dk-text-muted)" }}>ATS Check, Ghost Detector, Tracker</div>
              </div>
              <div style={{ background: "var(--dk-surface-2)", border: "1px solid var(--dk-border)", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--green)" }}>Pro $9/mo</div>
                <div style={{ fontSize: "11px", color: "var(--dk-text-muted)" }}>All 11 tools unlimited</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
