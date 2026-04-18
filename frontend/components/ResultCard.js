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

function TagList({ items, variant = "neutral" }) {
  if (!items?.length) return <span className="tag-empty">None identified</span>;
  return (
    <div className="tag-list">
      {items.map((item, i) => (
        <span key={i} className={`tag tag-${variant}`}>{item}</span>
      ))}
    </div>
  );
}

function ListItems({ items, icon = "→" }) {
  if (!items?.length) return null;
  return (
    <ul className="dash-list">
      {items.map((item, i) => (
        <li key={i}><span className="dash-icon">{icon}</span>{item}</li>
      ))}
    </ul>
  );
}

export default function ResultCard({ result }) {
  if (!result) return null;

  const r = result;
  const mainScore = r.overall_match_score;
  const scoreColor = mainScore >= 75 ? "var(--green)" : mainScore >= 50 ? "var(--yellow)" : "var(--red)";
  const scoreLabel = mainScore >= 75 ? "Strong Match" : mainScore >= 50 ? "Moderate Match" : "Needs Work";

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
    } catch {
      alert("Could not connect to backend.");
    }
  }

  return (
    <div className="dashboard">

      {/* Header row */}
      <div className="dashboard-header">
        <div>
          <div className="domain-badge">{r.detected_domain}</div>
          <h2 className="dashboard-title">Analysis Results</h2>
        </div>
        <button className="btn-report" onClick={handleDownloadReport}>
          ⬇ Download Report
        </button>
      </div>

      {/* Score overview */}
      <div className="card score-overview">
        <div className="main-score-block">
          <div className="main-score-circle" style={{ borderColor: scoreColor }}>
            <span className="main-score-number" style={{ color: scoreColor }}>{mainScore}</span>
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

      {/* Two col: strengths + weaknesses */}
      <div className="two-col-cards">
        <div className="card">
          <div className="card-title green-accent">Strengths</div>
          <ListItems items={r.strengths} icon="✓" />
        </div>
        <div className="card">
          <div className="card-title red-accent">Weaknesses</div>
          <ListItems items={r.weaknesses} icon="✗" />
        </div>
      </div>

      {/* Brutal feedback */}
      <div className="card">
        <div className="card-title orange-accent">Honest Feedback</div>
        <ListItems items={r.brutal_feedback} icon="→" />
      </div>

      {/* Tailored summary */}
      {r.tailored_summary && (
        <div className="card">
          <div className="card-title">Tailored Summary</div>
          <p className="result-text">{r.tailored_summary}</p>
        </div>
      )}

      {/* Keywords */}
      <div className="two-col-cards">
        <div className="card">
          <div className="card-title red-accent">Must-Have Keywords Missing</div>
          <TagList items={r.missing_keywords_must_have} variant="danger" />
        </div>
        <div className="card">
          <div className="card-title yellow-accent">Nice-to-Have Keywords Missing</div>
          <TagList items={r.missing_keywords_nice_to_have} variant="warning" />
        </div>
      </div>

      {/* Recruiter concerns */}
      {r.recruiter_concerns?.length > 0 && (
        <div className="card">
          <div className="card-title yellow-accent">Recruiter Concerns</div>
          <ListItems items={r.recruiter_concerns} icon="⚠" />
        </div>
      )}

      {/* Top fixes */}
      <div className="card">
        <div className="card-title accent-accent">Top Fixes — Do These First</div>
        <ol className="fixes-list">
          {r.top_fixes?.map((fix, i) => (
            <li key={i}><span className="fix-number">{i + 1}</span>{fix}</li>
          ))}
        </ol>
      </div>

      {/* Improved bullets */}
      {r.improved_bullets?.length > 0 && (
        <div className="card">
          <div className="card-title">Improved Bullet Examples</div>
          <ListItems items={r.improved_bullets} icon="•" />
        </div>
      )}

    </div>
  );
}
