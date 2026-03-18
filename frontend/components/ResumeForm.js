"use client";

import { useState } from "react";
import ResultCard from "./ResultCard";

export default function ResumeForm() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

const handleAnalyze = async (e) => {
  e.preventDefault();
  setLoading(true);
  setResult(null);

  try {
    const response = await fetch("http://127.0.0.1:8001/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        resume_text: resumeText,
        job_description: jobDescription
      })
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
      <form className="form" onSubmit={handleAnalyze}>
        <label>Resume Text</label>
        <textarea
          rows="12"
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your resume text here..."
        />

        <label>Job Description</label>
        <textarea
          rows="12"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here..."
        />

        <button type="submit" disabled={loading}>
          {loading ? "⏳ Analyzing..." : "Analyze Resume"}
        </button>
      </form>

      <ResultCard result={result} />
    </>
  );
}