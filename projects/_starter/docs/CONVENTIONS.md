# How this codebase is built

Read this before writing anything. It is short on purpose.

## What this is

One Next.js app that is two things for a small business:

1. the **public website** (home, about, gallery, notices, contact; content editable from a panel, by hand or by voice; English, Bengali and Hindi),
2. the **dashboard** at `/admin`: enquiries from the website, website editing, gallery, notices, logins, activity log, settings. On a phone it works like an app (bottom bar, sliding sheets, installable), it has a bell for what needs doing, and each person can read it in English, Hindi or Bengali.

Every client project starts as a copy of this. What is special to one client is added as a **business module** (see the last section). Build only what the business uses every week. No filler screens, no fake numbers, no features that only look good in a demo.

## Stack

Next.js 15 App Router, React 19, TypeScript strict, Tailwind 3, Drizzle ORM on Postgres (Neon in production, PGlite locally), `jose` + `bcryptjs` for login, `zod` for validation, `motion` for animation, `recharts` for charts, `lucide-react` for icons, `sharp` for images, `vitest` for tests.

Do not add a dependency unless the feature cannot be built without it.

## Files you must know

| File | What it gives you |
|---|---|
| `src/config/brand.ts` | `BRAND`: the client's name, short name, tagline, logo and app colours. Never type the client's name anywhere else. |
| `tailwind.config.ts` | Colours: `brand` and `accent` change per client; `ink` (greys), `sun`, `mint`, `sky`, `coral` are shared. Fonts: `font-display` for headings, `font-sans` for the rest. |
| `src/db/schema.ts` | Every table and value list. `settings` is a key/value table. |
| `src/db/index.ts` | `const db = await getDb()`; types `DB`, `Tx`, `DbOrTx`. `db.transaction(async (tx) => ...)` works. |
| `src/lib/auth.ts` | `requireSession(roles?)` for pages and actions; `apiSession(roles?)` for route handlers; role lists `TEAM_ROLES`, `ADMIN_ONLY`. |
| `src/lib/api.ts` | `action(fn)` wraps a server action into `{ ok, data }` or `{ ok: false, error, fields }`; `handle(fn)` + `ok(data)` for route handlers; `ApiError`. |
| `src/lib/date.ts` | India-time dates: `todayIST()`, `currentPeriod()`, `periodLabel`, `addMonths`, `lastPeriods`, `periodRange`, `addDays`, `formatDate`, `formatDateTime`, `financialYear`, `weekday`. |
| `src/lib/money.ts` | `inr`, `inrShort`: how rupees are written. |
| `src/lib/validators.ts` | zod pieces: `phone`, `optionalPhone`, `optionalEmail`, `day`, `optionalDay`, `period`, `rupees`, `text()`, `requiredText(label)`, `uuid`, `optionalUuid`, `username`, `password`, `slugify`. |
| `src/lib/audit.ts` | `audit(session, 'enquiry.status', { entity, entityId, summary })`. Call it after every change that matters. |
| `src/lib/wa.ts` | WhatsApp click-to-chat and phone links: `waLink`, `telLink`. |
| `src/components/ui/core.tsx` | Server-safe UI: `Button`, `LinkButton`, `buttonClass`, `Card`, `CardHeader`, `CardBody`, `PageHeader`, `Badge`, `StatusBadge`, `Stat`, `EmptyState`, `Table/Th/Td/Tr`, `Field`, `Input`, `Select`, `Textarea`, `FormGrid`, `Avatar`, `Detail`, `Meter`, `TabLinks`, `Notice`. |
| `src/components/ui/client.tsx` | Client UI: `Modal`, `Drawer`, `BottomSheet`, `useToast`, `LoadingButton`, `ConfirmButton`, `PrintButton`, `SearchInput`, `UrlSelect`, `UrlDate`, `Pagination`, `useUrlParam`, `FilterHost`. On a phone `Modal` and `Drawer` turn into a bottom sheet by themselves. |
| `src/components/ui/lang.tsx`, `src/lib/t.ts` | Dashboard words in the person's language: `useT()` in client components, `await getT()` in server components. Also `LangMenu`, the dropdown in the top bar. |
| `src/i18n/ui-hi.ts`, `ui-bn.ts`, `ui.ts`, `rich.tsx` | The Hindi and Bengali dashboard dictionaries, how `t()` works, and `rich()` for a sentence with a link or bold word inside it. |
| `src/components/ui/charts.tsx` | `BarsChart`, `AreaTrend`, `Donut`, `CHART_COLORS`. |
| `src/components/ui/motion.tsx` | `Reveal`, `Stagger`, `StaggerItem`, `CountUp`. |
| `src/components/cms/image-field.tsx` | `<ImageField value onChange folder />`: photo upload with preview, for any form. |
| `src/app/admin/_ui/` | Small dashboard helpers: `useAction` and `useForm` (forms that call a server action), `ContactLinks`, `FilterBar`, `readSearch`, `query`. |
| `src/components/dash/nav.ts` | The menu of the dashboard (`NAV`) and the phone bottom bar (`TABS`). A screen not listed there cannot be reached. |
| `src/components/dash/shell.tsx` | The dashboard frame: sidebar and top bar on a laptop; top bar, bottom bar and the "More" icon grid on a phone. It sets the page width (up to 1880px), so a screen never sets its own outer width. Shared by every client: do not change it for one client. |
| `src/components/dash/notifications.tsx`, `src/server/notifications.ts` | The bell in the top bar and the Notifications screen. The server file is where a module adds its own lines. |
| `src/components/pwa/pwa.tsx`, `install-banner.tsx`, `src/app/manifest.ts`, `public/sw.js` | The installable app: `usePwa()`, `<InstallApp>`, the install bar, "Send app link to WhatsApp", the offline bar and the loading bar. The service worker keeps only fixed files, never a dashboard screen or data. |
| `src/cms/*` | Website content: section definitions, `content(section)` reader. |

