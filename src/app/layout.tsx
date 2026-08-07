import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

// www is the canonical host: the apex 308-redirects to it in Vercel. Keep this
// in sync with the redirect direction, or the canonical tag points at a URL
// that redirects.
const SITE = "https://www.nexvoratechnologies.co.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Nexvora Technologies — Software for growing businesses",
    template: "%s · Nexvora Technologies",
  },
  description:
    "Nexvora Technologies builds practical software products for Indian businesses — social media automation, school management, health records, exam platforms and more.",
  keywords: [
    "Nexvora Technologies",
    "SocialPilot AI",
    "EduFlow",
    "software company India",
    "SaaS Kolkata",
  ],
  openGraph: {
    title: "Nexvora Technologies",
    description:
      "Practical software products for Indian businesses — social media automation, school management, health records and more.",
    url: SITE,
    siteName: "Nexvora Technologies",
    locale: "en_IN",
    type: "website",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-white font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
