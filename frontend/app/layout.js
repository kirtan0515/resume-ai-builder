import "./globals.css";

export const metadata = {
  title: "ResumeAI Hub — AI-Powered Resume Optimizer",
  description: "Analyze your resume against any job description, get AI-powered improvements, and download a polished PDF.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="navbar">
          <a className="navbar-brand" href="/">
            <span className="navbar-brand-dot" />
            ResumeAI Hub
          </a>
          <span className="navbar-badge">Powered by GPT-4o</span>
        </nav>
        {children}
        <footer className="footer">
          © {new Date().getFullYear()} ResumeAI Hub · Built with FastAPI, Next.js & OpenAI
        </footer>
      </body>
    </html>
  );
}
