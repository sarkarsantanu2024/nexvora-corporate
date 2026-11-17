# Mantra Kidz: how this codebase is built

Read this before writing anything. It is short on purpose.

## What this is

One Next.js app that is three things for a franchise play school chain:

1. the **public website** (content editable from a panel, by hand or by voice),
2. the **head office (HQ) dashboard**: franchise leads, centres, royalty, reports, website editing,
3. the **centre dashboard** for each franchise centre (enquiries, children, attendance, fees, expenses, staff) and a small **parent corner**.

The client is an IT person. Build only what a real play school chain uses every week. No filler screens, no fake numbers, no features that only look good in a demo.

## Stack

Next.js 15 App Router, React 19, TypeScript strict, Tailwind 3, Drizzle ORM on Postgres (Neon in production, PGlite locally), `jose` + `bcryptjs` for login, `zod` for validation, `motion` for animation, `recharts` for charts, `lucide-react` for icons, `sharp` for images, `vitest` for tests.

**Do not add dependencies** and do not run `npm install`. If you truly need one, say so in your final report.

## Files you must know

| File | What it gives you |
|---|---|
| `src/db/schema.ts` | Every table and value list. **Frozen**: do not edit. Each main table has a `meta` jsonb for extras; `settings` is a key/value table. If a column is truly missing, say so in your report. |
| `src/db/index.ts` | `const db = await getDb()`; types `DB`, `Tx`, `DbOrTx`. `db.transaction(async (tx) => …)` works. |
| `src/lib/auth.ts` | `requireSession(roles?)`, `requireCentre(roles?)` for pages and actions; `apiSession`, `apiCentre` for route handlers; `canManageCentre(session)`; role lists `HQ_ROLES`, `CENTRE_SCREEN_ROLES`, `CENTRE_MANAGERS`. |
| `src/lib/api.ts` | `action(fn)` wraps a server action into `{ ok, data } \| { ok:false, error, fields }`; `handle(fn)` + `ok(data)` for route handlers; `ApiError`, `fail('message')`. |
| `src/lib/date.ts` | India-time dates: `todayIST()`, `currentPeriod()`, `periodLabel`, `addMonths`, `lastPeriods`, `periodRange`, `addDays`, `formatDate`, `formatDateTime`, `financialYear`, `ageLabel`, `weekday`. |
| `src/lib/money.ts` | `inr`, `inrShort`, `invoiceStatus`, `balanceOf`, `royaltyAmount`, `percent`, `allocatePayment`. |
| `src/lib/numbering.ts` | `nextAdmissionNo`, `nextInvoiceNo`, `nextReceiptNo`, `nextCentreCode`, `nextNumber` (atomic; pass the `tx`). |
| `src/lib/validators.ts` | zod pieces: `phone`, `optionalPhone`, `optionalEmail`, `day`, `optionalDay`, `period`, `rupees`, `text()`, `requiredText(label)`, `uuid`, `optionalUuid`, `username`, `password`, `slugify`. |
| `src/lib/audit.ts` | `audit(session, 'payment.create', { entity, entityId, centreId, summary })`. Call it after every change to money, children, centres, logins, website. |
| `src/lib/wa.ts`, `csv.ts` | WhatsApp click-to-chat links (`waLink`, `fillTemplate`), CSV export (`toCsv`, `csvResponse`). |
| `src/components/ui/core.tsx` | Server-safe UI: `Button`, `LinkButton`, `buttonClass`, `Card`, `CardHeader`, `CardBody`, `PageHeader`, `Badge`, `StatusBadge`, `Stat`, `EmptyState`, `Table/Th/Td/Tr`, `Field`, `Input`, `Select`, `Textarea`, `FormGrid`, `Avatar`, `Detail`, `Meter`, `TabLinks`, `Notice`. |
| `src/components/ui/client.tsx` | Client UI: `Modal`, `Drawer`, `useToast`, `LoadingButton`, `ConfirmButton`, `PrintButton`, `SearchInput`, `UrlSelect`, `UrlDate`, `Pagination`, `useUrlParam`. |
| `src/components/ui/charts.tsx` | `BarsChart`, `AreaTrend`, `Donut`, `CHART_COLORS`. |
| `src/components/ui/motion.tsx` | `Reveal`, `Stagger`, `StaggerItem`, `CountUp`. |
| `src/components/cms/image-field.tsx` | `<ImageField value onChange folder />`: photo upload with preview, for any form. |
| `src/components/dash/nav.ts` | The menu of each area (`NAV`) and the phone bottom bar (`TABS`, at most four screens). The routes listed there are the routes to build. |
| `src/components/dash/shell.tsx` | The frame of every dashboard screen: sidebar on a laptop; bottom bar, slide-in menu and back arrow on a phone. It sets the page width (up to 1880px) for every screen, so a screen never sets its own outer width. |
| `src/components/pwa/pwa.tsx`, `src/app/manifest.ts`, `public/sw.js` | The installable app: `usePwa()`, `<InstallApp>`, offline bar, loading bar. The service worker keeps only fixed files, never a dashboard screen or data. |
| `src/config/brand.ts` | The client's name, logo and app colours in one place. After changing the logo run `npm run icons`. |
| `src/cms/*` | Website content: section definitions, `content(section)` reader. |
| `tailwind.config.ts` | Colours: `brand` (indigo), `accent` (red), `ink` (neutrals), `sun`, `mint`, `sky`, `coral`. Fonts: `font-display` (Baloo 2) for headings, `font-sans` for the rest. |

