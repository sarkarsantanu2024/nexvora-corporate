/**
 * The name, colours and logo of this client, in one place.
 *
 * The dashboard frame, the login screen, the installed app (manifest), the
 * browser tab and the website's default name all read from here. A new client
 * project changes this file and the two colour scales in tailwind.config.ts,
 * replaces public/brand/mark.png, then runs `npm run icons`.
 */
export const BRAND = {
  /** Full name: the installed app, the login screen, the website until it is edited. */
  name: 'Client Name',
  /** Under the app icon on a phone: 12 letters or fewer. */
  shortName: 'Client',
  tagline: 'Your tagline here',
  /** One line on the login screen and in the installed app's details. */
  description: 'The website, enquiries and day to day work, in one place.',
  /** The square logo, drawn in the sidebar and on the login screen. */
  mark: '/brand/mark.png',
  /** Status bar and title bar of the installed app: brand-700 from tailwind.config.ts. */
  themeColor: '#3f348f',
  /** Behind the logo while the installed app opens. */
  backgroundColor: '#ffffff',
} as const;
