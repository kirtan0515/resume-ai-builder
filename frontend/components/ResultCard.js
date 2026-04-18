"use client";

import { useState } from "react";
import API_URL from "../lib/api";

function ScoreBar({ label, value, prevValue }) {
  const color = value >= 75 ? "var(--green)" : value >= 50 ? "var(--yellow)" : "var(--red)";
  const diff = prevValue !== undefined ? value - prevValue : null;
  return (
    <div className="score-bar-row">
      <span className="score-bar-label">{label}</span>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="score-bar-value" style={{ color }}>{value}</span>
      {diff !== null && diff !== 0 && (
        <span className={`score-diff ${diff > 0 ? "positive" : "negative"}`}>
          {diff > 0 ? `+${diff}` : diff}
        </span>
      )}
    </div>
  );
}

function Section({ title, accent, icon, children }) {
  return (
    <div className="card">
      <div className={`card-title ${accent || ""}`}>
        {icon && <span className="section-icon">{icon}</span>}{title}
      </div>
      {children}
    </div>
  );
}

function BulletList({ items, icon, iconColor, fallback }) {
  if (!items?.length) return <p className="empty-state">{fallback || "None identified."}</p>;
  return (
    <ul className="dash-list">
      {items.map((item, i) => (
        <li key={i}>
          <span className="dash-icon" style={iconColor ? { color: iconColor } : {}}>{icon || "→"}</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function TagList({ items, variant, fallback }) {
  if (!items?.length) return <p className="empty-state">{fallback || "None identified."}</p>;
  return (
    <div className="tag-list">
      {items.map((item, i) => <span key={i} className={`tag tag-${variant}`}>{item}</span>)}
    </div>
  );
}

function ScreeningVerdict({ verdict, reasons }) {
  if (!verdict) return null;
  const isGood = verdict === "Likely Shortlisted";
  const isMid = verdict === "Borderline";
  const color = isGood ? "var(--green)" : isMid ? "var(--yellow)" : "var(--red)";
  const bg = isGood ? "rgba(34,197,94,0.08)" : isMid ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)";
  const border = isGood ? "rgba(34,197,94,0.25)" : isMid ? "rgba(245,158,11,0.25)" : "rgba(239,68,68,0.25)";
  const icon = isGood ? "✅" : isMid ? "⚠️" : "❌";

  return (
    <div className="verdict-card" style={{ background: bg, borderColor: border }}>
      <div className="verdict-header">
        <span className="verdict-icon">{icon}</span>
        <div>
          <div className="verdict-label">Screening Verdict</div>
          <div className="verdict-value" style={{ color }}>{verdict}</div>
        </div>
      </div>
      {reasons?.length > 0 && (
        <ul className="verdict-reasons">
          {reasons.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      )}
    </div>
  );
}

function VersionComparison({ result, prevResult }) {
  if (!prevResult) return null;
  const diff = result.overall_match_score - prevResult.overall_match_score;
  const color = diff > 0 ? "var(--green)" : diff < 0 ? "var(--red)" : "var(--text-muted)";
  const arrow = diff > 0 ? "↑" : diff < 0 ? "↓" : "→";

  return (
    <div className="version-compare">
      <div className="version-compare-title">📊 Version Comparison</div>
      <div className="version-compare-scores">
        <div className="version-score old">{prevResult.overall_match_score}<span>/100</span></div>
        <div className="version-arrow" style={{ color }}>{arrow}</div>
        <div className="version-score new">{result.overall_match_score}<span>/100</span></div>
      </div>
      <div className="version-diff" style={{ color }}>
        {diff === 0 ? "No change" : `Score ${diff > 0 ? "improved" : "dropped"} by ${Math.abs(diff)} points`}
      </div>
      <div className="version-bars">
        <ScoreBar label="ATS Keywords" value={result.ats_keyword_score} prevValue={prevResult.ats_keyword_score} />
        <ScoreBar label="Experience" value={result.experience_alignment_score} prevValue={prevResult.experience_alignment_score} />
        <ScoreBar label="Impact" value={result.impact_score} prevValue={prevResult.impact_score} />
      </div>
    </div>
  );
}

export default function ResultCard({ result, prevResult }) {
  const [copied, setCopied] = useState(false);
  if (!result) return null;

  const r = result;
  const score = r.overall_match_score;
  const scoreColor = score >= 75 ? "var(--green)" : score >= 50 ? "var(--yellow)" : "var(--red)";
  const scoreLabel = score >= 75 ? "Strong Match" : score >= 50 ? "Moderate Match" : "Needs Work";

  async function handleDownloadReport() {
    try {
      const res = await fetch(`${API_URL}/download-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis: result }),
      });
      if (!res.ok) { alert("Failed to generate report."); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume-improvement-report.txt";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert("Could not connect to backend."); }
  }

  function handleShare() {
    const text = `My resume scored ${score}/100 on ResumeAI Hub — ${r.screening_verdict || "analyzed"} for ${r.detected_domain || "my target role"}. Check it out at resumeaihub.com`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="dashboard">

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <div className="domain-badge">🎯 {r.detected_domain}</div>
          <h2 className="dashboard-title">Analysis Results</h2>
        </div>
        <div className="dashboard-actions">
          <button className="btn-share" onClick={handleShare}>
            {copied ? "✓ Copied!" : "Share Score"}
          </button>
          <button className="btn-report" onClick={handleDownloadReport}>
            ⬇ Download Report
          </button>
        </div>
      </div>

      {/* Version comparison */}
      {prevResult && <VersionComparison result={result} prevResult={prevResult} />}

      {/* Screening verdict */}
      <ScreeningVerdict verdict={r.screening_verdict} reasons={r.verdict_reasons} />

      {/* Score overview */}
      <div className="card score-overview">
        <div className="main-score-block">
          <div className="main-score-circle" style={{ borderColor: scoreColor }}>
            <span className="main-score-number" style={{ color: scoreColor }}>{score}</span>
            <span className="main-score-pct">/ 100</span>
          </div>
          <div>
            <div className="main-score-label" style={{ color: scoreColor }}>{scoreLabel}</div>
            <p className="main-score-sub">Overall match against the job description</p>
          </div>
        </div>
        <div className="score-bars">
          <ScoreBar label="ATS Keywords" value={r.ats_keyword_score} />
          <ScoreBar label="Domain Relevance" value={r.domain_relevance_score} />
          <ScoreBar label="Experience Alignment" value={r.experience_alignment_score} />
          <ScoreBar label="Impact & Results" value={r.impact_score} />
        </div>
      </div>

      {/* TOP FIXES — hero card */}
      <div className="card card-priority">
        <div className="card-title accent-accent">
          <span className="section-icon">🔧</span>
          Top Fixes — Do These First
        </div>
        <ol className="fixes-list">
          {r.top_fixes?.length
            ? r.top_fixes.map((fix, i) => (
                <li key={i}><span className="fix-number">{i + 1}</span>{fix}</li>
              ))
            : <li><span className="fix-number">✓</span>No critical fixes identified — your resume is well-aligned.</li>
          }
        </ol>
      </div>

      {/* Strengths + Weaknesses */}
      <div className="two-col-cards">
        <Section title="Strengths" accent="green-accent" icon="✅">
          <BulletList items={r.strengths} icon="✓" iconColor="var(--green)"
            fallback="Your resume shows solid alignment in this area." />
        </Section>
        <Section title="Weaknesses" accent="red-accent" icon="❌">
          <BulletList items={r.weaknesses} icon="✗" iconColor="var(--red)"
            fallback="No major weaknesses identified for this role." />
        </Section>
      </div>

      {/* Honest feedback */}
      <Section title="Honest Feedback" accent="orange-accent" icon="💬">
        <BulletList items={r.brutal_feedback} icon="→"
          fallback="Your resume is reasonably well-positioned for this role." />
      </Section>

      {/* Tailored summary */}
      {r.tailored_summary && (
        <Section title="Tailored Summary" icon="📝">
          <p className="result-text">{r.tailored_summary}</p>
        </Section>
      )}

      {/* Keywords */}
      <div className="two-col-cards">
        <Section title="Must-Have Keywords Missing" accent="red-accent" icon="🚨">
          <TagList items={r.missing_keywords_must_have} variant="danger"
            fallback="No major keyword gaps detected for this role." />
        </Section>
        <Section title="Nice-to-Have Keywords" accent="yellow-accent" icon="💡">
          <TagList items={r.missing_keywords_nice_to_have} variant="warning"
            fallback="No additional keyword gaps identified." />
        </Section>
      </div>

      {/* Recruiter concerns */}
      <Section title="Recruiter Concerns" accent="yellow-accent" icon="👀">
        <BulletList items={r.recruiter_concerns} icon="⚠" iconColor="var(--yellow)"
          fallback="No significant recruiter concerns identified." />
      </Section>

      {/* Improved bullets */}
      {r.improved_bullets?.length > 0 && (
        <Section title="Improved Bullet Examples" icon="✍️">
          <BulletList items={r.improved_bullets} icon="•" />
        </Section>
      )}

      {/* Bottom CTA */}
      <div className="report-cta">
        <div>
          <div className="report-cta-title">Save Your Full Report</div>
          <div className="report-cta-sub">All scores, verdict, fixes, keywords, and improved bullets.</div>
        </div>
        <button className="btn-primary" onClick={handleDownloadReport}>
          ⬇ Download Improvement Report
        </button>
      </div>

    </div>
  );
}
