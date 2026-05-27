import "./globals.css";

export const metadata = {
  title: "ResumeAI Hub — AI Resume Analyzer & Career Tools | Get More Interviews",
  description: "Free AI resume analyzer with ATS scoring, job matching, interview prep, salary negotiation, ghost job detection, and more. 11 AI career tools in one platform. Powered by GPT-4o.",
  keywords: "resume analyzer, ATS checker, resume score, AI resume, job matching, interview prep, cover letter generator, salary negotiation, ghost job detector, resume builder, career tools",
  openGraph: {
    title: "ResumeAI Hub — 11 AI Career Tools to Land More Interviews",
    description: "Upload your resume, get instant ATS scoring, find matching jobs, prep for interviews, and negotiate salary — all powered by GPT-4o.",
    url: "https://www.resumeaihub.com",
    siteName: "ResumeAI Hub",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ResumeAI Hub — AI Resume Analyzer",
    description: "11 AI career tools: resume scoring, job matching, interview prep, salary negotiation, and more. Free to try.",
  },
  alternates: {
    canonical: "https://www.resumeaihub.com",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ResumeAI Hub",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "url": "https://www.resumeaihub.com",
    "description": "AI-powered resume analyzer with 11 career tools including ATS scoring, job matching, interview prep, and salary negotiation.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free tier with 2 analyses. Pro plan at $9/month for unlimited access."
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1"
    }
  };

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#0a1628" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
