// The published price list.
//
// One source of truth: the cards in the small-jobs band and the calculator in
// the slide-over both read from here, so a number can never be right in one
// place and stale in the other.
//
// Everything in PRICE_GROUPS is a fixed-price job between ₹499 and ₹12,999 —
// work small enough that quoting it individually wastes more time than doing
// it. Websites are not on that list: they are sold as one of the three plans
// in PACKAGES, and no other website price may appear anywhere on the site.
// Anything larger is discussed and priced on its own. NOT_INCLUDED holds the
// running costs that are never part of any figure on this page.
//
// Repriced on 2026-08-21 against how long each job actually takes now, rather
// than against what the market charges. The anchor is the visiting card at
// ₹499: about 45 minutes when the customer supplies their own logo. Everything
// else is set from its own hours at roughly that rate — a little higher for
// web and software, where the skill is deeper and the work is still mine to
// answer for after it is live.
//
// ₹499 is the floor and should stay there. Below it the WhatsApp conversation,
// the revision and the sending cost more than the job earns, and a number that
// low reads as unserious to the customer rather than as generous.
//
// One caution worth keeping in view: the making got faster, the talking did
// not. Understanding what someone wants, the two rounds of changes and the
// chasing take the same time they always did, and those hours are inside these
// figures too.

// ₹1,499 rather than ₹1499: the Indian grouping is what people read prices in.
export function rupees(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export type PriceItem = {
  id: string;
  label: string;
  price: number;
};

export type PriceGroup = {
  id: string;
  icon: string;
  title: string;
  lead: string;
  items: PriceItem[];
};

export const PRICE_GROUPS: PriceGroup[] = [
  {
    id: "design",
    icon: "palette",
    title: "Design, for screen or for print",
    lead: "Send the details and your photos. You approve the proof before anything is printed. Printing and courier are paid by you, on top of the design price.",
    items: [
      { id: "visiting-card", label: "Visiting card design", price: 499 },
      { id: "poster", label: "Poster or leaflet", price: 699 },
      { id: "flex", label: "Flex, banner or hoarding", price: 799 },
      { id: "sunpack", label: "Sunpack or sign board", price: 799 },
      { id: "menu", label: "Menu card, price list or rate chart", price: 999 },
      { id: "brochure", label: "Brochure or catalogue", price: 1999 },
      { id: "event-card", label: "Wedding, puja or event card", price: 1199 },
      { id: "stationery", label: "Letterhead, bill and envelope set", price: 1499 },
      { id: "logo", label: "Logo, with source files", price: 1999 },
    ],
  },
  {
    id: "social",
    icon: "thumb_up",
    title: "Social media and your accounts",
    lead: "Set up properly the first time, in your own account, never mine.",
    items: [
      { id: "insta-profile", label: "Instagram business profile set up", price: 499 },
      { id: "fb-page", label: "Facebook business page set up", price: 699 },
      { id: "yt-channel", label: "YouTube channel with banner and about", price: 1199 },
      { id: "gbp", label: "Google Business Profile set up", price: 1199 },
      { id: "wa-business", label: "WhatsApp Business with catalogue", price: 1199 },
      { id: "posts-5", label: "Five social media post designs", price: 999 },
      { id: "posts-month", label: "A month of posts, twelve designs", price: 2499 },
    ],
  },
  {
    id: "documents",
    icon: "description",
    title: "Documents, sheets and slides",
    lead: "The paperwork that decides whether a customer takes you seriously.",
    items: [
      { id: "biodata", label: "Bio-data, CV or covering letter", price: 499 },
      { id: "formats", label: "Certificate, offer letter or receipt format", price: 499 },
      { id: "billing", label: "Quotation, invoice and letterhead formats", price: 899 },
      { id: "deck", label: "Presentation, up to 15 slides", price: 1499 },
      { id: "excel", label: "Excel sheet with formulas that work", price: 1499 },
      { id: "profile-pdf", label: "Company profile PDF", price: 1999 },
    ],
  },
  {
    id: "web",
    icon: "bolt",
    title: "Small websites and small software",
    lead: "Not every job needs a big build. Some need one working thing, this week.",
    items: [
      { id: "qr-menu", label: "QR-code menu or price page", price: 1499 },
      { id: "site-repair", label: "Repair to a website you already have", price: 1999 },
      { id: "tool", label: "Small calculator or enquiry form tool", price: 2499 },
      { id: "landing", label: "One-page landing site", price: 3499 },
      // The 3-page and 5-page websites were taken off this list on
      // 2026-11-10 so that no website price here clashes with the three
      // plans below. A website is bought as a plan now.
      { id: "portfolio", label: "Portfolio website with gallery", price: 7999 },
      { id: "excel-app", label: "One Excel process turned into a small app", price: 12999 },
    ],
  },
];

/**
 * The three website plans. Every website on this site is sold as one of
 * these, at these prices, and nowhere else on the site may name another
 * website price. Set on 2026-11-10 and revised by Santanu on 2026-11-11:
 * every plan is a five-page website, ₹5,999 is the permanent price (no
 * "launch offer" tag), Get my business online is ₹11,999, the Platinum
 * plan is gone (the business dashboard is a monthly add-on on Run it
 * yourself instead, DASHBOARD_ADDON), and the only recurring figure on a
 * card is the plan price. The monthly service (AMC) has its own cards: CARE_PLANS.
 *
 * The old "worth" arithmetic (adding up the small jobs inside a bundle) is
 * gone: the website itself is no longer on the small-jobs list, so there is
 * nothing honest to add up. A plan is a price, and the list under it is what
 * that price buys.
 */
export type Package = {
  id: string;
  name: string;
  tagline: string;
  /** The small label on the card: Full plan, Most control. None on the first plan. */
  label?: string;
  price: number;
  includes: string[];
  featured?: boolean;
  /** One line set apart on the card, in a tinted box under the list. */
  highlight?: string;
};

/**
 * The business dashboard runs on Nexvora's servers and database. It is
 * ₹500 a month, paid on top of the plan's monthly service, by a Get my
 * business online or Run it yourself client (since 2026-11-13 it no longer
 * needs the edit panel). Nexvora switches the dashboard on once the month is
 * paid, and off if it lapses.
 */
export const DASHBOARD_MONTHLY = 500;

const ACCOUNTS_LINE = "Domain, hosting and every account in your own name. If you would rather not deal with any of it, I can set them up and manage them for you.";
const FB_LINE = "Facebook business page, created with your own email id";
const YT_LINE = "YouTube channel with banner and About section, created with your own email id";
const GBP_LINE = "Google Business Profile, created with your own email id";

export const PACKAGES: Package[] = [
  {
    id: "starter",
    name: "Just get me started",
    tagline: "For a business that is nowhere online yet",
    price: 5999,
    includes: [
      "Five-page website: Home, About, Services, Gallery and Contact",
      "WhatsApp button, call button and Google Map",
      FB_LINE,
      YT_LINE,
      GBP_LINE,
      ACCOUNTS_LINE,
    ],
  },
  {
    id: "online",
    name: "Get my business online",
    tagline: "The whole thing, in one go",
    label: "Full plan",
    price: 11999,
    featured: true,
    includes: [
      "Five-page website: Home, About, Services, Gallery and Contact",
      "WhatsApp and call button on every page",
      "Opens quickly on a cheap Android phone",
      "Set up so Google can read and list every page",
      FB_LINE,
      YT_LINE,
      GBP_LINE,
      "Logo, if you do not already have one",
      "Visiting card design",
      "Five social media post designs to start you off",
      ACCOUNTS_LINE,
    ],
    highlight: "Optional add-on: your own business management software (customers, fees, stock, expenses, reports, staff logins) for ₹500 a month on top of the monthly service, switched on whenever you want it",
  },
  {
    id: "self",
    name: "Run it yourself",
    tagline: "The full plan, plus a panel to change it yourself",
    label: "Most control",
    price: 15999,
    includes: [
      "Everything in Get my business online",
      "Your own private edit panel with a login, made for your website only",
      "The panel follows the same sections as your website, so each section of your site has its own matching form (for example: Home banner, About, Services, Gallery, Contact)",
      "Change text, photos, prices, phone number, WhatsApp number, address, timings, Google Map location and social media links yourself, any time",
      "Replace or add gallery photos and put up an offer banner",
      "Works on your phone, no technical knowledge needed",
      "Your design and layout stay protected: you change what is inside each section, and if you have no content for a section yet you can hide it and bring it back later. Nothing else can be moved, so the site never breaks or looks messy",
      "A short training call to show you how to use it",
    ],
    highlight: "Optional add-on: the business dashboard (customers, fees, stock, expenses, reports, staff logins) for ₹500 a month on top of the monthly service, switched on whenever you want it",
  },
];

/**
 * The business dashboard: an add-on to Run it yourself, not a plan of its
 * own (Santanu dropped the Platinum card on 2026-11-11). The client pays
 * DASHBOARD_MONTHLY a month and Nexvora switches the dashboard on.
 */
export const DASHBOARD_ADDON = {
  name: "Business dashboard",
  monthly: DASHBOARD_MONTHLY,
  for: "Get my business online and Run it yourself",
  intro: "Run the business from your phone, with a login on your own website. Paid on top of the plan's monthly service, switched on the day the first month is paid; your website keeps working whether or not you continue.",
  includes: [
    "A dashboard built for your kind of business: students or customers, fees or bills, stock and items, staff, expenses",
    "Collections, pending payments and expenses for today, this month and this year, in plain numbers",
    "WhatsApp reminders for pending fees or orders, sent from your own number with one tap",
    "Logins for your staff, with each person seeing only what they need",
    "Your customers log in from your own website, so there is one place for everything",
    "Monthly and yearly reports you can save as PDF",
    "Set up with your current list of customers or students, so you do not start from zero",
    "A training call for you and your staff",
  ],
};

/** The block under the plans. */
export const FIRST_MONTH_FREE = {
  title: "Your first month is free",
  intro: "It starts on the day the website goes live. For that month:",
  lines: [
    "Your photos and text uploaded",
    "2 Facebook posts every week",
    "Videos you send uploaded to YouTube",
  ],
  after:
    "After the free month you choose, or not. Each website plan has one monthly service (AMC) that goes with it, shown below: Basic, Gold or Platinum. It is optional.",
};

/** The comparison table under the plans. Columns follow PACKAGES order. */
export const PLAN_COMPARISON: { row: string; values: string[] }[] = [
  { row: "Website pages", values: ["5", "5", "5"] },
  { row: "Facebook, YouTube and Google Business Profile, on your own email", values: ["Yes", "Yes", "Yes"] },
  { row: "Logo, visiting card and five post designs", values: ["No", "Yes", "Yes"] },
  { row: "Edit it yourself panel", values: ["No", "No", "Yes"] },
  { row: "Business dashboard add-on: customers, fees, stock, expenses, reports, staff logins", values: ["No", `Optional, ${rupees(DASHBOARD_MONTHLY)}/month with the monthly service`, `Optional, ${rupees(DASHBOARD_MONTHLY)}/month with the monthly service`] },
  { row: "First month of care free", values: ["Yes", "Yes", "Yes"] },
];

/** The one line under the monthly service cards. */
export const CARE_OPTIONAL_NOTE =
  "The monthly service follows your website plan: Basic with Just get me started, Gold with Get my business online, Platinum with Run it yourself. Your own business management software is a separate add-on of ₹500 a month, on top of Gold or Platinum.";

/**
 * Nexvora Care: the monthly service (AMC). One for each website plan.
 *
 * Santanu simplified this on 2026-11-13. Until then the section had a
 * three-price "monthly service" block and, under it, two bigger content
 * plans (Basic Care ₹1,499 and Active Care ₹2,999). He found the two sets
 * of prices confusing for a customer and asked for three AMC types only,
 * one per website plan, named Basic, Gold and Platinum. The content plans
 * are gone; the prices are the ones the monthly service already had.
 *
 * Deliberately not sold as hosting. The moment a plan is described as
 * hosting, it is compared with a ₹100 hosting bill and loses.
 *
 * The allowance is stated out loud, in things a shopkeeper can count.
 * "Minor updates included" with no number is how a plan turns into unpaid
 * development.
 *
 * The annual price is ten months for twelve.
 */
export type CarePlan = {
  id: string;
  name: string;
  /** The website plan this service goes with: a Package id. */
  planId: string;
  monthly: number;
  yearly: number;
  who: string;
  /** The allowance, stated rather than implied. */
  allowance: string;
  includes: string[];
  /** One line set apart in a tinted box under the list. */
  highlight?: string;
};

export const CARE_PLANS: CarePlan[] = [
  {
    id: "basic",
    name: "Basic",
    planId: "starter",
    monthly: 399,
    yearly: 3999,
    who: "For the Just get me started plan",
    allowance: "One small change a month",
    includes: [
      "Your domain and hosting renewed on time, in your name, so your website never goes off suddenly",
      "Your website backed up and kept safe every month, without you having to ask",
      "If something breaks, I fix it. You do not get a new bill for it",
      "One small change every month: a new price, a new phone number, a new photo",
      "Message me on WhatsApp any time. You talk to me, not to a call centre",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    planId: "online",
    monthly: 599,
    yearly: 5999,
    who: "For the Get my business online plan",
    allowance: "Unlimited content and photo updates, and four Facebook posts a month",
    includes: [
      "Your website stays fresh: text and photos updated as often as you need, with no limit",
      "Four Facebook posts a month, designed and posted for you, so your page never goes quiet",
      "If something breaks, I fix it. You do not get a new bill for it",
      "Message me on WhatsApp any time. You talk to me, not to a call centre",
    ],
    highlight: "Get your own business management software for just ₹500 a month more: customers, fees, stock, expenses and reports, all on your phone",
  },
  {
    id: "platinum",
    name: "Platinum",
    planId: "self",
    monthly: 799,
    yearly: 7999,
    who: "For the Run it yourself plan",
    allowance: "Your edit panel kept online, so you make your own changes any time",
    includes: [
      "Your own admin panel: change any text or photo yourself, whenever you feel like it",
      "Eight Facebook posts a month, designed and posted for you, so your page stays busy",
      "Your domain and hosting renewed on time, in your name, so your website never goes off suddenly",
      "Your website backed up and kept safe every month, without you having to ask",
      "If something breaks, I fix it. You do not get a new bill for it",
      "Your panel is always on, with your photos stored safely and backed up every day",
      "Message me on WhatsApp any time. You talk to me, not to a call centre",
    ],
    highlight: "Get your own business management software for just ₹500 a month more: customers, fees, stock, expenses and reports, all on your phone",
  },
];

// The line between looking after what exists and building something new.
// Written down because this is the single thing that decides whether a
// monthly plan is worth having or slowly turns into unpaid development.
export const CARE_INCLUDED = [
  "Changing text, prices and phone numbers",
  "Swapping photographs and replacing a banner",
  "Small layout tidying on a page that already exists",
  "Facebook posts, up to the number the plan says",
  "Keeping hosting, backups and security in order",
  "Telling you what went wrong when something breaks",
];

export const CARE_NOT_INCLUDED = [
  "New pages beyond the five the plan covers",
  "Facebook posts beyond the number your plan says, and YouTube uploads, after the free first month",
  "A new feature, module or payment gateway",
  "An enquiry or contact form",
  "A booking system or anything new with a database behind it (the edit panel and the business dashboard are already part of their plans)",
  "A full redesign of the site",
  "A mobile app or custom software built from scratch",
];

// The running costs. These are never inside any figure on this page, they are
// paid to the provider in the customer's own name, and saying so plainly here
// is cheaper than an argument later.
export const NOT_INCLUDED: {
  icon: string;
  label: string;
  note: string;
  /** A second line, shown under the note where one is needed. */
  extra?: string;
}[] = [
  {
    icon: "dns",
    label: "Domain name",
    note: "Bought in your name and renewed every year. I will tell you the exact cost before you buy.",
  },
  {
    icon: "cloud",
    label: "Hosting and business email",
    note: "A yearly or monthly bill paid to the hosting company, sized to what you actually use.",
    extra:
      "The edit panel (Run it yourself) and the business dashboard add-on run on Nexvora's own servers and database. The edit panel is included in its plan. The dashboard is ₹500 a month on top of the monthly service: it is switched on when the month is paid and off if it lapses, and the website keeps working either way. If you ever leave, you get all your text, photos and business records to take with you.",
  },
  {
    icon: "local_shipping",
    label: "Printing and courier",
    note: "The design is what is priced here. The press bill and the courier are paid by you, at what they actually cost. I do not add anything to either.",
  },
  {
    icon: "campaign",
    label: "Advertising budget",
    note: "What you pay Google or Meta to show your ads is yours, and it goes on your own card.",
  },
  {
    icon: "credit_card",
    label: "Payment gateway charges",
    note: "Razorpay or Stripe take a percentage of each order. That is between you and them.",
  },
  {
    icon: "sms",
    label: "SMS and WhatsApp API charges",
    note: "Only if your job needs them. Charged by the provider, per message.",
  },
];

const ALL_ITEMS = new Map(
  PRICE_GROUPS.flatMap((g) => g.items).map((i) => [i.id, i]),
);

export function itemById(id: string): PriceItem | undefined {
  return ALL_ITEMS.get(id);
}

