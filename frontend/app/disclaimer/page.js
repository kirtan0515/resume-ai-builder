import Navbar from "../../components/Navbar";

export const metadata = { title: "AI Disclaimer — ResumeAI Hub" };

export default function DisclaimerPage() {
  return (
    <>
      <Navbar />
      <div className="legal-page">
        <h1>AI Disclaimer</h1>
        <p className="legal-date">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <section>
          <h2>AI-Generated Content</h2>
          <p>ResumeAI Hub uses artificial intelligence (OpenAI GPT-4o) to analyze resumes and generate feedback. All analysis results, scores, suggestions, and recommendations are AI-generated and may not be 100% accurate.</p>
        </section>

        <section>
          <h2>No Employment Guarantee</h2>
          <p>Using ResumeAI Hub does not guarantee job interviews, employment offers, or any specific career outcome. Resume analysis is one tool among many in a job search. Results vary based on industry, role, company, and many factors outside our control.</p>
        </section>

        <section>
          <h2>Not Professional Career Advice</h2>
          <p>AI-generated feedback is not a substitute for professional career counseling, human resume review, or industry-specific expertise. We recommend using our feedback as a starting point, not a definitive assessment.</p>
        </section>

        <section>
          <h2>ATS Score Accuracy</h2>
          <p>ATS (Applicant Tracking System) scores provided by ResumeAI Hub are estimates based on keyword matching and AI analysis. Different companies use different ATS systems with different algorithms. Our scores are approximations intended to guide improvement, not exact predictions of any specific ATS outcome.</p>
        </section>

        <section>
          <h2>Use at Your Own Discretion</h2>
          <p>You are responsible for reviewing all AI-generated suggestions before applying them to your resume. Always use your own judgment when making changes to your professional documents.</p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>Questions? Contact us at support@resumeaihub.com.</p>
        </section>
      </div>
    </>
  );
}
