"use client";

import { useState } from "react";
import API_URL from "../lib/api";

export default function BillingPanel({ session, userMeta }) {
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  if (!session || !userMeta) return null;

  const { role, subscription_status, current_period_end, stripe_customer_id } = userMeta;
  const isPaid = role === "paid";
  const isAdmin = role === "admin";
  const isCanceling = subscription_status === "canceling";

  const periodEnd = current_period_end
    ? new Date(current_period_end).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/create-checkout-session`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Could not start checkout. Please try again.");
    } catch { alert("Could not connect to backend."); }
    finally { setLoading(false); }
  }

  async function handleManageBilling() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/create-portal-session`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Could not open billing portal.");
    } catch { alert("Could not connect to backend."); }
    finally { setLoading(false); }
  }

  async function handleCancel() {
    if (!confirm("Cancel your Pro subscription? You'll keep access until the end of your billing period.")) return;
    setCancelLoading(true);
    try {
      const res = await fetch(`${API_URL}/cancel-subscription`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        alert("Subscription canceled. You'll retain Pro access until your billing period ends.");
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.detail || "Could not cancel subscription.");
      }
    } catch { alert("Could not connect to backend."); }
    finally { setCancelLoading(false); }
  }

  if (isAdmin) {
    return (
      <div className="billing-panel">
        <div className="billing-panel-row">
          <div>
            <div className="billing-panel-label">Plan</div>
            <div className="billing-panel-value">Admin <span className="admin-badge">⚡ Unlimited</span></div>
          </div>
        </div>
      </div>
    );
  }

  if (isPaid) {
    return (
      <div className="billing-panel">
        <div className="billing-panel-row">
          <div>
            <div className="billing-panel-label">Plan</div>
            <div className="billing-panel-value">
              Pro {isCanceling && <span className="status-badge canceling">Canceling</span>}
              {!isCanceling && <span className="status-badge active">Active</span>}
            </div>
            {periodEnd && (
              <div className="billing-panel-sub">
                {isCanceling ? `Access until ${periodEnd}` : `Renews ${periodEnd}`}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {stripe_customer_id && (
              <button className="btn-secondary" onClick={handleManageBilling} disabled={loading}>
                {loading ? "Loading..." : "Manage Billing"}
              </button>
            )}
            {!isCanceling && (
              <button className="btn-danger" onClick={handleCancel} disabled={cancelLoading}>
                {cancelLoading ? "Canceling..." : "Cancel Subscription"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="billing-panel billing-panel-upgrade">
      <div>
        <div className="billing-panel-label">Plan</div>
        <div className="billing-panel-value">Free</div>
        <div className="billing-panel-sub">Upgrade to Pro for unlimited analyses</div>
      </div>
      <button className="btn-primary" onClick={handleUpgrade} disabled={loading}>
        {loading ? <><span className="spinner" /> Loading...</> : "Upgrade to Pro — $9/mo"}
      </button>
    </div>
  );
}
