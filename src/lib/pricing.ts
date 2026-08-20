// The published price list.
//
// One source of truth: the cards in the small-jobs band and the calculator in
// the slide-over both read from here, so a number can never be right in one
// place and stale in the other.
//
// Everything in PRICE_GROUPS is a fixed-price job between ₹499 and ₹12,999 —
// work small enough that quoting it individually wastes more time than doing
// it. Anything larger is discussed and priced on its own; see PACKAGES for the
// bundles, and NOT_INCLUDED for the running costs that are never part of any
// figure on this page.
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
    lead: "Set up properly the first time, in your own account — never mine.",
    items: [
      { id: "insta-profile", label: "Instagram business profile set up", price: 499 },
      { id: "fb-page", label: "Facebook business page set up", price: 699 },
      { id: "yt-channel", label: "YouTube channel with banner and about", price: 1199 },
      { id: "gbp", label: "Google Business Profile set up", price: 1199 },
      { id: "wa-business", label: "WhatsApp Business with catalogue", price: 1199 },
      { id: "posts-5", label: "Five social media post designs", price: 999 },
      { id: "posts-month", label: "A month of posts — twelve designs", price: 2499 },
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
      { id: "site-3", label: "3-page website with contact form", price: 5999 },
      { id: "portfolio", label: "Portfolio website with gallery", price: 7999 },
      { id: "site-5", label: "5-page business website", price: 9999 },
      { id: "excel-app", label: "One Excel process turned into a small app", price: 12999 },
    ],
  },
];

type PackageSpec = {
  id: string;
  name: string;
  tagline: string;
  price: number;
  // Ids from PRICE_GROUPS. The "worth" shown against the package price is the
  // sum of these, computed rather than typed — a saving a customer can add up
  // for themselves is the only kind worth printing, and a hand-keyed total is
  // one edit away from being a lie.
  worthItems: string[];
  // Display lines. A superset of worthItems: some of these are part of another
  // line rather than a separately priced job, and are listed because they are
  // what the customer actually cares about.
  includes: string[];
  featured?: boolean;
};

const PACKAGE_SPECS: PackageSpec[] = [
  {
    id: "starter",
    name: "Just get me started",
    tagline: "For a business that is nowhere online yet",
    price: 4499,
    worthItems: ["landing", "fb-page", "gbp", "visiting-card"],
    includes: [
      "One-page website with your services and photos",
      "Contact form and WhatsApp button",
      "Facebook business page set up",
      "Google Business Profile set up",
      "Visiting card design",
      "Domain, hosting and accounts under your control wherever practical",
    ],
  },
  {
    id: "online",
    name: "Get my business online",
    tagline: "The whole thing, in one go",
    price: 13999,
    worthItems: [
      "site-5",
      "fb-page",
      "insta-profile",
      "yt-channel",
      "gbp",
      "wa-business",
      "logo",
      "visiting-card",
      "posts-5",
    ],
    featured: true,
    includes: [
      "5-page website — home, about, services, gallery, contact",
      "Contact form and WhatsApp button on every page",
      "Opens quickly on a cheap Android phone",
      "Facebook business page set up",
      "Instagram business profile set up",
      "YouTube channel with banner and about section",
      "Google Business Profile set up",
      "WhatsApp Business with your catalogue",
      "Logo, if you do not already have one",
      "Visiting card design",
      "Five social media post designs to start you off",
      "Set up so Google can read and list your pages",
      "Domain, hosting and accounts under your control wherever practical",
    ],
  },
];

export type Package = Omit<PackageSpec, "worthItems"> & { worth: number };

/**
 * Nexvora Care — the monthly plans.
 *
 * Deliberately not sold as hosting. The moment a plan is described as hosting,
 * it is compared with a ₹100 hosting bill and loses. What is actually being
 * bought is knowing who to WhatsApp when something breaks, and not having to
 * learn any of it — which is the same promise the rest of the site makes,
 * continued past the day the site goes live.
 *
 * Every tier states its time allowance out loud. "Minor updates included" with
 * no number is how a ₹299 customer ends up asking for a booking system, and
 * how the person doing the work quietly starts resenting the plan. A stated
 * limit protects both sides and is easier to sell than a vague generosity.
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
  /** The time allowance, stated rather than implied. */
  allowance: string;
  includes: string[];
  featured?: boolean;
};

