"use client";

import API_URL from "../lib/api";

function ScoreBar({ label, value }) {
  const color = value >= 75 ? "var(--green)" : value >= 50 ? "var(--yellow)" : "var(--red)";
  return (
    <div className="score-bar-row">
      <span className="score-bar-label">{label}</span>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="score-bar-value" style={{ color }}>{value}</span>
    </div>
  );
}

function Section({ title, accent, icon, children }) {
  return (
    <div className="card">
      <div className={`card-title ${accent || ""}`}>{icon && <span className="section-icon">{icon}</span>}{title}</div>
      {children}
    </div>
  );
}

function BulletList({ items, icon, iconColor }) {
  if (!items?.length) return <p className="empty-state">None identified.</p>;
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

function TagList({ items, variant }) {
  if (!items?.length) return <p className="empty-state">None identified.</p>;
  return (
    <div className="tag-list">
      {items.map((item, i) => <span key={i} className={`tag tag-${variant}`}>{item}</span>)}
    </div>
  );
}

export default function ResultCard({ result }) {
  if (!result) return null;

  const r = result;
  const score = r.overall_match_score;
  const scoreColor = score >= 75 ? "var(--green)" : score >= 50 ? "var(--yellow)" : "var(--red)";
  const scoreLabel = score >= 75 ? "Strong Match" : score >= 50 ? "Moderate Match" : "Needs Work";

  const rejectionRisk = score < 50
    ? "Your resume will likely be filtered out before reaching a recruiter."
    : score < 75
    ? "Your resume may pass ATS but could struggle with human review."
    : null;

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

  return (
    <div className="dashboard">

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <div className="domain-badge">🎯 {r.detected_domain}</div>
          <h2 className="dashboard-title">Analysis Results</h2>
        </div>
        <button className="btn-report" onClick={handleDownloadReport}>
          ⬇ Download Report
        </button>
      </div>

      {/* Rejection risk banner */}
      {rejectionRisk && (
        <div className="rejection-banner">
          <span className="rejection-icon">⚠</span>
          {rejectionRisk}
        </div>
      )}

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
          {r.top_fixes?.map((fix, i) => (
            <li key={i}>
              <span className="fix-number">{i + 1}</span>
              {fix}
            </li>
          ))}
        </ol>
      </div>

      {/* Strengths + Weaknesses */}
      <div className="two-col-cards">
        <Section title="Strengths" accent="green-accent" icon="✅">
          <BulletList items={r.strengths} icon="✓" iconColor="var(--green)" />
        </Section>
        <Section title="Weaknesses" accent="red-accent" icon="❌">
          <BulletList items={r.weaknesses} icon="✗" iconColor="var(--red)" />
        </Section>
      </div>

      {/* Honest feedback */}
      <Section title="Honest Feedback" accent="orange-accent" icon="💬">
        <BulletList items={r.brutal_feedback} icon="→" />
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
          <TagList items={r.missing_keywords_must_have} variant="danger" />
        </Section>
        <Section title="Nice-to-Have Keywords" accent="yellow-accent" icon="💡">
          <TagList items={r.missing_keywords_nice_to_have} variant="warning" />
        </Section>
      </div>

      {/* Recruiter concerns */}
      {r.recruiter_concerns?.length > 0 && (
        <Section title="Recruiter Concerns" accent="yellow-accent" icon="👀">
          <BulletList items={r.recruiter_concerns} icon="⚠" iconColor="var(--yellow)" />
        </Section>
      )}

      {/* Improved bullets */}
      {r.improved_bullets?.length > 0 && (
        <Section title="Improved Bullet Examples" icon="✍️">
          <BulletList items={r.improved_bullets} icon="•" />
        </Section>
      )}

      {/* Bottom download */}
      <div className="report-cta">
        <div>
          <div className="report-cta-title">Save Your Full Report</div>
          <div className="report-cta-sub">Includes all scores, fixes, keywords, and improved bullets.</div>
        </div>
        <button className="btn-primary" onClick={handleDownloadReport}>
          ⬇ Download Improvement Report
        </button>
      </div>

    </div>
  );
}
