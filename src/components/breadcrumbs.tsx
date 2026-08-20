import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { NAV_LINKS, SITE_URL } from "@/lib/site";

/**
 * Breadcrumbs, rendered and marked up.
 *
 * The visible trail gives a reader who landed straight on an inner page from
 * search a way back to the top. The BreadcrumbList JSON-LD alongside it is
 * what makes Google show "nexvoratechnologies.co.in › Price" in the result
 * instead of a bare URL. The label comes from NAV_LINKS, so it can never
 * disagree with the menu.
 */
export function Breadcrumbs({ current }: { current: string }) {
  const page = NAV_LINKS.find((l) => l.href === current);
  if (!page) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: page.label,
        item: `${SITE_URL}${page.href}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="border-b border-slate-200 bg-white">
        <div className="shell py-3">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
            <li>
              <Link href="/" className="transition hover:text-brand-600">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="flex items-center">
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </li>
            <li>
              <span className="font-medium text-slate-800" aria-current="page">
                {page.label}
              </span>
            </li>
          </ol>
        </div>
      </nav>
    </>
  );
}
