// The sample websites — one invented business per kind of customer, each a
// complete standalone site under public/demo/<slug>/ (see public/demo/README.md).
//
// This list is what the /demos page and its cards read from. The folder is
// what actually serves the site, so a demo that exists in the folder but not
// here is reachable by link yet invisible on the page — add it here to show it.
//
// `image` is the demo's own hero photograph, served straight out of its
// folder. Every demo names that file hero.jpg on purpose, so this list never
// has to know what the picture is of. The card is therefore a real photograph
// from the real page, not a screenshot that goes stale the day the demo is
// edited.
//
// These are labelled samples everywhere they appear — here, in the strip at
// the top of every demo, and in each demo's footer. /disclaimer promises that
// every example on this site says what it is, and an invented sweet shop with
// an invented address is exactly the case that promise was written for.
export type Demo = {
  slug: string;
  /** The invented business name on the demo itself. */
  name: string;
  /** The kind of business, in the customer's words. */
  kind: string;
  blurb: string;
  image: string;
  alt: string;
};

export const DEMOS: Demo[] = [
  {
    slug: "sweets",
    name: "Mohini Mishtanna Bhandar",
    kind: "Sweet shop",
    blurb:
      "A Bengali sweet shop — the counter, the price list, festival boxes and catering, with a WhatsApp button on every screen.",
    image: "/demo/sweets/images/hero.jpg",
    alt: "Sample website for a Bengali sweet shop",
  },
  {
    slug: "saree",
    name: "Sreemoyee Sarees",
    kind: "Saree and clothing shop",
    blurb:
      "Handloom, Tant and Jamdani sarees, the bridal collection and blouse stitching, laid out like a catalogue.",
    image: "/demo/saree/images/hero.jpg",
    alt: "Sample website for a saree and ethnic clothing shop",
  },
  {
    slug: "clinic",
    name: "Mukherjee Clinic",
    kind: "Doctor and clinic",
    blurb:
      "One doctor's profile and clinic — qualifications, a consultation timings table, fees and what to bring to the first visit.",
    image: "/demo/clinic/images/hero.jpg",
    alt: "Sample website for a doctor's clinic",
  },
  {
    slug: "idol-maker",
    name: "Pal Pratima Shilpalaya",
    kind: "Idol maker in Kumartuli",
    blurb:
      "An idol-making studio — the process from bamboo and straw to the painting of the eyes, the Pujo order calendar, and shipping abroad.",
    image: "/demo/idol-maker/images/hero.jpg",
    alt: "Sample website for an idol-making studio in Kumartuli",
  },
  {
    slug: "computer-center",
    name: "Digital Disha Computer Centre",
    kind: "Computer centre",
    blurb:
      "Computer training — basic computing, MS Office, Tally, DTP and typing, with batch timings and the certificate at the end.",
    image: "/demo/computer-center/images/hero.jpg",
    alt: "Sample website for a computer training centre",
  },
  {
    slug: "activity-center",
    name: "Anondo Kids Activity Hub",
    kind: "Multi-activity centre",
    blurb:
      "Dance, drawing, karate, music, abacus and spoken English under one roof, with a colour-coded weekly timetable.",
    image: "/demo/activity-center/images/hero.jpg",
    alt: "Sample website for a children's multi-activity centre",
  },
  {
    slug: "coaching",
    name: "Dishari Coaching Centre",
    kind: "Coaching centre",
    blurb:
      "Coaching for Class 5 to 12 — boards covered, subjects, batch size, how results are tracked, and a fee table.",
    image: "/demo/coaching/images/hero.jpg",
    alt: "Sample website for a school coaching centre",
  },
  {
    slug: "abacus",
    name: "Sankhya Abacus Academy",
    kind: "Abacus centre",
    blurb:
      "Abacus and mental arithmetic for ages 5 to 14 — the levels, a free demo class, competitions and the questions parents ask.",
    image: "/demo/abacus/images/hero.jpg",
    alt: "Sample website for an abacus and mental arithmetic centre",
  },
  {
    slug: "dance",
    name: "Nupur Nritya Academy",
    kind: "Dance academy",
    blurb:
      "Bharatanatyam, Kathak, Rabindra Nritya and Bollywood batches, the teacher's profile and the annual show.",
    image: "/demo/dance/images/hero.jpg",
    alt: "Sample website for a dance academy",
  },
  {
    slug: "drawing",
    name: "Rong Tuli Art School",
    kind: "Drawing centre",
    blurb:
      "Drawing and art classes for children and adults — pencil, watercolour, art-college entrance preparation and weekend batches.",
    image: "/demo/drawing/images/hero.jpg",
    alt: "Sample website for a drawing and art school",
  },
  {
    slug: "play-school",
    name: "Chotto Pakhi Play School",
    kind: "Play school",
    blurb:
      "A play school for ages 2 to 5 — Playgroup to KG, a day at school from drop-off to pick-up, safety and admissions.",
    image: "/demo/play-school/images/hero.jpg",
    alt: "Sample website for a play school",
  },
  {
    slug: "furniture",
    name: "Bosu Kaath Ghar",
    kind: "Wooden furniture shop",
    blurb:
      "A furniture shop and workshop — beds, almirahs and dining sets in Sheesham and teak, custom orders and delivery.",
    image: "/demo/furniture/images/hero.jpg",
    alt: "Sample website for a wooden furniture shop",
  },
  {
    slug: "salon",
    name: "Aalta Beauty Parlour",
    kind: "Salon and beauty parlour",
    blurb:
      "A ladies' parlour — haircut, facial, threading, hair spa, mehendi and a bridal package, with a fixed price list and appointments on WhatsApp.",
    image: "/demo/salon/images/hero.jpg",
    alt: "Sample website for a salon and beauty parlour",
  },
  {
    slug: "gym",
    name: "Iron Para Gym",
    kind: "Gym and fitness centre",
    blurb:
      "A neighbourhood gym — weights floor, cardio, group classes, a women's hour, trainer profiles and three membership plans with the timings.",
    image: "/demo/gym/images/hero.jpg",
    alt: "Sample website for a gym and fitness centre",
  },
  {
    slug: "yoga",
    name: "Wellness Yoga Studio",
    kind: "Yoga studio",
    blurb:
      "A yoga studio — seven practices, small classes, online sessions and the timings, in calm greens.",
    image: "/demo/yoga/images/hero-balance-pose.jpg",
    alt: "Sample website for a yoga studio",
  },
];
