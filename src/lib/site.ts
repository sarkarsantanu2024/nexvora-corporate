// www is the canonical host: the apex 308-redirects to it in Vercel.
export const SITE_URL = "https://www.nexvoratechnologies.co.in";

// The card WhatsApp, Facebook and LinkedIn draw when the URL is pasted. It is
// a real 1200x630 file in public/ rather than a generated image, so what gets
// shared is exactly what was approved — and every route spreads this same
// object, because a page that sets its own `openGraph` replaces the parent's
// wholesale rather than inheriting the image from it.
export const OG_IMAGE = {
  url: `${SITE_URL}/og-cover.png`,
  width: 1200,
  height: 630,
  alt: "Nexvora Technologies — need a website for your business? You don't need a big company budget.",
};

// Contact details and capability shorthand live here because they appear in
// three or four places each — header, hero, footer, contact section — and a
// phone number that disagrees with itself across a page is worse than none.
export const CONTACT = {
  phoneDisplay: "+91 98042 43159",
  phoneHref: "tel:+919804243159",
  whatsappHref: "https://wa.me/919804243159",
  email: "sarkarsantanu69@gmail.com",
  emailHref: "mailto:sarkarsantanu69@gmail.com",
  street: "142 R. N. Guha Road",
  city: "Kolkata",
  state: "West Bengal",
  pincode: "700076",
  country: "India",
  location: "Kolkata, West Bengal, India",
  addressLines: ["142 R. N. Guha Road", "Kolkata, West Bengal 700076", "India"],
  mapQuery: "142 R.N. Guha Road, Kolkata, West Bengal 700076, India",
  udyam: "UDYAM-WB-10-021416",
};

// The shorthand people scan for before they read a word of copy. Icons are
// Material Symbols ligatures; the font is loaded in the layout.
export const CAPABILITIES: { icon: string; label: string }[] = [
  { icon: "language", label: "Website" },
  { icon: "badge", label: "Portfolio" },
  { icon: "web", label: "Web app" },
  { icon: "cloud", label: "SaaS" },
  { icon: "install_mobile", label: "PWA" },
  { icon: "database", label: "Database" },
  { icon: "psychology", label: "AI" },
  { icon: "design_services", label: "Web design" },
  { icon: "palette", label: "Graphic design" },
  { icon: "dns", label: "Domain and hosting" },
  { icon: "shopping_bag", label: "Online store" },
  { icon: "thumb_up", label: "Social media" },
  { icon: "campaign", label: "Digital marketing" },
  { icon: "description", label: "Excel, PPT, bio-data" },
  { icon: "local_shipping", label: "Print and delivery" },
  { icon: "movie", label: "Video and reels" },
  { icon: "translate", label: "Content writing" },
];

// Deliberately short, and in the order a nervous first-time buyer wants it:
// what can you do for me, how does this work, what does it cost, who are you,
// and the questions I am too embarrassed to ask. Anything that reads like a
// corporate software catalogue has been left off.
// Real routes rather than anchors on one long page: each of these is a page
// Google can rank on its own terms, which a single scrolling document cannot
// be. Order is the one a nervous first-time buyer wants — what can you do for
// me, how does this work, what does it cost, can I see it, who are you, and
// the questions I am too embarrassed to ask.
export const NAV_LINKS = [
  { href: "/what-i-can-do", label: "What I can do" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/price", label: "Price" },
  { href: "/examples", label: "Examples" },
  { href: "/about", label: "About me" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];