export const CARE_PLANS: CarePlan[] = [
  {
    id: "basic",
    name: "Basic Care",
    monthly: 299,
    yearly: 2999,
    who: "For a simple business website that mostly stays the same",
    allowance: "Up to 30 minutes of changes a month",
    includes: [
      "Hosting and the security certificate looked after",
      "Backups taken, and checked that they actually restore",
      "I am told if your site goes down, before you notice",
      "Security updates as they come",
      "Small changes — a phone number, a price, a photograph",
      "WhatsApp support from me, not a ticket queue",
    ],
  },
  {
    id: "business",
    name: "Business Care",
    monthly: 599,
    yearly: 5999,
    who: "For a business that actually uses its website every month",
    featured: true,
    allowance: "Up to 1 hour of changes a month",
    includes: [
      "Everything in Basic Care",
      "Text and photographs replaced whenever you need",
      "A new offer or announcement banner put up",
      "Your Google Business Profile kept current",
      "A monthly check that the site is fast and working",
      "Your enquiries checked — the form and the WhatsApp button",
      "Your message answered first",
    ],
  },
  {
    id: "growth",
    name: "Growth Care",
    monthly: 999,
    yearly: 9999,
    who: "For a business that wants its website working, not just sitting there",
    allowance: "Up to 2 hours of changes a month",
    includes: [
      "Everything in Business Care",
      "2 promotional creatives a month, in your colours",
      "Ongoing SEO work so you keep turning up in searches",
      "Google Business posts and photographs kept going",
      "A monthly note on how many people came and from where",
      "Small landing pages for an offer or a season",
    ],
  },
  {
    id: "pro",
    name: "Pro Care",
    monthly: 1499,
    yearly: 14999,
    who: "For a web application, an online shop, or custom software",
    allowance: "Up to 4 hours of maintenance a month",
    includes: [
      "Everything in Growth Care",
      "Your application and its database watched, not just the website",
      "Bugs fixed as they are found",
      "Speed and uptime watched properly",
      "Small changes to features you already have",
      "A monthly report in plain language on how it is all holding up",
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
  "Keeping hosting, backups and security in order",
  "Telling you what went wrong when something breaks",
];

export const CARE_NOT_INCLUDED = [
  "New pages beyond what the plan allows",
  "A new feature, module or payment gateway",
  "A booking system, a login, or anything with a database behind it",
  "A full redesign of the site",
  "A mobile app or custom software built from scratch",
];

// The running costs. These are never inside any figure on this page, they are
// paid to the provider in the customer's own name, and saying so plainly here
// is cheaper than an argument later.
export const NOT_INCLUDED: { icon: string; label: string; note: string }[] = [
  {
    icon: "dns",
    label: "Domain name",
    note: "Bought in your name and renewed every year. I will tell you the exact cost before you buy.",
  },
  {
    icon: "cloud",
    label: "Hosting and business email",
    note: "A yearly or monthly bill paid to the hosting company, sized to what you actually use.",
  },
  {
    icon: "local_shipping",
    label: "Printing and courier",
    note: "The design is what is priced here. The press bill and the courier are paid by you, at what they actually cost — I do not add anything to either.",
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

// A typo in a worthItems id would silently understate the package's value, so
// it fails the build instead. Cheap insurance on a number a customer may well
// sit and add up.
export const PACKAGES: Package[] = PACKAGE_SPECS.map(
  ({ worthItems, ...rest }) => ({
    ...rest,
    worth: worthItems.reduce((sum, id) => {
      const item = ALL_ITEMS.get(id);
      if (!item) {
        throw new Error(
          `Package "${rest.id}" lists unknown price item "${id}". Fix the id in PACKAGE_SPECS or add the item to PRICE_GROUPS.`,
        );
      }
      return sum + item.price;
    }, 0),
  }),
);

// ₹1,499 rather than ₹1499 — the Indian grouping is what people read prices in.
export function rupees(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}
