// "What can I help you with?" — the plain-language grouping that sits in place
// of a wall of service cards.
//
// A shopkeeper does not search for "API integration". He knows he has two
// systems that do not talk to each other. So every line here is written as the
// thing the customer wants done, and the technical name is kept out of it. The
// longer, more technical list still exists in services.ts further down the page
// for anyone who wants the detail.
export type HelpGroup = {
  icon: string;
  title: string;
  lead: string;
  items: string[];
};

export const HELP_GROUPS: HelpGroup[] = [
  {
    icon: "storefront",
    title: "Get your business online",
    lead: "You want people to be able to find you, see what you do, and message you.",
    items: [
      "A website for your business",
      "A portfolio of your own work",
      "A single page for one offer or one course",
      "An online shop that takes payment",
      "A page where people book or send an enquiry",
      "Something that opens properly on a phone",
    ],
  },
  {
    icon: "campaign",
    title: "Get customers online",
    lead: "You already do good work. Not enough people around you know about it.",
    items: [
      "Come up on Google when someone searches nearby",
      "A Facebook page set up properly",
      "A YouTube channel set up properly",
      "A WhatsApp button on everything",
      "Posts and festival creatives every month",
      "Paid advertising to a budget you fix",
      "Enquiries coming to your phone",
    ],
  },
  {
    icon: "settings_suggest",
    title: "Make your work easier",
    lead: "You are running the business on Excel, a notebook and memory, and it has stopped working.",
    items: [
      "Software that remembers your customers and orders",
      "An admin panel only you and your staff can open",
      "Fees, orders or bookings kept in one place",
      "Follow-ups and enquiries that stop getting lost",
      "Reports you can actually read",
      "Two systems made to share information automatically",
    ],
  },
  {
    icon: "palette",
    title: "Make your business look professional",
    lead: "The work is good. The paperwork and the signage do not say so yet.",
    items: [
      "A logo",
      "Visiting cards",
      "Posters and flyers",
      "Brochures",
      "Designs for Facebook, Instagram and WhatsApp",
      "Letterhead, quotation and bill formats",
      "Excel sheets, presentations and bio-data",
    ],
  },
];
