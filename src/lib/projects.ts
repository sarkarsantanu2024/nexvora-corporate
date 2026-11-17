/* Client projects that are their own app (their own folder under projects/,
   their own database and logins), not one of the sample sites. The super
   admin's Projects page lists them from here. To add one, add a row.

   Only addresses and usernames are kept here. Never a password. */

export type Project = {
  slug: string;
  name: string;
  /** What kind of business it is, in a few words. */
  kind: string;
  status: "live" | "building";
  /** The folder in this repository. */
  folder: string;
  /** The live address, without a slash at the end. Empty until it is live. */
  live: string;
  /** The same app on this computer (npm run dev in the folder). */
  local: string;
  /** The page to log in on, after the address. */
  loginPath: string;
  /** The top login of the project: this is how Nexvora operates it. */
  adminUser: string;
  /** What is in it, one short line each. */
  has: string[];
};

export const PROJECTS: Project[] = [
  {
    slug: "mantrakidz",
    name: "Mantra Kidz",
    kind: "Franchise play school",
    status: "live",
    folder: "projects/mantrakidz",
    live: "https://mantrakidz.nexvoratechnologies.co.in",
    local: "http://localhost:3400",
    loginPath: "/login",
    adminUser: "admin",
    has: ["Website in English, Bengali and Hindi", "Edit panel, by hand or by voice", "Head office, centre and parent dashboards", "Phone app with install, bell and notifications"],
  },
];
