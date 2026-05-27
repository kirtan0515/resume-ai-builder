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
                <div className="tool-desc">Score & feedback</div>
              </a>
              <a href="/ats-check" className="tool-card">
                <div className="tool-icon">▣</div>
                <div className="tool-name">ATS Simulator</div>
                <div className="tool-desc">Test parsing</div>
              </a>
              <a href="/tracker" className="tool-card">
                <div className="tool-icon">▤</div>
                <div className="tool-name">Tracker</div>
                <div className="tool-desc">Track applications</div>
              </a>
              <a href="/interview" className="tool-card">
                <div className="tool-icon">◇</div>
                <div className="tool-name">Interview Prep</div>
                <div className="tool-desc">Practice questions</div>
              </a>
              <a href="/cover-letter" className="tool-card">
                <div className="tool-icon">▧</div>
                <div className="tool-name">Cover Letter</div>
                <div className="tool-desc">AI-generated</div>
              </a>
              <a href="/salary" className="tool-card">
                <div className="tool-icon">△</div>
                <div className="tool-name">Salary Intel</div>
                <div className="tool-desc">Negotiate better</div>
              </a>
              <a href="/ghost-check" className="tool-card">
                <div className="tool-icon">◌</div>
                <div className="tool-name">Ghost Check</div>
                <div className="tool-desc">Detect fake jobs</div>
              </a>
              <a href="/linkedin" className="tool-card">
                <div className="tool-icon">◈</div>
                <div className="tool-name">LinkedIn Check</div>
                <div className="tool-desc">vs Resume</div>
              </a>
              <a href="/builder" className="tool-card">
                <div className="tool-icon">▦</div>
                <div className="tool-name">Resume Builder</div>
                <div className="tool-desc">PDF & LaTeX</div>
              </a>
              <a href="/profile" className="tool-card">
                <div className="tool-icon">○</div>
                <div className="tool-name">Profile</div>
                <div className="tool-desc">Your saved data</div>
              </a>
            </div>

            <ResumeForm session={session} userMeta={userMeta} />
          </>
        ) : (
          <div className="card signin-prompt">
            <div className="signin-prompt-icon">🔐</div>
            <h3 className="signin-prompt-title">Sign in to Analyze Your Resume</h3>
            <p className="signin-prompt-body">
              Create a free account to get started. Your first 2 analyses are free.
            </p>
            <button className="btn-primary" style={{ margin: "0 auto" }} onClick={() => setShowAuth(true)}>
              Get Started — It's Free
            </button>
          </div>
        )}
      </main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
