import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WC GEO Audit | Web Consulting Agency",
  description:
    "GEO visibility audits for AI search — free snapshots and full technical PDF reports.",
};

export const viewport: Viewport = {
  themeColor: "#f5f8fc",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" style={{ colorScheme: "light" }}>
      <body className="page-shell min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
