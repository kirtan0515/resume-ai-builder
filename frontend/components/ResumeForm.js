"use client";

import { useState, useEffect, useRef } from "react";
import ResultCard from "./ResultCard";
import API_URL from "../lib/api";

const LOADING_MESSAGES = [
  "Detecting industry and domain...",
  "Checking ATS keyword match...",
  "Evaluating experience alignment...",
  "Analyzing impact and metrics...",
  "Generating recruiter feedback...",
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

export default function ResumeForm() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [prevResult, setPrevResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const msgInterval = useRef(null);

  useEffect(() => {
    setUsageCount(getUsageCount());
  }, []);

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

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!resumeText || resumeText.trim().length < 20) { alert("Please add your resume text."); return; }
    if (!jobDescription?.trim()) { alert("Please add a job description."); return; }

    const count = getUsageCount();
    if (count >= FREE_LIMIT) { setShowLimitModal(true); return; }

    setLoading(true);
    if (result) setPrevResult(result);
    setResult(null);
    startLoadingMessages();

    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.detail || "Something went wrong."); return; }
      const newCount = incrementUsage();
      setUsageCount(newCount);
      setResult(data);
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch { alert("Could not connect to backend."); }
    finally { setLoading(false); stopLoadingMessages(); }
  };

  const remaining = FREE_LIMIT - usageCount;

  return (
    <>
      {/* Usage indicator */}
      {usageCount > 0 && (
        <div className="usage-bar">
          <span className="usage-text">
            {remaining > 0
              ? `${remaining} free analysis${remaining === 1 ? "" : "es"} remaining today`
              : "Daily limit reached — upgrade for unlimited access"}
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
          <div className="upload-icon">📄</div>
          <div className="upload-zone-text">
            {uploading ? "Extracting text..." : "Drop PDF here or click to browse"}
          </div>
          <div className="upload-zone-sub">PDF only · Text auto-extracted</div>
          {uploadedFile && <div className="upload-status">✓ {uploadedFile} ready</div>}
        </div>
      </div>

      {/* Inputs */}
      <form onSubmit={handleAnalyze}>
        <div className="card">
          <div className="card-title">Resume & Job Description</div>
          <div className="form-group">
            <label className="form-label">Resume Text</label>
            <textarea
              rows={10}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume here, or upload a PDF above to auto-fill..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Job Description</label>
            <textarea
              rows={10}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description you're targeting..."
            />
          </div>
          <button className="btn-primary btn-analyze" type="submit" disabled={loading || uploading}>
            {loading
              ? <><span className="spinner" />{loadingMsg || "Analyzing..."}</>
              : "✦ Analyze My Resume"}
          </button>
        </div>
      </form>

      {/* Results */}
      {result && (
        <div id="results">
          <ResultCard result={result} prevResult={prevResult} />
        </div>
      )}

      {/* Limit modal */}
      {showLimitModal && (
        <div className="modal-overlay" onClick={() => setShowLimitModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">🚀</div>
            <h3 className="modal-title">Daily Limit Reached</h3>
            <p className="modal-body">
              You've used your {FREE_LIMIT} free analyses for today.
              Upgrade to Pro for unlimited resume analysis, priority processing, and advanced insights.
            </p>
            <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }}
              onClick={() => setShowLimitModal(false)}>
              Upgrade to Pro — Coming Soon
            </button>
            <button className="modal-dismiss" onClick={() => setShowLimitModal(false)}>
              Maybe later
            </button>
          </div>
        </div>
      )}
    </>
  );
}
