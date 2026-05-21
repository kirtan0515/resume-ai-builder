"use client";

import { useState } from "react";
import API_URL from "../lib/api";

export default function JobMatcher({ session, userMeta, resumeText }) {
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("United States");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isPro = userMeta?.role === "paid" || userMeta?.role === "admin";

  async function handleSearch(e) {
    e.preventDefault();
    if (!jobTitle.trim()) { alert("Enter a job title to search."); return; }
    if (!resumeText || resumeText.trim().length < 20) { alert("Upload or paste your resume first."); return; }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch(`${API_URL}/find-jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          resume_text: resumeText,
          job_title: jobTitle,
          location: location,
        }),
      });

      const data = await res.json();

      if (res.status === 402) {
        setError("pro");
        return;
      }
      if (!res.ok) {
        setError(data.detail || "Something went wrong.");
        return;
      }

      setResults(data);
    } catch {
      setError("Could not connect to backend.");
    } finally {
      setLoading(false);
    }
  }

  function getScoreColor(score) {
    if (score >= 75) return "var(--green)";
    if (score >= 55) return "var(--brand)";
    if (score >= 40) return "var(--yellow)";
    return "var(--red)";
  }

  if (!isPro) {
    return (
      <div className="card card-locked">
        <div className="card-title accent-accent">Job Matching</div>
        <div className="locked-overlay">
          <div className="locked-icon">🔒</div>
          <div className="locked-text">Find jobs that match your resume with Pro</div>
          <a href="/pricing" className="btn btn-md btn-brand locked-btn">Upgrade to Pro — $9/mo</a>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title accent-accent">Find Matching Jobs</div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
        <div style={{ flex: "2", minWidth: "200px" }}>
          <input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Job title (e.g. Software Engineer, Data Analyst)"
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ flex: "1", minWidth: "150px" }}>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            style={{ width: "100%" }}
          />
        </div>
        <button className="btn btn-md btn-brand" type="submit" disabled={loading}>
          {loading ? <><span className="spinner" /> Searching...</> : "Find Jobs"}
        </button>
      </form>

      {error === "pro" && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <p style={{ color: "var(--dk-text-muted)", marginBottom: "12px" }}>Job matching is a Pro feature.</p>
          <a href="/pricing" className="btn btn-md btn-brand">Upgrade to Pro</a>
        </div>
      )}

      {error && error !== "pro" && (
        <p style={{ color: "var(--red)", fontSize: "14px" }}>{error}</p>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "32px" }}>
          <span className="spinner" style={{ width: "24px", height: "24px", borderWidth: "3px" }} />
          <p style={{ color: "var(--dk-text-muted)", marginTop: "12px", fontSize: "14px" }}>
            Searching and scoring jobs against your resume...
          </p>
        </div>
      )}

      {results && results.jobs?.length > 0 && (
        <div className="job-results">
          <p style={{ fontSize: "13px", color: "var(--dk-text-muted)", marginBottom: "16px" }}>
            Found {results.jobs.length} jobs for "{results.query}" in {results.location}
          </p>
          {results.jobs.map((job, i) => (
            <div key={i} className="job-card">
              <div className="job-card-header">
                <div>
                  <div className="job-card-title">{job.title}</div>
                  <div className="job-card-company">{job.company} · {job.location}</div>
                </div>
                <div className="job-card-score" style={{ color: getScoreColor(job.match_score) }}>
                  {job.match_score}%
                </div>
              </div>
              <div className="job-card-verdict">{job.verdict}</div>
              <p className="job-card-reason">{job.reason}</p>
              <div className="job-card-skills">
                {job.matched_skills?.map((s, j) => (
                  <span key={j} className="tag tag-qual-met">{s}</span>
                ))}
                {job.missing_skills?.map((s, j) => (
                  <span key={j} className="tag tag-danger">{s}</span>
                ))}
              </div>
              {job.url && (
                <a href={job.url} target="_blank" rel="noopener noreferrer" className="job-card-link">
                  View Job →
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {results && results.jobs?.length === 0 && (
        <p style={{ color: "var(--dk-text-muted)", fontSize: "14px", textAlign: "center", padding: "20px" }}>
          No jobs found for this search. Try a different title or location.
        </p>
      )}
    </div>
  );
}
