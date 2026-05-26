"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";
import API_URL from "../../lib/api";

const STATUS_OPTIONS = ["applied", "interview", "offer", "rejected", "withdrawn"];
const STATUS_COLORS = { applied: "var(--brand)", interview: "var(--yellow)", offer: "var(--green)", rejected: "var(--red)", withdrawn: "var(--dk-text-muted)" };

export default function TrackerPage() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);

  // New app form
  const [newTitle, setNewTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newJD, setNewJD] = useState("");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchApps(session.access_token);
        fetchStats(session.access_token);
      }
      setLoading(false);
    });
  }, []);

  async function fetchApps(token) {
    try {
      const res = await fetch(`${API_URL}/applications`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setApps(data.applications || []); }
    } catch {}
  }

  async function fetchStats(token) {
    try {
      const res = await fetch(`${API_URL}/applications/stats`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setStats(await res.json());
    } catch {}
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newTitle.trim() || !newCompany.trim()) { alert("Title and company required."); return; }
    setAdding(true);
    try {
      const res = await fetch(`${API_URL}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ title: newTitle, company: newCompany, url: newUrl, location: newLocation, job_description: newJD, notes: newNotes }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewTitle(""); setNewCompany(""); setNewUrl(""); setNewLocation(""); setNewJD(""); setNewNotes("");
        setShowAdd(false);
        fetchApps(session.access_token);
        fetchStats(session.access_token);
        if (data.match_score) alert(`Added! Match score: ${data.match_score}%`);
      }
    } catch { alert("Could not add."); }
    finally { setAdding(false); }
  }

  async function handleStatusChange(appId, newStatus) {
    try {
      await fetch(`${API_URL}/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchApps(session.access_token);
      fetchStats(session.access_token);
    } catch {}
  }

  async function handleDelete(appId) {
    if (!confirm("Delete this application?")) return;
    try {
      await fetch(`${API_URL}/applications/${appId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      fetchApps(session.access_token);
      fetchStats(session.access_token);
    } catch {}
  }

  function getScoreColor(s) { return s >= 75 ? "var(--green)" : s >= 55 ? "var(--brand)" : s >= 40 ? "var(--yellow)" : "var(--red)"; }

  if (loading) return <div className="dashboard-page"><Navbar dark /><div style={{ textAlign: "center", padding: "100px" }}><span className="spinner" style={{ width: "24px", height: "24px", borderWidth: "3px" }} /></div></div>;

  if (!session) return <div className="dashboard-page"><Navbar dark /><div className="main-content"><div className="card signin-prompt"><h3 className="signin-prompt-title">Sign in to track applications</h3><a href="/dashboard" className="btn btn-md btn-brand" style={{ margin: "16px auto 0" }}>Sign In</a></div></div></div>;

  return (
    <div className="dashboard-page">
      <Navbar dark />
      <div className="dashboard-hero">
        <h1>Application Tracker</h1>
        <p>Track your job applications and see which ones have the best chances.</p>
      </div>

      <main className="main-content">
        {/* Stats */}
        {stats && stats.total > 0 && (
          <div className="admin-grid" style={{ marginBottom: "20px" }}>
            <div className="admin-stat-card"><div className="admin-stat-value">{stats.total}</div><div className="admin-stat-label">Total Applied</div></div>
            <div className="admin-stat-card"><div className="admin-stat-value" style={{ color: "var(--green)" }}>{stats.interview_rate}%</div><div className="admin-stat-label">Interview Rate</div></div>
            <div className="admin-stat-card"><div className="admin-stat-value" style={{ color: "var(--brand)" }}>{stats.avg_match_score}</div><div className="admin-stat-label">Avg Match Score</div></div>
            <div className="admin-stat-card"><div className="admin-stat-value" style={{ color: "var(--green)" }}>{stats.by_status?.offer || 0}</div><div className="admin-stat-label">Offers</div></div>
          </div>
        )}

        {stats?.insight && stats.total > 3 && (
          <div className="card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
            <div style={{ fontSize: "14px", color: "var(--brand)", fontWeight: "500" }}>{stats.insight}</div>
          </div>
        )}

        {/* Add button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ fontSize: "14px", color: "var(--dk-text-muted)" }}>{apps.length} application{apps.length !== 1 ? "s" : ""}</div>
          <button className="btn btn-md btn-brand" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? "Cancel" : "+ Add Application"}
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <form onSubmit={handleAdd} className="card" style={{ marginBottom: "20px" }}>
            <div className="card-title">Add New Application</div>
            <div className="two-col-cards">
              <div className="form-group"><label className="form-label">Job Title *</label><input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Software Engineer" /></div>
              <div className="form-group"><label className="form-label">Company *</label><input value={newCompany} onChange={e => setNewCompany(e.target.value)} placeholder="Google" /></div>
            </div>
            <div className="two-col-cards">
              <div className="form-group"><label className="form-label">URL</label><input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." /></div>
              <div className="form-group"><label className="form-label">Location</label><input value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="Remote / NYC" /></div>
            </div>
            <div className="form-group">
              <label className="form-label">Job Description (optional — for auto-scoring)</label>
              <textarea rows={4} value={newJD} onChange={e => setNewJD(e.target.value)} placeholder="Paste JD to auto-score match against your resume..." />
            </div>
            <div className="form-group"><label className="form-label">Notes</label><input value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Referral from..." /></div>
            <button className="btn btn-md btn-brand" type="submit" disabled={adding}>
              {adding ? <><span className="spinner" /> Adding...</> : "Add Application"}
            </button>
          </form>
        )}

        {/* Applications list */}
        {apps.length === 0 && !showAdd && (
          <div className="card" style={{ textAlign: "center", padding: "48px" }}>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--dk-text)", marginBottom: "8px" }}>No applications yet</div>
            <div style={{ fontSize: "14px", color: "var(--dk-text-muted)", marginBottom: "20px" }}>Start tracking your job applications to see insights and patterns.</div>
            <button className="btn btn-md btn-brand" onClick={() => setShowAdd(true)}>+ Add Your First Application</button>
          </div>
        )}

        {apps.map(app => (
          <div key={app.id} className="card" style={{ padding: "20px", marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--dk-text)" }}>{app.title}</div>
                <div style={{ fontSize: "14px", color: "var(--dk-text-muted)", marginTop: "2px" }}>
                  {app.company}{app.location ? ` · ${app.location}` : ""}
                </div>
                {app.notes && <div style={{ fontSize: "13px", color: "var(--dk-text-muted)", marginTop: "6px", fontStyle: "italic" }}>{app.notes}</div>}
                <div style={{ fontSize: "12px", color: "var(--dk-text-muted)", marginTop: "6px" }}>
                  Applied: {app.applied_date ? new Date(app.applied_date).toLocaleDateString() : "—"}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                {app.match_score > 0 && (
                  <div style={{ fontSize: "20px", fontWeight: "800", color: getScoreColor(app.match_score) }}>
                    {app.match_score}%
                  </div>
                )}
                <select
                  value={app.status}
                  onChange={e => handleStatusChange(app.id, e.target.value)}
                  style={{ background: "var(--dk-surface-2)", border: "1px solid var(--dk-border)", borderRadius: "6px", color: STATUS_COLORS[app.status], padding: "6px 10px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" }}
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div style={{ display: "flex", gap: "8px" }}>
                  {app.url && <a href={app.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "var(--brand)" }}>View →</a>}
                  <button onClick={() => handleDelete(app.id)} style={{ fontSize: "12px", color: "var(--red)", background: "transparent", border: "none", cursor: "pointer" }}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