Use these. Do not write a second button, a second date formatter or a second table style.

## Roles

`admin` and `staff`.

- `admin` does everything.
- `staff` does the day-to-day work but cannot open Team and logins, the Activity log or Settings, and cannot delete an enquiry.
- Check the role in the service (`assertAdmin(session)`, `assertTeam(session)` from `src/server/admin/shared.ts`), not only by hiding the button.
- When a record id comes from the browser, load the record on the server and check it exists before changing it.

## How a feature is laid out

```
src/server/<domain>/service.ts   plain async functions. Take the actor first:
                                 (session: Session, input)
                                 Check the role, validate with zod, do the work,
                                 write the audit line.
                                 No cookies(), no redirect(), no revalidatePath() here,
                                 so they can be tested with vitest.
src/server/<domain>/actions.ts   'use server'. Each action: get the session,
                                 call the service, revalidatePath(), wrapped in action().
src/app/admin/<route>/page.tsx   server component: auth, load data, render.
src/app/admin/<route>/*.tsx      client components for forms and interactive parts.
tests/<domain>.test.ts           vitest against the in-memory database.
```

`src/server/enquiries` with `src/app/admin/enquiries` and `tests/enquiries.test.ts` is the worked example. Copy its shape.

Money rules, for any module that handles money: whole rupees, integers only. A payment is never deleted, it is cancelled (keep a `voidedAt` column), and cancelled rows are left out of every total. Anything that writes more than one row about money runs inside `db.transaction`.

Lists: filters live in the URL (`?q=&status=&page=`) using `SearchInput`, `UrlSelect`, `UrlDate`, `Pagination`, so a filtered list can be bookmarked and the back button works. 25 rows a page. Put the filters inside `<FilterBar>` (it carries the `filter-bar` class).

Forms: a `Drawer` or `Modal` for short forms, a page for long ones. Show field errors from `result.fields` under the field. Disable the button while saving (`LoadingButton`). Toast on success. Confirm before anything destructive (`ConfirmButton`).

Every list has an `EmptyState` that says what the screen is for and offers the first action. Every screen must work at 360px wide with no sideways scroll.

## The dashboard on a phone

The dashboard must feel like an app on a phone, not a small web page. The shared kit does this, as long as a screen uses the kit and does not invent its own pieces.

