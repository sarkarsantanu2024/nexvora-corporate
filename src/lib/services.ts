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
    icon: "support_agent",
    title: "Support and maintenance",
    body: "Someone picks up. Security patches, framework upgrades and the small stuff — a new column in a report, one more field on a form — without a fresh quotation each time.",
  },
];
