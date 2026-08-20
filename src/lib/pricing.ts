// The published price list.
//
// One source of truth: the cards in the small-jobs band and the calculator in
// the slide-over both read from here, so a number can never be right in one
// place and stale in the other.
//
// Everything in PRICE_GROUPS is a fixed-price job between ₹999 and ₹14,999 —
// work small enough that quoting it individually wastes more time than doing
// it. Anything larger is discussed and priced on its own; see PACKAGES for the
// bundles, and NOT_INCLUDED for the running costs that are never part of any
// figure on this page.

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
      { id: "visiting-card", label: "Visiting card design", price: 999 },
      { id: "poster", label: "Poster or leaflet", price: 999 },
      { id: "flex", label: "Flex, banner or hoarding", price: 1499 },
      { id: "sunpack", label: "Sunpack or sign board", price: 1499 },
      { id: "menu", label: "Menu card, price list or rate chart", price: 1499 },
      { id: "brochure", label: "Brochure or catalogue", price: 2499 },
      { id: "event-card", label: "Wedding, puja or event card", price: 1999 },
      { id: "stationery", label: "Letterhead, bill and envelope set", price: 1999 },
      { id: "logo", label: "Logo, with source files", price: 2999 },
    ],
  },
  {
    id: "social",
    icon: "thumb_up",
    title: "Social media and your accounts",
    lead: "Set up properly the first time, in your own account — never mine.",
    items: [
      { id: "insta-profile", label: "Instagram business profile set up", price: 999 },
      { id: "fb-page", label: "Facebook business page set up", price: 1499 },
      { id: "yt-channel", label: "YouTube channel with banner and about", price: 1999 },
      { id: "gbp", label: "Google Business Profile set up", price: 1999 },
      { id: "wa-business", label: "WhatsApp Business with catalogue", price: 1999 },
      { id: "posts-5", label: "Five social media post designs", price: 1999 },
      { id: "posts-month", label: "A month of posts — twelve designs", price: 4999 },
    ],
  },
  {
    id: "documents",
    icon: "description",
    title: "Documents, sheets and slides",
    lead: "The paperwork that decides whether a customer takes you seriously.",
    items: [
      { id: "biodata", label: "Bio-data, CV or covering letter", price: 999 },
      { id: "formats", label: "Certificate, offer letter or receipt format", price: 999 },
      { id: "billing", label: "Quotation, invoice and letterhead formats", price: 1499 },
      { id: "deck", label: "Presentation, up to fifteen slides", price: 1999 },
      { id: "excel", label: "Excel sheet with formulas that work", price: 1999 },
      { id: "profile-pdf", label: "Company profile PDF", price: 2999 },
    ],
  },
  {
    id: "web",
    icon: "bolt",
    title: "Small websites and small software",
    lead: "Not every job needs a big build. Some need one working thing, this week.",
    items: [
      { id: "qr-menu", label: "QR-code menu or price page", price: 2999 },
      { id: "site-repair", label: "Repair to a website you already have", price: 2999 },
      { id: "tool", label: "Small calculator or enquiry form tool", price: 3999 },
      { id: "landing", label: "One-page landing site", price: 4999 },
      { id: "site-3", label: "Three-page website with contact form", price: 7999 },
      { id: "portfolio", label: "Portfolio website with gallery", price: 9999 },
      { id: "site-5", label: "Five-page business website", price: 11999 },
      { id: "excel-app", label: "One Excel process turned into a small app", price: 14999 },
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
    price: 7999,
    worthItems: ["landing", "fb-page", "gbp", "visiting-card"],
    includes: [
      "One-page website with your services and photos",
      "Contact form and WhatsApp button",
      "Facebook business page set up",
      "Google Business Profile set up",
      "Visiting card design",
      "Everything registered in your name",
    ],
  },
  {
    id: "online",
    name: "Get my business online",
    tagline: "The whole thing, in one go",
    price: 19999,
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
      "Five-page website — home, about, services, gallery, contact",
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
      "Everything registered in your name",
    ],
  },
];

export type Package = Omit<PackageSpec, "worthItems"> & { worth: number };

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
