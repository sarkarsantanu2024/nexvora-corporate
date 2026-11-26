# Client project blueprint

How every Nexvora client project is built: the website, the database, the edit panel and the business management software. Taken from Mantra Kidz, the first client project (live since 17 Nov 2026), with features EduFlow has that Mantra Kidz does not.

Written 26 Nov 2026. Read with `NEW_PROJECT.md` (the setup checklist) and `CONVENTIONS.md` (how the code is written).

---

## Part 1. The prompt to paste for a new client

Copy this, fill in the parts in square brackets, and paste it into Claude Code opened at `nexvora-corporate`.

```
New client project. Follow projects/_starter/docs/BLUEPRINT.md, NEW_PROJECT.md and
CONVENTIONS.md exactly. Build it the same way as projects/mantrakidz.

Client: [business name]
Current website (if any): [url]
Business type: [play school / coaching / gym / salon / shop / clinic / other]
Branches: [one place / several branches / franchise with head office]
City and languages: [city]; website in [English, Bengali, Hindi]
Who logs in: [owner, staff, branch manager, parent/customer ...]
What they do every week that the software must handle:
  - [admissions / members / orders / bookings / stock ...]
  - [fees or bills, how they are paid: UPI, QR, bank, cash]
  - [attendance / appointments / deliveries ...]
  - [reports they look at]
Plan they are buying: [Website / Website + edit panel / Platinum: all three]
Colours and logo: [from the logo / from the old site / to decide]

Rules:
1. Create the project with: node scripts/new-client-project.mjs [slug] "[Business Name]"
2. Keep the starter's shell, UI kit, login, PWA, languages, bell, edit panel and voice.
   Add the client's work as business modules (CONVENTIONS.md, "Adding a business module").
3. Check BLUEPRINT.md Part 5 (EduFlow features) and Part 6 (module catalogue) and list
   which modules this client needs before writing code. Show me the list first.
4. Nothing fake: no invented numbers, years, awards, reviews or features that only look
   good in a demo. Anything not known about the client goes in docs/CONTENT_TO_CONFIRM.md.
5. Any change that is not special to this client also goes into projects/_starter.
6. Finish with: typecheck, tests, build, a browser check at 1440 and 390 for every role,
   docs/ARCHITECTURE.md and docs/COSTING.md (feature-by-feature price and monthly care).
7. Do not commit or deploy until I say so.
```

---

## Part 2. What every project is

One Next.js app and one Postgres database per client. It is four things in one:

| Part | Who uses it | Address |
|---|---|---|
| Public website | Visitors | `/`, `/bn/...`, `/hi/...` |
| Edit panel | The owner and staff | `/admin/website` (Mantra Kidz: `/hq/website`) |
| Business management | Owner, staff, branch managers | `/admin/...` (Mantra Kidz: `/hq/...` and `/centre/...`) |
| Customer corner (optional) | Parents, members, customers | Mantra Kidz: `/parent/...` |

One login screen (`/login`) for every role. Each person lands on their own area after login.

Every project gets its **own** Vercel project, its **own** Neon database and its **own** Blob store. Nothing is shared between clients, so one client's data can never reach another, and one client can be moved or switched off on its own.

All client projects live in `nexvora-corporate/projects/<slug>`. The corporate site ignores that folder (root `tsconfig.json` excludes it). The super admin page `/admin/projects` on the corporate site lists them.

---

## Part 3. Architecture

### 3.1 Stack

