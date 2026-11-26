/**
 * The languages this client uses. The ONE place to change them.
 *
 * LANGUAGES: what the website and the dashboard offer, in the order the
 * language menus show them. Known codes: 'en' (English), 'bn' (Bengali),
 * 'hi' (Hindi). A language left out is nowhere: no menu entry, no address,
 * no sitemap line. Its word files stay in the code, ready to switch back on.
 *
 * DEFAULT_LANGUAGE: lives at the plain address (/about) and is what the
 * dashboard, login and password screens open in until a person picks another.
 * Every other language gets a prefix: /en/about, /bn/about, /hi/about.
 *
 * Keep 'en' in the list: English is the base wording of the website, and
 * every translation falls back to it.
 */
import type { Lang } from '@/lib/i18n';

// Kishore Bharati is a Bengali-medium school: Bengali first, English second.
export const LANGUAGES: readonly Lang[] = ['bn', 'en'];
export const DEFAULT_LANGUAGE: Lang = 'bn';
