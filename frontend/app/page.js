"use client";

import ResumeForm from "../components/ResumeForm";

export default function Home() {
  return (
    <main className="container">
      <h1>🚀 Resume AI Builder</h1>
      <p>Paste your resume and a job description to get AI-powered suggestions.</p>
      <ResumeForm />
    </main>
  );
}