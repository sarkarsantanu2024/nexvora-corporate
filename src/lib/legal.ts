import type { Metadata } from "next";
import { CONTACT, OG_IMAGE, SITE_URL } from "@/lib/site";

/**
 * The legal pages, written once and rendered by one component.
 *
 * These are the pages nobody reads until something has gone wrong, which is
 * exactly why they are written in the same plain words as the rest of the
 * site. A shopkeeper who is upset about a bill should be able to read the
 * refund page once and know where he stands. Anything that needed a lawyer to
 * decode would be worse than nothing, because it would look like the small
 * print he was warned about.
 *
 * Two rules held while writing them:
 *
 * 1. Nothing here may say something the site does not actually do. The site is
 *    static, there is no server, the enquiry form hands the message to
 *    WhatsApp, and Google Analytics is the only thing that sets a cookie. The
 *    privacy and cookie pages say precisely that, so a reader who opens the
 *    page source finds it agrees with them.
 * 2. Nothing here may quietly take back a promise made on the sales pages. The
 *    price, payment, ownership and third-party-cost wording is the same
 *    wording as /price and /faq, because a terms page that contradicts the
 *    page that sold the job is how customers stop trusting you.
 */

/** Shown at the top of every legal page and in the footer. */
export const LEGAL_UPDATED = "21 August 2026";

/** The same date, for the sitemap. */
export const LEGAL_UPDATED_AT = new Date("2026-08-21");

export type LegalBlock =
  | { p: string }
  | { list: string[] }
  /** A short line that matters more than the paragraph around it. */
  | { callout: string };

export type LegalSection = {
  heading: string;
  blocks: LegalBlock[];
};

export type LegalDoc = {
  slug: string;
  /** Footer and breadcrumb label. Short. */
  label: string;
  eyebrow: string;
  /** The h1. */
  title: string;
  intro: string;
  icon: string;
  motif: string[];
  metaTitle: string;
  metaDescription: string;
  sections: LegalSection[];
};

const WHO =
  `Nexvora Technologies is a one-person technology business run by Santanu Sarkar from ${CONTACT.location}. It is a registered MSME, Udyam ${CONTACT.udyam}. There is no office you can walk into and no staff — when this page says "I", it means Santanu Sarkar, and when it says "you", it means the person or business using this website or buying work from me.`;

