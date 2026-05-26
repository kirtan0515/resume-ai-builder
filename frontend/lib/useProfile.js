"use client";

import { useState, useEffect } from "react";
import API_URL from "./api";

/**
 * Hook to load and manage the user's saved resume text.
 * Call this in any page that needs the resume — it auto-loads from the profile.
 */
export function useProfile(session) {
  const [resumeText, setResumeText] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    if (!session) return;
    loadResume(session.access_token);
  }, [session]);

  async function loadResume(token) {
    try {
      const res = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.empty && data.resume_text) {
          setResumeText(data.resume_text);
        }
      }
    } catch {}
    finally { setProfileLoaded(true); }
  }

  async function saveResumeText(text) {
    setResumeText(text);
    if (!session) return;
    try {
      await fetch(`${API_URL}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ resume_text: text }),
      });
    } catch {}
  }

  async function uploadAndExtract(file) {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_URL}/upload-resume`, { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.resume_text?.trim()) {
        setResumeText(data.resume_text);
        // Save to profile
        await saveResumeText(data.resume_text);
        return data.resume_text;
      }
    } catch {}
    return null;
  }

  return { resumeText, setResumeText, saveResumeText, uploadAndExtract, profileLoaded };
}
