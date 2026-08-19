import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { CONTACT } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

// www is the canonical host: the apex 308-redirects to it in Vercel. Keep this
// in sync with the redirect direction, or the canonical tag points at a URL
// that redirects.
const SITE = "https://www.nexvoratechnologies.co.in";

// GA4 property for www.nexvoratechnologies.co.in. Hard-coded rather than
// left to an environment variable alone: a measurement ID is public by
// definition (it ships in the page source), and the site should not silently
// stop measuring because a variable went missing from a project setting.
// NEXT_PUBLIC_GA_ID still overrides it, which is what a second property or a
// staging site would use.
//
// Only production builds report. Local development and `next start` on a
// laptop would otherwise pollute the figures with our own page views.
const GA_ID =
  process.env.NODE_ENV === "production"
    ? (process.env.NEXT_PUBLIC_GA_ID ?? "G-202QYT01PV")
    : undefined;

const DESCRIPTION =
  "Affordable website, online store, portfolio, web app, hosting and digital marketing services for Indian small businesses. Kolkata-based Nexvora Technologies also builds EduFlow school management software.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default:
      "Nexvora Technologies — Affordable Website, Web App & Digital Marketing in Kolkata",
    template: "%s · Nexvora Technologies",
  },
  description: DESCRIPTION,
  applicationName: "Nexvora Technologies",
  authors: [{ name: "Santanu Sarkar" }],
  creator: "Nexvora Technologies",
  publisher: "Nexvora Technologies",
  category: "technology",
  keywords: [
    "Nexvora Technologies",
    "website design company Kolkata",
    "affordable website development India",
    "small business website Kolkata",
    "e-commerce website development",
    "portfolio website design",
    "web application development",
    "PWA development",
    "domain and hosting India",
    "digital marketing Kolkata",
    "Facebook page setup",
    "YouTube channel setup",
    "SEO services Kolkata",
    "graphic design Kolkata",
    "EduFlow school management software",
    "SocialPilot AI",
  ],
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Nexvora Technologies",
    title:
      "Nexvora Technologies — Getting your business online should not cost a fortune",
    description: DESCRIPTION,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexvora Technologies — Affordable web, store and marketing services",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: { canonical: SITE },
  formatDetection: { telephone: true, address: true, email: true },
};

export const viewport: Viewport = { themeColor: "#0a1128" };

// Structured data. LocalBusiness (rather than plain Organization) is what puts
// the address, phone and opening details into a Google knowledge panel.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["ProfessionalService", "LocalBusiness"],
      "@id": `${SITE}#business`,
      name: "Nexvora Technologies",
      url: SITE,
      image: `${SITE}/logo-mark.png`,
      logo: `${SITE}/logo-mark.png`,
      description: DESCRIPTION,
      telephone: "+91-98042-43159",
      email: CONTACT.email,
      priceRange: "₹₹",
      address: {
        "@type": "PostalAddress",
        streetAddress: CONTACT.street,
        addressLocality: CONTACT.city,
        addressRegion: CONTACT.state,
        postalCode: CONTACT.pincode,
        addressCountry: "IN",
      },
      areaServed: { "@type": "Country", name: "India" },
      founder: {
        "@type": "Person",
        name: "Santanu Sarkar",
        jobTitle: "Founder",
      },
      sameAs: [
        "https://www.facebook.com/sarkarsantanu69",
        "https://www.linkedin.com/in/santanusarkar86/",
      ],
      identifier: `Udyam ${CONTACT.udyam}`,
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Services",
        itemListElement: [
          "Custom website development",
          "Portfolio and personal websites",
          "E-commerce and online stores",
          "Web and mobile application development",
          "Domain, hosting and business email",
          "Facebook page and YouTube channel setup",
          "SEO and performance optimisation",
          "Digital marketing and lead generation",
          "Graphic design and brand identity",
        ].map((name) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name },
        })),
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}#website`,
      url: SITE,
      name: "Nexvora Technologies",
      publisher: { "@id": `${SITE}#business` },
      inLanguage: "en-IN",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN" className={inter.variable}>
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body className="bg-white font-sans text-ink antialiased">
        {children}
        {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
      </body>
    </html>
  );
}
