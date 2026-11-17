'use client';

/**
 * Hands the visitor's language and its dictionary to client components, and
 * gives the whole site one link component that keeps the language in the
 * address: <SiteLink href="/about"> goes to /bn/about for a Bengali visitor.
 */
import Link from 'next/link';
import { createContext, useContext, type ComponentProps, type ReactNode } from 'react';
import { localePath, type Lang } from '@/lib/i18n';
import { getDict, type Dict } from './index';

type Site = { lang: Lang; t: Dict };

// Outside the provider (which should not happen on a site page) everything falls back to English.
const SiteContext = createContext<Site>({ lang: 'en', t: getDict('en') });

export function SiteI18n({ lang, children }: { lang: Lang; children: ReactNode }) {
  // The dictionary is looked up here, not passed in, so only the language crosses from server to browser.
  return <SiteContext.Provider value={{ lang, t: getDict(lang) }}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);

export function SiteLink({ href, ...props }: Omit<ComponentProps<typeof Link>, 'href'> & { href: string }) {
  const { lang } = useSite();
  return <Link href={localePath(lang, href)} {...props} />;
}
