import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { BackToTop } from "@/components/back-to-top";
import { ContactDock } from "@/components/contact-dock";
import { PriceCalculator } from "@/components/price-calculator";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CONTACT, NAV_LINKS, OG_IMAGE, SITE_URL } from "@/lib/site";
import "./globals.css";

// www is the canonical host: the apex 308-redirects to it in Vercel. Defined
// once in lib/site so the canonical tag, the sitemap and the OG image URL
// cannot disagree about which host is the real one.
const SITE = SITE_URL;

// GA4 property for www.nexvoratechnologies.co.in, in the owner's personal
// Google account rather than an employer's. Hard-coded rather than
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
    ? (process.env.NEXT_PUBLIC_GA_ID ?? "G-06RYPVJNB3")
    : undefined;

// Written for the person, not the crawler — but the words a person would
// actually search for are still in it. Tell me what you need is the whole
// proposition; everything else on the page is detail.
const DESCRIPTION =
  "You don't need to understand technology, or a big company budget. Tell me on WhatsApp what your business needs and I'll tell you what it costs before we start. Websites, online stores, web apps, Google and Facebook setup, design and marketing for small businesses across India. Kolkata-based Nexvora Technologies also builds EduFlow school management software.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default:
      "Nexvora Technologies — Website for Your Business Without a Big Company Budget",
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
      "Need a website for your business? You don't need a big company budget.",
    description: DESCRIPTION,
    locale: "en_IN",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Need a website for your business? You don't need a big company budget.",
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
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
          "Social media posts and creatives",
          "Product and marketing images",
          "Short promotional videos",
          "Content writing and translation",
          "Printing and delivery",
          "Excel, PowerPoint, bio-data and document work",
        ].map((name) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name },
        })),
      },
    },
    // The routes, declared once. FAQPage markup lives on /faq itself, beside
    // the questions it describes, rather than being asserted from every page.
    {
      "@type": "SiteNavigationElement",
      "@id": `${SITE}#nav`,
      name: NAV_LINKS.map((l) => l.label),
      url: NAV_LINKS.map((l) => `${SITE}${l.href}`),
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
    <html lang="en-IN">
      <head>
        {/* One stylesheet for all three faces: Poppins for headings, Inter for
            reading text, and Material Symbols for the icons. Linked rather than
            fetched through next/font because the build machine cannot reach
            Google Fonts, and an icon font cannot be subset by next/font
            anyway. display=swap so the text is readable while they load. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700&display=swap"
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
        {/* Chrome lives here rather than in each page, so a new route cannot
            ship without the header, the footer or the two contact buttons. */}
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <PriceCalculator />
        <ContactDock />
        <BackToTop />
        {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
      </body>
    </html>
  );
}