| Piece | Choice | Why |
|---|---|---|
| Framework | Next.js 15 App Router, React 19, TypeScript strict | Site, dashboards and API in one codebase; server components read the database directly |
| Database | Postgres on Neon, Drizzle ORM | Money and attendance need real tables and transactions |
| Local database | PGlite when `DATABASE_URL` is not set | `npm install && npm run dev` is the whole setup; tests run in memory |
| Login | Own signed cookie (`jose`) + `bcryptjs` | No outside login service to pay for |
| Checks on input | `zod`, on the server | Whatever the browser sends is checked again |
| Look | Tailwind 3, `lucide-react` icons, `motion`, `recharts` | One design kit for all clients |
| Photos | `sharp` re-encodes; Vercel Blob in production, `.data/uploads` locally | Small fast photos; no raw uploads served |
| Fonts | Self-hosted with `@fontsource` | A Google Fonts fetch once broke a Vercel build |
| Voice | Browser speech recognition + own command parser; Claude Haiku only for sentences the parser cannot place, and only when `ANTHROPIC_API_KEY` is set | Works without any paid service |
| Tests | `vitest` against in-memory PGlite | Money, access and publishing rules are tested |

Port 3400 locally.

### 3.2 How a request travels

```
Browser
  │
  ├─ public pages (with /bn and /hi prefixes)
  ├─ /login            one login for every role
  ├─ /admin, /hq, /centre, /parent ...   dashboards by role
  └─ /api/...          public forms, media upload, voice, notifications, /api/v1 REST
        │
  middleware  ── reads the language (address prefix for the site, ui_lang cookie for dashboards)
              ── sends anyone without a login cookie to /login
        │
  page or server action  ── checks role (and branch) on the server
        │
  src/server/<area>/service.ts  ── plain functions: validate, do the work, write the audit line
        │
  Drizzle ── Neon (live) │ PGlite (your PC)
        │
  Vercel Blob (live photos) │ .data/uploads (your PC)
```

### 3.3 Folders

```
src/config/brand.ts     name, short name, logo, app colour of this client
tailwind.config.ts      colour scales: change brand and accent per client
src/app/(site)          public website pages
src/app/admin           dashboard and edit panel (one folder per screen)
src/app/api             public forms, media, voice, notifications, v1 REST
src/server/<area>       business logic, one folder per area, no HTTP inside
src/db                  schema.ts, index.ts (getDb), seed
src/cms/sections        every editable block of the website
src/voice               voice engine and command grammar
src/i18n                dashboard wording in Hindi and Bengali
src/components          ui kit, dashboard shell, phone app parts, site parts, edit-panel parts
drizzle                 SQL migrations (npm run db:generate)
scripts                 migrate, seed, reset, icons, placeholders
tests                   vitest
docs                    ARCHITECTURE, COSTING, CONVENTIONS, CONTENT_TO_CONFIRM, NEW_PROJECT
```

A business area always has the same three files:

```
src/server/<area>/service.ts    the rules (tested)
src/server/<area>/actions.ts    'use server' wrappers: session, call service, refresh page
src/app/admin/<area>/page.tsx   the screen
tests/<area>.test.ts            what is refused, what is saved, what staff may not do
```

### 3.4 Database

**Tables every project has (from the starter):**

| Table | Holds |
|---|---|
| `users` | Every login: role, username, bcrypt hash, wrong-try count, lock time, must-change-password flag |
| `enquiries`, `enquiry_notes` | Website contact form and follow-up notes |
| `announcements` | Notices on the site, circulars to staff, notices to customers |
| `site_content`, `content_revisions` | Website text per section and language; every published version kept for undo |
| `media`, `gallery_items` | Photo library and gallery albums |
| `settings` | Key/value settings of the business |
| `audit_log` | Who changed what, when |

Add `counters` (atomic running numbers for bills, receipts, admission numbers) as soon as a module issues numbers.

**Tables Mantra Kidz added for a franchise school (28 in all):**

- People and branches: `centres`, `staff`
- Academics: `programmes`, `academic_years`, `batches`, `students`, `attendance`, `staff_attendance`
- Leads: `franchise_leads`, `admission_enquiries`, `activity_notes`, `contact_messages`
- Money: `fee_heads`, `invoices`, `invoice_items`, `payments`, `expenses`, `royalty_invoices`, `royalty_payments`

