"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";
import API_URL from "../../lib/api";

const emptyExp = () => ({ title: "", company: "", dates: "", bullets: [""] });
const emptyProj = () => ({ title: "", tech: "", bullets: [""] });
const emptyEdu = () => ({ school: "", degree: "", dates: "" });

export default function BuilderPage() {
  const [session, setSession] = useState(null);
  const [userMeta, setUserMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [website, setWebsite] = useState("");
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState([emptyExp()]);
  const [projects, setProjects] = useState([emptyProj()]);
  const [education, setEducation] = useState([emptyEdu()]);
  const [certifications, setCertifications] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.access_token);
        fetchMeta(session.access_token);
      }
      setLoading(false);
    });
  }, []);

  async function fetchMeta(token) {
    try {
      const res = await fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setUserMeta(await res.json());
    } catch {}
  }

  async function fetchProfile(token) {
    try {
      const res = await fetch(`${API_URL}/profile`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (!data.empty) {
          setName(data.name || "");
          setEmail(data.email || "");
          setPhone(data.phone || "");
          setLocation(data.location || "");
          setLinkedin(data.linkedin || "");
          setGithub(data.github || "");
          setWebsite(data.website || "");
          setSummary(data.summary || "");
          setSkills(Array.isArray(data.skills) ? data.skills.join(", ") : "");
          setExperience(data.experience?.length ? data.experience : [emptyExp()]);
          setProjects(data.projects?.length ? data.projects : [emptyProj()]);
          setEducation(data.education?.length ? data.education : [emptyEdu()]);
          setCertifications(Array.isArray(data.certifications) ? data.certifications.join("\n") : "");
        }
      }
    } catch {}
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`${API_URL}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          name, email, phone, location, linkedin, github, website, summary,
          skills: skills.split(",").map(s => s.trim()).filter(Boolean),
          experience: experience.filter(e => e.title || e.company),
          projects: projects.filter(p => p.title),
          education: education.filter(e => e.school || e.degree),
          certifications: certifications.split("\n").map(c => c.trim()).filter(Boolean),
          template: "classic",
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { alert("Could not save."); }
    finally { setSaving(false); }
  }

  async function handleGenerate() {
    const isPro = userMeta?.role === "paid" || userMeta?.role === "admin";
    if (!isPro) { window.location.href = "/pricing"; return; }

    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/generate-resume-pdf`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.status === 402) { window.location.href = "/pricing"; return; }
      if (!res.ok) { alert("Failed to generate PDF."); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert("Could not connect."); }
    finally { setGenerating(false); }
  }

  function updateExp(i, field, val) { setExperience(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e)); }
  function updateExpBullet(i, bi, val) { setExperience(prev => prev.map((e, idx) => idx === i ? { ...e, bullets: e.bullets.map((b, j) => j === bi ? val : b) } : e)); }
  function addExpBullet(i) { setExperience(prev => prev.map((e, idx) => idx === i ? { ...e, bullets: [...e.bullets, ""] } : e)); }

  function updateProj(i, field, val) { setProjects(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p)); }
  function updateProjBullet(i, bi, val) { setProjects(prev => prev.map((p, idx) => idx === i ? { ...p, bullets: p.bullets.map((b, j) => j === bi ? val : b) } : p)); }
  function addProjBullet(i) { setProjects(prev => prev.map((p, idx) => idx === i ? { ...p, bullets: [...p.bullets, ""] } : p)); }

  function updateEdu(i, field, val) { setEducation(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e)); }

  const isPro = userMeta?.role === "paid" || userMeta?.role === "admin";

  if (loading) return <div className="dashboard-page"><Navbar dark /><div style={{ textAlign: "center", padding: "100px" }}><span className="spinner" style={{ width: "24px", height: "24px", borderWidth: "3px" }} /></div></div>;

  if (!session) return <div className="dashboard-page"><Navbar dark /><div className="main-content"><div className="card signin-prompt"><h3 className="signin-prompt-title">Sign in to build your resume</h3><a href="/dashboard" className="btn btn-md btn-brand" style={{ margin: "16px auto 0" }}>Sign In</a></div></div></div>;

  return (
    <div className="dashboard-page">
      <Navbar dark />
      <div className="dashboard-hero">
        <h1>Resume Builder</h1>
        <p>Fill in your details, save your profile, and generate a polished PDF anytime.</p>
      </div>

      <main className="main-content">
        {/* Personal Info */}
        <div className="card">
          <div className="card-title">Personal Information</div>
          <div className="two-col-cards">
            <Field label="Full Name" value={name} onChange={setName} placeholder="Jane Doe" />
            <Field label="Email" value={email} onChange={setEmail} placeholder="jane@email.com" />
          </div>
          <div className="two-col-cards">
            <Field label="Phone" value={phone} onChange={setPhone} placeholder="+1 555 000 0000" />
            <Field label="Location" value={location} onChange={setLocation} placeholder="New York, NY" />
          </div>
          <div className="two-col-cards">
            <Field label="LinkedIn" value={linkedin} onChange={setLinkedin} placeholder="linkedin.com/in/jane" />
            <Field label="GitHub" value={github} onChange={setGithub} placeholder="github.com/jane" />
          </div>
          <Field label="Website" value={website} onChange={setWebsite} placeholder="janedoe.com" />
        </div>

        {/* Summary */}
        <div className="card">
          <div className="card-title">Professional Summary</div>
          <textarea rows={4} value={summary} onChange={e => setSummary(e.target.value)} placeholder="2-4 sentence professional summary..." />
        </div>

        {/* Skills */}
        <div className="card">
          <div className="card-title">Skills</div>
          <input value={skills} onChange={e => setSkills(e.target.value)} placeholder="Python, React, AWS, Docker, FastAPI..." />
          <p style={{ fontSize: "12px", color: "var(--dk-text-muted)", marginTop: "6px" }}>Comma-separated</p>
        </div>

        {/* Experience */}
        <div className="card">
          <div className="card-title">Experience</div>
          {experience.map((exp, i) => (
            <div key={i} style={{ background: "var(--dk-surface-2)", border: "1px solid var(--dk-border)", borderRadius: "var(--radius)", padding: "16px", marginBottom: "12px" }}>
              <div className="two-col-cards">
                <Field label="Title" value={exp.title} onChange={v => updateExp(i, "title", v)} placeholder="Software Engineer" />
                <Field label="Company" value={exp.company} onChange={v => updateExp(i, "company", v)} placeholder="Acme Corp" />
              </div>
              <Field label="Dates" value={exp.dates} onChange={v => updateExp(i, "dates", v)} placeholder="Jan 2023 – Present" />
              <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--dk-text-label)", marginBottom: "6px", display: "block" }}>Bullets</label>
              {exp.bullets.map((b, bi) => (
                <input key={bi} value={b} onChange={e => updateExpBullet(i, bi, e.target.value)} placeholder="Achievement..." style={{ marginBottom: "6px" }} />
              ))}
              <button className="btn btn-sm btn-secondary" onClick={() => addExpBullet(i)}>+ Bullet</button>
            </div>
          ))}
          <button className="btn btn-sm btn-secondary" onClick={() => setExperience([...experience, emptyExp()])}>+ Add Experience</button>
        </div>

        {/* Projects */}
        <div className="card">
          <div className="card-title">Projects</div>
          {projects.map((proj, i) => (
            <div key={i} style={{ background: "var(--dk-surface-2)", border: "1px solid var(--dk-border)", borderRadius: "var(--radius)", padding: "16px", marginBottom: "12px" }}>
              <div className="two-col-cards">
                <Field label="Title" value={proj.title} onChange={v => updateProj(i, "title", v)} placeholder="AI Resume Builder" />
                <Field label="Tech" value={proj.tech} onChange={v => updateProj(i, "tech", v)} placeholder="Python, FastAPI, React" />
              </div>
              {proj.bullets.map((b, bi) => (
                <input key={bi} value={b} onChange={e => updateProjBullet(i, bi, e.target.value)} placeholder="What you built..." style={{ marginBottom: "6px" }} />
              ))}
              <button className="btn btn-sm btn-secondary" onClick={() => addProjBullet(i)}>+ Bullet</button>
            </div>
          ))}
          <button className="btn btn-sm btn-secondary" onClick={() => setProjects([...projects, emptyProj()])}>+ Add Project</button>
        </div>

        {/* Education */}
        <div className="card">
          <div className="card-title">Education</div>
          {education.map((edu, i) => (
            <div key={i} style={{ background: "var(--dk-surface-2)", border: "1px solid var(--dk-border)", borderRadius: "var(--radius)", padding: "16px", marginBottom: "12px" }}>
              <div className="two-col-cards">
                <Field label="School" value={edu.school} onChange={v => updateEdu(i, "school", v)} placeholder="MIT" />
                <Field label="Degree" value={edu.degree} onChange={v => updateEdu(i, "degree", v)} placeholder="B.S. Computer Science" />
              </div>
              <Field label="Dates" value={edu.dates} onChange={v => updateEdu(i, "dates", v)} placeholder="2020 – 2024" />
            </div>
          ))}
          <button className="btn btn-sm btn-secondary" onClick={() => setEducation([...education, emptyEdu()])}>+ Add Education</button>
        </div>

        {/* Certifications */}
        <div className="card">
          <div className="card-title">Certifications</div>
          <textarea rows={3} value={certifications} onChange={e => setCertifications(e.target.value)} placeholder="One per line: AWS Solutions Architect&#10;Google Cloud Professional..." />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "8px" }}>
          <button className="btn btn-lg btn-brand" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner" /> Saving...</> : saved ? "✓ Saved" : "Save Profile"}
          </button>
          <button className="btn btn-lg btn-outline-light" onClick={handleGenerate} disabled={generating}>
            {generating ? <><span className="spinner" /> Generating...</> : isPro ? "Download Resume PDF" : "🔒 Download PDF (Pro)"}
          </button>
        </div>

        {!isPro && (
          <p style={{ fontSize: "13px", color: "var(--dk-text-muted)", marginTop: "12px" }}>
            PDF generation is a Pro feature. <a href="/pricing" style={{ color: "var(--brand)" }}>Upgrade to Pro</a> to download your resume.
          </p>
        )}
      </main>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "var(--dk-text-label)", marginBottom: "5px" }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
