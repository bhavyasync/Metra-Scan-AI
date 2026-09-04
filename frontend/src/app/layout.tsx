import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#059669",
};

export const metadata: Metadata = {
  title: "MetraScan AI | Legal Metrology Compliance Inspection Platform",
  description:
    "AI-powered packaged commodity compliance inspection under Legal Metrology Rules, 2011",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-emerald-600 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}