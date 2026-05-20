"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Navbar({ dark = false }) {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchRole(session.access_token);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session) fetchRole(session.access_token);
      else setIsAdmin(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchRole(token) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001"}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(data.role === "admin");
      }
    } catch {}
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <nav className={`navbar ${dark ? "navbar-dark" : ""}`}>
      <a href="/">
        <img src="/ResumeAIHublogo.png" alt="ResumeAI Hub" className="navbar-logo" />
      </a>

      <div className="navbar-links">
        <a className="navbar-link" href="/pricing">Pricing</a>
        {session && <a className="navbar-link" href="/dashboard">Dashboard</a>}
        {isAdmin && <span className="admin-badge">Admin</span>}
        {session ? (
          <button className="btn-nav btn-nav-ghost" onClick={handleSignOut}>Sign Out</button>
        ) : (
          <a className="btn-nav btn-nav-primary" href="/dashboard">Get Started</a>
        )}
      </div>

      <button className="navbar-hamburger" aria-label="Menu">☰</button>
    </nav>
  );
}
