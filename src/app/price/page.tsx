import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/site";
import { PageBanner } from "@/components/page-banner";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Pricing } from "@/components/sections";

export const metadata: Metadata = {
  title: "Price — Small Jobs From ₹999, Packages From ₹7,999",
  description: "Real numbers, written down. Small jobs between ₹999 and ₹14,999, packages from ₹7,999, and a plain list of the running costs — domain, hosting, printing, ad budget — that are never inside any of those figures.",
  alternates: { canonical: "https://www.nexvoratechnologies.co.in/price" },
  openGraph: {
    url: "https://www.nexvoratechnologies.co.in/price",
    title: "Price — Small Jobs From ₹999, Packages From ₹7,999",
    description: "Real numbers, written down. Small jobs between ₹999 and ₹14,999, packages from ₹7,999, and a plain list of the running costs — domain, hosting, printing, ad budget — that are never inside any of those figures.",
    images: [OG_IMAGE],
  },
  twitter: { images: [OG_IMAGE.url] },
};

export default function Page() {
  return (
    <>
      <PageBanner
        {...{
        "eyebrow": "Price",
        "title": "Price should never be the reason a business stays offline.",
        "intro": "So the numbers are on the page rather than behind a phone call. Small jobs from ₹999, packages from ₹7,999, and an honest list of the running costs — domain, hosting, printing, ad budget — that are never hidden inside any figure here.",
        "icon": "sell",
        "motif": [
          "currency_rupee",
          "receipt_long",
          "inventory_2",
          "handshake",
          "dns",
          "local_shipping"
        ],
        "image": {
          "src": "/banners/rupee-notes.jpg",
          "alt": "Indian rupee notes and coins"
        }
      }}
      />
      <Breadcrumbs current="/price" />
      <Pricing />
    </>
  );
}
