"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// The marketing site's header, footer, calculator and contact dock belong on
// the marketing pages only. The edit panel and the admin area are tools with
// their own chrome, so on those routes this renders the page alone. The root
// layout still owns the pieces, so a new marketing route cannot ship without
// them; this only decides where they show.
const BARE_PREFIXES = ["/panel", "/admin", "/login"];

export function SiteChrome({ header, footer, extras, children }: { header: ReactNode; footer: ReactNode; extras: ReactNode; children: ReactNode }) {
  const pathname = usePathname() || "/";
  const bare = BARE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (bare) return <>{children}</>;
  return (
    <>
      {header}
      <main>{children}</main>
      {footer}
      {extras}
    </>
  );
}