Use these. Do not write a second button, a second date formatter or a second table style.

## Roles and scoping

`hq_admin`, `hq_staff` (head office), `centre_admin` (franchise owner or centre head), `centre_staff` (teacher, front desk), `parent`.

- Head office sees every centre. To work inside one, it "steps in" (`enterCentre`), after which `requireCentre()` returns that centre.
- A centre role can only ever touch its own centre. **Every query on a centre-owned table must filter by `centre.id` from `requireCentre()`**, never by an id sent from the browser alone. When a record id comes from the browser, load it with `and(eq(table.id, id), eq(table.centreId, centre.id))`.
- `centre_staff` cannot see or change expenses, salaries, royalty, reports, fee settings, staff or settings, and cannot void a receipt. Check with `canManageCentre(session)` in the action, not only by hiding the button.
- A parent sees only children where `students.parentUserId = session.uid`.

## How a feature is laid out

```
src/server/<domain>/service.ts   plain async functions. Take the actor explicitly:
                                 (ctx: { session: Session; centre: Centre }, input)
                                 Validate with zod, do the work, write the audit line.
                                 No cookies(), no redirect(), no revalidatePath() here,
                                 so they can be tested with vitest.
src/server/<domain>/actions.ts   'use server'. Each action: get the session/centre,
                                 call the service, revalidatePath(), wrapped in action().
src/app/<area>/<route>/page.tsx  server component: auth, load data, render.
src/app/<area>/<route>/*.tsx     client components for forms and interactive parts.
src/app/api/v1/...               REST route handlers for the main resources
                                 (list, create, update), thin wrappers over the same
                                 services using handle() + apiSession()/apiCentre().
tests/<domain>.test.ts           vitest against the in-memory database (see tests/seed.test.ts).
```

Money rules: whole rupees, integers only. A payment is never deleted, it is voided (`voidedAt`), and voided rows are left out of every total. Anything that writes more than one row about money runs inside `db.transaction`.

Lists: filters live in the URL (`?q=&status=&page=`) using `SearchInput`, `UrlSelect`, `Pagination`, so a filtered list can be bookmarked and the back button works. 25 rows a page.

Forms: a `Drawer` or `Modal` for short forms, a page for long ones. Show field errors from `result.fields` under the field. Disable the button while saving (`LoadingButton`). Toast on success. Confirm before anything destructive (`ConfirmButton`).

Every list has an `EmptyState` that says what the screen is for and offers the first action. Every screen must work at 360px wide: tables scroll sideways inside their card (the `Table` component does this), nothing overflows the page. Anything pinned to the bottom of the screen adds `var(--dash-bottom)` so it sits above the phone's bottom bar.

## Look and feel

Dashboards: calm, roomy, fast. White cards on the pale background, indigo for primary actions, red only for danger and overdue. Headings in `font-display`. Numbers in tiles and tables use the `tabular` class. Subtle motion only: cards fade up on load (`animate-fade-up`), tiles count up (`CountUp`), bars grow.

Public website: this is where the animation budget goes (see the website brief).

## Words

Write the way a school owner talks. "Children", not "students" in screen text (the table is called `students`; that is fine). "Bill" for an invoice, "receipt" for a payment, "centre", "head office", "fee". Short labels, sentence case, no jargon, no exclamation marks, no em dashes. Error messages say what to do: "Enter a 10 digit mobile number".

Never state something about the school that we do not know to be true: no invented counts, years, awards, fees or testimonials.

## Checking your work

There is **one shared dev server at http://localhost:3400** with hot reload. It is already running.

- **Never** start or stop a dev server, and never run `next build` or `npm run build`. (Five builders share one 4-core machine.)
- Typecheck: `npx tsc --noEmit --incremental false -p .` You will also see errors from files other builders are in the middle of writing. Fix only your own.
- Tests: `npx vitest run tests/<yourfile>.test.ts`
- Look at your screens with a headless browser: `playwright-core` is installed; launch with `chromium.launch({ channel: 'msedge' })`. Keep your scripts and screenshots in your own scratch folder (given in your brief), not in the repo. Check at 1440 and 390 wide, and read your screenshots.
- Sample logins (password `mantra123`): `admin` (head office admin), `hqstaff`, `laketown` (centre head, sample centre with data), `laketown.desk` (centre staff), `9000001005` (parent).
- The sample database is shared with the other builders. Adding records while testing is fine; do not wipe tables.
- If the server is down or a page fails because of someone else's file, do not try to fix their file. Carry on with typecheck and tests, and say so in your report.

## Hard rules

- Stay inside the folders your brief gives you. Do not edit shared files (`src/db`, `src/lib`, `src/components/ui`, `src/components/dash`, root config) unless your brief says a file is yours. If a shared helper is missing something, write a local helper and mention it in your report.
- No `git` commands that change anything (no add, commit, stash, checkout).
- No `any` to silence the type checker where a real type is a line away. No commented-out code. No TODO left behind without saying so in your report.
- Comments explain why, in plain words, where a reader would otherwise wonder.