- **Frame.** A top bar (the logo, or a back arrow on an inner screen, then the bell, the language and the person), and a bottom bar with up to four screens and "More". "More" slides up one grid of icons, four to a row, with every screen the person may open. It can be pulled down to shut.
- **Heading row.** `PageHeader` keeps the screen's buttons on the same row as the heading. Put the add button in `actions`, never in a row of its own below.
- **Forms.** `Modal` and `Drawer` open as a bottom sheet on a phone. Pull the top edge up for the full screen, pull it down to shut. On a laptop the `Drawer` comes in from the right and its left edge can be pulled to make it wider. Nothing to do in the screen: just use `Modal` or `Drawer`.
- **Filters.** At phone width every `UrlSelect` and `UrlDate` hides itself and a round filter button appears at the bottom right. It opens a sheet with each filter as a tick list. The search box keeps its row. Again nothing to do in the screen.
- **Tables.** `Table` draws each row as a card on a phone, with the column heading beside each value. The frame copies the headings onto the cells, so give every column a `Th` with words in it (an empty `Th` is fine for a column of buttons).
- **Pinned things.** Anything fixed to the bottom of the screen adds `var(--dash-bottom)` so it sits above the bottom bar: `bottom-[calc(1rem+var(--dash-bottom))]`. Toasts already do.
- **Motion.** Sheets slide on every device, also where the phone asks for less motion (`MotionConfig reducedMotion="never"` in the frame). The owner asked for this. The public website still follows the phone's setting.
- **Flat look.** The classes `dash-app app-ui` on the frame switch the dashboard to squarer corners and lighter shadows through CSS variables (see `html:has(.app-ui)` in `src/app/globals.css` and the radius and shadow lines in `tailwind.config.ts`). The login and password screens carry `app-ui` too. The public website is not touched by it.
- **Install bar.** A black bar drops from the top on the login screen and in the dashboard for anyone who has not installed the app: logo on the left, Install on the right, a WhatsApp button to send the link to a phone. It shows a moment after every load, stays 15 seconds, comes back about every 30 minutes, and the cross hides it until the next load.
- **Send app link to WhatsApp** (in the person's menu). In the starter everyone sends only their own link. A project with more kinds of user adds them to `AUDIENCES` in `src/components/pwa/install-banner.tsx`; the note there says how.

## Dashboard languages

The dashboard, the login screen and the password screen can be read in English (the default), Hindi or Bengali. Each person picks from the dropdown in the top bar; the choice is kept in the `ui_lang` cookie for a year. The dropdown stays in the top bar, never inside the menu.

- The English sentence is the key. Write `t('Add login')`; the Hindi and Bengali files say what that is. Nothing to register.
- Server component: `const t = await getT();` Client component: `const t = useT();`
- With a value: `t('{n} new enquiries', { n: 12 })`. With a link or bold word inside the sentence: `rich(t('Change it any time from {link}.'), { link: <Link ...> })`.
- Every word a person reads goes through `t()`: headings, labels, buttons, hints, empty states, toasts, error messages from the server (`t(result.error)`), menu labels and status words.
- Do not translate what a person typed in, names, amounts or dates.
- Add each new sentence to **both** `src/i18n/ui-hi.ts` and `src/i18n/ui-bn.ts`. Keep every `{name}` in the translation. `tests/ui-i18n.test.ts` fails when a sentence on a screen is missing from either file, when the two files differ, or when a `{name}` was dropped. Add your module's folder to `SCANNED` in that test.
- A sentence that only reaches `t()` through a variable (a label in `nav.ts`, a status word, an error thrown in a service) is not seen by the test. Add it to both files by hand.
- Plain everyday Hindi and Bengali. Common English office words (Login, Password, Gallery, WhatsApp) stay as people say them.
- How it travels: the middleware reads the cookie and passes the language on in a request header, for `/admin`, `/account` and `/login`. The edit panel's section screens have a dot in the address (`/admin/website/home.intro`), so the middleware names `/admin/website/:path*` as a second matcher. An API route does not pass through that step and reads the cookie itself (see `src/app/api/notifications/route.ts`).

## Notifications

The bell in the top bar shows what needs the person today. Nothing is stored: each line is worked out from the database when asked, so it appears when the thing happens and goes away by itself when the thing is dealt with. Which lines a person has already seen is kept on their own device (localStorage), and the bell counts the rest.

The starter shows: enquiries nobody answered for more than two days (red), other new enquiries (amber), website changes saved but not published (amber), notices that went up in the last seven days (blue).

To add your own, open `src/server/notifications.ts`. Write one function that takes the session and `t` and returns a list of lines, then add it to `SOURCES` at the bottom. The bell, the count and the screen pick it up. A new kind of line needs an icon in `src/components/dash/notifications.tsx`. The note at the top of the server file has the details.

## Common features a module plugs into

Each of these is a list in one file. A module adds its entry there; the screens, the bell and the daily job pick it up.

| Feature | Add your entry to | Example |
|---|---|---|
| WhatsApp reminders | `REMINDER_KINDS` in `src/server/reminders/kinds.ts` | fee due in 3 days, birthday today. Give each a `dedupeKey` naming the thing and the occasion, and a `resolved` check so a paid fee's reminder is set aside by itself. |
| Trash | `SOURCES` in `src/server/trash/service.ts` | a customer, a product. Set `deletedAt` instead of deleting, leave such rows out of every list, and make `purge` refuse when money records hang off the row. |
| Import from a spreadsheet | `<ImportButton fields onImport>` on the screen (`src/components/ui/import.tsx`), and `runImport(rows, schema, save)` in the service (`src/server/import.ts`) | customers, products. Each row is checked with zod; a refused row is listed with its reason. |
| "What to do next" cards | `RULES` in `src/server/suggestions.ts` | "this month's costs are higher than the takings". Plain rules over counts, never a guess. |
| Daily job | `JOBS` in `src/server/jobs.ts` | the monthly bill run. Must be safe to run twice. |
| Plan | `plan: 'platinum'` on the menu item in `nav.ts`, and `await requirePlan('platinum')` at the top of the page | every business screen is Platinum; website editing is `panel`. |

The plan and the paused account (`src/server/platform.ts`, `src/lib/plans.ts`) are set only by Nexvora through `/api/platform`. `requireSession` already sends everyone to `/suspended` while the account is paused, so a module does nothing for that.

## Website content

The site is cut into sections declared in `src/cms/sections/`. Each declaration lists its fields and default text, and from it come the page's typed content, the edit panel's form and the voice assistant's vocabulary.

To add an editable block: declare it with `defineSection`, add it to `SECTIONS` in `src/cms/sections/index.ts`, add its Bengali and Hindi wording in `src/cms/sections/translations/`, then read it in the page with `content(section)`. The test `tests/site-translations.test.ts` fails if a translation is missing.

Fixed words of the website (menu labels, form labels, error messages) live in `src/components/site/i18n/en.ts`, `bn.ts` and `hi.ts`. All three must have the same keys.

Bengali and Hindi pages are the same pages under `/bn` and `/hi`. The middleware strips the prefix and passes the language on. The dashboard does not use the address for its language; see "Dashboard languages" above.

## Look and feel

Dashboard: calm, flat, fast. A white sidebar and white cards on the pale background, thin borders instead of heavy shadows, the brand colour for primary actions, the accent colour only for danger and overdue. Screens use the full width. Numbers in tiles and tables use the `tabular` class. Subtle motion only: a screen fades in (`animate-page-in`, done by the frame), tiles count up (`CountUp`), sheets slide.

Public website: this is where the animation budget goes.

The page width (up to 1880px), the sidebar, the phone bottom bar, the icon-grid menu, the bell, the language dropdown, the install bar and the offline bar are the same for every client. A client changes the name, the logo and two colour scales, never the layout.

## Words

Write the way the owner of the business talks. Short labels, sentence case, no jargon, no exclamation marks, no long dashes. Error messages say what to do: "Enter a 10 digit mobile number".

Never state something about the business that we do not know to be true: no invented counts, years, awards, prices or testimonials.

## Checking your work

- Typecheck: `npm run typecheck`
- Tests: `npm test`, or one file: `npx vitest run tests/<file>.test.ts`
- Run it: `npm run dev`, then http://localhost:3400. Log in with `admin` / `admin123`.
- Look at your screens at 1440 and 390 wide. At 390 check there is no sideways scroll, the add button is on the heading row, the form opens as a sheet, and the filters are behind the round button.
- Switch the dashboard to Hindi and to Bengali from the top bar and look again. An English sentence on a Hindi screen means a `t()` is missing or the sentence is not in the dictionary.
- A second build beside a running dev server: set `NEXT_DIST_DIR=.next-verify` first, and delete that folder afterwards.
- Local data: `APP_DATA_DIR=memory` gives a throwaway database for one run; `npm run db:reset` deletes the local one.

## Hard rules

- No `any` to silence the type checker where a real type is a line away. No commented-out code. No TODO left behind without telling the owner.
- Comments explain why, in plain words, where a reader would otherwise wonder.
- After changing `src/db/schema.ts`, run `npm run db:generate` and keep the new file in `drizzle/`. Never edit a migration that has already gone live; make a new one.

## Adding a business module

A business module is one area of work for one client: billing, stock, bookings, members, repairs. It sits beside Enquiries and follows the same shape. Take "bookings" as the example.

1. **Table.** In `src/db/schema.ts`, at the place marked "business modules", add the table (`bookings`) and its value lists (`BOOKING_STATUSES`). Add its row type at the bottom. Then run:

   ```
   npm run db:generate
   ```

   A new SQL file appears in `drizzle/`. The local database applies it on the next start. Neon gets it on the next Vercel build (`vercel-build` runs the migration first).

2. **Service.** Create `src/server/bookings/service.ts`. Plain async functions that take the session first: `listBookings(filters)`, `createBooking(session, input)`, `setBookingStatus(session, id, status)`. Each one checks the role, validates the input with zod, does the work and calls `audit(...)`. No cookies and no redirects here.

3. **Actions.** Create `src/server/bookings/actions.ts` with `'use server'` on the first line. Each action gets the session with `requireSession(TEAM_ROLES)`, calls the service, calls `revalidatePath('/admin', 'layout')`, and is wrapped in `action()`.

4. **Screens.** Create `src/app/admin/bookings/page.tsx` (the list) and, if needed, `src/app/admin/bookings/[id]/page.tsx` (one record). Client parts (forms, buttons) go in files beside them and use `useAction` from `src/app/admin/_ui/use-action.ts`. Every page starts with `await requireSession(TEAM_ROLES)` or `requireSession(ADMIN_ONLY)`.

5. **Menu.** In `src/components/dash/nav.ts`, add the screen to `NAV.admin`, in a group of its own if there are several:

   ```ts
   { title: 'Bookings', items: [{ href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck }] },
   ```

   Add `roles: ['admin']` to an item only admins may see. Choose an icon that shows what the screen is about: it is also the tile in the phone menu, so it must be clear without its label. Give the item a one-word `short` name if its label is long.

6. **Phone bottom bar (optional).** If the team opens this screen many times a day, put its address in `TABS.admin` in the same file. The bar holds four at most, so take one out when you add one.

7. **Words in Hindi and Bengali.** Wrap every word on the new screens in `t()`, and add each sentence to `src/i18n/ui-hi.ts` and `src/i18n/ui-bn.ts`: the screens' sentences, the menu label, title and short name, the status words, and the error messages the service throws. Add the module's folder to `SCANNED` in `tests/ui-i18n.test.ts`. See "Dashboard languages".

8. **Notifications (optional).** If the module has things that wait for someone (an order not packed, a payment overdue), add a function to `SOURCES` in `src/server/notifications.ts`. See "Notifications".

9. **Overview tile (optional).** Add a count to `getOverview()` in `src/server/admin/service.ts` and a `Stat` tile on `src/app/admin/page.tsx`.

10. **Status colours (optional).** New status words get their colour in `STATUS_TONES` in `src/components/ui/core.tsx`.

11. **Settings (optional).** A module with its own settings adds a group to `SETTING_DEFAULTS` in `src/server/admin/shared.ts` and a card on the Settings page.

12. **Tests.** Add `tests/bookings.test.ts`. Start it like `tests/enquiries.test.ts` (in-memory database, the seeded admin as the session) and cover: what is refused, what is saved, what staff may not do.

Other things a module may need:

- **A public form** (a visitor books or asks for a quote): add the schema and save function to `src/server/site/enquiries.ts`, and a route file under `src/app/api/public/<name>/route.ts` that is one line of `publicForm(...)`. Rate limiting and the bot trap come with it.
- **A new role** (say `customer` with its own area): add it to `ROLES` in the schema, to `ROLE_LABELS` and a new area in `nav.ts`, give it a home in `homeFor()` in `src/lib/session-token.ts`, and add the area's address to the two lists at the top of `src/middleware.ts`. Give the area a layout like `src/app/admin/layout.tsx` and a `notifications` page, answer for it in `src/app/api/notifications/route.ts`, and list the role in `AUDIENCES` in `src/components/pwa/install-banner.tsx`.
- **Photos**: use `<ImageField />`; uploads go through `/api/media` and are stored for you.

Keep the module's code in its own folders. Do not change the shared kit (`src/components/ui`, `src/components/dash`, `src/components/pwa`, `src/lib`) for one client. If something in the kit should be better for everyone, change it in `projects/_starter` too, so the next client gets it.
