"use client";

function ScoreRing({ score }) {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 75 ? "Strong Match" : score >= 50 ? "Moderate Match" : "Weak Match";
  const r = 34;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="score-container">
      <div className="score-ring">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#2a2d3e" strokeWidth="7" />
          <circle
            cx="40" cy="40" r={r} fill="none"
            stroke={color} strokeWidth="7"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="score-ring-text" style={{ color }}>{score}%</div>
      </div>
      <div className="score-info">
        <h3 style={{ color }}>{label}</h3>
        <p>Your resume matches {score}% of the job requirements. {score < 75 ? "See suggestions below to improve." : "Great alignment with this role."}</p>
      </div>
    </div>
  );
}

export default function ResultCard({ result }) {
  if (!result?.analysis) return null;
  const { tailored_summary, improved_bullets, missing_skills, match_score } = result.analysis;

  return (
    <div className="card">
      <div className="card-title">Step 3 — AI Analysis Results</div>

      <ScoreRing score={match_score} />

      {tailored_summary && (
        <div className="result-section">
          <div className="result-section-title">Tailored Summary</div>
          <p className="result-text">{tailored_summary}</p>
        </div>
      )}

      {improved_bullets?.length > 0 && (
        <div className="result-section">
          <div className="result-section-title">Improved Bullet Points</div>
          <ul className="result-bullets">
            {improved_bullets.map((bullet, i) => (
              <li key={i}>{bullet}</li>
            ))}
          </ul>
        </div>
      )}

      {missing_skills?.length > 0 && (
        <div className="result-section">
          <div className="result-section-title">Missing Skills / Keywords</div>
          <div className="skill-tags">
            {missing_skills.map((skill, i) => (
              <span key={i} className="skill-tag">{skill}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
