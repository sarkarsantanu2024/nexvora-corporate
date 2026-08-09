import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = { themeColor: "#2f4ac0" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Material Symbols is an icon font, not a text font, so next/font
            cannot subset it — link the variable font directly and let the
            browser cache it. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="bg-white font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
