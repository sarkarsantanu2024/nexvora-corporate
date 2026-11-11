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
 * card is the yearly AMC. The care plans are shown on their own cards.
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
  /**
   * The monthly service for this plan: optional, after the free first
   * month, and what keeps the site alive. Shown in the Nexvora Care section
   * (SERVICE below), never on the plan card itself: Santanu wants the cards
   * to carry one price only. Priced for a small Kolkata business on
   * 2026-11-11, well under the Care plans, which are about weekly content
   * work rather than keeping the site running. The yearly price is ten
   * months for twelve, as on the Care plans.
   */
  service: { monthly: number; yearly: number; what: string };
};

/** The monthly service block inside the Nexvora Care section. One price per plan, from PACKAGES. */
export const SERVICE = {
  title: "Monthly service: your website kept alive",
  lead: "The light option. A small amount every month, after the free first month, and the site stays up, safe and current. Stop whenever you like.",
  includes: [
    "Domain and hosting renewals handled on time, in your name",
    "Backups taken and security updates applied",
    "A broken thing fixed when it breaks, without a new bill",
    "Small changes as they come: a price, a phone number, a photograph",
    "WhatsApp support from me, not a ticket queue",
  ],
  dashboard: `Business dashboard add-on: ${"₹500"} a month on top of the monthly service, on the Run it yourself plan.`,
};

/**
 * The business dashboard runs on Nexvora's servers and database. It is
 * ₹500 a month, paid on top of the plan's monthly service, by a Run it
 * yourself client. Nexvora switches the dashboard on once the month is
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
    service: { monthly: 399, yearly: 3999, what: "hosting and domain renewals handled, backups, security updates and a small change every month" },
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
    service: { monthly: 599, yearly: 5999, what: "hosting and domain renewals handled, backups, security updates and up to two small changes every month" },
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
    service: { monthly: 799, yearly: 7999, what: "everything above, plus the edit panel kept online with its photo storage and daily backups" },
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
  for: "Run it yourself",
  intro: "Run the business from your phone, from the same login as your website. Paid on top of the plan's monthly service, switched on the day the first month is paid; your website keeps working whether or not you continue.",
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
    "After the free month you choose, or not. Nexvora Care below has a small monthly service that keeps the site alive, and two bigger monthly plans for a business that wants regular content work done for it. All of it is optional.",
};

/** The comparison table under the plans. Columns follow PACKAGES order. */
export const PLAN_COMPARISON: { row: string; values: string[] }[] = [
  { row: "Website pages", values: ["5", "5", "5"] },
  { row: "Facebook, YouTube and Google Business Profile, on your own email", values: ["Yes", "Yes", "Yes"] },
  { row: "Logo, visiting card and five post designs", values: ["No", "Yes", "Yes"] },
  { row: "Edit it yourself panel", values: ["No", "No", "Yes"] },
  { row: "Business dashboard add-on: customers, fees, stock, expenses, reports, staff logins", values: ["No", "No", `Optional, ${rupees(DASHBOARD_MONTHLY)}/month with the monthly service`] },
  { row: "First month of care free", values: ["Yes", "Yes", "Yes"] },
];

/** The one line under the care plans. */
export const CARE_OPTIONAL_NOTE =
  "On the Run it yourself plan you can make your own changes any time, so a Care plan is optional. The business dashboard add-on (₹500 a month, with the monthly service) is separate from Care too: it keeps the dashboard online and backed up, while Care is about me doing the content work for you.";

/**
 * Nexvora Care — the monthly plans. The AMC, in plain words.
 *
 * Two plans, not a ladder. Four tiers from ₹299 to ₹1,499 were replaced on
 * 2026-11-07 because the cheap rungs only gave people a reason to buy less;
 * on 2026-11-09 a second, higher plan was added for the customer who changes
 * things every week — new products, new photographs, posts and videos —
 * because that customer was costing more than ₹1,499 of time and the plan
 * needed to say so.
 *
 * Deliberately not sold as hosting. The moment a plan is described as hosting,
 * it is compared with a ₹100 hosting bill and loses. What is actually being
 * bought is a website and social accounts that stay alive every week without
 * the owner having to learn any of it — the same promise the rest of the site
 * makes, continued past the day the site goes live.
 *
 * The allowance is stated out loud, in things a shopkeeper can count: pages,
 * posts, uploads. "Minor updates included" with no number is how a plan turns
 * into unpaid development, and how the person doing the work quietly starts
 * resenting it. A stated limit protects both sides and is easier to sell than
 * a vague generosity.
 *
 * The annual price is roughly ten months for twelve. It is worth offering:
 * the customer saves real money, and the cash arrives at the start of the year
 * rather than in twelve pieces that each need chasing.
 *
 * Not called an AMC anywhere in the interface. Plenty of Indian businesses
 * know the term, but the person this site is written for may not, and "care"
 * needs no explaining.
 */
export type CarePlan = {
  id: string;
  name: string;
  monthly: number;
  yearly: number;
  who: string;
  /** The allowance, stated rather than implied. */
  allowance: string;
  includes: string[];
  featured?: boolean;
};

export const CARE_PLANS: CarePlan[] = [
  {
    id: "basic",
    name: "Basic Care",
    monthly: 1499,
    yearly: 14999,
    who: "For a business whose website mostly stays the same, with a few changes a month",
    allowance: "Up to five pages, and up to two changes a month",
    includes: [
      "Your website looked after: up to five pages kept working and up to date",
      "Text and photographs replaced when you need, up to two times a month",
      "A new offer or announcement banner put up",
      "Two Facebook posts a month, designed and posted for you",
      "WhatsApp support from me, not a ticket queue",
    ],
  },
  {
    id: "active",
    name: "Active Care",
    monthly: 2999,
    yearly: 29999,
    who: "For a business that changes something every week: products, photographs, posts, videos",
    featured: true,
    allowance: "Up to five pages, weekly changes, one Facebook post and one YouTube upload a week",
    includes: [
      "Everything in Basic Care",
      "Products, prices, photographs and content changed every week, as often as you need",
      "One Facebook post a week, designed and posted for you",
      "The video you send me uploaded to your YouTube channel every week",
      "Your Google Business Profile kept current: posts, photographs and hours",
      "A small page for each new offer or season",
      "Your message answered first",
    ],
  },
];

// The line between looking after what exists and building something new.
// Written down because this is the single thing that decides whether a
// monthly plan is worth having or slowly turns into unpaid development.
export const CARE_INCLUDED = [
  "Changing text, prices and phone numbers",
  "Swapping photographs and replacing a banner",
  "Small layout tidying on a page that already exists",
  "Facebook posts and YouTube uploads, up to the number the plan says",
  "Keeping hosting, backups and security in order",
  "Telling you what went wrong when something breaks",
];

export const CARE_NOT_INCLUDED = [
  "New pages beyond the five the plan covers",
  "Shooting or editing the videos: you send the video, I upload it",
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

