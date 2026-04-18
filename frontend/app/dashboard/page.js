"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import ResumeForm from "../../components/ResumeForm";
import AuthModal from "../../components/AuthModal";
import Navbar from "../../components/Navbar";

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
    <>
      <Navbar />

      <div className="hero" style={{ paddingBottom: "24px" }}>
        <div className="hero-badge">✦ AI Resume Intelligence</div>
        <h1>Analyze Your Resume</h1>
        <p>Upload your resume, paste a job description, and get instant AI-powered feedback.</p>
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
