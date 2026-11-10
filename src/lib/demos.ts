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
// `group` is the heading the card sits under on /demos. With nearly forty
// samples a flat grid stops being scannable; a shopkeeper should find
// "Shops" and a doctor "Health" without reading every card. Groups appear
// in the order of DEMO_GROUPS, cards in the order they are listed here.
//
// These are labelled samples everywhere they appear — here, in the strip at
// the top of every demo, and in each demo's footer. /disclaimer promises that
// every example on this site says what it is, and an invented sweet shop with
// an invented address is exactly the case that promise was written for.
export type DemoGroup = (typeof DEMO_GROUPS)[number];

export const DEMO_GROUPS = [
  "Shops",
  "Health",
  "Classes and schools",
  "Fitness and beauty",
  "Food and events",
  "Services and trades",
] as const;

export type Demo = {
  slug: string;
  /** The invented business name on the demo itself. */
  name: string;
  /** The kind of business, in the customer's words. */
  kind: string;
  group: DemoGroup;
  blurb: string;
  image: string;
  alt: string;
};

export const DEMOS: Demo[] = [
  // ---- Shops -------------------------------------------------------------
  {
    slug: "sweets",
    name: "Mohini Mishtanna Bhandar",
    kind: "Sweet shop",
    group: "Shops",
    blurb:
      "A Bengali sweet shop: the counter, the price list, festival boxes and catering, with a WhatsApp button on every screen.",
    image: "/demo/sweets/images/hero.jpg",
    alt: "Sample website for a Bengali sweet shop",
  },
  {
    slug: "saree",
    name: "Sreemoyee Sarees",
    kind: "Saree and clothing shop",
    group: "Shops",
    blurb:
      "Handloom, Tant and Jamdani sarees, the bridal collection and blouse stitching, laid out like a catalogue.",
    image: "/demo/saree/images/hero.jpg",
    alt: "Sample website for a saree and ethnic clothing shop",
  },
  {
    slug: "tailor",
    name: "Rupashree Ladies Tailors",
    kind: "Tailor and boutique",
    group: "Shops",
    blurb:
      "A ladies' tailor: stitching charges by garment, delivery times, a measurement guide and a trial fitting on every order.",
    image: "/demo/tailor/images/hero.jpg",
    alt: "Sample website for a ladies' tailor and boutique",
  },
  {
    slug: "jewellery",
    name: "Swarnalata Jewellers",
    kind: "Jewellery shop",
    group: "Shops",
    blurb:
      "Hallmarked gold and silver: bridal sets, making charges explained with a worked bill, old gold exchange and an 11-month savings scheme.",
    image: "/demo/jewellery/images/hero.jpg",
    alt: "Sample website for a gold and silver jewellery shop",
  },
  {
    slug: "optical",
    name: "Nayan Opticals",
    kind: "Optical shop",
    group: "Shops",
    blurb:
      "Free eye test, frames to try, a lens comparison table, contact lenses, and glasses ready in two days.",
    image: "/demo/optical/images/hero.jpg",
    alt: "Sample website for an optical shop with eye testing",
  },
  {
    slug: "mobile-shop",
    name: "Ghosh Mobile World",
    kind: "Electronics and mobile shop",
    group: "Shops",
    blurb:
      "Phones by budget with EMI and exchange, screen and battery repair in two hours, accessories and small appliances.",
    image: "/demo/mobile-shop/images/hero.jpg",
    alt: "Sample website for a mobile phone and electronics shop",
  },
  {
    slug: "furniture",
    name: "Bosu Kaath Ghar",
    kind: "Wooden furniture shop",
    group: "Shops",
    blurb:
      "A furniture shop and workshop: beds, almirahs and dining sets in Sheesham and teak, custom orders and delivery.",
    image: "/demo/furniture/images/hero.jpg",
    alt: "Sample website for a wooden furniture shop",
  },
  {
    slug: "hardware-paint",
    name: "Bhowmick Hardware and Paints",
    kind: "Hardware and paint shop",
    group: "Shops",
    blurb:
      "Paints with shade matching, plumbing and electrical fittings, a sample price table, contractor rates and van delivery.",
    image: "/demo/hardware-paint/images/hero.jpg",
    alt: "Sample website for a hardware and paint shop",
  },
  {
    slug: "pharmacy",
    name: "Bhattacharya Medical Hall",
    kind: "Pharmacy",
    group: "Shops",
    blurb:
      "A medicine shop open till midnight: send a prescription on WhatsApp for delivery, generic options, BP and sugar checks, a monthly box for the elderly.",
    image: "/demo/pharmacy/images/hero.jpg",
    alt: "Sample website for a medicine shop",
  },

  // ---- Health ------------------------------------------------------------
  {
    slug: "clinic",
    name: "Mukherjee Clinic",
    kind: "Doctor and clinic",
    group: "Health",
    blurb:
      "One doctor's profile and clinic: qualifications, a consultation timings table, fees and what to bring to the first visit.",
    image: "/demo/clinic/images/hero.jpg",
    alt: "Sample website for a doctor's clinic",
  },
  {
    slug: "dental",
    name: "Sen Dental Care",
    kind: "Dental clinic",
    group: "Health",
    blurb:
      "Two dentists with a printed fee list: root canals, braces, implants, children's teeth and same-day help for toothache.",
    image: "/demo/dental/images/hero.jpg",
    alt: "Sample website for a dental clinic",
  },
  {
    slug: "pathology-lab",
    name: "Nabadiganta Diagnostics",
    kind: "Diagnostic and pathology lab",
    group: "Health",
    blurb:
      "Blood tests and full body packages, home collection from 6 am, reports on WhatsApp the same evening, ECG, X-ray and USG.",
    image: "/demo/pathology-lab/images/hero.jpg",
    alt: "Sample website for a pathology and diagnostic lab",
  },
  {
    slug: "homeopathy",
    name: "Arogya Niketan",
    kind: "Homeopathy and ayurveda clinic",
    group: "Health",
    blurb:
      "A homeopathic and an ayurvedic doctor under one roof: thirty-minute consultations, online follow-ups and medicines from the clinic.",
    image: "/demo/homeopathy/images/hero.jpg",
    alt: "Sample website for a homeopathy and ayurveda clinic",
  },

  // ---- Classes and schools ----------------------------------------------
  {
    slug: "coaching",
    name: "Dishari Coaching Centre",
    kind: "Coaching centre",
    group: "Classes and schools",
    blurb:
      "Coaching for Class 5 to 12: boards covered, subjects, batch size, how results are tracked, and a fee table.",
    image: "/demo/coaching/images/hero.jpg",
    alt: "Sample website for a school coaching centre",
  },
  {
    slug: "abacus",
    name: "Sankhya Abacus Academy",
    kind: "Abacus centre",
    group: "Classes and schools",
    blurb:
      "Abacus and mental arithmetic for ages 5 to 14: the levels, a free demo class, competitions and the questions parents ask.",
    image: "/demo/abacus/images/hero.jpg",
    alt: "Sample website for an abacus and mental arithmetic centre",
  },
  {
    slug: "computer-center",
    name: "Digital Disha Computer Centre",
    kind: "Computer training centre",
    group: "Classes and schools",
    blurb:
      "Computer training: basic computing, MS Office, Tally, DTP and typing, with batch timings and the certificate at the end.",
    image: "/demo/computer-center/images/hero.jpg",
    alt: "Sample website for a computer training centre",
  },
  {
    slug: "spoken-english",
    name: "Uttaran Spoken English Centre",
    kind: "Spoken English centre",
    group: "Classes and schools",
    blurb:
      "Spoken English for students, housewives and job seekers: ten to a batch, three-month courses, a free first demo class.",
    image: "/demo/spoken-english/images/hero.jpg",
    alt: "Sample website for a spoken English centre",
  },
  {
    slug: "dance",
    name: "Nupur Nritya Academy",
    kind: "Dance academy",
    group: "Classes and schools",
    blurb:
      "Bharatanatyam, Kathak, Rabindra Nritya and Bollywood batches, the teacher's profile and the annual show.",
    image: "/demo/dance/images/hero.jpg",
    alt: "Sample website for a dance academy",
  },
  {
    slug: "music-school",
    name: "Sur Sadhana Sangeet Vidyalaya",
    kind: "Music school",
    group: "Classes and schools",
    blurb:
      "Rabindra Sangeet, classical vocal, guitar, keyboard, tabla, harmonium and violin: small batches, exam prep and a stage every January.",
    image: "/demo/music-school/images/hero.jpg",
    alt: "Sample website for a music school",
  },
  {
    slug: "drawing",
    name: "Rong Tuli Art School",
    kind: "Drawing school",
    group: "Classes and schools",
    blurb:
      "Drawing and art classes for children and adults: pencil, watercolour, art-college entrance preparation and weekend batches.",
    image: "/demo/drawing/images/hero.jpg",
    alt: "Sample website for a drawing and art school",
  },
  {
    slug: "play-school",
    name: "Chotto Pakhi Play School",
    kind: "Play school",
    group: "Classes and schools",
    blurb:
      "A play school for ages 2 to 5: Playgroup to KG, a day at school from drop-off to pick-up, safety and admissions.",
    image: "/demo/play-school/images/hero.jpg",
    alt: "Sample website for a play school",
  },
  {
    slug: "activity-center",
    name: "Anondo Kids Activity Hub",
    kind: "Kids activity centre",
    group: "Classes and schools",
    blurb:
      "Dance, drawing, karate, music, abacus and spoken English under one roof, with a colour-coded weekly timetable.",
    image: "/demo/activity-center/images/hero.jpg",
    alt: "Sample website for a children's multi-activity centre",
  },

  // ---- Fitness and beauty ------------------------------------------------
  {
    slug: "gym",
    name: "Iron Para Gym",
    kind: "Gym and fitness centre",
    group: "Fitness and beauty",
    blurb:
      "A neighbourhood gym: weights floor, cardio, group classes, a women's hour, trainer profiles and three membership plans with the timings.",
    image: "/demo/gym/images/hero.jpg",
    alt: "Sample website for a gym and fitness centre",
  },
  {
    slug: "yoga",
    name: "Wellness Yoga Studio",
    kind: "Yoga studio",
    group: "Fitness and beauty",
    blurb:
      "A yoga studio: seven practices, small classes, online sessions and the timings, in calm greens.",
    image: "/demo/yoga/images/hero-balance-pose.jpg",
    alt: "Sample website for a yoga studio",
  },
  {
    slug: "salon",
    name: "Aalta Beauty Parlour",
    kind: "Beauty parlour and salon",
    group: "Fitness and beauty",
    blurb:
      "A ladies' parlour: haircut, facial, threading, hair spa, mehendi and a bridal package, with a fixed price list and appointments on WhatsApp.",
    image: "/demo/salon/images/hero.jpg",
    alt: "Sample website for a salon and beauty parlour",
  },

  // ---- Food and events ---------------------------------------------------
  {
    slug: "restaurant",
    name: "Kutum Bari Bhojonaloy",
    kind: "Restaurant and cafe",
    group: "Food and events",
    blurb:
      "A Bengali restaurant: a tabbed menu with prices, lunch and dinner timings, WhatsApp delivery within 3 km and party booking.",
    image: "/demo/restaurant/images/hero.jpg",
    alt: "Sample website for a Bengali restaurant and cafe",
  },
  {
    slug: "caterer",
    name: "Sreemoyee Caterers",
    kind: "Caterer",
    group: "Food and events",
    blurb:
      "Veg, non-veg and premium per-plate packages, event menus, live counters, booking steps with a 50% advance and what is included.",
    image: "/demo/caterer/images/hero.jpg",
    alt: "Sample website for a wedding and event caterer",
  },
  {
    slug: "bakery",
    name: "Anjali Cake House",
    kind: "Cake and bakery shop",
    group: "Food and events",
    blurb:
      "Custom, photo, eggless and wedding cakes, a price-by-weight table, one-day-ahead ordering and delivery within 5 km.",
    image: "/demo/bakery/images/hero.jpg",
    alt: "Sample website for a cake and bakery shop",
  },
  {
    slug: "banquet-hall",
    name: "Rajbari Banquets",
    kind: "Banquet and marriage hall",
    group: "Food and events",
    blurb:
      "Two AC halls for 150 and 400 guests, a per-day rate card by event, what is included, caterer rules and date checks on WhatsApp.",
    image: "/demo/banquet-hall/images/hero.jpg",
    alt: "Sample website for a banquet and marriage hall",
  },
  {
    slug: "event-decorator",
    name: "Sanyal Decorators and Tent House",
    kind: "Event decorator",
    group: "Food and events",
    blurb:
      "Wedding stage, haldi and birthday decoration, with pandal, chairs, lights and sound on hire and fixed packages with prices.",
    image: "/demo/event-decorator/images/hero.jpg",
    alt: "Sample website for an event decorator and tent house",
  },
  {
    slug: "photo-studio",
    name: "Chhobighar Studio",
    kind: "Photo studio",
    group: "Food and events",
    blurb:
      "Passport photos in ten minutes, wedding photo and video packages, pre-wedding, baby and product shoots, printing and framing.",
    image: "/demo/photo-studio/images/hero.jpg",
    alt: "Sample website for a photo studio",
  },

  // ---- Services and trades -----------------------------------------------
  {
    slug: "idol-maker",
    name: "Pal Pratima Shilpalaya",
    kind: "Idol maker in Kumartuli",
    group: "Services and trades",
    blurb:
      "An idol-making studio: the process from bamboo and straw to the painting of the eyes, the Pujo order calendar, and shipping abroad.",
    image: "/demo/idol-maker/images/hero.jpg",
    alt: "Sample website for an idol-making studio in Kumartuli",
  },
  {
    slug: "printing-press",
    name: "Mudrika Printing Works",
    kind: "Printing press",
    group: "Services and trades",
    blurb:
      "Visiting cards, bill books, flex banners, wedding cards, stickers and pamphlets: same-day printing, bulk rates and Kolkata delivery.",
    image: "/demo/printing-press/images/hero.jpg",
    alt: "Sample website for a printing press and flex shop",
  },
  {
    slug: "real-estate",
    name: "Bhattacharya Property Consultants",
    kind: "Real estate agent",
    group: "Services and trades",
    blurb:
      "Flats to buy or rent in New Town, Salt Lake and Baguiati, with brokerage stated plainly and site visits booked on WhatsApp.",
    image: "/demo/real-estate/images/hero.jpg",
    alt: "Sample website for a local real estate agent",
  },
  {
    slug: "travel-agent",
    name: "Bhraman Bilash Tours and Travels",
    kind: "Travel agent",
    group: "Services and trades",
    blurb:
      "Family packages to Digha, Puri, Darjeeling, Gangtok and Andaman with per-person prices, tickets, car hire and Char Dham.",
    image: "/demo/travel-agent/images/hero.jpg",
    alt: "Sample website for a travel agent",
  },
  {
    slug: "advocate",
    name: "Bhattacharya Law Chamber",
    kind: "Advocate's chamber",
    group: "Services and trades",
    blurb:
      "One advocate at Alipore Court and the High Court: practice areas, consultation fee, what to bring, chamber hours and a plain fee list.",
    image: "/demo/advocate/images/hero.jpg",
    alt: "Sample website for an advocate's chamber",
  },
  {
    slug: "tax-consultant",
    name: "Mukherjee Tax and Accounts",
    kind: "Tax consultant and accountant",
    group: "Services and trades",
    blurb:
      "Income tax returns, GST, company and shop registrations, TDS, audit and bookkeeping, with a fee table and a deadline calendar.",
    image: "/demo/tax-consultant/images/hero.jpg",
    alt: "Sample website for a tax consultant and accountant",
  },
  {
    slug: "garage",
    name: "Biswas Motor Works",
    kind: "Two-wheeler and car garage",
    group: "Services and trades",
    blurb:
      "Scooter, bike and car servicing with labour prices by vehicle type, time taken, a free 10-point check, pick-up and drop and insurance help.",
    image: "/demo/garage/images/hero.jpg",
    alt: "Sample website for a two-wheeler and car service garage",
  },
];
