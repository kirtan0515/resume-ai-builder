import "./globals.css";

export const metadata = {
  title: "Resume AI Builder",
  description: "AI-powered resume tailoring tool",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}