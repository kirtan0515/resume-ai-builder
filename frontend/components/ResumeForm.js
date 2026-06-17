"use client";

import { useState, useEffect, useRef } from "react";
import ResultCard from "./ResultCard";
import JobMatcher from "./JobMatcher";
import API_URL from "../lib/api";

const LOADING_MESSAGES = [
  "Detecting industry and domain...",
  "Checking ATS keyword match...",
  "Evaluating experience alignment...",
  "Analyzing impact and metrics...",
  "Generating feedback...",
  "Scoring your resume...",
];

const FREE_LIMIT = 3;
const STORAGE_KEY = "resumeai_usage";

function getUsageCount() {
  if (typeof window === "undefined") return 0;
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  const today = new Date().toDateString();
  return data.date === today ? (data.count || 0) : 0;
}

function incrementUsage() {
  const today = new Date().toDateString();
  const count = getUsageCount() + 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count }));
  return count;
}

export default function ResumeForm({ session, userMeta }) {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [activeTab, setActiveTab] = useState("analyze"); // analyze | jobs
  const [result, setResult] = useState(null);
  const [resumeOnlyResult, setResumeOnlyResult] = useState(null);
  const [prevResult, setPrevResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const msgInterval = useRef(null);

  const isPrivileged = userMeta?.role === "admin" || userMeta?.role === "paid";

  useEffect(() => { setUsageCount(getUsageCount()); }, []);

  function startLoadingMessages() {
    let i = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    msgInterval.current = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[i]);
    }, 1800);
  }

  function stopLoadingMessages() {
    clearInterval(msgInterval.current);
    setLoadingMsg("");
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const res = await fetch(`${API_URL}/upload-resume`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { alert(data.detail || "Failed to upload."); return; }
      if (data.resume_text?.trim()) {
        setResumeText(data.resume_text);
        setUploadedFile(file.name);
      } else {
        alert("PDF uploaded but no text could be extracted.");
      }
    } catch { alert("Could not upload PDF."); }
    finally { setUploading(false); }
  };

  // Resume-only analysis (no JD required)
  const handleResumeOnly = async () => {
    if (!resumeText || resumeText.trim().length < 20) { alert("Please add your resume text."); return; }
    if (!isPrivileged) {
      const count = getUsageCount();
      if (count >= FREE_LIMIT) { setShowLimitModal(true); return; }
    }

    setLoading(true);
    setResumeOnlyResult(null);
    startLoadingMessages();

    try {
      const res = await fetch(`${API_URL}/analyze-resume-only`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body: JSON.stringify({ resume_text: resumeText }),
      });
      const data = await res.json();
      if (res.status === 402) { setShowLimitModal(true); return; }
      if (!res.ok) { alert(data.detail || "Something went wrong."); return; }
      if (!isPrivileged) incrementUsage();
      setResumeOnlyResult(data);
      setTimeout(() => document.getElementById("resume-results")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch { alert("Could not connect to backend."); }
    finally { setLoading(false); stopLoadingMessages(); }
  };

  // Full analysis (resume + JD)
  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!resumeText || resumeText.trim().length < 20) { alert("Please add your resume text."); return; }
    if (!jobDescription?.trim()) { alert("Please add a job description for targeted analysis."); return; }
    if (!isPrivileged) {
      const count = getUsageCount();
      if (count >= FREE_LIMIT) { setShowLimitModal(true); return; }
    }

    setLoading(true);
    if (result) setPrevResult(result);
    setResult(null);
    startLoadingMessages();

    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription }),
      });
      const data = await res.json();
      if (res.status === 402) { setShowLimitModal(true); return; }
      if (res.status === 401) { alert("Session expired. Please sign in again."); return; }
      if (!res.ok) { alert(data.detail || "Something went wrong."); return; }
      if (!isPrivileged) incrementUsage();
      setResult(data);
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch { alert("Could not connect to backend."); }
    finally { setLoading(false); stopLoadingMessages(); }
  };

  return (
    <>
      {/* Usage indicator — only for free users */}
      {usageCount > 0 && !isPrivileged && (
        <div className="usage-bar">
          <span className="usage-text">
            {FREE_LIMIT - usageCount > 0
              ? `${FREE_LIMIT - usageCount} free analysis${FREE_LIMIT - usageCount === 1 ? "" : "es"} remaining`
              : "Free limit reached — upgrade for unlimited access"}
          </span>
          <div className="usage-dots">
            {Array.from({ length: FREE_LIMIT }).map((_, i) => (
              <span key={i} className={`usage-dot ${i < usageCount ? "used" : ""}`} />
            ))}
          </div>
        </div>
      )}

      {/* Upload */}
      <div className="card">
        <div className="card-title">Upload Resume</div>
        <div className="upload-zone">
          <input type="file" accept="application/pdf" onChange={handleFileChange} />
          <div className="upload-icon">↑</div>
          <div className="upload-zone-text">
            {uploading ? "Extracting text..." : "Drop PDF here or click to browse"}
          </div>
          <div className="upload-zone-sub">PDF only · Text auto-extracted</div>
          {uploadedFile && <div className="upload-status">✓ {uploadedFile} ready</div>}
        </div>
      </div>

      {/* Resume text */}
      <div className="card">
        <div className="card-title">Resume Text</div>
        <div className="form-group">
          <textarea
            rows={8}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume here, or upload a PDF above to auto-fill..."
          />
        </div>

        {/* Quick analyze button — no JD needed */}
        <button
          className="btn btn-md btn-brand"
          onClick={handleResumeOnly}
          disabled={loading || uploading || !resumeText.trim()}
          style={{ marginBottom: "12px" }}
        >
          {loading && !jobDescription ? <><span className="spinner" />{loadingMsg || "Analyzing..."}</> : "Quick Score — No Job Description Needed"}
        </button>
        <p style={{ fontSize: "12px", color: "var(--dk-text-muted)" }}>
          Get your resume quality score + suggested job titles instantly
        </p>
      </div>

      {/* Resume-only results */}
      {resumeOnlyResult && (
        <div id="resume-results">
          <ResumeOnlyResults data={resumeOnlyResult} />
        </div>
      )}

      {/* Tabs */}
      <div className="tab-bar">
        <button className={`tab ${activeTab === "analyze" ? "tab-active" : ""}`} onClick={() => setActiveTab("analyze")}>
          Targeted Analysis
        </button>
        <button className={`tab ${activeTab === "jobs" ? "tab-active" : ""}`} onClick={() => setActiveTab("jobs")}>
          Find Jobs
        </button>
      </div>

      {/* Targeted analysis tab */}
      {activeTab === "analyze" && (
        <form onSubmit={handleAnalyze}>
          <div className="card">
            <div className="card-title">Job Description (for targeted analysis)</div>
            <div className="form-group">
              <textarea
                rows={8}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description you're targeting for a detailed match analysis..."
              />
            </div>
            <button className="btn btn-lg btn-brand" type="submit" disabled={loading || uploading} style={{ width: "100%" }}>
              {loading && jobDescription ? <><span className="spinner" />{loadingMsg || "Analyzing..."}</> : "Analyze Against Job Description"}
            </button>
          </div>
        </form>
      )}

      {/* Job matching tab */}
      {activeTab === "jobs" && (
        <JobMatcher session={session} userMeta={userMeta} resumeText={resumeText} />
      )}

      {/* Targeted analysis results */}
      {result && (
        <div id="results">
          <ResultCard result={result} prevResult={prevResult} session={session} userMeta={userMeta} />
        </div>
      )}

      {/* Limit modal */}
      {showLimitModal && (
        <div className="modal-overlay" onClick={() => setShowLimitModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">🔒</div>
            <h3 className="modal-title">Free Limit Reached</h3>
            <p className="modal-body">
              You've used your <strong>3 free analyses</strong>.
            </p>
            <ul className="modal-features">
              <li>✓ Unlimited analyses with Pro</li>
              <li>✓ Smart job matching</li>
              <li>✓ Download improvement report</li>
              <li>✓ Version comparison</li>
              <li>✓ Cancel anytime</li>
            </ul>
            <p className="modal-terms">$9/mo · No refunds after usage</p>
            <button className="btn btn-lg btn-brand" style={{ width: "100%" }}
              onClick={() => { setShowLimitModal(false); window.location.href = "/pricing"; }}>
              Upgrade to Pro — $9/mo
            </button>
            <button className="modal-dismiss" onClick={() => setShowLimitModal(false)}>Maybe later</button>
          </div>
        </div>
      )}
    </>
  );
}

