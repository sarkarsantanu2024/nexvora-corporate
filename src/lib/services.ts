// Services we take on outside of our own products. `icon` is a Material Symbols
// ligature name — the font is loaded in layout.tsx, so any name from
// fonts.google.com/icons works here without touching the component.
export type Service = {
  icon: string;
  title: string;
  body: string;
};

export const SERVICES: Service[] = [
  {
    icon: "language",
    title: "Custom website development",
    body: "Hand-written sites, not a bought theme you end up fighting six months later. You get the repository, the hosting setup, and pages that still open quickly on a three-year-old Android phone.",
  },
  {
    icon: "badge",
    title: "Portfolio and personal sites",
    body: "For freelancers, photographers, tutors and consultants who currently turn up nowhere when a client searches their name. Your work, your rates if you want them shown, and a contact form that reaches your phone.",
  },
  {
    icon: "thumb_up",
    title: "Facebook page and YouTube channel",
    body: "Set up properly the first time: correct category, cover art, contact button, channel banner and the first few posts written with you. Handed over in your own account, never ours.",
  },
  {
    icon: "shopping_bag",
    title: "E-commerce and online stores",
    body: "Catalogue, UPI and card checkout through Razorpay or Stripe, GST-compliant invoices, courier tracking, and a stock count that agrees with what is on the shelf. Shopify when that fits, custom when it genuinely does not.",
  },
  {
    icon: "trending_up",
    title: "SEO and performance",
    body: "Technical repairs first — load time, crawl errors, broken markup, duplicate pages — then the content that actually earns a ranking. You see the search terms, your position on them, and what moved since last month.",
  },
  {
    icon: "code",
    title: "Custom software development",
    body: "Most of what we build started life as a spreadsheet somebody outgrew. We sit with the people doing the work, write down what actually happens, then shape the software around that instead of around a template.",
  },
  {
    icon: "smartphone",
    title: "Mobile apps",
    body: "One React Native codebase covering Android and iOS. Screens are built to keep working when the connection drops, because in the districts our software runs in, it drops.",
  },
  {
    icon: "campaign",
    title: "Digital marketing and lead generation",
    body: "Google and Meta campaigns run to a budget agreed before anything goes live. The monthly report says how many enquiries came in and what each one cost. Impressions and reach are not achievements.",
  },
  {
    icon: "palette",
    title: "Graphic design and brand identity",
    body: "Logo, colours and type, plus the unglamorous set nobody quotes for: letterhead, invoice, visiting card, sign board, WhatsApp display picture. Source files are handed over, so you are never waiting on us to change a phone number.",
  },
  {
    icon: "psychology",
    title: "AI where it pays for itself",
    body: "Post writing, reading documents nobody wants to retype, answering questions from your own records. We take one task first, count the hours it saves, and widen the scope only after that.",
  },
  {
    icon: "cloud",
    title: "Cloud setup and deployment",
    body: "Deploys in about two minutes, rollbacks in one. Backups that have been restored at least once on purpose, alerts that reach a person, and a hosting bill you can read line by line.",
  },
  {
    icon: "design_services",
    title: "Interface design",
    body: "Screens are drawn in Figma and shown to whoever will open them forty times a day — the front desk, the teacher, the store clerk — before any code gets written. Fewer clicks beats a prettier gradient.",
  },
  {
    icon: "dns",
    title: "Domain and hosting",
    body: "We buy or transfer the domain, point the DNS, fit the SSL and put the renewal dates in a calendar somebody watches. No site of ours goes dark because an invoice was missed.",
  },
  {
    icon: "storage",
    title: "Server space and email",
    body: "Shared space or a VPS, sized to what you actually use rather than the package the reseller wants to sell. Company mailboxes on your own domain, storage, and backups kept off the same machine.",
  },
  {
    icon: "auto_awesome_motion",
    title: "Social media posts and creatives",
    body: "A month of posts prepared in one go — festival greetings, offer creatives, new-arrival cards — in your colours and your language, sized for Facebook, Instagram and WhatsApp status. Usually back in two or three days.",
  },
  {
    icon: "photo_camera",
    title: "Product and marketing images",
    body: "Clean product pictures for your catalogue, banners, hoardings and menu boards, without booking a studio or waiting on a photographer. Send what you have and we work from that.",
  },
  {
    icon: "movie",
    title: "Short promotional videos",
    body: "Thirty to sixty seconds for Reels, YouTube Shorts or WhatsApp status, with a voiceover in Bengali, Hindi or English. Good enough to run as an advertisement, cheap enough to make one a month.",
  },
  {
    icon: "translate",
    title: "Content writing and translation",
    body: "Website copy, product descriptions, brochure text and Google Business posts, written in plain language and translated between Bengali, Hindi and English. Rewrites until you are happy with it.",
  },
  {
    icon: "description",
    title: "Documents, sheets and presentations",
    body: "Excel sheets that calculate correctly and do not break when somebody sorts a column, PowerPoint decks for a pitch or a class, bio-data and CVs, letterheads, quotation and bill formats. Small jobs, usually back within the week.",
  },
  {
    icon: "local_shipping",
    title: "Printing and delivery",
    body: "Anything we design can be printed and sent to you — visiting cards, brochures, flyers, banners, sign boards, wedding and event cards. You approve the proof, we deal with the press and the courier.",
  },
  {
    icon: "support_agent",
    title: "Support and maintenance",
    body: "Someone picks up. Security patches, framework upgrades and the small stuff — a new column in a report, one more field on a form — without a fresh quotation each time.",
  },
];
