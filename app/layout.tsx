import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "100x Chatbot — AI Assistant by 100xSolutions",
  description:
    "Embeddable AI chatbot powered by 100xSolutions. Drop a single script tag to add a smart assistant to any website.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif',
          background: "var(--background)",
          color: "var(--foreground)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
