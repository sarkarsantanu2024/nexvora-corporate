import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/site";
import { PageBanner } from "@/components/page-banner";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FAQS } from "@/lib/faq";
import { Faq } from "@/components/sections";

export const metadata: Metadata = {
  title: "FAQ — The Questions People Ask Me First",
  description: "What it costs, how much to pay up front, whose name the domain is in, which language you can write to me in, what happens if the work runs late, and whether I take very small jobs.",
  alternates: { canonical: "https://www.nexvoratechnologies.co.in/faq" },
  openGraph: {
    url: "https://www.nexvoratechnologies.co.in/faq",
    title: "FAQ — The Questions People Ask Me First",
    description: "What it costs, how much to pay up front, whose name the domain is in, which language you can write to me in, what happens if the work runs late, and whether I take very small jobs.",
    images: [OG_IMAGE],
  },
  twitter: { images: [OG_IMAGE.url] },
};

// FAQPage markup belongs on the page that carries the questions, and is built
// from the same array the page renders so the two cannot drift apart.
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function Page() {
  return (
    <>
      <PageBanner
        {...{
        "eyebrow": "Questions",
        "title": "The things people are too polite to ask.",
        "intro": "What it really costs, how much you pay up front, whose name the domain ends up in, which language you can write to me in, and what happens if the work runs late. No question about your own money is a silly one.",
        "icon": "help",
        "motif": [
          "currency_rupee",
          "key",
          "schedule",
          "translate",
          "receipt_long",
          "flight_takeoff"
        ],
        "image": {
          "src": "/banners/market-stall.jpg",
          "alt": "A stallholder at a busy Indian market"
        }
      }}
      />
      <Breadcrumbs current="/faq" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <Faq />
    </>
  );
}
