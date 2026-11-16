# Mantra Kidz: architecture

Status on 16 Nov 2026. One Next.js application and one Postgres database serve the public website, the head office dashboard, every centre's dashboard and the parent corner.

## At a glance

```
Browser
  │
  ├─ /, /about, /programmes … (also /bn/…, /hi/…)   public website
  ├─ /login                                           one login for every role
  ├─ /hq/…        head office      (hq_admin, hq_staff)
  ├─ /centre/…    one centre       (centre_admin, centre_staff; head office can step in)
  ├─ /parent/…    parent corner    (parent)
  └─ /api/…       REST: public forms, /api/v1 (hq, centre, parent), media, voice
        │
  middleware ── language prefix → request header; login cookie gate for dashboards
        │
  pages and server actions ── check role and centre, then call
        │
  src/server/<area>/…  ── business logic, plain functions, tested with vitest
        │
  Drizzle ORM ── Neon Postgres in production │ embedded PGlite on a developer machine
        │
  Vercel Blob (photos in production) │ .data/uploads locally
```

Size: 28 tables, 65 pages, 38 route handlers, about 38,600 lines of TypeScript, 203 automated tests.

## Stack and why

| Choice | Reason |
|---|---|
| Next.js 15 (App Router), React 19, TypeScript strict | One codebase for site, dashboards and API; server components read the database directly, so most screens ship little JavaScript |
| Postgres on Neon, Drizzle ORM | Real relational data (money, attendance) with transactions; SQL migrations kept in `drizzle/` |
| PGlite fallback | With no `DATABASE_URL` the app runs on an embedded Postgres, migrates and seeds itself: `npm install && npm run dev` is the whole setup, and tests run in memory |
| Signed cookie login (`jose`, `bcryptjs`) | No third-party login service to pay for or depend on |
| Tailwind, `motion`, `recharts`, `lucide-react` | Design system in `tailwind.config.ts`; animation and charts without heavy libraries |
| `zod` | Every input is checked on the server, whatever the browser sent |

## Roles and separation

| Role | Area | Can |
|---|---|---|
| `hq_admin` | `/hq`, any centre | Everything, including logins, settings, royalty payments |
| `hq_staff` | `/hq`, any centre | Day-to-day head office work; no logins, settings or royalty payments |
| `centre_admin` | `/centre` | Everything in their own centre |
| `centre_staff` | `/centre` | Enquiries, children, attendance, taking payments; no expenses, salaries, reports, settings, voids |
| `parent` | `/parent` | Read-only view of their own children |

Every table a centre owns carries `centre_id`. The centre is taken from the login (or, for head office, from the centre it stepped into), never from an id sent by the browser, and every lookup by id also matches the centre. Tests cover a centre trying to read another centre's child, bill and receipt, and a parent trying to read another family's child.

## Data model (28 tables)

- **People and centres:** `centres`, `users`, `staff`
- **Academics:** `programmes` (with Bengali and Hindi wording), `academic_years`, `batches`, `students`, `attendance`, `staff_attendance`
- **Leads:** `franchise_leads`, `admission_enquiries`, `activity_notes`, `contact_messages`
- **Money:** `fee_heads`, `invoices`, `invoice_items`, `payments`, `expenses`, `royalty_invoices`, `royalty_payments`
- **Communication:** `announcements` (public notices, circulars to centres, notices to parents)
- **Website:** `site_content`, `content_revisions`, `media`, `gallery_items`
- **System:** `settings`, `counters`, `audit_log`

Money rules: whole rupees in integer columns; a receipt is never deleted, it is voided and left out of every total; anything that writes more than one money row runs in a transaction; one monthly bill per child per month is enforced by a unique index, so the monthly run is safe to repeat; receipt, bill and admission numbers come from an atomic counter. Royalty is worked out from the same non-voided receipts the centre's own reports use.

## Website content

The site is cut into 41 sections declared in `src/cms/sections/`. Each declaration lists its fields and default text, and from it come the page's typed content, the edit panel's form and the voice assistant's vocabulary. Saving makes a draft; publishing copies it live, keeps the previous version for restore, and refreshes the cached pages at once. Bengali and Hindi are stored as separate rows (`home.hero@bn`) holding only what differs; anything not translated falls back to English.

Languages use address prefixes (`/bn/about`, `/hi/about`). The middleware strips the prefix and passes the language in a header, so there is one set of pages. Each language has its own typefaces, and Bengali and Hindi get taller line spacing and no letter spacing (`src/app/globals.css`).

## Voice editing

`src/voice/`: the browser's speech recognition (Chrome, Edge, Android Chrome) feeds a command parser that matches what was said against section and field names. Every change shows a confirmation card and is saved as a draft first. Sentences the parser cannot place can be sent to Claude, only when `ANTHROPIC_API_KEY` is set, and only the sentence and the list of field names are sent. The engine is ported from Halkhata.

## Security

- Passwords hashed with bcrypt; five wrong tries lock the account for 15 minutes; first-time passwords must be changed.
- Login cookie is HTTP-only, signed, 12 hours.
- Role and centre are checked in the server action or route, not only by hiding buttons.
- Public forms have a hidden trap field and a per-address rate limit.
- Uploads are re-encoded by the server; local file serving refuses path tricks.
- The activity log records logins, money changes, child records, centre changes and website publishes.

## Checks

`npm run typecheck`, `npm test` (203 tests: seed consistency, admissions, attendance, billing, payments, voids, royalty, lead conversion, parent access, content publishing, voice commands, translations), `next build`. A browser sweep of 136 screen visits across all roles at laptop and phone width passed with no errors on 16 Nov 2026.

## Deployment

One Vercel project (Root Directory `projects/mantrakidz`) and one Neon project. The `vercel-build` script updates the tables, then builds. Steps and environment variables are in the README.

## Known limits

- Dashboards are in English only.
- Centre names and addresses, gallery captions and notices are single-language.
- Videos in the banner are links (YouTube or an mp4 address); mp4 upload is not supported.
- No online payment gateway by choice: parents pay by UPI, QR or bank transfer and the centre records it.
- WhatsApp messages open the sender's own WhatsApp with the text ready; nothing is sent automatically.
- Not yet tested by hand: a real microphone, video slides, and the screens listed in the handoff notes.
