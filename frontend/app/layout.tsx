import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://brihanmumbai-fix.vercel.app";

export const metadata: Metadata = {
  title: "BrihanMumbai Fix - Report Civic Issues in Mumbai",
  description: "AI-powered civic issue reporting platform for Mumbai citizens. Report potholes, garbage, water issues, and more. Track resolution in real-time.",
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [
      { url: "/images/favicon-32x32.png?v=3", type: "image/png", sizes: "32x32" },
      { url: "/favicon.ico?v=3", sizes: "any" },
    ],
    shortcut: "/favicon.ico?v=3",
    apple: "/apple-icon.png?v=3",
  },
  openGraph: {
    title: "BrihanMumbai Fix - Report Civic Issues in Mumbai",
    description: "AI-powered civic issue reporting platform for Mumbai citizens.",
    type: "website",
    url: "/",
    siteName: "BrihanMumbai Fix",
    images: [
      {
        url: "/images/og-preview.png?v=1",
        width: 1200,
        height: 630,
        alt: "BrihanMumbai Fix",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BrihanMumbai Fix - Report Civic Issues in Mumbai",
    description: "AI-powered civic issue reporting platform for Mumbai citizens.",
    images: ["/images/og-preview.png?v=1"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-sans">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