**Rules for every table:**

- Every table a branch owns carries `centre_id` (or `branch_id`). The branch comes from the login, never from an id the browser sent. Every lookup by id also matches the branch.
- Main tables have `created_at`, `updated_at`, `deleted_at` (soft delete) and a `meta` jsonb for small extras.
- Money is whole rupees in integer columns.
- A receipt is never deleted. It is voided (`voided_at` + reason) and left out of every total.
- Anything that writes more than one money row runs in `db.transaction`.
- Repeatable jobs (monthly bills) are made safe by a unique index: one bill per child per month.
- Changing the schema: edit `schema.ts`, run `npm run db:generate`, keep the new SQL file. Never edit a migration that already went live.

### 3.5 Roles

Starter: `admin` (everything) and `staff` (no Team and logins, Activity log or Settings).

Mantra Kidz, for a franchise:

| Role | Area | Can |
|---|---|---|
| `hq_admin` | head office, any branch | Everything, including logins, settings, royalty payments |
| `hq_staff` | head office, any branch | Day-to-day work; no logins, settings or royalty payments |
| `centre_admin` | own branch | Everything in their branch |
| `centre_staff` | own branch | Enquiries, children, attendance, taking payments; no expenses, salaries, reports, settings, voids |
| `parent` | parent corner | Read-only view of their own children |

Head office "steps into" a branch to work inside it. The role is always checked in the service or action, not only by hiding a button.

### 3.6 Website and edit panel

- The site is cut into **sections** (`src/cms/sections/`, 41 in Mantra Kidz). Each section declares its fields and default text. From that one declaration come the page's content, the edit panel form and the voice vocabulary.
- Save makes a **draft**. **Publish** puts it live, keeps the old version in history (restore any time), and refreshes the cached pages at once (cache tag `site-data`).
- Bengali and Hindi are stored as separate rows (`home.hero@bn`) holding only what differs. Anything not translated falls back to English.
- Languages use address prefixes (`/bn/about`). One set of pages; the middleware strips the prefix. Bengali and Hindi get their own fonts, taller line spacing and no letter spacing (bottom of `globals.css`).
- Home banner: slider of photos and videos (YouTube or mp4 link).
- Photo library, gallery albums, notices and events managed from the panel.
- Photos are shrunk in the browser before upload (Vercel refuses request bodies over about 4.5 MB), then re-encoded by the server.
- Public forms: hidden trap field + rate limit per address. No OTP or phone verification (format checks only).
- SEO: sitemap, robots, page titles, structured data, one address per language.
- Website animation budget is spent on the public site, not on the dashboard.

### 3.7 Voice editing

Speak a change in English, Hindi or Bengali, for example "change the home heading to ...". The parser matches section and field names; every change shows a confirmation card and is saved as a draft. There is a typed-command box too. Engine ported from Halkhata (`G:\1.AI-project\digital-dukaan`, `components/voice/useVoice.ts`). Works in Chrome, Edge and Android Chrome.

### 3.8 Dashboard: app on a phone

Same for every client. A client changes the name, logo and two colours, never the layout.

- Full width, capped at 1880px. Sidebar on a laptop.
- Phone: top bar (logo or back arrow, bell, language, person), bottom bar with four screens and "More". "More" opens a grid of icon tiles.
- Forms open as bottom sheets on a phone (drag up for full screen, down to close), as a right-side drawer on a laptop.
- Filters hide behind a round button at the bottom right, which opens a sheet of tick lists.
- Tables become cards on a phone.
- Main button of each screen sits on the heading row, top right.
- Slides animate on every device (`MotionConfig reducedMotion="never"`); Santanu's PC has animations switched off and reads a plain fade as broken.
- PWA: manifest, service worker (keeps only fixed files, never data), offline page, install bar, "Send app link to WhatsApp". Icons: `npm run icons`.
- Dashboard languages: English, Hindi, Bengali from the top bar dropdown (`ui_lang` cookie). Every word goes through `t()`; a test fails if a sentence is missing from either file.
- Bell: what needs doing today, worked out live from the database (`src/server/notifications.ts`). Nothing stored; a line goes away when the thing is dealt with.
- Rupee icon, not dollar. House for Home. Icons must be clear without their label.