const REACH_ME = `You can reach me on WhatsApp at ${CONTACT.phoneDisplay}, or by email at ${CONTACT.email}. Bengali, Hindi or English is fine, and a voice note is fine.`;

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "/privacy",
    label: "Privacy",
    eyebrow: "Privacy",
    title: "What I know about you, and what I do with it.",
    intro:
      "This website has no login, no account and no database. It does not ask you for anything. The only things I ever hold about you are the messages you choose to send me and the bills for work you have paid for. This page says that properly, and says what the few outside services involved can see.",
    icon: "lock",
    motif: ["shield", "visibility_off", "chat", "receipt_long", "delete"],
    metaTitle: "Privacy Policy",
    metaDescription:
      "What Nexvora Technologies collects, what it does not, which outside services see anything, how long messages and bills are kept, and how to ask for your information to be deleted.",
    sections: [
      {
        heading: "Who this is about",
        blocks: [
          { p: WHO },
          {
            p: "I decide what happens to the information described on this page, so under the Digital Personal Data Protection Act, 2023 I am the data fiduciary for it. If you want something changed or deleted, I am the person to ask — there is nobody else to be passed on to.",
          },
        ],
      },
      {
        heading: "The website itself collects nothing",
        blocks: [
          {
            p: "There is no server behind this site. The pages are files, served as they are, and there is no place for anything you type to be stored. That is not a policy decision I could quietly reverse next month — it is how the site is built.",
          },
          {
            p: "The enquiry form on the contact page does not send anything anywhere. As you fill it in, it writes a WhatsApp or email message for you in your own browser. When you press the button, your phone or computer opens WhatsApp or your email app with that message ready. You can read it, change it, or close it and send nothing. Nothing leaves your device until you send it yourself.",
          },
          {
            p: "The price calculator works the same way. The choices you make and the total it shows stay in your browser. They are not saved, and I never see them unless you send them to me.",
          },
          { callout: "If you never message me, I do not know you were here." },
        ],
      },
      {
        heading: "What I hold once you do message me",
        blocks: [
          {
            p: "When you contact me, I have whatever you chose to put in the message. In practice that is usually:",
          },
          {
            list: [
              "Your name, and the name of your business",
              "Your phone number or email address, because that is what you wrote from",
              "Your town or city, if you told me",
              "What you want built, and roughly what you want to spend",
              "Anything you send me for the job — photographs, your logo, price lists, text, documents",
            ],
          },
          {
            p: "If you go ahead with a job, I also hold the bill and the record of payment. If the job involves a domain, hosting, a Google Business Profile or a social account, I will need the details to set those up in your name.",
          },
          {
            p: "I do not ask for and do not want your Aadhaar, your PAN unless a bill genuinely requires it, your bank passwords, your card numbers or your OTPs. Nobody from Nexvora will ever ask you for an OTP. If somebody claiming to be me does, it is not me.",
          },
        ],
      },
      {
        heading: "What I use it for",
        blocks: [
          {
            list: [
              "Answering you, and understanding what you need",
              "Quoting the job, and telling you what it will cost",
              "Doing the work you asked for",
              "Raising the bill and keeping the record of it",
              "Telling you about something that affects work I built for you — a renewal coming up, or something that has broken",
            ],
          },
          {
            p: "I do not sell your information, rent it, or hand it to anyone for marketing. I do not add you to a mailing list because you enquired once. If I ever want to show your work as an example, I ask you first, and you can say no without it changing anything else.",
          },
        ],
      },
      {
        heading: "The outside services involved",
        blocks: [
          {
            p: "A small site still touches a few other companies. These are all of them:",
          },
          {
            list: [
              "Vercel, in the United States, serves these pages. Like any web host it records the ordinary details of a request — the address the page was asked from, roughly when, and what browser was used.",
              "Google Analytics counts visits, so I know which pages people actually read. It is set up to measure pages, not people. More about this, and how to switch it off, is on the cookies page.",
              "Google Fonts supplies the three typefaces this site uses. Your browser fetches them from Google, which means Google sees the request. No cookie is set by it.",
              "WhatsApp, which is Meta, carries the messages you send me there. Their terms apply to that conversation as much as mine do.",
              "Gmail, which is Google, holds email you send me.",
              "Where a job needs one, the domain registrar, the hosting company, or a payment gateway such as Razorpay. These are set up in your name wherever that is possible, and you deal with them directly.",
            ],
          },
          {
            p: "I have no control over what these companies do with what passes through them. What I can tell you is that I do not give them anything about you beyond what the service itself needs to work.",
          },
        ],
      },
      {
        heading: "How long I keep it",
        blocks: [
          {
            p: "WhatsApp and email conversations stay in those apps. I do not clear them out on a schedule, because a customer coming back after two years usually wants me to remember what was agreed the first time.",
          },
          {
            p: "Bills and payment records I keep as long as the law requires me to keep the records of a sale, which is a few years, and I cannot delete those on request while that period is running.",
          },
          {
            p: "Files you sent for a job — photographs, logos, documents — I keep while the work is live and for a reasonable time after, in case you need something rebuilt. Ask me to delete them and I will.",
          },
        ],
      },
      {
        heading: "How it is kept safe",
        blocks: [
          {
            p: "Honestly: this is a one-person business, not a bank. Your messages sit in WhatsApp and Gmail, both of which are locked with a password and two-step verification. Files sit on my own machine and its backup. Nobody else has access to any of it.",
          },
          {
            p: "If something ever went wrong and your information was exposed, I would tell you, and tell you what had happened, rather than hope you did not notice.",
          },
        ],
      },
      {
        heading: "What you can ask me for",
        blocks: [
          {
            list: [
              "A copy of what I hold about you",
              "A correction, if something is wrong",
              "Deletion of what I hold, except the bills the law makes me keep",
              "That I stop contacting you, which I will, immediately",
            ],
          },
          {
            p: `Just ask. There is no form and no fee. Message me on WhatsApp at ${CONTACT.phoneDisplay} or email ${CONTACT.email} and I will do it, normally within a few days.`,
          },
          {
            p: "If you are not happy with how I handled a request about your information, write to me first and say so plainly — it is a small business and most things are a misunderstanding. If that goes nowhere, the Digital Personal Data Protection Act, 2023 gives you the right to complain to the Data Protection Board of India.",
          },
        ],
      },
      {
        heading: "Children",
        blocks: [
          {
            p: "This is a website for businesses. It is not aimed at children and I do not knowingly take information from anyone under 18. If a child has sent me something, tell me and I will delete it.",
          },
        ],
      },
      {
        heading: "If this page changes",
        blocks: [
          {
            p: `This page was last changed on ${LEGAL_UPDATED}. If the way the site works changes, this page changes with it on the same day. There is no archive of old versions — what is on this page is what is true today.`,
          },
          { p: REACH_ME },
        ],
      },
    ],
  },

  {
    slug: "/terms",
    label: "Terms of use",
    eyebrow: "Terms",
    title: "The rules, in the same plain words as everything else.",
    intro:
      "Two different things are covered here: using this website, which is free and open to anyone, and buying work from me, which is not. The second one matters more. Nothing on this page takes back a promise made anywhere else on this site — if you ever find a place where it seems to, the promise wins.",
    icon: "gavel",
    motif: ["handshake", "description", "payments", "schedule", "balance"],
    metaTitle: "Terms of Use",
    metaDescription:
      "What is agreed when you use this website or buy work from Nexvora Technologies — prices, payment, what you supply, who owns the finished work, timelines, and what I am and am not responsible for.",
    sections: [
      {
        heading: "Who you are agreeing with",
        blocks: [
          { p: WHO },
          {
            p: "By using this website you accept the terms on this page. If a part of it does not suit you, say so before we start work rather than after — most of it can be discussed.",
          },
        ],
      },
      {
        heading: "What actually forms our agreement",
        blocks: [
          {
            p: "The job itself is governed by what you and I agreed in writing before the work started — the price, what is included, and when you pay. That is normally a WhatsApp message or an email, followed by the invoice. It is the real agreement.",
          },
          {
            p: "This page fills in everything we did not discuss. If this page and what we agreed for your job disagree, what we agreed for your job is what counts.",
          },
          {
            callout:
              "Nothing starts until you know the price. That is the whole way this business works, and it is not something buried in a terms page.",
          },
        ],
      },
      {
        heading: "Prices",
        blocks: [
          {
            p: "The fixed prices published on the price page are real prices for those exact jobs, and they are what you pay for them. They are between ₹499 and ₹12,999 because those are the jobs small enough that quoting each one separately wastes more of your time than doing it.",
          },
          {
            p: "Anything larger is quoted on its own after we have talked, and the price calculator on this site gives an estimate to argue with, not a bill.",
          },
          {
            p: "Once a price is agreed for your job, that is the price. Nothing gets added later because the work turned out harder than I expected. If you ask for something that was not in what we agreed, that is a separate thing — I tell you what it costs before I build it, and you decide.",
          },
          {
            p: "Published prices can change for future jobs. A price already agreed with you does not change. Any tax that applies by law is shown on the invoice.",
          },
        ],
      },
      {
        heading: "What is never inside the price",
        blocks: [
          {
            p: "Some costs are paid to other companies, not to me, and they are never part of any figure I quote:",
          },
          {
            list: [
              "The domain name, bought in your name and renewed every year",
              "Hosting and business email, billed by the hosting company",
              "Printing and courier, which are paid at what they actually cost",
              "Advertising budget paid to Google or Meta, on your own card",
              "Payment gateway charges, which are a percentage taken by Razorpay or Stripe",
              "SMS and WhatsApp API charges, billed per message by the provider",
            ],
          },
          {
            p: "I will tell you what these come to before you commit to any of them, and I do not add anything on top of what they cost.",
          },
        ],
      },
      {
        heading: "Payment",
        blocks: [
          {
            p: "How you pay is agreed at the same time as the price, before work starts, and it is written down with everything else.",
          },
          {
            p: "Small jobs are usually paid once you have the finished thing in your hand. Larger ones are split into stages, so you are never paying far ahead of what has actually been done, and a stage payment falls due when that stage is delivered.",
          },
          {
            p: "You get a proper invoice for every job, with the terms we agreed written on it. If an invoice sits unpaid, I will chase it by WhatsApp before I do anything else — but work stops until it is settled, and files, source material and accounts are handed over once the job is paid for in full.",
          },
        ],
      },
      {
        heading: "What you need to give me",
        blocks: [
          {
            p: "Most jobs need something from you: your text, your photographs, your logo, your price list, access to an account. The date I give you assumes those arrive when I ask for them. If they do not, the date moves — that is arithmetic, not a penalty.",
          },
          {
            p: "What you send me has to be yours to send. If you give me a photograph, a font, a logo or a piece of writing that belongs to somebody else, and they come after it, that is on you and not on me. If you are not sure whether you have the right to use something, ask me and we will find something you clearly do.",
          },
          {
            p: "I will not build something illegal, something designed to mislead people, or something that pretends to be a business it is not. I would rather lose the job.",
          },
        ],
      },
      {
        heading: "Changes and approval",
        blocks: [
          {
            p: "Reasonable changes while a job is in progress are normal and expected — that is what a draft is for. Redoing something from the beginning because you have changed your mind about the whole idea is a new job, and I will tell you what it costs before I start it.",
          },
          {
            p: "When you approve a design or a page, that is the version that gets built, printed or published. For anything that goes to a printing press, the proof you approve is what gets printed, and a mistake in an approved proof cannot be undone afterwards. Read it properly — the spelling of a name, the phone number, the date.",
          },
        ],
      },
      {
        heading: "Who owns the finished work",
        blocks: [
          {
            p: "You do, once the job is paid for in full. The design, the pages, the files — yours, to use, change, or hand to somebody else later.",
          },
          {
            p: "The domain, the hosting, and your Google and social accounts are registered in your name wherever that is practical, and they stay under your control. A few things genuinely cannot work that way — a payment gateway has its own account rules, and some services are billed through mine. Where that happens I say so at the time. If you ever want to move away from me, you take everything with you and you do not need my permission.",
          },
          {
            p: "Two things stay mine. The tools and general code I reuse across jobs remain mine to reuse. And unless you tell me not to, I may show the finished work as an example of what I do — a screenshot, your business name, a link. Say the word and I will not.",
          },
        ],
      },
      {
        heading: "Timelines",
        blocks: [
          {
            p: "Dates I give you are honest estimates from someone who has done the job before, not guarantees underwritten by a large company.",
          },
          {
            p: "If something is going to be late, you hear it from me the same day I know, not after the date has passed. Delays caused by waiting for your content, your approval or a third party's account move the date by the same amount.",
          },
        ],
      },
      {
        heading: "The monthly care plans",
        blocks: [
          {
            p: "Nexvora Care is optional and always has been. Your website is yours once it is paid for, and it keeps working whether or not you ever pay me again.",
          },
          {
            p: "Each plan states out loud how much of my time it includes each month. That allowance does not roll over into the next month. Looking after what already exists is inside the plan; building something new is not, and the price page lists exactly which is which.",
          },
          {
            p: "You can stop a plan whenever you like — see the refunds page for what happens to money already paid. If I ever have to stop offering a plan, you get a month's notice.",
          },
        ],
      },
      {
        heading: "What I do not promise",
        blocks: [
          {
            p: "I will not tell you what you want to hear in order to get a job, and this is the part where that costs me something.",
          },
          {
            list: [
              "Nobody can guarantee a position in Google results. I will build the site properly, mark it up correctly and set your Google Business Profile up so that it has a fair chance, and anyone who promises you the first place is guessing or lying.",
              "I cannot guarantee sales, enquiries or visitors. A website makes you findable and credible; it does not make people want what you sell.",
              "Software has bugs. I fix what I built when you find something wrong with it, but no site anywhere is perfect on the first day.",
              "Hosting companies, Google, Meta and payment gateways go down sometimes, change their rules, and occasionally close accounts. When that happens I will help you sort it out, but the outage is not mine and I cannot promise it will not happen.",
            ],
          },
        ],
      },
      {
        heading: "How far my responsibility goes",
        blocks: [
          {
            p: "If I get something wrong, I fix it. That is the first and usually the only remedy either of us needs.",
          },
          {
            p: "Beyond that, if it ever came to money, what I can be held liable for is limited to what you actually paid me for that job. I am not liable for business you believe you lost, profits you expected, or costs somebody else charged you — and not for anything caused by a third-party service failing, by content you supplied, or by changes somebody else made to the work after I handed it over.",
          },
          {
            p: "None of this limits anything that cannot lawfully be limited.",
          },
        ],
      },
      {
        heading: "Using this website",
        blocks: [
          {
            p: "Read it, share it, quote it, send the link to anyone. What you may not do is copy the pages, the writing, the design or the images to pass off as your own, or scrape the site to rebuild it somewhere else. The words and the layout of this site are mine.",
          },
          {
            p: "Screenshots of work built for clients are shown with their business names because that work is public. Those names and logos belong to those businesses. Google, Meta, WhatsApp, Razorpay and the other product names on this site belong to their owners, and mentioning them does not mean they endorse me.",
          },
          {
            p: "Links out to other sites are there because they are useful. What is on the other end is not mine and is not something I check regularly.",
          },
        ],
      },
      {
        heading: "If we ever disagree",
        blocks: [
          {
            p: "Message me first and say what is wrong. Almost everything gets sorted out in one conversation, and I would far rather fix it than argue about it.",
          },
          {
            p: `If it cannot be sorted out that way, Indian law applies and the courts at ${CONTACT.city}, ${CONTACT.state} have jurisdiction.`,
          },
        ],
      },
      {
        heading: "If this page changes",
        blocks: [
          {
            p: `This page was last changed on ${LEGAL_UPDATED}. A change here applies to work agreed after that date, never backwards to a job we already shook hands on.`,
          },
          { p: REACH_ME },
        ],
      },
    ],
  },

  {
    slug: "/refunds",
    label: "Refunds",
    eyebrow: "Refunds and cancellation",
    title: "If you want to stop, here is exactly what happens to your money.",
    intro:
      "Nobody enjoys this conversation, so it is written down before it is needed. The short version: you pay for work that has been done, you do not pay for work that has not, and money already spent with somebody else cannot come back from me.",
    icon: "currency_exchange",
    motif: ["undo", "payments", "handshake", "schedule", "receipt_long"],
    metaTitle: "Refund and Cancellation Policy",
    metaDescription:
      "When Nexvora Technologies refunds money and when it does not — cancelling before work starts, cancelling part-way, delivered work, third-party costs like domains and printing, and the monthly care plans.",
    sections: [
      {
        heading: "The rule everything else follows",
        blocks: [
          {
            callout:
              "You pay for the work that has been done. Anything not done comes back to you.",
          },
          {
            p: "Everything below is just that rule applied to particular situations. If your situation is not on this page, that sentence is the answer.",
          },
        ],
      },
      {
        heading: "Before work starts",
        blocks: [
          {
            p: "Changed your mind before I have begun? Tell me and you get back everything you have paid, in full. No questions and no deduction. This happens sometimes and it is fine.",
          },
        ],
      },
      {
        heading: "Once work has started",
        blocks: [
          {
            p: "Tell me you want to stop and I stop that day. Then I tell you honestly how much of the job was done, you pay for that part, and the rest comes back to you.",
          },
          {
            p: "I show you what was done — the drafts, the pages, the designs as they stand — so you can see the assessment is fair rather than take my word for it. You keep those files for the part you paid for.",
          },
          {
            p: "If we cannot agree on how much was done, I would rather settle in your favour than have you tell people I kept your money.",
          },
        ],
      },
      {
        heading: "Once the work is delivered",
        blocks: [
          {
            p: "After you have approved and received the finished work, the job is paid for and there is no refund. You have the thing.",
          },
          {
            p: "What you do still get is this: if the finished work is not what we agreed, or something in it is genuinely broken, I fix it. That is not a favour and there is no time limit on my own mistakes.",
          },
          {
            p: "What is not a refund reason: deciding afterwards that you wanted a different design, wanting to change the whole idea after approving it, or a mistake that was in a proof you approved.",
          },
        ],
      },
      {
        heading: "Printed work",
        blocks: [
          {
            p: "Printing is the one place where a mistake cannot be undone. Once you approve a proof and it goes to the press, that print run is spent — the press bill cannot come back from me, and neither can the courier.",
          },
          {
            p: "If the error was mine and the approved proof shows it, I redo the design free and pay for the reprint. If the approved proof was correct and the printing came out wrong, that is between me and the press, and I will sort it out for you.",
          },
        ],
      },
      {
        heading: "Money already paid to somebody else",
        blocks: [
          {
            p: "These are never refundable by me, because I never had them:",
          },
          {
            list: [
              "A domain name, once registered. It is yours for the year, in your name, and registrars do not take them back.",
              "Hosting, once bought for a period.",
              "Printing and courier, once the job has gone to the press.",
              "Advertising budget, once Google or Meta has spent it.",
              "Payment gateway charges taken on a transaction.",
            ],
          },
          {
            p: "This is exactly why I tell you what each of these costs before you buy it, rather than after.",
          },
        ],
      },
      {
        heading: "The monthly care plans",
        blocks: [
          {
            p: "Stop whenever you like. There is no notice period and no cancellation charge — send one WhatsApp message.",
          },
          {
            list: [
              "On a monthly plan, it runs to the end of the month you have paid for and then stops. That month is not refunded, because the hosting, the backups and the watching all ran.",
              "On a yearly plan, I refund the whole months you have not used. Part-months are not split.",
              "The time allowance in a plan does not carry over and is not refunded if you did not use it. That is what a plan is — it is there whether you needed it that month or not.",
            ],
          },
          {
            p: "Your website does not switch off when a plan ends. It is yours, it keeps working, and I hand over whatever you need to take it elsewhere.",
          },
        ],
      },
      {
        heading: "If I am the one who stops",
        blocks: [
          {
            p: "If I cannot finish a job — I am ill, I have taken on something beyond what I can honestly do, or life gets in the way — you get back everything you paid for the part that was not done, and you keep the part that was.",
          },
          {
            p: "If it is my fault that we got there, I will also help you hand the work to somebody else, with the files and an explanation of where things stand, at no charge.",
          },
        ],
      },
      {
        heading: "How a refund actually reaches you",
        blocks: [
          {
            p: "Back the same way it came — the same UPI ID, the same bank account, the same card. I do not issue refunds as credit notes or as free work you did not ask for, unless you would rather have that.",
          },
          {
            p: "Ask on WhatsApp or by email. I will tell you the amount and the reasoning within two working days, and send it within seven working days of us agreeing the figure. A card or gateway refund can take a few more days to appear on your statement, which is the bank's timing and not mine.",
          },
        ],
      },
      {
        heading: "If you think this has been applied unfairly",
        blocks: [
          {
            p: "Say so, to me, in whatever words you like. A small business lives on what its customers say about it, and no amount of money on a single job is worth being the person who kept it.",
          },
          { p: REACH_ME },
          {
            p: `This page was last changed on ${LEGAL_UPDATED}.`,
          },
        ],
      },
    ],
  },

  {
    slug: "/cookies",
    label: "Cookies",
    eyebrow: "Cookies",
    title: "One cookie, and it is Google counting visits.",
    intro:
      "Most cookie pages are long because most sites carry a dozen trackers. This one is short. This site sets no cookies of its own, has no advertising pixels and no chat widget. Google Analytics is the only thing here that stores anything in your browser, and this page tells you how to stop it.",
    icon: "cookie",
    motif: ["analytics", "toggle_off", "visibility", "font_download", "block"],
    metaTitle: "Cookie Policy",
    metaDescription:
      "The only cookies on nexvoratechnologies.co.in are Google Analytics cookies used to count visits. No advertising pixels, no tracking widgets, and here is how to switch it off.",
    sections: [
      {
        heading: "What a cookie is, in one line",
        blocks: [
          {
            p: "A cookie is a small note a website leaves in your browser so it can recognise the same browser next time. It is not a program and it cannot read anything else on your device.",
          },
        ],
      },
      {
        heading: "What this site sets",
        blocks: [
          {
            p: "Google Analytics, and nothing else. It writes two cookies — one usually named _ga and one starting _ga_ — which tell it whether this browser has been here before and whether this is one visit or two. They last up to two years unless you clear them.",
          },
          {
            p: "What I actually look at is which pages people read and roughly where in the country they came from. It tells me whether the price page is doing its job. I am not building a profile of you, I could not identify you from it, and no advertising is run off it.",
          },
          {
            callout:
              "No advertising pixels. No Facebook pixel. No chat widget. No cookie from Nexvora itself — there is no server here to set one.",
          },
        ],
      },
      {
        heading: "Things that are not cookies but you should still know about",
        blocks: [
          {
            list: [
              "The three typefaces on this site load from Google Fonts. That sets no cookie, but your browser does ask Google for the files, so Google sees the request.",
              "The web host, Vercel, keeps ordinary request logs the way every web host does. That is not a cookie either.",
              "The WhatsApp and phone buttons are plain links. Nothing happens until you press one, and then you are in WhatsApp or your phone app, under their terms.",
            ],
          },
        ],
      },
      {
        heading: "How to switch it off",
        blocks: [
          {
            list: [
              "Block or delete cookies in your browser settings. Every browser can do it, and this site works perfectly without them.",
              "Install Google's own Analytics opt-out add-on, which stops it on every site, not just this one.",
              "Use a private or incognito window, which throws the cookies away when you close it.",
            ],
          },
          {
            p: "Nothing on this site is behind a cookie. Refuse all of them and every page, the price calculator and the enquiry form work exactly as they do now.",
          },
        ],
      },
      {
        heading: "If this changes",
        blocks: [
          {
            p: `Last changed on ${LEGAL_UPDATED}. If I ever add something that sets a cookie — a chat widget, an advertising pixel — this page changes on the same day, before it goes live. More about the rest of it is on the privacy page.`,
          },
        ],
      },
    ],
  },

  {
    slug: "/disclaimer",
    label: "Disclaimer",
    eyebrow: "Disclaimer",
    title: "What this website is, and what it is not.",
    intro:
      "This site is where I explain what I do and what it costs. It is written carefully and kept up to date, but it is a sales website, not a contract, not advice, and not a guarantee of what your business will achieve.",
    icon: "info",
    motif: ["help", "link", "trending_up", "verified", "photo_library"],
    metaTitle: "Disclaimer",
    metaDescription:
      "Prices on this site are indicative until confirmed, examples are labelled as client work or demonstrations, and no result in Google or in sales is guaranteed.",
    sections: [
      {
        heading: "The prices",
        blocks: [
          {
            p: "The fixed prices are real and I stand behind them for the jobs they name. Everything else on the price page, and everything the calculator produces, is an estimate meant to give you a sense of the number before you talk to me.",
          },
          {
            p: "Your actual price is the one I give you for your actual job, in writing, before any work starts. That is the only figure that binds either of us.",
          },
        ],
      },
      {
        heading: "The examples",
        blocks: [
          {
            p: "Every screenshot in the examples section is of something that genuinely exists and runs. Nothing there is a template preview or a mock-up.",
          },
          {
            p: "Each one is labelled for what it is: my own product, work built for a client, or a demonstration I built myself to show what is possible. Read the label. A demonstration site is not a customer, and it is marked that way so nobody assumes an endorsement that was never given.",
          },
          {
            p: "Photographs of shops, markets and people elsewhere on this site are there to illustrate the kind of business I work with. They are not customers unless the page says so.",
          },
        ],
      },
      {
        heading: "Results",
        blocks: [
          {
            p: "Nothing on this site should be read as a promise of a position in Google, a number of enquiries, or an amount of sales. I build the thing properly and give it a fair chance. What happens next depends on your business, your prices, your competition and your market, none of which I control.",
          },
          {
            p: "Where a page mentions a result from past work, it is what happened for that business. It is not a forecast for yours.",
          },
        ],
      },
      {
        heading: "Advice",
        blocks: [
          {
            p: "I will tell you what I honestly think about your website, your online presence and what is worth spending money on. That is a builder's opinion, not legal, tax, financial or business advice, and it should not be the only thing you rely on for a decision that matters.",
          },
          {
            p: "Anything on this site about registration, tax or the law is general and may be out of date. Check it with somebody qualified before you act on it.",
          },
        ],
      },
      {
        heading: "Other people's sites and names",
        blocks: [
          {
            p: "Links out to other websites are there because they are useful. I do not control them, I do not check them regularly, and a link is not an endorsement of everything on the other end.",
          },
          {
            p: "Product and company names on this site — Google, Meta, WhatsApp, Vercel, Razorpay, and the businesses whose work is shown — belong to their owners. They are named because they are part of the work, not because they are connected to me.",
          },
        ],
      },
      {
        heading: "Keeping it accurate",
        blocks: [
          {
            p: "Prices, capabilities and examples change, and I update this site rather than let it drift. Even so, something on a page may be behind. If you spot anything here that is wrong or out of date, tell me and I will fix it that day.",
          },
          { p: REACH_ME },
          { p: `Last changed on ${LEGAL_UPDATED}.` },
        ],
      },
    ],
  },
];

