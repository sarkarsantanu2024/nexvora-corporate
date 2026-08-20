// The product grid on the home page. `href` is null for products whose
// subdomain is not live yet — those render as "Coming soon" instead of a link,
// so we never ship a card that 404s. To publish one: add its CNAME in GoDaddy,
// attach the domain in Vercel, wait for Valid Configuration, then set href here.
export type Product = {
  name: string;
  tagline: string;
  blurb: string;
  href: string | null;
  accent: string;
};

export const PRODUCTS: Product[] = [
  {
    name: "SocialPilot AI",
    tagline: "Facebook marketing on autopilot",
    blurb:
      "Generate, schedule and publish posts to Facebook Pages with AI. Built for multi-branch businesses that need every centre posting consistently.",
    href: "https://socialpilot.nexvoratechnologies.co.in",
    accent: "from-blue-500 to-indigo-600",
  },
  {
    name: "EduFlow",
    tagline: "School and coaching management",
    blurb:
      "Admissions, attendance, fees, exams and parent communication in one place — designed for schools and coaching centres.",
    href: "https://eduflow.nexvoratechnologies.co.in",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    name: "Dekhao Apna Talent",
    tagline: "Talent discovery platform",
    blurb:
      "A stage for performers to publish their work, build an audience and get discovered by organisers and sponsors.",
    href: "https://talent.nexvoratechnologies.co.in",
    accent: "from-fuchsia-500 to-purple-600",
  },
  {
    name: "Health Locker",
    tagline: "Personal medical records",
    blurb:
      // "Secure" is a claim with a standard behind it, and this one is not
      // live or tested yet. It says organised until it can say secure.
      "Keep prescriptions, reports and medical history in one organised place, shareable with any doctor in seconds.",
    href: null,
    accent: "from-rose-500 to-red-600",
  },
  {
    name: "Abacus Exam",
    tagline: "Online abacus assessments",
    blurb:
      "Conduct timed abacus and mental-maths examinations online, with automatic scoring and certificate generation.",
    href: null,
    accent: "from-amber-500 to-orange-600",
  },
  {
    name: "Print Ready",
    tagline: "Print job management",
    blurb:
      "Take print orders, track jobs through production and keep customers updated without the phone calls.",
    href: null,
    accent: "from-cyan-500 to-sky-600",
  },
  {
    name: "Tirupati Balaji Hospital",
    tagline: "Hospital website and enquiries",
    blurb:
      "Departments, doctor profiles, appointment enquiries and patient information for a multi-speciality hospital.",
    href: null,
    accent: "from-slate-500 to-slate-700",
  },
];
