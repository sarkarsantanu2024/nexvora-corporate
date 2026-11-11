import { CONTACT } from "@/lib/site";

// The questions people actually ask on WhatsApp before they agree to anything.
// Answers are kept to what is true and already promised elsewhere on the page —
// nothing here should be a claim we cannot keep on a bad week.
export type Faq = { q: string; a: string };

export const FAQS: Faq[] = [
  {
    q: "I don't know what I need. Can I still message you?",
    a: "Yes. That is the normal way this starts. Tell me what your business does and what you want a customer to be able to do: see your products, book a slot, order something, find your shop. I will work out the rest and tell you what I think you need, and what you do not.",
  },
  {
    q: "How much will it cost?",
    a: "Websites come as three plans: Just get me started at ₹5,999 (a five-page website with your Facebook, YouTube and Google Business Profile set up), Get my business online at ₹11,999 (the full plan, with logo, visiting card and post designs) and Run it yourself at ₹15,999 (the full plan plus a private edit panel so you can change the site yourself). On Run it yourself you can add the business dashboard for ₹500 a month on top of the monthly service, to run your customers, fees, stock and expenses from your phone. Small jobs run from ₹499. Anything bigger, like an online shop, gets its own number. You will know that number before any work starts.",
  },
  {
    q: "Can I change my website myself?",
    a: "Yes, on the Run it yourself plan (₹15,999). Once the plan is paid, a Login button appears on your website and opens a private edit panel that matches your website section by section. You can change text, photos, prices, phone number, address and social links any time, and hide a section you have no content for yet. The design stays protected, so nothing can break. On the other plans, just WhatsApp me the change.",
  },
  {
    q: "What does the business dashboard do?",
    a: "It is an add-on to the Run it yourself plan: ₹500 a month on top of the plan's monthly service. You and your staff log in from your own website and see one simple screen for the business: today's collection, pending fees or bills, who has not paid, expenses, stock, and a monthly or yearly report you can save as PDF. The screens change with the kind of business: a coaching centre sees students, batches and fees; a shop sees items, stock and bills; a clinic sees patients and appointments. It is made for a phone and for someone who has never used software before. One tap sends a WhatsApp reminder to anyone who owes you money.",
  },
  {
    q: "My job is very small. Will you even take it?",
    a: "Yes, and there is a whole price band for it: ₹499 to ₹12,999. A poster, a visiting card, a brochure, a flex or sunpack board, Facebook and Instagram post designs, a Facebook business page or YouTube channel set up, a presentation, a bio-data, a quotation or bill format, an Excel sheet that calculates, a QR-code menu page, a small tool to replace one spreadsheet. Send it on WhatsApp; most of it comes back the same day and the smallest jobs within minutes. A lot of people start here before they ask me about a website, which is a sensible way to do it.",
  },
  {
    q: "How does the payment work?",
    a: "We agree it at the same time as the price, before any work starts, and it is written down with everything else. Small jobs are usually paid once you have the finished thing in your hand. Larger ones are split into stages so you are never paying far ahead of what has actually been done. Whatever we agree is what you pay. Nothing is added to the bill later because the job turned out to be harder than I thought. If you ask for something that was not in what we agreed, that is a separate thing: I will tell you what it costs before I build it, and you decide.",
  },
  {
    q: "Will the website be in my name or yours?",
    a: "Yours. Domain, hosting, Google and social accounts are registered to you wherever that is practical, and they stay under your control. A few things genuinely cannot work that way: a payment gateway has its own account rules, some third-party services are billed through mine, and occasionally a customer would simply rather I hold the technical side. Where that happens I will say so at the time and tell you what it means. Everything that can be in your name is, and if you ever want to move away from me you take it with you without needing my permission.",
  },
  {
    q: "What happens after the website is live? Do I have to pay every month?",
    a: "Not unless you want to. The website is yours once it is paid for. Under Nexvora Care there is a small monthly service for each plan, from ₹399 to ₹799 a month, which is optional: it keeps the hosting, domain, backups and security in order and covers small changes as they come. The edit panel on Run it yourself is included in the plan. The business dashboard add-on on Run it yourself is ₹500 a month on top of that service, because it lives on a server and a database that I keep running, backed up and safe for you; it is switched on when the month is paid, and your website keeps working even if you stop. On top of that, what is optional is Nexvora Care, a monthly plan from ₹1,499 where I look after the hosting, the backups and the security and make the small changes as they come up: a new price, a new photograph, a new offer. If you change things every week (products, photographs, Facebook posts, YouTube videos), there is a ₹2,999 plan for that. Each plan says out loud what it includes, so nobody is guessing. Take it if you would rather not think about any of this, and leave it if you would.",
  },
  {
    q: "Can we meet face to face?",
    a: "Most of the work runs on phone, WhatsApp and video call, and that keeps your cost down. If you would rather sit across a table, say so and we will find somewhere in Kolkata to meet. Some jobs are better done face to face, and for those I will travel. Whether yours is one of them is my decision, and I will tell you plainly either way. If I do come, you arrange the travel, the stay and the food, and I do not charge extra for the trip itself.",
  },
  {
    q: "Which language can I write to you in?",
    a: "Bengali, Hindi or English, whichever is easiest. A voice note is fine. So is a photograph of something you have written on paper.",
  },
  {
    q: "What if the work takes longer than you said?",
    a: "You hear it from me the same day I know, not after the date has passed. Sometimes a requirement turns out to be harder, or the plan needs changing. If something changes, I will tell you, even when the news is not good.",
  },
  {
    q: "I already have a website. Can you repair it instead?",
    a: "Often, yes. Send me the address and I will tell you honestly whether it is worth repairing or whether rebuilding it will cost you less in the end.",
  },
  {
    q: "Will I get a proper bill?",
    a: `A proper invoice for every job, with the payment terms we agreed written on it. Nexvora is a registered MSME (Udyam ${CONTACT.udyam}) based in Kolkata.`,
  },
];