/** Footer links and sitemap entries, driven off the documents themselves. */
export const LEGAL_LINKS = LEGAL_DOCS.map((d) => ({
  href: d.slug,
  label: d.label,
}));

export function legalDoc(slug: string): LegalDoc {
  const doc = LEGAL_DOCS.find((d) => d.slug === slug);
  // A page file asking for a slug that does not exist is a build-time mistake,
  // not something to render an empty page for.
  if (!doc) throw new Error(`No legal document for ${slug}`);
  return doc;
}

/** The canonical URL for a legal page. */
export function legalUrl(slug: string): string {
  return `${SITE_URL}${slug}`;
}

/**
 * The metadata for a legal page, built from the document itself.
 *
 * Written once here rather than copied into five page files, where the fifth
 * copy is always the one that ends up with another page's canonical URL in it.
 * The OG image is spread in deliberately: a route that sets its own
 * `openGraph` replaces the parent's wholesale rather than inheriting it.
 */
export function legalMetadata(slug: string): Metadata {
  const doc = legalDoc(slug);
  const url = legalUrl(slug);
  return {
    title: doc.metaTitle,
    description: doc.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      url,
      title: doc.metaTitle,
      description: doc.metaDescription,
      images: [OG_IMAGE],
    },
    twitter: { images: [OG_IMAGE.url] },
  };
}
