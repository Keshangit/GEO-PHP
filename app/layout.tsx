import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WC GEO Audit | Web Consulting Agency",
  description:
    "GEO visibility audits for AI search — free snapshots and full technical PDF reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background font-sans">
        {children}
      </body>
    </html>
  );
}
