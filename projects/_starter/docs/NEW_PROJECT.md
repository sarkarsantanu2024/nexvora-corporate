# Starting a new client project

A checklist. Work down it in order. The full picture (architecture, EduFlow features to add, module catalogue, plans, and a prompt to paste) is in `BLUEPRINT.md`. Commands are typed in a terminal opened at the top folder of the repository (`nexvora-corporate`).

## 1. Make the project

```
node scripts/new-client-project.mjs <slug> "<Business Name>"
```

Example: `node scripts/new-client-project.mjs sunrise-stores "Sunrise Stores"`

- The slug is the folder name: small letters, digits and hyphens only.
- This copies `projects/_starter` to `projects/<slug>` and puts the business name into `src/config/brand.ts`, `package.json`, `README.md` and the offline page.
- It refuses to run if `projects/<slug>` already exists.

Then:

```
cd projects/<slug>
npm install
npm run dev
```

Open http://localhost:3400. Log in at `/login` with `admin` / `admin123`.

## 2. Name and wording: `src/config/brand.ts`

- [ ] `name`: check the spelling.
- [ ] `shortName`: 12 letters or fewer. It sits under the app icon on a phone.
- [ ] `tagline`: one short line.
- [ ] `description`: one line shown on the login screen.

## 3. Colours: `tailwind.config.ts`

- [ ] Change the **`brand`** scale to the main colour of the client's logo.
- [ ] Change the **`accent`** scale to the second colour (used for the main website button and for alerts).
- [ ] Copy the new `brand` 700 value into `themeColor` in `src/config/brand.ts`.
- [ ] Put the same value in `public/offline.html` (it appears three times as `#3f348f`).

Leave the other colours (sun, mint, sky, coral, ink) alone unless the client asks.

## 4. Logo and app icons

- [ ] Replace `public/brand/mark.png` with the client's logo: square, PNG, at least 512 x 512.
- [ ] Replace `public/brand/icon.png` with a small copy (64 x 64) for the browser tab.
- [ ] Run `npm run icons`. It makes the phone app icons from `mark.png`.

No logo yet? `node scripts/make-placeholders.mjs "<Business Name>"` makes a plain one with the first letter, then run `npm run icons`.

## 5. Look at it

- [ ] Home, About, Gallery, Contact on a laptop and on a phone.
- [ ] Send a test message from the Contact page and find it under Enquiries. The bell in the top bar of the dashboard should show 1.
- [ ] The dashboard on a phone (or a browser window made 390 wide): the bottom bar, "More" opening the grid of icons, Add login opening as a sheet from the bottom, the round filter button on the Activity log.
- [ ] The language dropdown in the top bar: Hindi and Bengali both read correctly.
- [ ] The black install bar drops from the top of the login screen with the client's logo in it.
- [ ] `npm run typecheck` and `npm test` both pass.

## 6. Client-specific work

- [ ] List what this client needs beyond the starter (billing, stock, bookings and so on).
- [ ] Build each one as a business module: `docs/CONVENTIONS.md`, "Adding a business module".
- [ ] For every new screen: an icon that fits it in the menu, every word through `t()` with Hindi and Bengali added, the add button on the heading row, forms in a `Modal` or `Drawer`, filters as `UrlSelect` or `UrlDate` inside `FilterBar`. `docs/CONVENTIONS.md`, "The dashboard on a phone" and "Dashboard languages".
- [ ] Things that wait for someone (an order, a payment due) go on the bell: `src/server/notifications.ts`.
- [ ] If the client has more kinds of user than admin and staff, decide whose app link each may send on WhatsApp: `AUDIENCES` in `src/components/pwa/install-banner.tsx`.

## 7. Go live

Full steps are in `README.md`, "Put it live". In short:

- [ ] **Neon**: new project, copy the pooled connection string.
- [ ] **Vercel**: new project, Root Directory `projects/<slug>`, Build Command `npm run vercel-build`.
- [ ] **Blob store**: create it as **Public**, connect it to the project with the read-write token box ticked.
- [ ] **Environment variables**: `DATABASE_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET` and `PLATFORM_SECRET` (two different random strings of 32 characters or more; keep the platform one in your own records), and `ANTHROPIC_API_KEY` if voice should understand free sentences.
- [ ] **Plan**: the app starts on Platinum. If the client bought less, set it: `curl -X POST https://<site>/api/platform -H "Authorization: Bearer <PLATFORM_SECRET>" -H "Content-Type: application/json" -d '{"plan":"panel"}'`.
- [ ] **Daily job**: the next morning, Settings › Your plan should say when the daily check last ran.
- [ ] **Seed**: with `DATABASE_URL` and `ADMIN_PASSWORD` set in your terminal, run `npm run db:seed` once.
- [ ] Log in on the live site and change the admin password when asked.
- [ ] Open the live site on a phone, tap Install on the black bar, and check the app opens from its icon. Send the app link to the owner from the person menu, "Send app link to WhatsApp".

## 8. Real content

- [ ] Edit website: replace every placeholder line. Fill in Contact details (phone, WhatsApp, address, map link).
- [ ] Gallery: add the client's photos, then delete the album "Sample photos".
- [ ] Team and logins: make a login for each person. Do not share the admin login.
- [ ] Never write something about the business that is not true: no made-up years, counts, awards or reviews.
- [ ] Point the domain at Vercel when the client approves.