### 3.9 Security

- bcrypt passwords; 5 wrong tries lock the login for 15 minutes; first password must be changed.
- HTTP-only signed cookie, 12 hours.
- Role and branch checked on the server.
- Uploads re-encoded; local file serving refuses path tricks.
- Activity log for logins, money, records, branch changes, website publishes.
- Security headers on every page (`next.config.ts`).

### 3.10 Payments

No payment gateway (no Razorpay). Customers pay by UPI, QR or bank transfer; the business records it. Payment details (UPI ID, QR image, bank account) are set in Settings and shown to customers. WhatsApp messages open the sender's own WhatsApp with the text ready; nothing is sent automatically.

---

## Part 4. Build order

The order Mantra Kidz was built in, which worked:

1. **Read the client.** Old website, what they do every week, who logs in. Write `docs/CONTENT_TO_CONFIRM.md` with everything not known for sure.
2. **Make the project** from the starter (`node scripts/new-client-project.mjs`). Name, colours, logo, icons.
3. **Schema first.** Add every table the client needs to `schema.ts` and freeze it before building screens, so several pieces can be built side by side without clashing.
4. **Shared helpers** before screens: money, numbering, validators, dates (IST), audit, CSV, WhatsApp links.
5. **Website sections** and their Bengali/Hindi wording.
6. **Business modules**, one area at a time, each with its tests.
7. **Customer corner** if the plan has it.
8. **Bell lines** for things that wait for someone.
9. **Checks:** typecheck, tests, build, browser check of every screen for every role at 1440 and 390 wide (no errors, no sideways scroll, staff blocked from manager screens), Hindi and Bengali screens read once.
10. **Docs:** `ARCHITECTURE.md`, `COSTING.md` (per feature + monthly care), update `CONTENT_TO_CONFIRM.md`.
11. **Proposal PDFs** for the client (Mantra Kidz: `docs/proposal/make-proposal.mjs`, content in `content.mjs`, English and Bengali, plus a features-only PDF without prices).
12. **Go live** (Part 8), sample data removed, client reviews on the Vercel link, then the domain.

---

## Part 5. EduFlow features Mantra Kidz does not have

Checked on 26 Nov 2026 against `G:\1.AI-project\eduflow-saas` (read only, never change it) and `projects/mantrakidz`. Copy the pattern, not the code: EduFlow uses Auth.js and a different data layer.

### 5.1 Belongs in the starter (every client)

**Built on 26 Nov 2026 in the starter and in Mantra Kidz**, except "business type words" (it waits until the starter carries a customer module) and the printable profit and loss (Mantra Kidz has its reports; the starter has no money module). How a module plugs into each one: `CONVENTIONS.md`, "Common features a module plugs into".

