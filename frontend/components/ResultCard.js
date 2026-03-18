export default function ResultCard({ result }) {
  if (!result) return null;

  return (
    <div className="result-card">
      <h2>Tailored Summary</h2>
      <p>{result.tailored_summary}</p>

      <h2>Improved Bullet Points</h2>
      <ul>
        {result.improved_bullets?.map((bullet, index) => (
          <li key={index}>{bullet}</li>
        ))}
      </ul>

      <h2>Missing Skills</h2>
      <ul>
        {result.missing_skills?.map((skill, index) => (
          <li key={index}>{skill}</li>
        ))}
      </ul>

      <h2>Match Score</h2>
      <p style={{ fontSize: "28px", fontWeight: "bold" }}>
        {result.match_score}%</p>
    </div>
  );
}