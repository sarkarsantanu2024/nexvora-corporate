import type { MetadataRoute } from "next";

const SITE = "https://www.nexvoratechnologies.co.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
