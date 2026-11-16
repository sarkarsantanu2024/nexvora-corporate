# Mantra Kidz: costing

Status on 16 Nov 2026. Two kinds of numbers are in this file and they are kept apart:

- **Running costs** are what the hosting companies charge. These were read from their pricing pages on 16 Nov 2026 and are in US dollars as published.
- **Selling prices and the monthly service fee** are a proposal for you to adjust before quoting. They are not market research.

## 1. One-time build, by feature

| # | Feature | What the client gets | Proposed price (₹) |
|---|---|---|---|
| 1 | Public website | 12 page types (home, about, programmes and a page per class, facilities, gallery, centres and a page per centre, admissions, franchise, notices, contact), animated design, banner slider with photo and video slides, three enquiry forms with spam protection, search-engine setup (sitemap, page titles, structured data) | 25,000 |
| 2 | Three languages | English, Bengali and Hindi on every page, own typefaces and line spacing per language, language switcher, per-language addresses for search engines | 8,000 |
| 3 | Website edit panel | 41 editable sections, draft and publish, live preview, change history with restore, per-language editing, media library, gallery manager, notices and events manager | 18,000 |
| 4 | Voice editing | Change text, photos, notices and sections by speaking in English, Hindi or Bengali; typed-command box; confirmation before every change; optional free-form understanding | 12,000 |
| 5 | Logins and security | One login page for five roles, lockout after wrong tries, forced first password change, every centre sealed off from the others, activity log | 8,000 |
| 6 | Head office: franchise leads | Pipeline board, follow-up dates, notes, WhatsApp and call buttons, convert a lead into a centre with its login | 10,000 |
| 7 | Head office: centres | Centre profiles, agreement and royalty terms, centre logins, performance per centre, step into any centre | 10,000 |
| 8 | Head office: royalty | Monthly royalty raised per centre (percent of collection or fixed), payments, statements, reminders, export | 12,000 |
| 9 | Head office: circulars, enquiries, programmes | Circulars to centres, all admission enquiries and website messages in one place, programme master in three languages | 6,000 |
| 10 | Head office: reports and settings | Centre comparison, admissions funnel, collection by method, royalty summary, team logins, organisation settings | 12,000 |
| 11 | Centre: admission enquiries | Pipeline, follow-ups, notes, admit a child straight from an enquiry | 6,000 |
| 12 | Centre: children | Admission form, profiles, move class, mark as left, year-end promotion, parent logins, export | 12,000 |
| 13 | Centre: classes and attendance | Classes with seats, daily attendance, monthly register with print and export, staff attendance | 10,000 |
| 14 | Centre: staff and settings | Staff records and logins, centre profile | 5,000 |
| 15 | Centre: fees | Fee heads, monthly bill run, one-off bills, payments, printable receipts, dues with WhatsApp reminders, day book, UPI / QR / bank details shown to parents, void and discount with reasons | 20,000 |
| 16 | Centre: expenses and salaries | Expenses by category, monthly salary payout with a guard against paying twice | 6,000 |
| 17 | Centre: reports and notices | Income and expense statement, dues ageing, admissions and withdrawals, attendance by class, notices to parents | 10,000 |
| 18 | Parent corner | Child's attendance, bills, receipts, how to pay, notices | 8,000 |
| 19 | Setup and handover | Hosting setup, domain mapping, first data load, a training session | 7,000 |
| | **Total** | | **2,05,000** |

Suggested ways to sell it:

- **Whole system:** ₹2,05,000 list price. As your first franchise client, a launch price around ₹1,60,000 to ₹1,75,000 still leaves room.
- **In stages:** website + languages + edit panel + voice + logins (rows 1 to 5) = ₹71,000 first; head office (6 to 10) = ₹50,000; centre software and parent corner (11 to 18) = ₹77,000; setup ₹7,000.
- Payment terms as you already work: 50% advance.

Not built, priced separately if asked: online payment gateway, SMS or WhatsApp Business API messages (today the app opens the sender's own WhatsApp with the text ready), mobile apps, uploading mp4 files (videos are pasted links), Bengali and Hindi for the dashboards.

## 2. What it costs to run each month

| Item | Published price (16 Nov 2026) | For this project |
|---|---|---|
| Vercel hosting | Hobby $0. Pro $20 per developer seat per month, which includes $20 of usage, 1 TB transfer and 10M requests. | The pricing page did not say whether a paying client's site is allowed on Hobby; assume Pro: **$20 a month**. One Pro seat can hold several client projects, so this cost is shared as you add clients. |
| Neon database | Free: 100 compute-hours and 1 GB per project. Launch: $0.106 per compute-hour and $0.35 per GB a month, no minimum. Neon's own example for light, on-and-off use is about $15 a month. | Starts inside Free. With several centres using it through the day, expect **$5 to $15 a month** on Launch. |
| Photo storage (Vercel Blob) | $0.023 per GB a month | A few GB at most: **under $1** |
| Voice free-form understanding (optional) | Claude Haiku 5.5: $0.10 per million input tokens, $0.50 per million output | A spoken command is a few thousand tokens. Hundreds of commands a month cost **well under $1**. Without a key the built-in commands still work. |
| Domain | Not checked | The client already owns mantrakidz.com |

**Running cost: about $25 to $36 a month** at the start, and less per client once the Vercel seat is shared. Convert at the day's rate when you quote; taxes are added by the providers at billing.

## 3. Monthly service (AMC), proposed

Running cost alone is roughly ₹2,500 to ₹3,000 a month at current exchange rates, so the fee has to sit above that.

| Plan | Proposed fee | Includes |
|---|---|---|
| Keep it running | ₹4,000 a month | Hosting, database, daily backups by Neon, security updates, uptime watch, fixing anything that breaks |
| Keep it running and growing | ₹6,500 a month | The above, plus content and photo updates on request, small changes up to 4 hours a month, phone and WhatsApp support in working hours |
| Per franchise centre | ₹400 a centre a month, added to either plan from the fourth centre | New centre setup, logins, training call for the centre head |

The per-centre line is what makes this a growing monthly income: the client's cost rises only when they open a centre, which is when they are earning more royalty themselves.

Yearly paid in advance: 10 months' fee for 12, as on your own price page.

## 4. Before quoting

- The Bengali and Hindi wording needs your read-through.
- `docs/CONTENT_TO_CONFIRM.md` lists what the client must confirm (address, franchise terms, photos are stock placeholders).
- Speaking into a real microphone, and video slides in the banner, have not been tested yet.
