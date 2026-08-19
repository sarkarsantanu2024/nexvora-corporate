import type { MetadataRoute } from "next";

const SITE = "https://www.nexvoratechnologies.co.in";

// One page site for now; the product subdomains carry their own sitemaps.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE,
      lastModified: new Date("2026-08-19"),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
