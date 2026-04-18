"use client";

import ResumeForm from "../components/ResumeForm";

export default function Home() {
  return (
    <>
      <div className="hero">
        <div className="hero-badge">✦ AI Resume Optimizer</div>
        <h1>Land More Interviews with AI</h1>
        <p>
          Upload your resume, paste a job description, and get instant AI-powered
          analysis, tailored suggestions, and a polished PDF — in seconds.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">RAG</span>
            <span className="hero-stat-label">Powered</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">GPT-4o</span>
            <span className="hero-stat-label">Model</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">ATS</span>
            <span className="hero-stat-label">Optimized</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">PDF</span>
            <span className="hero-stat-label">Export</span>
          </div>
        </div>
      </div>

      <main className="main-content">
        <ResumeForm />
      </main>
    </>
  );
}
