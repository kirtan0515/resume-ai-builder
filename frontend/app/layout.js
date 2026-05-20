import "./globals.css";

export const metadata = {
  title: "ResumeAI Hub — AI Resume Analyzer",
  description: "Get ATS scores, keyword gaps, recruiter feedback, and exactly what to fix. Free to try.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
