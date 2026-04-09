"use client";

import { useState } from "react";
import ResultCard from "./ResultCard";
import ResumeBuilder from "./ResumeBuilder";

export default function ResumeForm() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);

    try {
      const response = await fetch("http://127.0.0.1:8001/upload-resume", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("UPLOAD RESPONSE:", data);

      if (!response.ok) {
        alert(data.detail || "Failed to upload resume.");
        return;
      }

      if (data.resume_text && data.resume_text.trim()) {
        setResumeText(data.resume_text);
        alert("Resume PDF uploaded and text extracted successfully.");
      } else {
        alert("PDF uploaded, but no text could be extracted.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Could not upload PDF.");
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();

    console.log("RESUME TEXT BEFORE ANALYZE:", resumeText);

    if (!resumeText || resumeText.trim().length < 20) {
      alert("Please add your resume text before analyzing.");
      return;
    }

    if (!jobDescription || !jobDescription.trim()) {
      alert("Please add a job description before analyzing.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8001/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: jobDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Backend error:", data);
        alert(data.detail || "Something went wrong.");
        return;
      }

      setResult(data);
    } catch (error) {
      console.error("Analyze error:", error);
      alert("Could not connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="upload-card">
        <label className="upload-label">Upload Resume PDF</label>
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        {uploading && <p>Uploading PDF...</p>}
      </div>

      <form className="form" onSubmit={handleAnalyze}>
        <label>Resume Text</label>
        <textarea
          rows="12"
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your resume text here or upload a PDF..."
        />

        <label>Job Description</label>
        <textarea
          rows="12"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here..."
        />

        <button type="submit" disabled={loading || uploading}>
          {loading ? "⏳ Analyzing..." : "Analyze Resume"}
        </button>
      </form>

      <ResultCard result={result} />
      {result && <ResumeBuilder aiResult={result} />}
    </>
  );
}