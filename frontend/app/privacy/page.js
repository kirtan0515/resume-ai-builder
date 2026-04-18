import Navbar from "../../components/Navbar";

export const metadata = { title: "Privacy Policy — ResumeAI Hub" };

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <div className="legal-page">
        <h1>Privacy Policy</h1>
        <p className="legal-date">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <section>
          <h2>1. Information We Collect</h2>
          <p>We collect the following information when you use ResumeAI Hub:</p>
          <ul>
            <li>Email address (required for account creation)</li>
            <li>Resume text submitted for analysis (processed in real time, not stored)</li>
            <li>Job descriptions submitted for analysis (processed in real time, not stored)</li>
            <li>Usage data: number of analyses performed, timestamps</li>
            <li>Technical data: IP address, browser user agent</li>
          </ul>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul>
            <li>Provide and improve the Service</li>
            <li>Enforce usage limits and prevent abuse</li>
            <li>Send account-related emails (confirmation, password reset)</li>
            <li>Monitor system performance and security</li>
          </ul>
        </section>

        <section>
          <h2>3. Resume Data</h2>
          <p>Resume text and job descriptions you submit are sent to OpenAI's API for processing. This data is processed in real time and is not stored in our database. We do not use your resume content to train AI models. Please review OpenAI's privacy policy at openai.com/privacy.</p>
        </section>

        <section>
          <h2>4. We Do Not Sell Your Data</h2>
          <p>We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>
        </section>

        <section>
          <h2>5. Data Storage</h2>
          <p>Account data (email, usage counts) is stored securely in Supabase. We use industry-standard security practices to protect your data.</p>
        </section>

        <section>
          <h2>6. Cookies</h2>
          <p>We use cookies and local storage for authentication session management only. We do not use tracking or advertising cookies.</p>
        </section>

        <section>
          <h2>7. Your Rights</h2>
          <p>You may request deletion of your account and associated data at any time by contacting support@resumeaihub.com.</p>
        </section>

        <section>
          <h2>8. Changes to This Policy</h2>
          <p>We may update this Privacy Policy. We will notify you of significant changes via email or a notice on the Service.</p>
        </section>

        <section>
          <h2>9. Contact</h2>
          <p>Privacy questions? Contact us at support@resumeaihub.com.</p>
        </section>
      </div>
    </>
  );
}
