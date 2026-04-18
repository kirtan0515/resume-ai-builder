"use client";

import { useEffect, useState } from "react";
import API_URL from "../lib/api";

const emptyExperience = () => ({ title: "", company: "", dates: "", bullets: [""] });
const emptyProject = () => ({ title: "", tech: "", bullets: [""] });
const emptyEducation = () => ({ school: "", degree: "", dates: "" });

export default function ResumeBuilder({ aiResult, resumeData }) {
  const [name, setName] = useState(resumeData?.name || "");
  const [contact, setContact] = useState(
    resumeData?.contact || { email: "", phone: "", location: "", linkedin: "", github: "" }
  );
  const [summary, setSummary] = useState(resumeData?.summary || aiResult?.tailored_summary || "");
  const [skills, setSkills] = useState(resumeData?.skills?.join(", ") || "");
  const [experience, setExperience] = useState(
    resumeData?.experience?.length
      ? resumeData.experience
      : aiResult?.improved_bullets?.length
      ? [{ title: "", company: "", dates: "", bullets: aiResult.improved_bullets }]
      : [emptyExperience()]
  );
  const [projects, setProjects] = useState(
    resumeData?.projects?.length ? resumeData.projects : [emptyProject()]
  );
  const [education, setEducation] = useState(
    resumeData?.education?.length ? resumeData.education : [emptyEducation()]
  );
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!resumeData) return;
    setName(resumeData.name || "");
    setContact(resumeData.contact || { email: "", phone: "", location: "", linkedin: "", github: "" });
    setSummary(resumeData.summary || aiResult?.tailored_summary || "");
    setSkills(resumeData.skills?.join(", ") || "");
    setExperience(
      resumeData.experience?.length
        ? resumeData.experience
        : aiResult?.improved_bullets?.length
        ? [{ title: "", company: "", dates: "", bullets: aiResult.improved_bullets }]
        : [emptyExperience()]
    );
    setProjects(resumeData.projects?.length ? resumeData.projects : [emptyProject()]);
    setEducation(resumeData.education?.length ? resumeData.education : [emptyEducation()]);
  }, [resumeData, aiResult]);

  function updateListItem(setter, index, field, value) {
    setter((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function updateBullet(setter, itemIndex, bulletIndex, value) {
    setter((prev) =>
      prev.map((item, i) => {
        if (i !== itemIndex) return item;
        const bullets = [...item.bullets];
        bullets[bulletIndex] = value;
        return { ...item, bullets };
      })
    );
  }

  function addBullet(setter, itemIndex) {
    setter((prev) =>
      prev.map((item, i) => (i === itemIndex ? { ...item, bullets: [...item.bullets, ""] } : item))
    );
  }

  function removeBullet(setter, itemIndex, bulletIndex) {
    setter((prev) =>
      prev.map((item, i) => {
        if (i !== itemIndex) return item;
        const bullets = item.bullets.filter((_, bi) => bi !== bulletIndex);
        return { ...item, bullets: bullets.length ? bullets : [""] };
      })
    );
  }

  async function handleDownload() {
    if (!name.trim()) { alert("Please enter your name."); return; }
    if (!contact.email.trim()) { alert("Please enter your email."); return; }

    const payload = {
      name,
      contact,
      summary,
      skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      experience: experience
        .filter((e) => e.title || e.company || e.dates || e.bullets.some(Boolean))
        .map((e) => ({ ...e, bullets: e.bullets.map((b) => b.trim()).filter(Boolean) })),
      projects: projects
        .filter((p) => p.title || p.tech || p.bullets.some(Boolean))
        .map((p) => ({ ...p, bullets: p.bullets.map((b) => b.trim()).filter(Boolean) })),
      education: education.filter((e) => e.school || e.degree || e.dates),
    };

    setDownloading(true);
    try {
      const res = await fetch(`${API_URL}/download-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) { alert("Failed to generate PDF."); return; }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "optimized_resume.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Could not connect to backend.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="card">
      <div className="card-title">Step 4 — Build & Download Your Resume</div>
      <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px" }}>
        AI suggestions are pre-filled. Edit anything, then download your polished PDF.
      </p>

      {/* Personal Info */}
      <div className="builder-section">
        <p className="builder-section-title">Personal Info</p>
        <Field label="Full Name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
        </Field>
        <div className="two-col">
          <Field label="Email">
            <input value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} placeholder="jane@email.com" />
          </Field>
          <Field label="Phone">
            <input value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} placeholder="+1 555 000 0000" />
          </Field>
        </div>
        <div className="two-col">
          <Field label="Location">
            <input value={contact.location} onChange={(e) => setContact((c) => ({ ...c, location: e.target.value }))} placeholder="New York, NY" />
          </Field>
          <Field label="LinkedIn">
            <input value={contact.linkedin} onChange={(e) => setContact((c) => ({ ...c, linkedin: e.target.value }))} placeholder="linkedin.com/in/jane" />
          </Field>
        </div>
        <Field label="GitHub">
          <input value={contact.github} onChange={(e) => setContact((c) => ({ ...c, github: e.target.value }))} placeholder="github.com/jane" />
        </Field>
      </div>

      {/* Summary */}
      <div className="builder-section">
        <p className="builder-section-title">Summary</p>
        <Field label="Professional Summary">
          <textarea rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Professional summary..." />
        </Field>
        {aiResult?.tailored_summary && summary !== aiResult.tailored_summary && (
          <button className="btn-secondary" type="button" onClick={() => setSummary(aiResult.tailored_summary)}>
            ↩ Use AI suggestion
          </button>
        )}
      </div>

      {/* Skills */}
      <div className="builder-section">
        <p className="builder-section-title">Skills</p>
        <Field label="Skills (comma-separated)">
          <input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Python, FastAPI, React, Docker..." />
        </Field>
        {aiResult?.missing_skills?.length > 0 && (
          <div className="missing-skills-row">
            <span>Add missing skills from AI:</span>
            {aiResult.missing_skills.map((s, i) => (
              <button key={i} className="btn-secondary" type="button"
                onClick={() => setSkills((prev) => {
                  const current = prev.split(",").map((x) => x.trim()).filter(Boolean);
                  return current.includes(s) ? prev : prev ? `${prev}, ${s}` : s;
                })}
              >
                + {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Experience */}
      <div className="builder-section">
        <p className="builder-section-title">Experience</p>
        {experience.map((exp, i) => (
          <div key={i} className="item-box">
            <div className="two-col">
              <Field label="Job Title">
                <input value={exp.title} onChange={(e) => updateListItem(setExperience, i, "title", e.target.value)} placeholder="Software Engineer" />
              </Field>
              <Field label="Company">
                <input value={exp.company} onChange={(e) => updateListItem(setExperience, i, "company", e.target.value)} placeholder="Acme Corp" />
              </Field>
            </div>
            <Field label="Dates">
              <input value={exp.dates} onChange={(e) => updateListItem(setExperience, i, "dates", e.target.value)} placeholder="Jan 2023 – Present" />
            </Field>
            <Field label="Bullet Points">
              {exp.bullets.map((b, bi) => (
                <div key={bi} className="bullet-row">
                  <input value={b} onChange={(e) => updateBullet(setExperience, i, bi, e.target.value)} placeholder="Describe an achievement..." />
                  <button className="btn-danger" type="button" onClick={() => removeBullet(setExperience, i, bi)}>✕</button>
                </div>
              ))}
            </Field>
            <button className="btn-secondary" type="button" onClick={() => addBullet(setExperience, i)}>+ Add bullet</button>
            {i === 0 && aiResult?.improved_bullets?.length > 0 && (
              <button className="btn-secondary" type="button" onClick={() => updateListItem(setExperience, 0, "bullets", aiResult.improved_bullets)} style={{ marginLeft: "8px" }}>
                ↩ Use AI bullets
              </button>
            )}
            {experience.length > 1 && (
              <button className="btn-danger" type="button" onClick={() => setExperience((prev) => prev.filter((_, idx) => idx !== i))} style={{ marginLeft: "8px" }}>
                Remove
              </button>
            )}
          </div>
        ))}
        <button className="btn-secondary" type="button" onClick={() => setExperience((prev) => [...prev, emptyExperience()])}>
          + Add Experience
        </button>
      </div>

      {/* Projects */}
      <div className="builder-section">
        <p className="builder-section-title">Projects</p>
        {projects.map((proj, i) => (
          <div key={i} className="item-box">
            <div className="two-col">
              <Field label="Project Title">
                <input value={proj.title} onChange={(e) => updateListItem(setProjects, i, "title", e.target.value)} placeholder="AI Resume Builder" />
              </Field>
              <Field label="Tech Stack">
                <input value={proj.tech} onChange={(e) => updateListItem(setProjects, i, "tech", e.target.value)} placeholder="Python, FastAPI, React" />
              </Field>
            </div>
            <Field label="Bullet Points">
              {proj.bullets.map((b, bi) => (
                <div key={bi} className="bullet-row">
                  <input value={b} onChange={(e) => updateBullet(setProjects, i, bi, e.target.value)} placeholder="Describe the project..." />
                  <button className="btn-danger" type="button" onClick={() => removeBullet(setProjects, i, bi)}>✕</button>
                </div>
              ))}
            </Field>
            <button className="btn-secondary" type="button" onClick={() => addBullet(setProjects, i)}>+ Add bullet</button>
            {projects.length > 1 && (
              <button className="btn-danger" type="button" onClick={() => setProjects((prev) => prev.filter((_, idx) => idx !== i))} style={{ marginLeft: "8px" }}>
                Remove
              </button>
            )}
          </div>
        ))}
        <button className="btn-secondary" type="button" onClick={() => setProjects((prev) => [...prev, emptyProject()])}>
          + Add Project
        </button>
      </div>

      {/* Education */}
      <div className="builder-section">
        <p className="builder-section-title">Education</p>
        {education.map((edu, i) => (
          <div key={i} className="item-box">
            <div className="two-col">
              <Field label="School">
                <input value={edu.school} onChange={(e) => updateListItem(setEducation, i, "school", e.target.value)} placeholder="MIT" />
              </Field>
              <Field label="Degree">
                <input value={edu.degree} onChange={(e) => updateListItem(setEducation, i, "degree", e.target.value)} placeholder="B.S. Computer Science" />
              </Field>
            </div>
            <Field label="Dates">
              <input value={edu.dates} onChange={(e) => updateListItem(setEducation, i, "dates", e.target.value)} placeholder="2020 – 2024" />
            </Field>
            {education.length > 1 && (
              <button className="btn-danger" type="button" onClick={() => setEducation((prev) => prev.filter((_, idx) => idx !== i))}>Remove</button>
            )}
          </div>
        ))}
        <button className="btn-secondary" type="button" onClick={() => setEducation((prev) => [...prev, emptyEducation()])}>
          + Add Education
        </button>
      </div>

      <button className="btn-download" onClick={handleDownload} disabled={downloading}>
        {downloading ? "Generating PDF..." : "⬇ Download Resume PDF"}
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}
