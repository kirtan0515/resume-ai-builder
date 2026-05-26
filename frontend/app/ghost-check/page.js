"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";
import API_URL from "../../lib/api";

export default function GhostCheckPage() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [postedDate, setPostedDate] = useState("");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
  }, []);

  async function handleCheck(e) {
    e.preventDefault();
    if (!jobDescription.trim()) { alert("Paste the job description."); return; }
    setChecking(true); setResult(null);
    try {
      const res = await fetch(`${API_URL}/ghost-job-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ job_description: jobDescription, company_name: companyName, posted_date: postedDate, url }),
      });
      if (!res.ok) { alert("Failed to analyze."); return; }
      setResult(await res.json());
    } catch { alert("Could not connect."); }
    finally { setChecking(false); }
  }

  const probColor = (p) => p <= 30 ? "var(--green)" : p <= 60 ? "var(--yellow)" : "var(--red)";

  if (loading) return <div className="dashboard-page"><Navbar dark /><div style={{ textAlign: "center", padding: "100px" }}><span className="spinner" style={{ width: "24px", height: "24px", borderWidth: "3px" }} /></div></div>;
  if (!session) return <div className="dashboard-page"><Navbar dark /><div className="main-content"><div className="card signin-prompt"><h3 className="signin-prompt-title">Sign in to check ghost jobs</h3><a href="/dashboard" className="btn btn-md btn-brand" style={{ margin: "16px auto 0" }}>Sign In</a></div></div></div>;

  return (
    <div className="dashboard-page">
      <Navbar dark />
      <div className="dashboard-hero"><h1>Ghost Job Detector</h1><p>Check if a job posting is real or just collecting resumes. Stop wasting time on fake listings.</p></div>
      <main className="main-content">
        {!result && (
          <form onSubmit={handleCheck}>
            <div className="card">
              <div className="card-title">Paste the Job Posting</div>
              <div className="form-group"><label className="form-label">Job Description *</label><textarea rows={8} value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the full job description here..." /></div>
              <div className="two-col-cards">
                <div className="form-group"><label className="form-label">Company Name</label><input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company name" /></div>
                <div className="form-group"><label className="form-label">Posted Date</label><input value={postedDate} onChange={e => setPostedDate(e.target.value)} placeholder="e.g. 2 months ago, March 2024" /></div>
              </div>
              <div className="form-group"><label className="form-label">Job URL</label><input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." /></div>
              <button className="btn btn-lg btn-brand" type="submit" disabled={checking} style={{ width: "100%" }}>
                {checking ? <><span className="spinner" /> Analyzing...</> : "Check if Ghost Job"}
              </button>
            </div>
          </form>
        )}

        {result && (
          <div>
            {/* Verdict */}
            <div className="card" style={{ borderColor: probColor(result.ghost_probability) + "40" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "16px" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", border: `3px solid ${probColor(result.ghost_probability)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: "24px", fontWeight: "800", color: probColor(result.ghost_probability) }}>{result.ghost_probability}%</div>
                  <div style={{ fontSize: "10px", color: "var(--dk-text-muted)" }}>ghost</div>
                </div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: "700", color: probColor(result.ghost_probability), marginBottom: "4px" }}>{result.verdict}</div>
                  <div style={{ fontSize: "14px", color: "var(--dk-text-label)", lineHeight: "1.6" }}>{result.analysis}</div>
                </div>
              </div>
            </div>

            {/* Red flags */}
            {result.red_flags?.length > 0 && (
              <div className="card">
                <div className="card-title red-accent">Red Flags</div>
                <ul className="dash-list">
                  {result.red_flags.map((f, i) => <li key={i}><span className="dash-icon" style={{ color: "var(--red)" }}>⚠</span>{f}</li>)}
                </ul>
              </div>
            )}

            {/* Green flags */}
            {result.green_flags?.length > 0 && (
              <div className="card">
                <div className="card-title green-accent">Green Flags</div>
                <ul className="dash-list">
                  {result.green_flags.map((f, i) => <li key={i}><span className="dash-icon" style={{ color: "var(--green)" }}>✓</span>{f}</li>)}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <div className="card">
                <div className="card-title accent-accent">What You Should Do</div>
                <ul className="dash-list">
                  {result.recommendations.map((r, i) => <li key={i}><span className="dash-icon">→</span>{r}</li>)}
                </ul>
              </div>
            )}

            <button className="btn btn-md btn-secondary" onClick={() => setResult(null)} style={{ marginTop: "12px" }}>Check Another Job</button>
          </div>
        )}
      </main>
    </div>
  );
}
