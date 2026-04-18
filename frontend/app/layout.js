import "./globals.css";

export const metadata = {
  title: "ResumeAI Hub — AI-Powered Resume Optimizer",
  description: "Analyze your resume against any job description with AI-powered feedback.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer className="footer">
          © {new Date().getFullYear()} ResumeAI Hub · resumeaihub.com
        </footer>
      </body>
    </html>
  );
}
