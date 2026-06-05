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
    <>
      <nav className="nav">
        {/* Logo - left */}
        <a href="/">
          <img
            src="/ResumeAIHublogo.svg"
            alt="ResumeAI Hub"
            className="nav-logo"
            onError={(e) => { e.target.src = '/ResumeAIHublogo.png'; }}
          />
        </a>

        {/* Center links */}
        <div className="nav-center">
          <a className="nav-link" href="/#tools">Features</a>
          <a className="nav-link" href="/#how">How It Works</a>
          <a className="nav-link" href="/pricing">Pricing</a>
          {session && <a className="nav-link" href="/dashboard">Dashboard</a>}
          {session && <a className="nav-link" href="/tracker">Tracker</a>}
          {session && <a className="nav-link" href="/profile">Profile</a>}
        </div>

        {/* Right — CTA buttons */}
        <div className="nav-right">
          {isAdmin && <span className="nav-admin">Admin</span>}
          {session ? (
            <button className="nav-btn nav-btn-ghost" onClick={handleSignOut}>Sign Out</button>
          ) : (
            <>
              <a className="nav-btn nav-btn-ghost" href="/dashboard">Sign In</a>
              <a className="nav-btn nav-btn-primary" href="/dashboard">Get Started Free</a>
            </>
          )}
        </div>

        <button className="nav-hamburger" aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="nav-mobile-menu">
          <a href="/#tools" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="/#how" onClick={() => setMenuOpen(false)}>How It Works</a>
          <a href="/pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
          {session && <a href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</a>}
          {session && <a href="/tracker" onClick={() => setMenuOpen(false)}>Tracker</a>}
          {session && <a href="/profile" onClick={() => setMenuOpen(false)}>Profile</a>}
          {session ? (
            <button onClick={handleSignOut}>Sign Out</button>
          ) : (
            <a href="/dashboard" onClick={() => setMenuOpen(false)}>Get Started Free</a>
          )}
        </div>
      )}
    </>
  );
}
