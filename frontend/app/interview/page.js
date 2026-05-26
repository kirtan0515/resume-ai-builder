"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";
import API_URL from "../../lib/api";

export default function InterviewPage() {
  const [session, setSession] = useState(null);
  const [userMeta, setUserMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [questions, setQuestions] = useState(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [scoring, setScoring] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState(null);

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
    if (!resumeText.trim() || !jobDescription.trim()) { alert("Both resume and job description are required."); return; }
    setGenerating(true);
    setQuestions(null);
    try {
      const res = await fetch(`${API_URL}/interview-prep`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription }),
      });
      if (res.status === 402) { window.location.href = "/pricing"; return; }
      if (!res.ok) { alert("Failed to generate questions."); return; }
      const data = await res.json();
      setQuestions(data);
    } catch { alert("Could not connect."); }
    finally { setGenerating(false); }
  }

  async function handleScoreAnswer() {
    if (!userAnswer.trim()) { alert("Type your answer first."); return; }
    setScoring(true);
    setAnswerFeedback(null);
    try {
      const res = await fetch(`${API_URL}/score-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          question: questions.questions[currentQ].question,
          answer: userAnswer,
          job_description: jobDescription,
        }),
      });
      if (!res.ok) { alert("Failed to score."); return; }
      setAnswerFeedback(await res.json());
    } catch { alert("Could not connect."); }
    finally { setScoring(false); }
  }

  if (loading) return <div className="dashboard-page"><Navbar dark /><div style={{ textAlign: "center", padding: "100px" }}><span className="spinner" style={{ width: "24px", height: "24px", borderWidth: "3px" }} /></div></div>;

  if (!session) return <div className="dashboard-page"><Navbar dark /><div className="main-content"><div className="card signin-prompt"><h3 className="signin-prompt-title">Sign in for Interview Prep</h3><a href="/dashboard" className="btn btn-md btn-brand" style={{ margin: "16px auto 0" }}>Sign In</a></div></div></div>;

  return (
    <div className="dashboard-page">
      <Navbar dark />
      <div className="dashboard-hero">
        <h1>AI Interview Prep</h1>
        <p>Get personalized questions and practice answers based on your resume and target role.</p>
      </div>

      <main className="main-content">
        {!isPro && (
          <div className="card" style={{ textAlign: "center", padding: "32px" }}>
            <p style={{ color: "var(--dk-text-muted)", marginBottom: "16px" }}>Interview prep is a Pro feature.</p>
            <a href="/pricing" className="btn btn-md btn-brand">Upgrade to Pro — $9/mo</a>
          </div>
        )}

        {isPro && !questions && (
          <form onSubmit={handleGenerate}>
            <div className="card">
              <div className="card-title">Generate Interview Questions</div>
              <div className="form-group">
                <label className="form-label">Your Resume</label>
                <textarea rows={6} value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Paste your resume text..." />
              </div>
              <div className="form-group">
                <label className="form-label">Job Description</label>
                <textarea rows={6} value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the job description..." />
              </div>
              <button className="btn btn-lg btn-brand" type="submit" disabled={generating} style={{ width: "100%" }}>
                {generating ? <><span className="spinner" /> Generating questions...</> : "Generate Interview Questions"}
              </button>
            </div>
          </form>
        )}

        {isPro && questions && !practiceMode && (
          <div>
            <div className="card">
              <div className="card-title accent-accent">Interview Questions — {questions.role_summary}</div>
              <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
                <button className="btn btn-md btn-brand" onClick={() => { setPracticeMode(true); setCurrentQ(0); setUserAnswer(""); setAnswerFeedback(null); }}>
                  Start Practice Mode
                </button>
                <button className="btn btn-md btn-secondary" onClick={() => setQuestions(null)}>
                  Generate New Questions
                </button>
              </div>

              {questions.questions.map((q, i) => (
                <div key={i} style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: i < questions.questions.length - 1 ? "1px solid var(--dk-border)" : "none" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "8px" }}>
                    <span style={{ background: "var(--brand)", color: "white", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", flexShrink: 0 }}>{i + 1}</span>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: "600", color: "var(--dk-text)", marginBottom: "4px" }}>{q.question}</div>
                      <div style={{ fontSize: "12px", color: "var(--brand)", fontWeight: "600", textTransform: "uppercase", marginBottom: "6px" }}>{q.type}</div>
                      <div style={{ fontSize: "13px", color: "var(--dk-text-muted)", marginBottom: "8px" }}><strong>Why asked:</strong> {q.why_asked}</div>
                      <div style={{ fontSize: "13px", color: "var(--dk-text-label)", background: "var(--dk-surface-2)", padding: "12px", borderRadius: "8px", border: "1px solid var(--dk-border)" }}>
                        <strong>Suggested answer:</strong> {q.suggested_answer}
                      </div>
                      {q.key_points?.length > 0 && (
                        <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {q.key_points.map((p, j) => (
                            <span key={j} className="tag tag-qual-pref">{p}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {questions.tips?.length > 0 && (
              <div className="card">
                <div className="card-title green-accent">Tips for This Interview</div>
                <ul className="dash-list">
                  {questions.tips.map((t, i) => <li key={i}><span className="dash-icon">→</span>{t}</li>)}
                </ul>
              </div>
            )}

            {questions.red_flags_to_avoid?.length > 0 && (
              <div className="card">
                <div className="card-title red-accent">Avoid Saying</div>
                <ul className="dash-list">
                  {questions.red_flags_to_avoid.map((r, i) => <li key={i}><span className="dash-icon" style={{ color: "var(--red)" }}>✗</span>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Practice mode */}
        {isPro && questions && practiceMode && (
          <div className="card">
            <div className="card-title accent-accent">Practice Mode — Question {currentQ + 1} of {questions.questions.length}</div>

            <div style={{ fontSize: "17px", fontWeight: "600", color: "var(--dk-text)", marginBottom: "16px" }}>
              {questions.questions[currentQ].question}
            </div>

            <textarea
              rows={5}
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              placeholder="Type your answer here... then click Score to get feedback"
              style={{ marginBottom: "12px" }}
            />

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
              <button className="btn btn-md btn-brand" onClick={handleScoreAnswer} disabled={scoring}>
                {scoring ? <><span className="spinner" /> Scoring...</> : "Score My Answer"}
              </button>
              <button className="btn btn-md btn-secondary" onClick={() => { setCurrentQ(Math.min(currentQ + 1, questions.questions.length - 1)); setUserAnswer(""); setAnswerFeedback(null); }}>
                Next Question →
              </button>
              <button className="btn btn-md btn-secondary" onClick={() => setPracticeMode(false)}>
                Exit Practice
              </button>
            </div>

            {answerFeedback && (
              <div style={{ background: "var(--dk-surface-2)", border: "1px solid var(--dk-border)", borderRadius: "var(--radius)", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "24px", fontWeight: "800", color: answerFeedback.score >= 75 ? "var(--green)" : answerFeedback.score >= 50 ? "var(--brand)" : "var(--yellow)" }}>
                    {answerFeedback.score}/100
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--dk-text-label)" }}>{answerFeedback.verdict}</span>
                </div>

                {answerFeedback.strengths?.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--green)", marginBottom: "6px" }}>STRENGTHS</div>
                    {answerFeedback.strengths.map((s, i) => <div key={i} style={{ fontSize: "13px", color: "var(--dk-text-label)", marginBottom: "4px" }}>✓ {s}</div>)}
                  </div>
                )}

                {answerFeedback.improvements?.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--yellow)", marginBottom: "6px" }}>IMPROVEMENTS</div>
                    {answerFeedback.improvements.map((s, i) => <div key={i} style={{ fontSize: "13px", color: "var(--dk-text-label)", marginBottom: "4px" }}>→ {s}</div>)}
                  </div>
                )}

                {answerFeedback.better_version && (
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--brand)", marginBottom: "6px" }}>STRONGER VERSION</div>
                    <div style={{ fontSize: "13px", color: "var(--dk-text-label)", lineHeight: "1.6" }}>{answerFeedback.better_version}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
