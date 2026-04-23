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

function Section({ title, accent, icon, children, locked, onUpgrade }) {
  if (locked) {
    return (
      <div className="card card-locked">
        <div className={`card-title ${accent || ""}`}>
          {icon && <span className="section-icon">{icon}</span>}{title}
          <span className="pro-badge">Pro</span>
        </div>
        <div className="locked-overlay">
          <div className="locked-icon">🔒</div>
          <div className="locked-text">Available on Pro plan</div>
          <button className="btn-primary locked-btn" onClick={onUpgrade}>Upgrade to Pro — $9/mo</button>
        </div>
      </div>
    );
  }
  return (
    <div className="card">
      <div className={`card-title ${accent || ""}`}>
        {icon && <span className="section-icon">{icon}</span>}{title}
      </div>
      {children}
    </div>
  );
}

// Handles both old string[] and new {point, evidence, suggestion}[] formats
function EvidenceList({ items, icon, iconColor, fallback }) {
  if (!items?.length) return <p className="empty-state">{fallback || "None identified."}</p>;
  return (
    <ul className="evidence-list">
      {items.map((item, i) => {
        const isObj = typeof item === "object" && item !== null;
        const point = isObj ? item.point : item;
        const evidence = isObj ? item.evidence : null;
        const suggestion = isObj ? item.suggestion : null;
        return (
          <li key={i} className="evidence-item">
            <div className="evidence-point">
              <span className="dash-icon" style={iconColor ? { color: iconColor } : {}}>{icon || "→"}</span>
              {point}
            </div>
            {evidence && (
              <div className="evidence-snippet">
                <span className="evidence-label">Evidence:</span> {evidence}
              </div>
            )}
            {suggestion && (
              <div className="evidence-suggestion">
                <span className="evidence-label">How to improve:</span> {suggestion}
              </div>
            )}
          </li>
        );
      })}
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

function QualificationAnalysis({ qa }) {
  if (!qa) return null;
  return (
    <div className="qual-grid">
      {qa.required_met?.length > 0 && (
        <div className="qual-group">
          <div className="qual-label qual-met">✓ Required — Met</div>
          <div className="tag-list">
            {qa.required_met.map((s, i) => <span key={i} className="tag tag-qual-met">{s}</span>)}
          </div>
        </div>
      )}
      {qa.required_missing?.length > 0 && (
        <div className="qual-group">
          <div className="qual-label qual-missing">✗ Required — Missing</div>
          <div className="tag-list">
            {qa.required_missing.map((s, i) => <span key={i} className="tag tag-danger">{s}</span>)}
          </div>
        </div>
      )}
      {qa.preferred_met?.length > 0 && (
        <div className="qual-group">
          <div className="qual-label qual-met">✓ Preferred — Met</div>
          <div className="tag-list">
            {qa.preferred_met.map((s, i) => <span key={i} className="tag tag-qual-pref">{s}</span>)}
          </div>
        </div>
      )}
      {qa.preferred_missing?.length > 0 && (
        <div className="qual-group">
          <div className="qual-label qual-missing">✗ Preferred — Missing</div>
          <div className="tag-list">
            {qa.preferred_missing.map((s, i) => <span key={i} className="tag tag-warning">{s}</span>)}
          </div>
        </div>
      )}
      {qa.bonus_present?.length > 0 && (
        <div className="qual-group">
          <div className="qual-label qual-bonus">⭐ Bonus — Present</div>
          <div className="tag-list">
            {qa.bonus_present.map((s, i) => <span key={i} className="tag tag-bonus">{s}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

function VersionComparison({ result, prevResult, isPro, onUpgrade }) {
  if (!prevResult) return null;
  if (!isPro) {
    return (
      <div className="card card-locked">
        <div className="card-title accent-accent">
          <span className="section-icon">📊</span>Version Comparison
          <span className="pro-badge">Pro</span>
        </div>
        <div className="locked-overlay">
          <div className="locked-icon">🔒</div>
          <div className="locked-text">Track score improvements across versions with Pro</div>
          <button className="btn-primary locked-btn" onClick={onUpgrade}>Upgrade to Pro — $9/mo</button>
        </div>
      </div>
    );
  }
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

export default function ResultCard({ result, prevResult, session, userMeta }) {
  const [copied, setCopied] = useState(false);
  if (!result) return null;

  const r = result;
  const role = r._role || userMeta?.role || "free";
  const isPro = role === "paid" || role === "admin";
  const score = r.overall_match_score;
  const scoreColor = score >= 75 ? "var(--green)" : score >= 50 ? "var(--yellow)" : "var(--red)";

  // Use new verdict field, fall back to old screening_verdict
  const verdict = r.verdict || r.screening_verdict || "";
  const verdictExplanation = r.verdict_explanation || null;
  const internshipNote = r.internship_note && r.internship_note !== "null" ? r.internship_note : null;

  // Coach feedback — new field, fall back to old brutal_feedback
  const coachFeedback = r.coach_feedback || r.brutal_feedback || [];

  // Keywords — new fields, fall back to old
  const requiredMissing = r.missing_keywords_required || r.missing_keywords_must_have || [];
  const preferredMissing = r.missing_keywords_preferred || r.missing_keywords_nice_to_have || [];

  // Top fixes — handle both old string[] and new object[]
  const topFixes = r.top_fixes || [];

  // Improved bullets — handle both formats
  const improvedBullets = r.improved_bullets || [];

  function handleUpgrade() { window.location.href = "/pricing"; }

  async function handleDownloadReport() {
    if (!isPro) { handleUpgrade(); return; }
    try {
      const res = await fetch(`${API_URL}/download-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
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
    const text = `My resume scored ${score}/100 on ResumeAI Hub for ${r.detected_domain || "my target role"}. Try it free at resumeaihub.com`;
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
          <div className="domain-badge-row">
            <div className="domain-badge">🎯 {r.detected_domain}</div>
            {r.candidate_level && r.candidate_level !== "null" && (
              <div className="level-badge">{r.candidate_level}</div>
            )}
          </div>
          <h2 className="dashboard-title">Analysis Results</h2>
        </div>
        <div className="dashboard-actions">
          <button className="btn-share" onClick={handleShare}>
            {copied ? "✓ Copied!" : "Share Score"}
          </button>
          <button
            className={isPro ? "btn-report" : "btn-report btn-report-locked"}
            onClick={handleDownloadReport}
          >
            {isPro ? "⬇ Download Report" : "🔒 Download Report"}
          </button>
        </div>
      </div>

      {/* Internship note */}
      {internshipNote && (
        <div className="internship-note">
          🎓 {internshipNote}
        </div>
      )}

      {/* Version comparison */}
      {prevResult && (
        <VersionComparison result={result} prevResult={prevResult} isPro={isPro} onUpgrade={handleUpgrade} />
      )}

      {/* Verdict */}
      {verdict && (
        <div className="verdict-card" style={{
          background: score >= 85 ? "rgba(34,197,94,0.08)" : score >= 70 ? "rgba(99,102,241,0.08)" : score >= 55 ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)",
          borderColor: score >= 85 ? "rgba(34,197,94,0.25)" : score >= 70 ? "rgba(99,102,241,0.3)" : score >= 55 ? "rgba(245,158,11,0.25)" : "rgba(239,68,68,0.25)",
        }}>
          <div className="verdict-header">
            <span className="verdict-icon">{score >= 85 ? "✅" : score >= 70 ? "🔵" : score >= 55 ? "⚠️" : "❌"}</span>
            <div>
              <div className="verdict-label">Assessment</div>
              <div className="verdict-value" style={{
                color: score >= 85 ? "var(--green)" : score >= 70 ? "var(--accent)" : score >= 55 ? "var(--yellow)" : "var(--red)"
              }}>{verdict}</div>
            </div>
          </div>
          {verdictExplanation && (
            <p className="verdict-explanation">{verdictExplanation}</p>
          )}
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
            <div className="main-score-label" style={{ color: scoreColor }}>{verdict || "Score"}</div>
            <p className="main-score-sub">Overall match against the job description</p>
          </div>
        </div>
        <div className="score-bars">
          <ScoreBar label="ATS Keywords" value={r.ats_keyword_score} />
          <ScoreBar label="Domain Relevance" value={r.domain_relevance_score} />
          <ScoreBar label="Experience Alignment" value={r.experience_alignment_score} />
          <ScoreBar label="Impact & Results" value={r.impact_score} />
          {r.qualification_coverage_score > 0 && (
            <ScoreBar label="Qualification Coverage" value={r.qualification_coverage_score} />
          )}
        </div>
      </div>

      {/* Qualification analysis — always visible */}
      {r.qualification_analysis && (
        <div className="card">
          <div className="card-title">Qualification Coverage</div>
          <QualificationAnalysis qa={r.qualification_analysis} />
        </div>
      )}

      {/* TOP FIXES — always visible */}
      <div className="card card-priority">
        <div className="card-title accent-accent">
          <span className="section-icon">🔧</span>Top Fixes — Do These First
        </div>
        <ol className="fixes-list">
          {topFixes.length > 0
            ? topFixes.map((fix, i) => {
                const isObj = typeof fix === "object" && fix !== null;
                return (
                  <li key={i}>
                    <span className="fix-number">{isObj ? fix.priority : i + 1}</span>
                    <div className="fix-content">
                      <div className="fix-text">{isObj ? fix.fix : fix}</div>
                      {isObj && fix.why && <div className="fix-why">Why: {fix.why}</div>}
                      {isObj && fix.how && <div className="fix-how">How: {fix.how}</div>}
                    </div>
                  </li>
                );
              })
            : <li><span className="fix-number">✓</span><div className="fix-content">No critical fixes identified — your resume is well-aligned.</div></li>
          }
        </ol>
      </div>

      {/* Strengths + Weaknesses — always visible */}
      <div className="two-col-cards">
        <div className="card">
          <div className="card-title green-accent"><span className="section-icon">✅</span>Strengths</div>
          <EvidenceList items={r.strengths} icon="✓" iconColor="var(--green)"
            fallback="Your resume shows solid alignment in this area." />
        </div>
        <div className="card">
          <div className="card-title red-accent"><span className="section-icon">❌</span>Weaknesses</div>
          <EvidenceList items={r.weaknesses} icon="✗" iconColor="var(--red)"
            fallback="No major weaknesses identified for this role." />
        </div>
      </div>

      {/* Coach feedback — always visible */}
      <div className="card">
        <div className="card-title orange-accent"><span className="section-icon">💬</span>Coach Feedback</div>
        {coachFeedback.length > 0
          ? <ul className="dash-list">{coachFeedback.map((f, i) => (
              <li key={i}><span className="dash-icon">→</span>{f}</li>
            ))}</ul>
          : <p className="empty-state">Your resume is reasonably well-positioned for this role.</p>
        }
      </div>

      {/* Keywords — always visible */}
      <div className="two-col-cards">
        <div className="card">
          <div className="card-title red-accent"><span className="section-icon">🚨</span>Required Keywords Missing</div>
          <TagList items={requiredMissing} variant="danger"
            fallback="No required keyword gaps detected." />
        </div>
        <div className="card">
          <div className="card-title yellow-accent"><span className="section-icon">💡</span>Preferred Keywords Missing</div>
          <TagList items={preferredMissing} variant="warning"
            fallback="No preferred keyword gaps identified." />
        </div>
      </div>

      {/* Tailored summary — Pro only */}
      <Section title="Tailored Summary" icon="📝" locked={!isPro} onUpgrade={handleUpgrade}>
        {isPro && r.tailored_summary && <p className="result-text">{r.tailored_summary}</p>}
      </Section>

      {/* Improved bullets — Pro only */}
      <Section title="Improved Bullet Examples" icon="✍️" locked={!isPro} onUpgrade={handleUpgrade}>
        {isPro && improvedBullets.length > 0 && (
          <ul className="bullets-list">
            {improvedBullets.map((b, i) => {
              const isObj = typeof b === "object" && b !== null;
              return (
                <li key={i} className="bullet-item">
                  {isObj && b.original && (
                    <div className="bullet-before"><span className="bullet-label">Before:</span> {b.original}</div>
                  )}
                  <div className="bullet-after">
                    <span className="bullet-label">{isObj ? "After:" : "•"}</span> {isObj ? b.improved : b}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {/* Bottom CTA */}
      {isPro ? (
        <div className="report-cta">
          <div>
            <div className="report-cta-title">Save Your Full Report</div>
            <div className="report-cta-sub">All scores, evidence, fixes, keywords, and improved bullets.</div>
          </div>
          <button className="btn-primary" onClick={handleDownloadReport}>
            ⬇ Download Improvement Report
          </button>
        </div>
      ) : (
        <div className="report-cta report-cta-upgrade">
          <div>
            <div className="report-cta-title">Unlock Full Analysis with Pro</div>
            <div className="report-cta-sub">
              Tailored summary · Improved bullets · Download report · Version comparison
            </div>
            <div className="report-cta-terms">
              $9/mo · Cancel anytime · Access continues until billing period ends
            </div>
          </div>
          <button className="btn-primary" onClick={handleUpgrade}>Upgrade to Pro →</button>
        </div>
      )}

    </div>
  );
}
