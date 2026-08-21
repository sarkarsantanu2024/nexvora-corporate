import type { MetadataRoute } from "next";
import { LEGAL_LINKS, LEGAL_UPDATED_AT } from "@/lib/legal";
import { NAV_LINKS, SITE_URL } from "@/lib/site";

const SITE = SITE_URL;

// Driven off NAV_LINKS so a new route cannot be added to the menu and then
// quietly left out of the sitemap. The product subdomains carry their own.
const UPDATED = new Date("2026-08-20");

// Priority says what a crawler should spend its budget on. Price and What I
// can do are the two pages people actually search for, so they sit above the
// rest; contact and FAQ are useful but nobody arrives on the site looking for
// them first.
const PRIORITY: Record<string, number> = {
  "/what-i-can-do": 0.9,
  "/price": 0.9,
  "/examples": 0.8,
  "/how-it-works": 0.8,
  "/about": 0.7,
  "/faq": 0.7,
  "/contact": 0.6,
};

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE,
      lastModified: UPDATED,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...NAV_LINKS.map((l) => ({
      url: `${SITE}${l.href}`,
      lastModified: UPDATED,
      changeFrequency: "monthly" as const,
      priority: PRIORITY[l.href] ?? 0.6,
    })),
    // The legal pages. Listed so they are indexed and can be produced when
    // somebody asks whether the business has them, but priced at the bottom
    // of the crawl budget — nobody searches their way to a refund policy.
    ...LEGAL_LINKS.map((l) => ({
      url: `${SITE}${l.href}`,
      lastModified: LEGAL_UPDATED_AT,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