| Feature | What EduFlow does | Where to look in EduFlow | Why every client needs it |
|---|---|---|---|
| **Security headers** | `nosniff`, `SAMEORIGIN` frames, referrer policy, permissions policy, a content security policy on the home page | `vercel.json` | Mantra Kidz and the starter send none |
| **Daily scheduled job** | Vercel cron at 9:00 India time calls `/api/cron/automation`; refuses without a `CRON_SECRET` of 32+ characters | `vercel.json`, `src/app/api/cron/automation` | Monthly bills and reminders happen without anyone opening a screen |
| **Reminder queue (outbox)** | Switches for fee due in N days, fee overdue, absent today, birthday. Each fills `message_outbox` once only (unique key such as `fee_due:<id>`, `birthday:<id>:<year>`). The owner opens the queue, presses send on each (WhatsApp link), or dismisses. Old rows cleared after 45 to 60 days | `src/features/automation`, `src/features/reminders` | Today Mantra Kidz has a WhatsApp button on dues only; nothing reminds the owner of absentees or birthdays |
| **Message templates** | Editable WhatsApp texts with fields filled from real data (name, amount, month) | `templates` table, `src/lib/wa-link.ts` `renderTemplate` | Owner changes the wording without us |
| **Trash screen** | Every deleted record can be restored or removed for good from one screen | `src/features/trash` | Mantra Kidz soft-deletes (`deleted_at`) but has no screen to bring a record back |
| **Import from a spreadsheet** | Upload Excel/CSV, map columns, preview, import | `src/features/students` | Every new client arrives with a list of customers in Excel; Mantra Kidz only exports |
| **Smart suggestions on the overview** | Rule cards: loss or profit this month, pending fees, absent today, inactive customers, birthdays, free seats, low collection rate | `src/features/dashboard/smart-suggestions.tsx` | Tells a busy owner what to do today; rules are plain code, nothing invented |
| **Printable profit and loss** | Month, half year, year; "Save as PDF" is the browser's print | `src/features/dashboard/financial-report.tsx` | Mantra Kidz has income and expense reports per centre; check it has a print layout |
| **Suspended page** | When a client has not paid us, their dashboard shows a notice with our contact instead of the screens | `src/app/suspended` | Protects the monthly income (Part 7) |
| **Plan gating** | Each module has a lowest plan; screens call `requireModule`, which sends the person to an upgrade page | `src/lib/plan-gating.ts`, `src/lib/plan-guard.ts` | The platform goal: build everything, switch on what the client paid for |
| **Business type words** | Per sector: "Student" or "Member", "Levels" or "Subjects", which modules show, sample data | `src/lib/sectors.ts` | One starter serves a school, a gym and a coaching centre |

Note: EduFlow's "forgot password" is a stub that sends nothing. Do not copy it. Our way stays: the admin resets a staff password and the person must change it at the next login.

### 5.2 Business modules worth adding when the client needs them

| Module | What it does | EduFlow plan | Fits |
|---|---|---|---|
| **Inactive after unpaid months + reactivation fee** | After 4 unpaid months the customer becomes inactive; a set fee (₹700 default) brings them back | Free | Schools, coaching, gyms |
| **Monthly recurring charges and salaries posted as expenses** | Rent, salary, royalty posted automatically each month by the same safe-to-repeat job | Free | Any business with fixed monthly costs |
| **ID cards** | 88 x 56 mm cards with photo, 10 to an A4 page with cutting marks | Starter | Schools, coaching, gyms, staff of any business |
| **Certificates** | Upload a blank certificate design; the app fills each name and makes a PDF with a serial number and QR code. Public page `/verify/<serial>` confirms it is real (noindex) | Starter | Schools, training centres, courses |
| **Tests and ranks** | Record marks; rank the batch by percent, ties share a rank (1, 2, 2, 4); result card on WhatsApp | Growth | Coaching, tuition |
| **Promotions / level up** | Move a student to the next level with score; congratulation on WhatsApp | Growth | Abacus, dance, music, martial arts. Mantra Kidz has year-end class promotion only |
| **Outside exam registrations** | Fee, status steps, results | Growth | Music, dance, drawing boards |
| **Competitions and performances** | Log results and recitals | Growth | Dance, music, sports |
| **Events** | Annual function, exhibition, with WhatsApp invites | Growth | Schools, clubs. Mantra Kidz has notices but no event records with invites |
| **Kits and books sold to customers** | Bought from head office at a set price, sold with a margin, charged like a fee | Growth | Franchises that sell material (Mantra Kidz could use this for uniforms and books) |
| **Supplies received** | Advertising material and stationery received or printed | none | Franchises |
| **Welcome pack** | Poster image and a short animated video made in the browser, to send on WhatsApp after admission | Free | Schools, gyms |
| **Running customer ID** | `ABC-Branch-001`, never repeats | Free | Mantra Kidz already has admission numbers |
| **Seat packs / customer cap** | A plan allows N customers; more seats by request, approved by super admin, logged | all | Only if we sell by customer count |

