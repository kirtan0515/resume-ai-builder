"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import API_URL from "../../lib/api";

export default function AdminDashboard() {
  const [session, setSession] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAnalytics(session.access_token);
      else setLoading(false);
    });
  }, []);

  async function fetchAnalytics(token) {
    try {
      const res = await fetch(`${API_URL}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) { setError("404"); return; }
      if (!res.ok) { setError("denied"); return; }
      setData(await res.json());
    } catch { setError("network"); }
    finally { setLoading(false); }
  }

  // Show nothing suspicious — just a 404 page for non-owners
  if (error || (!loading && !data)) {
    return (
      <div style={{ background: "#080e1a", color: "#7a8fa8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "72px", fontWeight: "900", color: "#1e3048", marginBottom: "8px" }}>404</h1>
          <p>Page not found</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ background: "#080e1a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="spinner" style={{ width: "24px", height: "24px", borderWidth: "3px" }} />
      </div>
    );
  }

  const s = data.summary;
  const c = data.costs;
  const p = data.projections;

  return (
    <div className="dashboard-page" style={{ paddingTop: "24px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "8px" }}>Owner Analytics</h1>
        <p style={{ fontSize: "13px", color: "var(--dk-text-muted)", marginBottom: "32px" }}>
          Private dashboard · kirtan.patel0515@gmail.com
        </p>

        {/* Revenue & Costs */}
        <div className="admin-grid" style={{ marginBottom: "24px" }}>
          <StatCard label="Monthly Revenue" value={`$${c.monthly_revenue_usd}`} color="var(--green)" />
          <StatCard label="Est. Total Cost" value={`$${c.estimated_total_cost_usd}`} color="var(--yellow)" />
          <StatCard label="Est. Daily Cost" value={`$${c.estimated_daily_cost_usd}`} color="var(--yellow)" />
          <StatCard label="Est. Monthly Profit" value={`$${c.estimated_monthly_profit_usd}`} color={c.estimated_monthly_profit_usd >= 0 ? "var(--green)" : "var(--red)"} />
        </div>

        {/* User Stats */}
        <div className="admin-grid" style={{ marginBottom: "24px" }}>
          <StatCard label="Total Users" value={s.total_users} />
          <StatCard label="Paid Users" value={s.paid_users} color="var(--green)" />
          <StatCard label="Free Users" value={s.free_users} />
          <StatCard label="Active Subs" value={s.active_subscriptions} color="var(--brand)" />
        </div>

        {/* Usage Stats */}
        <div className="admin-grid" style={{ marginBottom: "24px" }}>
          <StatCard label="Analyses (All Time)" value={s.total_analyses_all_time} />
          <StatCard label="Analyses (Today)" value={s.total_analyses_today} color="var(--brand)" />
          <StatCard label="Unique IPs (Recent)" value={s.unique_ips_recent} />
          <StatCard label="Blocked Users" value={s.blocked_users} color="var(--red)" />
        </div>

        {/* Cost breakdown */}
        <div className="card" style={{ marginBottom: "20px" }}>
          <div className="card-title">Cost Breakdown</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "14px", color: "var(--dk-text-label)" }}>
            <div>Cost per analysis (GPT-4o + RAG):</div><div style={{ fontWeight: "700" }}>${c.cost_per_analysis_usd}</div>
            <div>Cost per job search (Apify + GPT-4o):</div><div style={{ fontWeight: "700" }}>${c.cost_per_job_search_usd}</div>
            <div>Cost per tool use (interview/cover/salary):</div><div style={{ fontWeight: "700" }}>${c.cost_per_tool_use_usd}</div>
            <div>Total API cost (all time):</div><div style={{ fontWeight: "700" }}>${c.estimated_total_api_cost_usd}</div>
            <div>Infrastructure (monthly):</div><div style={{ fontWeight: "700" }}>${c.infra_monthly_usd}</div>
            <div>Revenue (active subs × $9):</div><div style={{ fontWeight: "700", color: "var(--green)" }}>${c.monthly_revenue_usd}/mo</div>
            <div>Estimated monthly profit:</div><div style={{ fontWeight: "700", color: c.estimated_monthly_profit_usd >= 0 ? "var(--green)" : "var(--red)" }}>${c.estimated_monthly_profit_usd}/mo</div>
          </div>
        </div>

        {/* Projections */}
        {p && (
          <div className="card" style={{ marginBottom: "20px" }}>
            <div className="card-title accent-accent">Profit Projections</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "14px", color: "var(--dk-text-label)" }}>
              <div>Users needed to break even:</div><div style={{ fontWeight: "700" }}>{p.users_needed_breakeven} paid users</div>
              <div>Profit at 100 total users (5% convert):</div><div style={{ fontWeight: "700", color: p.profit_at_100_users >= 0 ? "var(--green)" : "var(--red)" }}>${p.profit_at_100_users}/mo</div>
              <div>Profit at 500 total users (5% convert):</div><div style={{ fontWeight: "700", color: "var(--green)" }}>${p.profit_at_500_users}/mo</div>
              <div>Profit at 1000 total users (5% convert):</div><div style={{ fontWeight: "700", color: "var(--green)" }}>${p.profit_at_1000_users}/mo</div>
              <div>Assumed conversion rate:</div><div style={{ fontWeight: "700" }}>{p.conversion_rate_assumed}</div>
              <div>Assumed analyses per user:</div><div style={{ fontWeight: "700" }}>{p.avg_analyses_per_user_assumed}</div>
            </div>
            <div style={{ marginTop: "16px", padding: "12px", background: "var(--dk-surface-2)", borderRadius: "8px", fontSize: "13px", color: "var(--dk-text-muted)" }}>
              At 5% conversion: 100 users = 5 paid = ${5*9}/mo revenue. 1000 users = 50 paid = ${50*9}/mo revenue.
              With 11 tools, higher engagement means higher conversion potential (target 8-12%).
            </div>
          </div>
        )}

        {/* Recent users */}
        <div className="card" style={{ marginBottom: "20px" }}>
          <div className="card-title">Recent Users</div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Analyses</th>
                  <th>Today</th>
                  <th>Sub Status</th>
                  <th>Last IP</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_users.map((u, i) => (
                  <tr key={i}>
                    <td>{u.email}</td>
                    <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                    <td>{u.lifetime_analyses}</td>
                    <td>{u.daily_analyses}</td>
                    <td>{u.subscription_status || "—"}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "11px" }}>{u.last_ip || "—"}</td>
                    <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="card-title">Recent Activity (Last 30)</div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>IP</th>
                  <th>User Agent</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_activity.map((log, i) => (
                  <tr key={i}>
                    <td>{log.email}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "11px" }}>{log.ip}</td>
                    <td style={{ fontSize: "11px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.user_agent}</td>
                    <td>{log.created_at ? new Date(log.created_at).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "var(--dk-text-muted)", marginTop: "40px" }}>
          CloudWatch: AWS Console → CloudWatch → Metrics → ResumeAI | Alarms: resume-ai-cpu-high, resume-ai-status-check-failed
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-value" style={color ? { color } : {}}>{value}</div>
      <div className="admin-stat-label">{label}</div>
    </div>
  );
}
