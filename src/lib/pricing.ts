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
 * plan is gone (the business management software is a monthly add-on
 * instead, SOFTWARE_ADDON), and the only recurring figure on a card is the
 * plan price. The monthly care plans have their own cards: CARE_PLANS.
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
 * The business management software (called the business dashboard until
 * 2026-11-23) runs on Nexvora's servers and database. It is ₹500 a month,
 * sold only with the Growth or Business care plan and paid on top of it.
 * It is never included free and cannot be added to Basic. Nexvora switches
 * it on once the month is paid, and off if it lapses.
 */
export const SOFTWARE_MONTHLY = 500;
/** The care plans the software can be added to: CarePlan ids. */
export const SOFTWARE_WITH = ["growth", "business"];
const SOFTWARE_LINE = `Optional add-on: your own business management software (customers, fees, stock, expenses, reports, staff logins) for ${rupees(SOFTWARE_MONTHLY)} a month, with the Growth or Business care plan`;

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
    highlight: SOFTWARE_LINE,
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
    highlight: SOFTWARE_LINE,
  },
];

/**
 * The business management software: an add-on to the Growth or Business
 * care plan, not a plan of its own and never part of one. Shown as its own
 * block directly under the care plan cards.
 */
export const SOFTWARE_ADDON = {
  name: "Business management software",
  monthly: SOFTWARE_MONTHLY,
  rule: "Available only with Growth or Business. Paid separately, on top of the plan price.",
  includes: [
    "Students or customers, fees or bills, stock, staff and expenses",
    "Totals for collections, pending payments and expenses: today, this month and this year",
    "WhatsApp reminders for pending fees or orders",
    "Staff logins with limited access",
    "Customer logins on your website",
    "Monthly and yearly reports, saveable as PDF",
    "Setup with your existing customer or student list, and a training call",
    "It switches on when the month is paid and off if payment lapses. Your website keeps working either way.",
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
    "After the free month, a monthly care plan is your choice. The plans are shown below.",
};

/** The comparison table under the plans. Columns follow PACKAGES order. */
export const PLAN_COMPARISON: { row: string; values: string[] }[] = [
  { row: "Website pages", values: ["5", "5", "5"] },
  { row: "Facebook, YouTube and Google Business Profile, on your own email", values: ["Yes", "Yes", "Yes"] },
  { row: "Logo, visiting card and five post designs", values: ["No", "Yes", "Yes"] },
  { row: "Edit it yourself panel", values: ["No", "No", "Yes"] },
  { row: "Business management software: customers, fees, stock, expenses, reports, staff logins", values: Array(3).fill(`Optional, ${rupees(SOFTWARE_MONTHLY)}/month extra, with Growth or Business care`) },
  { row: "First month of care free", values: ["Yes", "Yes", "Yes"] },
];

/** The heading and text above the care plan cards. */
export const CARE_INTRO = {
  heading: "Monthly care, after your website is live",
  before: "Your first month is free. After that, a care plan is your choice.",
  bold: "If you don't take a care plan, your website stays live for 1 year from launch.",
  after: "To keep it running after that, renew the domain and hosting in your name, or start any care plan. Pay for a year at once and get 2 months free.",
};

/**
 * The monthly report on WhatsApp: the main reason a customer stays on a
 * care plan, so it gets its own block under the cards. The sample numbers
 * are made up and must always carry the "Example numbers only." label.
 */
export const MONTHLY_REPORT = {
  heading: "See every month whether it's working",
  text: "On every care plan, you get a short report on WhatsApp at the end of each month: how many people called you from Google, how many asked for directions to your place, how many visited your website, and how many new reviews you got.",
  sample: [
    { n: 14, label: "calls from Google" },
    { n: 9, label: "direction requests" },
    { n: 210, label: "website visits" },
    { n: 3, label: "new reviews" },
  ],
  note: "Example numbers only.",
};

/**
 * Nexvora Care: the monthly care plans.
 *
 * Redesigned by Santanu on 2026-11-23. The old Basic, Gold and Platinum
 * plans (₹399, ₹599, ₹799, one per website plan) are gone. Any care plan now
 * goes with any website plan, and each plan includes everything in the one
 * before it, which the first bullet of Growth and Business says out loud.
 *
 * Deliberately not sold as hosting. The moment a plan is described as
 * hosting, it is compared with a ₹100 hosting bill and loses.
 *
 * Allowances are stated in things a shopkeeper can count (changes a month,
 * posts a month). "Minor updates included" with no number is how a plan
 * turns into unpaid development.
 *
 * The yearly price is ten months for twelve: 2 months free.
 */
/** Printed in bold wherever it appears in a plan's list. */
export const REPORT_LINE = "A monthly report on WhatsApp";

export type CarePlan = {
  id: string;
  name: string;
  monthly: number;
  yearly: number;
  subtitle: string;
  /** Small badge on the recommended plan. */
  badge?: string;
  includes: string[];
};

export const CARE_PLANS: CarePlan[] = [
  {
    id: "basic",
    name: "Basic",
    monthly: 499,
    yearly: 4999,
    subtitle: "Keep your website safe and up to date",
    includes: [
      "Domain and hosting renewed on time, in your name",
      "Backups, and fixes for anything that breaks, with no new bill for the fix",
      "4 changes a month (price, timing, photo or notice), done within 24 hours",
      "Google Business Profile kept correct: hours, photos and holidays",
      REPORT_LINE,
      "Your edit panel kept online, if your website has one",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    monthly: 999,
    yearly: 9999,
    subtitle: "More calls and more customers",
    badge: "Best for more customers",
    includes: [
      "Everything in Basic, plus:",
      "10 changes a month instead of 4",
      "8 posts a month on Facebook, Instagram and your Google Business Profile, including festival posts (Durga Puja, Poila Baisakh, Diwali and others)",
      "Review kit: a QR card for your counter and a ready-made WhatsApp message asking customers for a Google review",
      "A reply to every Google review you get",
      "1 print design a month: a poster, offer banner or admission flyer",
    ],
  },
  {
    id: "business",
    name: "Business",
    monthly: 1499,
    yearly: 14999,
    subtitle: "For businesses that run batches, fees or bills",
    includes: [
      "Everything in Growth, plus:",
      "12 posts a month instead of 8",
      "An admission or offer campaign every 3 months",
    ],
  },
];

// The line between looking after what exists and building something new.
// Written down because this is the single thing that decides whether a
// monthly plan is worth having or slowly turns into unpaid development.
export const CARE_INCLUDED = [
  "Changing text, prices, timings and phone numbers, up to the number of changes your plan says",
  "Swapping photographs and replacing a banner",
  "Small layout tidying on a page that already exists",
  "Posts, up to the number your plan says",
  "Keeping hosting, backups and security in order",
  "Telling you what went wrong when something breaks",
];

export const CARE_NOT_INCLUDED = [
  "New pages beyond the five the plan covers",
  "Changes and posts beyond the number your plan says, and YouTube uploads, after the free first month",
  "A new feature, module or payment gateway",
  "An enquiry or contact form",
  "A booking system or anything new with a database behind it (the edit panel comes with Run it yourself, and the business management software is its own add-on)",
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
      "The edit panel (Run it yourself) and the business management software run on Nexvora's own servers and database. The edit panel is included in its plan. The software is ₹500 a month, only with the Growth or Business care plan and paid on top of it. It is switched on when the month is paid and off if it lapses, and the website keeps working either way. If you ever leave, you get all your text, photos and business records to take with you.",
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

