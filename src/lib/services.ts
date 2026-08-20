// Services taken on for customers, as opposed to Nexvora's own products.
// Client-facing copy says "I" — the customer deals with one person. "Nexvora"
// and "we" are reserved for the products the business ships. `icon` is a Material Symbols
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
    body: "A site built for your business, not a bought template you end up fighting six months later. It still opens quickly on a three-year-old Android phone. The code and the hosting are handed to you, so any developer can pick it up later without asking me first.",
  },
  {
    icon: "badge",
    title: "Portfolio and personal sites",
    body: "For freelancers, photographers, tutors and consultants who currently turn up nowhere when a client searches their name. Your work, your rates if you want them shown, and a contact form that reaches your phone.",
  },
  {
    icon: "thumb_up",
    title: "Facebook page and YouTube channel",
    body: "Set up properly the first time: correct category, cover art, contact button, channel banner and the first few posts written with you. Handed over in your own account, never mine.",
  },
  {
    icon: "shopping_bag",
    title: "E-commerce and online stores",
    body: "Catalogue, UPI and card checkout through Razorpay or Stripe, invoices carrying your own GST details, courier tracking, and a stock count that agrees with what is on the shelf. Shopify when that fits, custom when it genuinely does not.",
  },
  {
    icon: "trending_up",
    title: "SEO and performance",
    body: "First the repairs that stop Google reading your site properly — slow pages, pages it cannot see, the same page showing up twice — then the writing that actually earns a ranking. You get told which searches you appear for, where you sit on them, and what moved since last month.",
  },
  {
    icon: "code",
    title: "Custom software development",
    body: "Most of what I build started life as a spreadsheet somebody outgrew. I sit with the people doing the work, write down what actually happens, then shape the software around that instead of around a template.",
  },
  {
    icon: "smartphone",
    title: "Mobile apps",
    body: "One app that works on both Android and iPhone, built once rather than twice, so you are not paying for the same thing two times. It keeps working when the signal drops, because where these apps get used, it drops.",
  },
  {
    icon: "campaign",
    title: "Digital marketing and lead generation",
    body: "Google and Meta campaigns run to a budget agreed before anything goes live. The monthly report says how many enquiries came in and what each one cost. Impressions and reach are not achievements.",
  },
  {
    icon: "palette",
    title: "Graphic design and brand identity",
    body: "Logo, colours and type, plus the unglamorous set nobody quotes for: letterhead, invoice, visiting card, sign board, WhatsApp display picture. Source files are handed over, so you are never waiting on me to change a phone number.",
  },
  {
    icon: "psychology",
    title: "AI where it pays for itself",
    body: "Post writing, reading documents nobody wants to retype, answering questions from your own records. I take one task first, count the hours it saves, and widen the scope only after that.",
  },
  {
    icon: "cloud",
    title: "Cloud setup and deployment",
    body: "A change goes live in about two minutes, and if one turns out wrong it is put back in one. Backups that have actually been restored at least once on purpose, alerts that reach a person rather than a screen nobody watches, and a hosting bill you can read line by line.",
  },
  {
    icon: "design_services",
    title: "Interface design",
    body: "Every screen is drawn and shown to whoever will open it forty times a day — the front desk, the teacher, the store clerk — before a line of code is written. Fewer clicks beats a prettier gradient.",
  },
  {
    icon: "dns",
    title: "Domain and hosting",
    body: "I buy or move your web address, connect it to your site, and fit the certificate that puts the padlock in the address bar. Renewal dates go in a calendar I actually watch, so no site I look after goes dark because one was missed.",
  },
  {
    icon: "storage",
    title: "Server space and email",
    body: "Space sized to what your site actually uses, rather than the package a reseller wants to sell you. Company email on your own name instead of a Gmail address, room for your files, and backups kept on a different machine from the site itself.",
  },
  {
    icon: "auto_awesome_motion",
    title: "Social media posts and creatives",
    body: "A month of posts prepared in one go — festival greetings, offer creatives, new-arrival cards — in your colours and your language, sized for Facebook, Instagram and WhatsApp status. Usually back in two or three days.",
  },
  {
    icon: "photo_camera",
    title: "Product and marketing images",
    body: "Clean product pictures for your catalogue, banners, hoardings and menu boards, without booking a studio or waiting on a photographer. Send what you have and I work from that.",
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
    body: "Anything I design can be printed and sent to you — visiting cards, brochures, flyers, banners, sign boards, wedding and event cards. You approve the proof and I deal with the press and the courier for you. The printing bill and the courier charge are yours, at what they cost; nothing is added on top.",
  },
  {
    icon: "support_agent",
    title: "Support and maintenance",
    body: "Someone picks up. Security updates, keeping the site current as browsers and phones change, and the small stuff — a new column in a report, one more field on a form — without a fresh quotation each time.",
  },
];
