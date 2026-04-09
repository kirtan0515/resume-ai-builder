"use client";

export default function ResultCard({ result }) {
  if (!result?.analysis) return null;

  const { tailored_summary, improved_bullets, missing_skills, match_score } = result.analysis;

  const scoreClass =
    match_score >= 75 ? "score-green" : match_score >= 50 ? "score-yellow" : "score-red";

  return (
    <div className="result-card">
      <h2>Analysis Results</h2>

      <div className="score-row">
        <span className="score-label">Match Score</span>
        <span className={`score-value ${scoreClass}`}>{match_score}%</span>
      </div>

      {tailored_summary && (
        <div className="result-section">
          <h3>Tailored Summary</h3>
          <p>{tailored_summary}</p>
        </div>
      )}

      {improved_bullets?.length > 0 && (
        <div className="result-section">
          <h3>Improved Bullet Points</h3>
          <ul>
            {improved_bullets.map((bullet, i) => (
              <li key={i}>{bullet}</li>
            ))}
          </ul>
        </div>
      )}

      {missing_skills?.length > 0 && (
        <div className="result-section">
          <h3>Missing Skills / Keywords</h3>
          <div className="skill-tags">
            {missing_skills.map((skill, i) => (
              <span key={i} className="skill-tag">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}