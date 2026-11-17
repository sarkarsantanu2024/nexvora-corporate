/**
 * The name, colours and logo of this client, in one place.
 *
 * The dashboard frame, the login screen, the installed app (manifest) and the
 * browser tab all read from here. A new client project changes this file and
 * the colours in tailwind.config.ts, then runs `npm run icons`.
 */
export const BRAND = {
  /** Full name: the installed app, the login screen. */
  name: 'Mantra Kidz',
  /** Under the app icon on a phone: 12 letters or fewer. */
  shortName: 'Mantra Kidz',
  tagline: 'A Play School',
  description: 'Admissions, attendance, fees, royalty and the website, for head office, every school and every parent.',
  /** The square logo, drawn in the sidebar and on the login screen. */
  mark: '/brand/mark.png',
  /** Status bar and title bar of the installed app: brand-700. */
  themeColor: '#3f348f',
  /** Behind the logo while the installed app opens. */
  backgroundColor: '#ffffff',
} as const;
