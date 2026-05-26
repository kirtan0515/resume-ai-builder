"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";
import API_URL from "../../lib/api";

export default function CoverLetterPage() {
  const [session, setSession] = useState(null);
  const [userMeta, setUserMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [tone, setTone] = useState("professional");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchMeta(session.access_token);
      setLoading(false);
    });
  }, []);

  async function fetchMeta(token) {
    try {
      const res = await fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setUserMeta(await res.json());
    } catch {}
  }

  const isPro = userMeta?.role === "paid" || userMeta?.role === "admin";

  async function handleGenerate(e) {
    e.preventDefault();
    if (!resumeText.trim() || !jobDescription.trim()) { alert("Resume and job description are required."); return; }
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/generate-cover-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription, company_name: companyName, tone }),
      });
      if (res.status === 402) { window.location.href = "/pricing"; return; }
      if (!res.ok) { alert("Failed to generate cover letter."); return; }
      setResult(await res.json());
    } catch { alert("Could not connect."); }
    finally { setGenerating(false); }
  }

  function handleCopy() {
    if (!result?.cover_letter) return;
    navigator.clipboard.writeText(result.cover_letter).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) return <div className="dashboard-page"><Navbar dark /><div style={{ textAlign: "center", padding: "100px" }}><span className="spinner" style={{ width: "24px", height: "24px", borderWidth: "3px" }} /></div></div>;

  if (!session) return <div className="dashboard-page"><Navbar dark /><div className="main-content"><div className="card signin-prompt"><h3 className="signin-prompt-title">Sign in for Cover Letters</h3><a href="/dashboard" className="btn btn-md btn-brand" style={{ margin: "16px auto 0" }}>Sign In</a></div></div></div>;

  return (
    <div className="dashboard-page">
      <Navbar dark />
      <div className="dashboard-hero">
        <h1>AI Cover Letter Generator</h1>
        <p>Generate a personalized cover letter that connects your experience to the role.</p>
      </div>

      <main className="main-content">
        {!isPro && (
          <div className="card" style={{ textAlign: "center", padding: "32px" }}>
            <p style={{ color: "var(--dk-text-muted)", marginBottom: "16px" }}>Cover letter generation is a Pro feature.</p>
            <a href="/pricing" className="btn btn-md btn-brand">Upgrade to Pro — $9/mo</a>
          </div>
        )}

        {isPro && (
          <form onSubmit={handleGenerate}>
            <div className="card">
              <div className="card-title">Generate Cover Letter</div>
              <div className="form-group">
                <label className="form-label">Your Resume</label>
                <textarea rows={6} value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Paste your resume text..." />
              </div>
              <div className="form-group">
                <label className="form-label">Job Description</label>
                <textarea rows={6} value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the job description..." />
              </div>
              <div className="two-col-cards">
                <div className="form-group">
                  <label className="form-label">Company Name (optional)</label>
                  <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Google, Amazon, etc." />
                </div>
                <div className="form-group">
                  <label className="form-label">Tone</label>
                  <select value={tone} onChange={e => setTone(e.target.value)} style={{ width: "100%", background: "var(--dk-surface-2)", border: "1px solid var(--dk-border)", borderRadius: "var(--radius)", color: "var(--dk-text)", padding: "12px 14px", fontSize: "14px" }}>
                    <option value="professional">Professional</option>
                    <option value="conversational">Conversational</option>
                    <option value="enthusiastic">Enthusiastic</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-lg btn-brand" type="submit" disabled={generating} style={{ width: "100%" }}>
                {generating ? <><span className="spinner" /> Generating...</> : "Generate Cover Letter"}
              </button>
            </div>
          </form>
        )}

        {result && (
          <div className="card">
            <div className="card-title accent-accent">Your Cover Letter</div>

            {result.subject_line && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--dk-text-muted)", marginBottom: "4px" }}>SUBJECT LINE</div>
                <div style={{ fontSize: "14px", color: "var(--brand)", fontWeight: "600" }}>{result.subject_line}</div>
              </div>
            )}

            <div style={{ background: "var(--dk-surface-2)", border: "1px solid var(--dk-border)", borderRadius: "var(--radius)", padding: "24px", marginBottom: "16px", whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: "1.8", color: "var(--dk-text-label)" }}>
              {result.cover_letter}
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <button className="btn btn-md btn-brand" onClick={handleCopy}>
                {copied ? "✓ Copied!" : "Copy to Clipboard"}
              </button>
              <button className="btn btn-md btn-secondary" onClick={() => setResult(null)}>
                Generate Another
              </button>
            </div>

            {result.key_connections?.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--dk-text-muted)", marginBottom: "8px" }}>KEY CONNECTIONS HIGHLIGHTED</div>
                <ul className="dash-list">
                  {result.key_connections.map((c, i) => <li key={i}><span className="dash-icon">→</span>{c}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
