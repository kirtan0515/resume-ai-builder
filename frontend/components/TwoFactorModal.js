"use client";

import { useState } from "react";

export default function TwoFactorModal({ email, token, onVerified, onCancel }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001"}/auth/verify-2fa`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email, code }),
        }
      );

      const data = await res.json();

      if (res.ok && data.valid) {
        onVerified();
      } else {
        setError("Invalid code, try again");
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon" style={{ fontSize: "48px" }}>🔑</div>
        <h3 className="modal-title">Enter Verification Code</h3>
        <p className="modal-body" style={{ marginBottom: "24px", color: "var(--dk-text-muted)" }}>
          Open QuantumTrust app to get your code
        </p>

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(val);
            }}
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: "24px",
              fontWeight: "600",
              textAlign: "center",
              letterSpacing: "8px",
              background: "var(--dk-surface-2, #13151f)",
              border: "1px solid var(--dk-border, #2a2d3e)",
              borderRadius: "8px",
              color: "var(--dk-text, #f1f2f6)",
              outline: "none",
              marginBottom: "16px",
            }}
            autoFocus
          />

          {error && (
            <p style={{
              color: "#ef4444",
              fontSize: "14px",
              marginBottom: "12px",
              textAlign: "center",
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={code.length !== 6 || loading}
            className="btn btn-lg btn-brand"
            style={{
              width: "100%",
              opacity: code.length !== 6 || loading ? 0.5 : 1,
              cursor: code.length !== 6 || loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <button
          className="modal-dismiss"
          onClick={onCancel}
          style={{ marginTop: "16px" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
