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

export const NAV_LINKS = [
  { href: "#mission", label: "Why us" },
  { href: "#promise", label: "Our promise" },
  { href: "#products", label: "Products" },
  { href: "#services", label: "Services" },
  { href: "#about", label: "About" },
  { href: "#founder", label: "Who we are" },
  { href: "#contact", label: "Contact" },
];