/* Resume-only results component */
function ResumeOnlyResults({ data }) {
  const score = data.overall_quality_score;
  const scoreColor = score >= 80 ? "var(--green)" : score >= 65 ? "var(--brand)" : score >= 45 ? "var(--yellow)" : "var(--red)";

  return (
    <div className="card">
      <div className="card-title accent-accent">Resume Quality Score</div>

      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
        <div className="main-score-circle" style={{ borderColor: scoreColor, width: "72px", height: "72px" }}>
          <span className="main-score-number" style={{ color: scoreColor, fontSize: "22px" }}>{score}</span>
          <span className="main-score-pct">/100</span>
        </div>
        <div>
          <div style={{ fontSize: "16px", fontWeight: "700", color: scoreColor }}>{data.verdict}</div>
          <div style={{ fontSize: "13px", color: "var(--dk-text-muted)" }}>{data.detected_domain} · {data.candidate_level}</div>
        </div>
      </div>

      {data.verdict_explanation && (
        <p style={{ fontSize: "14px", color: "var(--dk-text-label)", lineHeight: "1.6", marginBottom: "20px" }}>
          {data.verdict_explanation}
        </p>
      )}

      {/* Suggested job titles */}
      {data.suggested_job_titles?.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--dk-text-muted)", marginBottom: "10px" }}>
            Suggested Job Titles
          </div>
          <div className="tag-list">
            {data.suggested_job_titles.map((t, i) => (
              <span key={i} className="tag tag-qual-pref">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Key skills */}
      {data.key_skills_detected?.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--dk-text-muted)", marginBottom: "10px" }}>
            Key Skills Detected
          </div>
          <div className="tag-list">
            {data.key_skills_detected.map((s, i) => (
              <span key={i} className="tag tag-qual-met">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Score breakdown */}
      {data.scores && (
        <div className="score-bars" style={{ marginBottom: "20px" }}>
          {Object.entries(data.scores).map(([key, val]) => (
            <div key={key} className="score-bar-row">
              <span className="score-bar-label">{key.replace(/_/g, " ").replace("score", "").trim()}</span>
              <div className="score-bar-track">
                <div className="score-bar-fill" style={{ width: `${val}%`, background: val >= 75 ? "var(--green)" : val >= 50 ? "var(--brand)" : "var(--yellow)" }} />
              </div>
              <span className="score-bar-value" style={{ color: val >= 75 ? "var(--green)" : val >= 50 ? "var(--brand)" : "var(--yellow)" }}>{val}</span>
            </div>
          ))}
        </div>
      )}

      {/* Top improvements */}
      {data.top_improvements?.length > 0 && (
        <div>
          <div style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--dk-text-muted)", marginBottom: "10px" }}>
            Top Improvements
          </div>
          <ul className="dash-list">
            {data.top_improvements.map((item, i) => (
              <li key={i}><span className="dash-icon">→</span>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