### 5.3 Super admin (for Santanu, across all clients)

EduFlow's super admin can list every client, open one to help, switch it on or off, reset the owner's password, set the plan, see platform totals, and approve seat requests. Nexvora today has `/admin/projects` on the corporate site, which only lists the projects with links.

**Built on 26 Nov 2026 (option 1).** Every client app has `/api/platform` (key `PLATFORM_SECRET`). The corporate super admin's `/admin/projects` reads each app live (plan, running or paused, logins, last login, usage figures, last daily check) and has the plan list, Pause / Switch on and the note shown on the paused page. The corporate site holds each app's key under the name in `secretEnv` of `src/lib/projects.ts` (Mantra Kidz: `PLATFORM_SECRET_MANTRAKIDZ`). A new client: add its row there and set both keys.

Because each Nexvora client has its own database, a super admin cannot read them all from one place the EduFlow way. The two options were:

1. **Light (recommended first):** every project gets a small protected endpoint `/api/platform/status` (secret key shared with the corporate site) that returns plan, active or suspended, counts and last login. The corporate `/admin/projects` page calls each one and can switch a project to suspended or change its plan through the same endpoint.
2. **Heavy:** one shared database for all clients (EduFlow's way). Cheaper to run, but gives up "one client, one database", so not advised.

A built-in `superadmin` login inside each project (seeded, password only Santanu knows) is also useful for support.

---

## Part 6. Module catalogue by business type

Start from the starter, then add modules. Marked ✔ where Mantra Kidz already has working code to copy.

| Module | School / play school | Coaching / tuition | Activity centre (dance, abacus, yoga) | Gym | Salon / clinic | Shop |
|---|---|---|---|---|---|---|
| Enquiries and follow-ups ✔ | ● | ● | ● | ● | ● | ● |
| Customers (children, students, members) ✔ | ● | ● | ● | ● | ● | |
| Classes / batches with seats ✔ | ● | ● | ● | ● | | |
| Attendance and register ✔ | ● | ● | ● | ● | | |
| Staff, staff attendance, salaries ✔ | ● | ● | ● | ● | ● | ● |
| Fee heads, monthly bill run, receipts, dues ✔ | ● | ● | ● | ● | | |
| One-off bills ✔ | ● | ● | ● | ● | ● | ● |
| Expenses ✔ | ● | ● | ● | ● | ● | ● |
| Day book, income and expense reports ✔ | ● | ● | ● | ● | ● | ● |
| Notices to customers ✔ | ● | ● | ● | ● | | |
| Customer corner (parent / member login) ✔ | ● | ● | ● | ● | | |
| Branches, head office, royalty ✔ | franchise | franchise | franchise | franchise | franchise | |
| Franchise leads pipeline ✔ | franchise | franchise | franchise | franchise | franchise | |
| Reminder queue and templates (5.1) | ● | ● | ● | ● | ● | ● |
| Import from Excel (5.1) | ● | ● | ● | ● | ● | ● |
| ID cards, certificates (5.2) | ● | ● | ● | ● | | |
| Tests and ranks (5.2) | | ● | | | | |
| Levels, exams, performances (5.2) | | | ● | | | |
| Appointments / bookings (new) | | | | trainer | ● | |
| Stock, products, sales bills with GST (new) | kits | books | kits | supplements | products | ● |
| Orders and delivery (new) | | | | | | online shop |

"New" means neither project has it yet; build it as a business module (CONVENTIONS.md) and copy it back to the starter if a second client needs it. The three sample online stores on the corporate demos page are the reference for shop screens.

---

## Part 7. Plans, price and monthly income

The platform goal: build everything for every client, switch on what the plan covers, earn every month.

**Plan structure** (names for Santanu to confirm):

| Plan | Gives |
|---|---|
| Website | Public website, languages, contact form, setup |
| Website + edit panel | Above, plus the edit panel, photo library, gallery, notices, voice editing |
| Platinum | Above, plus the business management software and the customer corner |

**One-time build:** priced feature by feature in `docs/COSTING.md`, one row per feature with what the client gets. Mantra Kidz, agreed 19 Nov 2026: ₹2,05,000 for 19 features (edit panel ₹32,000, logins/security/phone app ₹20,000, three languages ₹12,000, the rest sized to fit), paid 40% at signing, 40% at handover, 20% within 15 days of go-live. That was a full franchise system for a friend, with no discount line and no GST line; a small shop gets a much smaller build.

**Monthly care:** Mantra Kidz agreed ₹5,000 a month + ₹500 per school, each line explained, no content work included (the client edits himself). A per-branch or per-customer line is what makes the income grow as the client grows.

**Running cost to us** (checked 16 Nov 2026, US dollars as published): Vercel Pro $20 per seat a month with $20 usage included (one seat holds many client projects; Hobby is non-commercial, so move to Pro before a paid go-live); Neon free tier to start, then about $5 to $15 a month on Launch; Blob $0.023 per GB a month; Claude Haiku for voice well under $1 a month. Recheck these before each quote.

**Reference prices from EduFlow** (self-serve SaaS, plus 18% GST): Free ₹0 (20 students), Starter ₹399/month (100), Growth ₹799 (300), Business ₹1,499 (1,000). These are for a shared self-serve product, not for a custom build with its own site.

**Protect the income:** plan gating and the suspended page (Part 5.1), yearly-in-advance option (10 months' fee for 12, as on the Nexvora price page), and the super admin switch (Part 5.3).

---

## Part 8. Go live

Full steps in the project `README.md`. In short:

1. Neon: new project (Singapore), copy the **pooled** connection string (host has `-pooler`).
2. Vercel: new project, Root Directory `projects/<slug>`, Build Command `npm run vercel-build` (migrates, then builds).
3. Blob: create it **Public**, connect it with the read-write token box ticked (`BLOB_READ_WRITE_TOKEN`).
4. Variables: `DATABASE_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`, optional `ANTHROPIC_API_KEY`, and `CRON_SECRET` once the daily job exists.
5. Seed once from your PC: in PowerShell `$env:DATABASE_URL="..."`, `$env:ADMIN_PASSWORD="..."`, `npm run db:seed` (PowerShell drops `--demo`; use `$env:SEED_DEMO="1"` for sample data). Close the terminal afterwards.
6. Push: `gh auth switch --user sarkarsantanu2024` first. Check the build with `gh api repos/sarkarsantanu2024/nexvora-corporate/commits/<sha>/statuses`.
7. Log in live, change the admin password, upload one photo to prove Blob works, install the app on a phone.
8. Remove sample data, client reviews on the Vercel link, then point the domain (subdomain of `nexvoratechnologies.co.in` for review, client's own domain at go-live).

---

## Part 9. Lessons from Mantra Kidz

- A `.vercelignore` at the repository root applies to every Vercel project in the repo. Do not add one.
- Two dev servers on one `.next` folder break each other. For a second server set `NEXT_DIST_DIR=.next-x` and a separate data folder (PGlite allows one writer).
- Never write that a feature is "already built" in a proposal; Santanu gives the client his own timeline.
- No phone number or OTP verification is offered.
- The client may know IT. No filler screens, no fake numbers.
- Values to paste into a browser: give something he can type, a file to import, or a button to press. Copying from VS Code can add stray text.
- Delete any `.env` file left on the Desktop after setup.
- Not tested by hand on Mantra Kidz yet: a real microphone, video slides, install on a real iPhone. Test these on every new project before handover.
