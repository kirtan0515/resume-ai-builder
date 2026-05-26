"use client";

import { useState } from "react";

/**
 * Shared resume upload component.
 * Shows current resume status + upload button.
 * Calls onExtracted(text) when a new resume is uploaded.
 */
export default function ResumeUploader({ resumeText, onExtracted, uploading, setUploading, apiUrl }) {
  const [uploadedFile, setUploadedFile] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const res = await fetch(`${apiUrl}/upload-resume`, { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.resume_text?.trim()) {
        setUploadedFile(file.name);
        onExtracted(data.resume_text);
      } else {
        alert(data.detail || "Could not extract text from PDF.");
      }
    } catch { alert("Could not upload PDF."); }
    finally { setUploading(false); }
  }

  const hasResume = resumeText && resumeText.trim().length > 20;

  return (
    <div className="card">
      <div className="card-title">Resume</div>
      {hasResume ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "14px", color: "var(--green)", fontWeight: "600", marginBottom: "4px" }}>
              ✓ Resume loaded ({resumeText.trim().split(/\s+/).length} words)
            </div>
            <div style={{ fontSize: "12px", color: "var(--dk-text-muted)" }}>
              {uploadedFile ? `From: ${uploadedFile}` : "From your saved profile"}
            </div>
          </div>
          <label className="btn btn-sm btn-secondary" style={{ cursor: "pointer" }}>
            {uploading ? "Uploading..." : "Upload Different Resume"}
            <input type="file" accept="application/pdf" onChange={handleFile} style={{ display: "none" }} />
          </label>
        </div>
      ) : (
        <div className="upload-zone">
          <input type="file" accept="application/pdf" onChange={handleFile} />
          <div className="upload-icon">↑</div>
          <div className="upload-zone-text">{uploading ? "Extracting..." : "Upload your resume PDF"}</div>
          <div className="upload-zone-sub">PDF only · Text auto-extracted and saved to your profile</div>
        </div>
      )}
    </div>
  );
}
