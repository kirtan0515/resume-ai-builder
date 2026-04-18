"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import ResumeForm from "../components/ResumeForm";
import AuthModal from "../components/AuthModal";

export default function Home() {
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
      } else {
        setUserMeta(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserMeta(token) {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";
      const res = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setUserMeta(await res.json());
    } catch {}
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUserMeta(null);
  }

  const isAdmin = userMeta?.role === "admin";

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <a className="navbar-brand" href="/">
          <span className="navbar-brand-dot" />
          ResumeAI Hub
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isAdmin && <span className="admin-badge">⚡ Admin</span>}
          {session ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="navbar-email">{session.user.email}</span>
              <button className="btn-signout" onClick={handleSignOut}>Sign Out</button>
            </div>
          ) : (
            <button className="btn-signin" onClick={() => setShowAuth(true)}>Sign In</button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="hero">
        <div className="hero-badge">✦ AI Resume Intelligence</div>
        <h1>Land More Interviews with AI</h1>
        <p>
          Upload your resume, paste a job description, and get instant
          domain-aware analysis — scores, honest feedback, and exactly what to fix.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">5</span>
            <span className="hero-stat-label">Score Dimensions</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">RAG</span>
            <span className="hero-stat-label">Powered</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">GPT-4o</span>
            <span className="hero-stat-label">Model</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">ATS</span>
            <span className="hero-stat-label">Optimized</span>
          </div>
        </div>
      </div>

      <main className="main-content">
        {loading ? (
          <div className="card" style={{ textAlign: "center", padding: "48px" }}>
            <span className="spinner" style={{ width: "24px", height: "24px", borderWidth: "3px" }} />
          </div>
        ) : session ? (
          <ResumeForm session={session} userMeta={userMeta} />
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
    </>
  );
}
