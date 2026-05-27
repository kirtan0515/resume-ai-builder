"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";
import API_URL from "../../lib/api";

export default function LinkedInPage() {
  const [session, setSession] = useState(null);
  const [userMeta, setUserMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [linkedinText, setLinkedinText] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) { fetchMeta(session.access_token); loadProfile(session.access_token); }
      setLoading(false);
    });
  }, []);

  async function fetchMeta(token) { try { const r = await fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } }); if (r.ok) setUserMeta(await r.json()); } catch {} }
  async function loadProfile(token) { try { const r = await fetch(`${API_URL}/profile`, { headers: { Authorization: `Bearer ${token}` } }); if (r.ok) { const d = await r.json(); if (!d.empty && d.resume_text) setResumeText(d.resume_text); } } catch {} }

  const isPro = userMeta?.role === "paid" || userMeta?.role === "admin";

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!linkedinText.trim() || !resumeText.trim()) { alert("Both LinkedIn text and resume required."); return; }
    setAnalyzing(true); setResult(null);
    try {
      const res = await fetch(`${API_URL}/linkedin-analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ linkedin_text: linkedinText, resume_text: resumeText }),
      });
      if (res.status === 402) { window.location.href = "/pricing"; return; }
      if (!res.ok) { alert("Failed."); return; }
      setResult(await res.json());
    } catch { alert("Could not connect."); }
    finally { setAnalyzing(false); }
  }

  if (loading) return <div className="dashboard-page"><Navbar dark /><div style={{ textAlign: "center", padding: "100px" }}><span className="spinner" style={{ width: "24px", height: "24px", borderWidth: "3px" }} /></div></div>;
  if (!session) return <div className="dashboard-page"><Navbar dark /><div className="main-content"><div className="card signin-prompt"><h3 className="signin-prompt-title">Sign in for LinkedIn Analysis</h3><a href="/dashboard" className="btn btn-md btn-brand" style={{ margin: "16px auto 0" }}>Sign In</a></div></div></div>;

  const scoreColor = (s) => s >= 80 ? "var(--green)" : s >= 60 ? "var(--brand)" : s >= 40 ? "var(--yellow)" : "var(--red)";

  return (
    <div className="dashboard-page">
      <Navbar dark />
      <div className="dashboard-hero"><h1>LinkedIn vs Resume Analyzer</h1><p>Find inconsistencies between your LinkedIn and resume before recruiters do.</p></div>
      <main className="main-content">
        {!isPro && <div className="card" style={{ textAlign: "center", padding: "32px" }}><p style={{ color: "var(--dk-text-muted)", marginBottom: "16px" }}>LinkedIn analysis is a Pro feature.</p><a href="/pricing" className="btn btn-md btn-brand">Upgrade to Pro</a></div>}

        {isPro && !result && (
          <form onSubmit={handleAnalyze}>
            <div className="card">
              <div className="card-title">Compare LinkedIn & Resume</div>
              <div className="form-group">
                <label className="form-label">LinkedIn Profile Text</label>
                <textarea rows={8} value={linkedinText} onChange={e => setLinkedinText(e.target.value)} placeholder="Go to your LinkedIn profile → copy all the text (About, Experience, Education, Skills sections)..." />
                <p style={{ fontSize: "12px", color: "var(--dk-text-muted)", marginTop: "4px" }}>Tip: Go to your LinkedIn profile, select all text (Cmd+A), and paste here.</p>
              </div>
              <div className="form-group">
                <label className="form-label">Resume Text {resumeText ? "(auto-loaded from profile)" : ""}</label>
                <textarea rows={6} value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Your resume text..." />
              </div>
              <button className="btn btn-lg btn-brand" type="submit" disabled={analyzing} style={{ width: "100%" }}>
                {analyzing ? <><span className="spinner" /> Analyzing...</> : "Compare LinkedIn vs Resume"}
              </button>
            </div>
          </form>
        )}

        {result && (
          <div>
            <div className="card">
              <div className="card-title accent-accent">Consistency Score</div>
              <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "16px" }}>
                <div style={{ width: "72px", height: "72px", borderRadius: "50%", border: `3px solid ${scoreColor(result.consistency_score)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "24px", fontWeight: "800", color: scoreColor(result.consistency_score) }}>{result.consistency_score}</span>
                </div>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: scoreColor(result.consistency_score) }}>{result.verdict}</div>
                  <div style={{ fontSize: "14px", color: "var(--dk-text-label)", marginTop: "4px" }}>{result.overall_advice}</div>
                </div>
              </div>
            </div>

            {result.mismatches?.length > 0 && (
              <div className="card">
                <div className="card-title red-accent">Mismatches Found</div>
                {result.mismatches.map((m, i) => (
                  <div key={i} style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: i < result.mismatches.length - 1 ? "1px solid var(--dk-border)" : "none" }}>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--dk-text)", marginBottom: "6px" }}>{m.area}</div>
                    <div style={{ fontSize: "13px", color: "var(--dk-text-muted)", marginBottom: "3px" }}><strong>LinkedIn:</strong> {m.linkedin_says}</div>
                    <div style={{ fontSize: "13px", color: "var(--dk-text-muted)", marginBottom: "3px" }}><strong>Resume:</strong> {m.resume_says}</div>
                    <div style={{ fontSize: "13px", color: "var(--brand)" }}><strong>Fix:</strong> {m.recommendation}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="two-col-cards">
              {result.linkedin_improvements?.length > 0 && (
                <div className="card"><div className="card-title accent-accent">Improve LinkedIn</div><ul className="dash-list">{result.linkedin_improvements.map((t, i) => <li key={i}><span className="dash-icon">→</span>{t}</li>)}</ul></div>
              )}
              {result.resume_improvements?.length > 0 && (
                <div className="card"><div className="card-title green-accent">Improve Resume</div><ul className="dash-list">{result.resume_improvements.map((t, i) => <li key={i}><span className="dash-icon">→</span>{t}</li>)}</ul></div>
              )}
            </div>

            <div className="two-col-cards">
              {result.missing_from_linkedin?.length > 0 && (
                <div className="card"><div className="card-title yellow-accent">Add to LinkedIn</div><ul className="dash-list">{result.missing_from_linkedin.map((t, i) => <li key={i}><span className="dash-icon" style={{ color: "var(--yellow)" }}>+</span>{t}</li>)}</ul></div>
              )}
              {result.missing_from_resume?.length > 0 && (
                <div className="card"><div className="card-title yellow-accent">Add to Resume</div><ul className="dash-list">{result.missing_from_resume.map((t, i) => <li key={i}><span className="dash-icon" style={{ color: "var(--yellow)" }}>+</span>{t}</li>)}</ul></div>
              )}
            </div>

            <button className="btn btn-md btn-secondary" onClick={() => setResult(null)} style={{ marginTop: "12px" }}>Analyze Again</button>
          </div>
        )}
      </main>
    </div>
  );
}
