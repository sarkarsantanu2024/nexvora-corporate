// Real screenshots of real, running work — the section a careful buyer scrolls
// to before they believe a word of the rest.
//
// Every `image` must exist in public/work/ or the card renders a broken frame,
// so this list holds only what has actually been captured. Nothing here is a
// mock-up or a template preview: if a screenshot cannot be taken of something
// running, it does not belong on the list.
//
// The three below were captured from the live sites with a headless browser.
// To refresh them, re-run that capture rather than cropping by hand — a
// screenshot that disagrees with the live site is worse than no screenshot.
export type WorkItem = {
  name: string;
  kind: "My own product" | "Built for a client";
  blurb: string;
  image: string;
  alt: string;
  href: string | null;
};

export const WORK: WorkItem[] = [
  {
    name: "EduFlow",
    kind: "My own product",
    blurb:
      "Admissions, fees, attendance and WhatsApp reminders for coaching classes and activity centres. Fee reminders go out from the centre's own number, with its UPI QR attached.",
    image: "/work/eduflow.png",
    alt: "The EduFlow home page, showing coaching-centre management software",
    href: "https://eduflow.nexvoratechnologies.co.in",
  },
  {
    name: "SocialPilot AI",
    kind: "My own product",
    blurb:
      "Posts generated, scheduled and published to Facebook Pages, with reach and enquiries tracked. Built for businesses running several branches that all need to post consistently.",
    image: "/work/socialpilot.png",
    alt: "The SocialPilot AI home page, showing Facebook page automation",
    href: "https://socialpilot.nexvoratechnologies.co.in",
  },
  {
    name: "Tirupati Balaji Health Care Group",
    kind: "Built for a client",
    blurb:
      "A multi-speciality hospital site: departments, doctor profiles, diagnostics, gallery and appointment enquiries, with the emergency numbers reachable from every page.",
    image: "/work/tirupati-balaji.png",
    alt: "The Tirupati Balaji Health Care Group hospital website home page",
    href: "https://tirupati-balaji-hospital.vercel.app/",
  },
  {
    name: "Avocado Tree",
    kind: "Built for a client",
    blurb:
      "A dark, photography-led site for a digital growth consultancy — the system they sell, their pricing, their articles and a booking call, built to read as well on a phone as on a laptop.",
    image: "/work/avocado-tree.png",
    alt: "The Avocado Tree digital consultancy website home page",
    href: "https://www.avocadotreedigital.com/",
  },
  {
    name: "Health Locker",
    kind: "My own product",
    blurb:
      "Prescriptions, lab reports, medicines and vaccinations for a whole family in one place. Nothing goes to a doctor unless somebody in the family sends it.",
    image: "/work/healthlocker.png",
    alt: "The Health Locker home page, showing a family medical records app",
    href: "https://health-locker-chi.vercel.app/",
  },
  {
    name: "Dekhao Apna Talent",
    kind: "My own product",
    blurb:
      "Centres, students, registrations and payments for a national talent contest, run with Mind Mantra Abacus. Every centre owner signs into a panel of their own.",
    image: "/work/dekhao-apna-talent.png",
    alt: "The Dekhao Apna Talent admin panel sign-in screen",
    href: "https://talent.nexvoratechnologies.co.in",
  },
  {
    name: "MsgFlow",
    kind: "My own product",
    blurb:
      "Turns the orders and enquiries buried in WhatsApp groups into proper records, then runs the follow-up automatically. For traders who currently scroll back through chats to find an order.",
    image: "/work/msgflow.png",
    alt: "The MsgFlow sign-in screen",
    href: "https://msg-flow.vercel.app/dashboard",
  },
];

// Staged, not yet shown: real, but with no public URL to capture from and no
// file in public/work/, so putting it on the page would ship a broken image.
// To publish: give the live URL so it can be captured the same way as the rest,
// or save the PNG at the path named here, then move the entry into WORK.
export const PENDING_WORK: (WorkItem & { needs: string })[] = [
  {
    name: "Print Ready",
    kind: "My own product",
    blurb:
      "Drop in a stack of ID-card PDFs and get clean cards laid out on A4 with crop marks, at exactly 100% scale. Everything is processed in the browser, so the files never leave the machine.",
    image: "/work/printready.png",
    alt: "The Print Ready upload screen for bulk ID-card PDFs",
    href: null,
    needs: "live URL, or save the PNG at public/work/printready.png",
  },
];
