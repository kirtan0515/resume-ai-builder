"use client";

import { useState } from "react";
import ResultCard from "./ResultCard";
import API_URL from "../lib/api";

export default function ResumeForm() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

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
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.detail || "Something went wrong."); return; }
      setResult(data);
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch { alert("Could not connect to backend."); }
    finally { setLoading(false); }
  };

  return (
    <>
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

      {/* Inputs + Analyze */}
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
            {loading ? <><span className="spinner" /> Analyzing...</> : "✦ Analyze My Resume"}
          </button>
        </div>
      </form>

      {/* Results */}
      {result && (
        <div id="results">
          <ResultCard result={result} />
        </div>
      )}
    </>
  );
}
