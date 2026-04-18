"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    <nav className="navbar">
      <a className="navbar-brand" href="/">
        <span className="navbar-brand-dot" />
        ResumeAI Hub
      </a>

      {/* Desktop nav */}
      <div className="navbar-links">
        <a className="navbar-link" href="/pricing">Pricing</a>
        {session && <a className="navbar-link" href="/dashboard">Dashboard</a>}
        {isAdmin && <span className="admin-badge">⚡ Admin</span>}
        {session ? (
          <button className="btn-signout" onClick={handleSignOut}>Sign Out</button>
        ) : (
          <a className="btn-signin" href="/dashboard">Sign In</a>
        )}
      </div>

      {/* Mobile hamburger */}
      <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? "✕" : "☰"}
      </button>

      {menuOpen && (
        <div className="navbar-mobile-menu">
          <a href="/pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
          {session && <a href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</a>}
          {session ? (
            <button onClick={handleSignOut}>Sign Out</button>
          ) : (
            <a href="/dashboard" onClick={() => setMenuOpen(false)}>Sign In</a>
          )}
        </div>
      )}
    </nav>
  );
}
