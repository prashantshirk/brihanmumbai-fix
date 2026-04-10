import type { Metadata } from "next";
import { Montserrat, Merriweather, Source_Code_Pro } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrihanMumbai Fix - Report Civic Issues in Mumbai",
  description: "AI-powered civic issue reporting platform for Mumbai citizens. Report potholes, garbage, water issues, and more. Track resolution in real-time.",
};

const _montserrat = Montserrat({ subsets: ["latin"] });
const _merriweather = Merriweather({ subsets: ["latin"] });
const _sourceCodePro = Source_Code_Pro({ subsets: ["latin"] });

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
