import { CONTACT } from "@/lib/site";

// The questions people actually ask on WhatsApp before they agree to anything.
// Answers are kept to what is true and already promised elsewhere on the page —
// nothing here should be a claim we cannot keep on a bad week.
export type Faq = { q: string; a: string };

export const FAQS: Faq[] = [
  {
    q: "I don't know what I need. Can I still message you?",
    a: "Yes. That is the normal way this starts. Tell me what your business does and what you want a customer to be able to do — see your products, book a slot, order something, find your shop. I will work out the rest and tell you what I think you need, and what you do not.",
  },
  {
    q: "How much will it cost?",
    a: "There is no one price, because a one-page website and a full online shop are not the same job. Tell me what you need and I will give you one number for it. You will know that number before any work starts.",
  },
  {
    q: "My job is very small. Will you even take it?",
    a: "Yes, and there is a whole price band for it — ₹499 to ₹12,999. A poster, a visiting card, a brochure, a flex or sunpack board, Facebook and Instagram post designs, a Facebook business page or YouTube channel set up, a presentation, a bio-data, a quotation or bill format, an Excel sheet that calculates, a 3-page website with a contact form, a small tool to replace one spreadsheet. Send it on WhatsApp; most of it comes back the same day and the smallest jobs within minutes. A lot of people start here before they ask me about a website, which is a sensible way to do it.",
  },
  {
    q: "How does the payment work?",
    a: "We agree it at the same time as the price, before any work starts, and it is written down with everything else. Small jobs are usually paid once you have the finished thing in your hand. Larger ones are split into stages so you are never paying far ahead of what has actually been done. Whatever we agree is what you pay — nothing is added to the bill later because the job turned out to be harder than I thought.",
  },
  {
    q: "Will the website be in my name or yours?",
    a: "Yours. Domain, hosting, Google and social accounts are registered to you wherever that is practical. If you ever want to move away from me, you take all of it with you and you do not need my permission.",
  },
  {
    q: "Can we meet face to face?",
    a: "Most of the work runs on phone, WhatsApp and video call, and that keeps your cost down. If you would rather sit across a table, say so and we will find somewhere in Kolkata to meet. Some jobs are better done face to face, and for those I will travel — whether yours is one of them is my decision, and I will tell you plainly either way. If I do come, you arrange the travel, the stay and the food, and I do not charge extra for the trip itself.",
  },
  {
    q: "Which language can I write to you in?",
    a: "Bengali, Hindi or English, whichever is easiest. A voice note is fine. So is a photograph of something you have written on paper.",
  },
  {
    q: "What if the work takes longer than you said?",
    a: "You hear it from me the same day I know, not after the date has passed. Sometimes a requirement turns out to be harder, or the plan needs changing. I would rather tell you an inconvenient truth early than a comfortable excuse late.",
  },
  {
    q: "I already have a website. Can you repair it instead?",
    a: "Often, yes. Send me the address and I will tell you honestly whether it is worth repairing or whether rebuilding it will cost you less in the end.",
  },
  {
    q: "Will I get a proper bill?",
    a: `A GST invoice for every rupee. Nexvora is a registered MSME — Udyam ${CONTACT.udyam} — with an office you can visit.`,
  },
];
