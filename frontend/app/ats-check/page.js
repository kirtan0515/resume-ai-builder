"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";
import ResumeUploader from "../../components/ResumeUploader";
import API_URL from "../../lib/api";

export default function ATSCheckPage() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.access_token);
      setLoading(false);
    });
  }, []);

  async function loadProfile(token) { try { const r = await fetch(`${API_URL}/profile`, { headers: { Authorization: `Bearer ${token}` } }); if (r.ok) { const d = await r.json(); if (!d.empty && d.resume_text) setResumeText(d.resume_text); } } catch {} }
  function handleResumeExtracted(text) { setResumeText(text); }

  async function handleCheck() {
    if (!resumeText.trim()) { alert("Upload or paste your resume."); return; }
    setChecking(true); setResult(null);
    try {
      const res = await fetch(`${API_URL}/ats-simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ resume_text: resumeText }),
      });
      if (!res.ok) { alert("Failed."); return; }
      setResult(await res.json());
    } catch { alert("Could not connect."); }
    finally { setChecking(false); }
  }

  if (loading) return <div className="dashboard-page"><Navbar dark /><div style={{ textAlign: "center", padding: "100px" }}><span className="spinner" style={{ width: "24px", height: "24px", borderWidth: "3px" }} /></div></div>;
  if (!session) return <div className="dashboard-page"><Navbar dark /><div className="main-content"><div className="card signin-prompt"><h3 className="signin-prompt-title">Sign in for ATS Check</h3><a href="/dashboard" className="btn btn-md btn-brand" style={{ margin: "16px auto 0" }}>Sign In</a></div></div></div>;

  const scoreColor = (s) => s >= 80 ? "var(--green)" : s >= 60 ? "var(--brand)" : s >= 40 ? "var(--yellow)" : "var(--red)";

  return (
    <div className="dashboard-page">
      <Navbar dark />
      <div className="dashboard-hero"><h1>ATS Simulator</h1><p>See how your resume looks after ATS processing. Find and fix parsing issues.</p></div>
      <main className="main-content">
        {!result && (
          <div>
            <ResumeUploader resumeText={resumeText} onExtracted={handleResumeExtracted} uploading={uploading} setUploading={setUploading} apiUrl={API_URL} />
            <button className="btn btn-lg btn-brand" onClick={handleCheck} disabled={checking || !resumeText.trim()} style={{ width: "100%", marginTop: "12px" }}>
              {checking ? <><span className="spinner" /> Simulating ATS...</> : "Run ATS Simulation"}
            </button>
          </div>
        )}

        {result && (
          <div>
            <div className="card">
              <div className="card-title accent-accent">ATS Compatibility Score</div>
              <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "16px" }}>
                <div style={{ width: "72px", height: "72px", borderRadius: "50%", border: `3px solid ${scoreColor(result.ats_score)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "24px", fontWeight: "800", color: scoreColor(result.ats_score) }}>{result.ats_score}</span>
                </div>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: scoreColor(result.ats_score) }}>{result.verdict}</div>
                  <div style={{ fontSize: "13px", color: "var(--dk-text-muted)" }}>{result.word_count} words detected</div>
                </div>
              </div>
              {result.sections_detected?.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--dk-text-muted)", marginBottom: "8px" }}>SECTIONS DETECTED BY ATS</div>
                  <div className="tag-list">{result.sections_detected.map((s, i) => <span key={i} className="tag tag-qual-met">{s}</span>)}</div>
                </div>
              )}
            </div>

            {result.issues?.length > 0 && (
              <div className="card">
                <div className="card-title red-accent">Parsing Issues Found</div>
                {result.issues.map((issue, i) => (
                  <div key={i} style={{ marginBottom: "14px", paddingBottom: "14px", borderBottom: i < result.issues.length - 1 ? "1px solid var(--dk-border)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span className={`tag tag-${issue.severity === "high" ? "danger" : issue.severity === "medium" ? "warning" : "qual-pref"}`}>{issue.severity}</span>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--dk-text)" }}>{issue.issue}</span>
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--dk-text-muted)", paddingLeft: "4px" }}>{issue.fix}</div>
                  </div>
                ))}
              </div>
            )}

            {result.parsing_warnings?.length > 0 && (
              <div className="card"><div className="card-title yellow-accent">ATS Warnings</div><ul className="dash-list">{result.parsing_warnings.map((w, i) => <li key={i}><span className="dash-icon" style={{ color: "var(--yellow)" }}>⚠</span>{w}</li>)}</ul></div>
            )}

            {result.formatting_tips?.length > 0 && (
              <div className="card"><div className="card-title green-accent">Formatting Tips</div><ul className="dash-list">{result.formatting_tips.map((t, i) => <li key={i}><span className="dash-icon" style={{ color: "var(--green)" }}>→</span>{t}</li>)}</ul></div>
            )}

            <button className="btn btn-md btn-secondary" onClick={() => setResult(null)} style={{ marginTop: "12px" }}>Check Again</button>
          </div>
        )}
      </main>
    </div>
  );
}
