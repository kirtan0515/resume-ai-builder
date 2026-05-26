"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";
import ResumeUploader from "../../components/ResumeUploader";
import API_URL from "../../lib/api";

export default function SalaryPage() {
  const [session, setSession] = useState(null);
  const [userMeta, setUserMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) { fetchMeta(session.access_token); loadProfile(session.access_token); }
      setLoading(false);
    });
  }, []);

  async function fetchMeta(token) { try { const r = await fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } }); if (r.ok) setUserMeta(await r.json()); } catch {} }
  async function loadProfile(token) { try { const r = await fetch(`${API_URL}/profile`, { headers: { Authorization: `Bearer ${token}` } }); if (r.ok) { const d = await r.json(); if (!d.empty && d.resume_text) setResumeText(d.resume_text); } } catch {} }
  function handleResumeExtracted(text) { setResumeText(text); if (session) fetch(`${API_URL}/profile`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ resume_text: text }) }).catch(() => {}); }

  const isPro = userMeta?.role === "paid" || userMeta?.role === "admin";

  async function handleGenerate(e) {
    e.preventDefault();
    if (!resumeText.trim() || !jobDescription.trim()) { alert("Resume and job description required."); return; }
    setGenerating(true); setResult(null);
    try {
      const res = await fetch(`${API_URL}/salary-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription, company_name: companyName, location }),
      });
      if (res.status === 402) { window.location.href = "/pricing"; return; }
      if (!res.ok) { alert("Failed."); return; }
      setResult(await res.json());
    } catch { alert("Could not connect."); }
    finally { setGenerating(false); }
  }

  if (loading) return <div className="dashboard-page"><Navbar dark /><div style={{ textAlign: "center", padding: "100px" }}><span className="spinner" style={{ width: "24px", height: "24px", borderWidth: "3px" }} /></div></div>;
  if (!session) return <div className="dashboard-page"><Navbar dark /><div className="main-content"><div className="card signin-prompt"><h3 className="signin-prompt-title">Sign in for Salary Intelligence</h3><a href="/dashboard" className="btn btn-md btn-brand" style={{ margin: "16px auto 0" }}>Sign In</a></div></div></div>;

  return (
    <div className="dashboard-page">
      <Navbar dark />
      <div className="dashboard-hero"><h1>Salary Negotiation AI</h1><p>Get salary estimates and negotiation scripts based on your experience and target role.</p></div>
      <main className="main-content">
        {!isPro && <div className="card" style={{ textAlign: "center", padding: "32px" }}><p style={{ color: "var(--dk-text-muted)", marginBottom: "16px" }}>Salary analysis is a Pro feature.</p><a href="/pricing" className="btn btn-md btn-brand">Upgrade to Pro</a></div>}

        {isPro && !result && (
          <form onSubmit={handleGenerate}>
            <ResumeUploader resumeText={resumeText} onExtracted={handleResumeExtracted} uploading={uploading} setUploading={setUploading} apiUrl={API_URL} />
            <div className="card">
              <div className="card-title">Job Details</div>
              <div className="form-group"><label className="form-label">Job Description</label><textarea rows={5} value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the job description..." /></div>
              <div className="two-col-cards">
                <div className="form-group"><label className="form-label">Company</label><input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Google, Startup, etc." /></div>
                <div className="form-group"><label className="form-label">Location</label><input value={location} onChange={e => setLocation(e.target.value)} placeholder="NYC, Remote, SF Bay Area" /></div>
              </div>
              <button className="btn btn-lg btn-brand" type="submit" disabled={generating} style={{ width: "100%" }}>
                {generating ? <><span className="spinner" /> Analyzing...</> : "Get Salary Intelligence"}
              </button>
            </div>
          </form>
        )}

        {result && (
          <div>
            {/* Range */}
            <div className="card">
              <div className="card-title accent-accent">Estimated Salary Range</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: "13px", color: "var(--dk-text-muted)" }}>Low</div><div style={{ fontSize: "24px", fontWeight: "800", color: "var(--yellow)" }}>${(result.estimated_range?.low || 0).toLocaleString()}</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: "13px", color: "var(--dk-text-muted)" }}>Mid</div><div style={{ fontSize: "28px", fontWeight: "800", color: "var(--brand)" }}>${(result.estimated_range?.mid || 0).toLocaleString()}</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontSize: "13px", color: "var(--dk-text-muted)" }}>High</div><div style={{ fontSize: "24px", fontWeight: "800", color: "var(--green)" }}>${(result.estimated_range?.high || 0).toLocaleString()}</div></div>
              </div>
              <div style={{ fontSize: "14px", color: "var(--brand)", fontWeight: "600", marginBottom: "8px" }}>Your position: {result.candidate_position}</div>
              <div style={{ fontSize: "14px", color: "var(--dk-text-label)" }}>{result.position_reasoning}</div>
            </div>

            {/* Negotiation scripts */}
            <div className="card">
              <div className="card-title green-accent">Negotiation Script</div>
              <div style={{ background: "var(--dk-surface-2)", border: "1px solid var(--dk-border)", borderRadius: "var(--radius)", padding: "16px", fontSize: "14px", color: "var(--dk-text-label)", lineHeight: "1.7", marginBottom: "16px" }}>
                "{result.negotiation_script}"
              </div>
              {result.counter_offer_script && (
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--dk-text-muted)", marginBottom: "8px" }}>IF OFFER IS LOW:</div>
                  <div style={{ background: "var(--dk-surface-2)", border: "1px solid var(--dk-border)", borderRadius: "var(--radius)", padding: "16px", fontSize: "14px", color: "var(--dk-text-label)", lineHeight: "1.7" }}>
                    "{result.counter_offer_script}"
                  </div>
                </div>
              )}
            </div>

            {/* Factors */}
            <div className="two-col-cards">
              <div className="card"><div className="card-title green-accent">Factors Increasing Pay</div><ul className="dash-list">{result.factors_increasing?.map((f, i) => <li key={i}><span className="dash-icon" style={{ color: "var(--green)" }}>↑</span>{f}</li>)}</ul></div>
              <div className="card"><div className="card-title red-accent">Factors Limiting Pay</div><ul className="dash-list">{result.factors_decreasing?.map((f, i) => <li key={i}><span className="dash-icon" style={{ color: "var(--red)" }}>↓</span>{f}</li>)}</ul></div>
            </div>

            {/* Tips */}
            <div className="card"><div className="card-title">Tips</div><ul className="dash-list">{result.tips?.map((t, i) => <li key={i}><span className="dash-icon">→</span>{t}</li>)}</ul></div>

            {result.market_context && <div className="card" style={{ padding: "16px 20px" }}><div style={{ fontSize: "14px", color: "var(--dk-text-muted)" }}>{result.market_context}</div></div>}

            <button className="btn btn-md btn-secondary" onClick={() => setResult(null)} style={{ marginTop: "12px" }}>Analyze Another Role</button>
          </div>
        )}
      </main>
    </div>
  );
}
