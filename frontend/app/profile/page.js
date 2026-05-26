"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";
import API_URL from "../../lib/api";

export default function ProfilePage() {
  const [session, setSession] = useState(null);
  const [userMeta, setUserMeta] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchMeta(session.access_token);
        fetchProfile(session.access_token);
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
        if (!data.empty) setProfile(data);
        else setProfile({ name: "", email: "", phone: "", location: "", linkedin: "", github: "", website: "", summary: "", skills: [], experience: [], education: [], projects: [], certifications: [], resume_text: "" });
      }
    } catch {}
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const res = await fetch(`${API_URL}/upload-resume`, { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.resume_text?.trim()) {
        setProfile(prev => ({ ...prev, resume_text: data.resume_text }));
        alert("Resume uploaded and text extracted!");
      }
    } catch { alert("Upload failed."); }
    finally { setUploading(false); }
  }

  async function handleAutoExtract() {
    if (!profile?.resume_text?.trim()) { alert("Upload a resume first."); return; }
    setExtracting(true);
    try {
      const res = await fetch(`${API_URL}/auto-fill-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ resume_text: profile.resume_text }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(prev => ({ ...prev, ...data, resume_text: prev.resume_text }));
        alert("Profile auto-filled from resume!");
      }
    } catch { alert("Could not extract."); }
    finally { setExtracting(false); }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`${API_URL}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(profile),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { alert("Could not save."); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="dashboard-page"><Navbar dark /><div style={{ textAlign: "center", padding: "100px" }}><span className="spinner" style={{ width: "24px", height: "24px", borderWidth: "3px" }} /></div></div>;

  if (!session) return <div className="dashboard-page"><Navbar dark /><div className="main-content"><div className="card signin-prompt"><h3 className="signin-prompt-title">Sign in to view your profile</h3><a href="/dashboard" className="btn btn-md btn-brand" style={{ margin: "16px auto 0" }}>Sign In</a></div></div></div>;

  return (
    <div className="dashboard-page">
      <Navbar dark />
      <div className="dashboard-hero">
        <h1>Your Profile</h1>
        <p>Your resume and profile data — used across all tools automatically.</p>
      </div>

      <main className="main-content">
        {/* Account info */}
        <div className="card">
          <div className="card-title">Account</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "15px", fontWeight: "600", color: "var(--dk-text)" }}>{userMeta?.email}</div>
              <div style={{ fontSize: "13px", color: "var(--dk-text-muted)" }}>
                Role: <span className={`role-badge role-${userMeta?.role}`}>{userMeta?.role}</span>
                {" · "}{userMeta?.lifetime_analyses || 0} analyses used
              </div>
            </div>
            {userMeta?.role === "free" && (
              <a href="/pricing" className="btn btn-sm btn-brand">Upgrade to Pro</a>
            )}
          </div>
        </div>

        {/* Resume upload */}
        <div className="card">
          <div className="card-title">Saved Resume</div>
          {profile?.resume_text?.trim() ? (
            <div>
              <div style={{ fontSize: "14px", color: "var(--green)", fontWeight: "600", marginBottom: "8px" }}>
                ✓ Resume saved ({profile.resume_text.trim().split(/\s+/).length} words)
              </div>
              <div style={{ fontSize: "13px", color: "var(--dk-text-muted)", marginBottom: "12px" }}>
                This resume is automatically used in Dashboard, Interview Prep, Cover Letter, and Job Matching.
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <label className="btn btn-sm btn-secondary" style={{ cursor: "pointer" }}>
                  {uploading ? "Uploading..." : "Upload New Resume"}
                  <input type="file" accept="application/pdf" onChange={handleUpload} style={{ display: "none" }} />
                </label>
                <button className="btn btn-sm btn-secondary" onClick={handleAutoExtract} disabled={extracting}>
                  {extracting ? "Extracting..." : "Auto-Fill Profile from Resume"}
                </button>
              </div>
            </div>
          ) : (
            <div className="upload-zone">
              <input type="file" accept="application/pdf" onChange={handleUpload} />
              <div className="upload-icon">↑</div>
              <div className="upload-zone-text">{uploading ? "Extracting..." : "Upload your resume PDF"}</div>
              <div className="upload-zone-sub">This will be used across all tools automatically</div>
            </div>
          )}
        </div>

        {/* Profile data preview */}
        {profile && profile.name && (
          <div className="card">
            <div className="card-title">Profile Data</div>
            <div style={{ fontSize: "14px", color: "var(--dk-text-label)", lineHeight: "1.8" }}>
              <div><strong>Name:</strong> {profile.name}</div>
              <div><strong>Email:</strong> {profile.email}</div>
              <div><strong>Phone:</strong> {profile.phone}</div>
              <div><strong>Location:</strong> {profile.location}</div>
              {profile.linkedin && <div><strong>LinkedIn:</strong> {profile.linkedin}</div>}
              {profile.github && <div><strong>GitHub:</strong> {profile.github}</div>}
              {profile.skills?.length > 0 && <div><strong>Skills:</strong> {Array.isArray(profile.skills) ? profile.skills.join(", ") : profile.skills}</div>}
              {profile.experience?.length > 0 && <div><strong>Experience:</strong> {profile.experience.length} entries</div>}
              {profile.education?.length > 0 && <div><strong>Education:</strong> {profile.education.length} entries</div>}
              {profile.projects?.length > 0 && <div><strong>Projects:</strong> {profile.projects.length} entries</div>}
            </div>
            <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
              <a href="/builder" className="btn btn-sm btn-secondary">Edit Full Profile in Builder</a>
            </div>
          </div>
        )}

        {/* Save */}
        <button className="btn btn-lg btn-brand" onClick={handleSave} disabled={saving}>
          {saving ? <><span className="spinner" /> Saving...</> : saved ? "✓ Saved" : "Save Profile"}
        </button>
      </main>
    </div>
  );
}
