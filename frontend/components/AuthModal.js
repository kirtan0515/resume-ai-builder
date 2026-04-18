"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "../lib/supabase";

export default function AuthModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">🔐</div>
        <h3 className="modal-title">Sign in to ResumeAI Hub</h3>
        <p className="modal-body">
          Create a free account to analyze your resume. No credit card required.
        </p>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: "#6366f1",
                  brandAccent: "#4f52d4",
                  inputBackground: "#13151f",
                  inputText: "#f1f2f6",
                  inputBorder: "#2a2d3e",
                  inputBorderFocus: "#6366f1",
                  inputBorderHover: "#6366f1",
                  defaultButtonBackground: "#1a1d27",
                  defaultButtonBackgroundHover: "#2a2d3e",
                  defaultButtonBorder: "#2a2d3e",
                  defaultButtonText: "#f1f2f6",
                  dividerBackground: "#2a2d3e",
                  messageText: "#8b8fa8",
                  anchorTextColor: "#6366f1",
                  anchorTextHoverColor: "#818cf8",
                },
                radii: {
                  borderRadiusButton: "8px",
                  buttonBorderRadius: "8px",
                  inputBorderRadius: "8px",
                },
              },
            },
          }}
          providers={["google"]}
          redirectTo={typeof window !== "undefined" ? window.location.origin : ""}
        />
        <button className="modal-dismiss" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
