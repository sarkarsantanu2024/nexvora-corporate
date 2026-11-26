# Dum Dum Kishore Bharati High School

The website, the edit panel and the dashboard of Dum Dum Kishore Bharati High School. One Next.js app, one Postgres database. Built from the Nexvora client starter (`projects/_starter`).

## What is in the box

| Who | Where | What they do |
|---|---|---|
| Visitors | `/` | Home, About, Gallery, Notices and Contact, in English, Bengali (`/bn`) and Hindi (`/hi`). The contact form sends an enquiry. |
| The team | `/admin` | Overview, Enquiries, Notifications, Edit website (by hand or by voice), Gallery, Notices, Team and logins, Activity log, Settings |
| Everyone with a login | `/login` | One login screen. A first-time password must be changed before anything else. |

Also built in:

- **Edit panel**: every part of the website is a section with a form. Save makes a draft, Publish puts it live, and every publish can be undone from the history.
- **Photo library and gallery**: uploads are shrunk and converted by the server.
- **Voice editing**: speak a change in English, Hindi or Bengali; it shows what it understood before saving.
- **Phone app**: on a phone the dashboard works like an app. A bottom bar holds the main screens, "More" slides up every screen as a grid of icons, forms and filters open as sheets from the bottom, and tables are drawn as cards. It installs to the home screen and shows a "no internet" page when offline.
- **Install bar**: a black bar at the top of the login screen and the dashboard offers to install the app, or to send its link to a phone on WhatsApp. The person menu has "Send app link to WhatsApp" too.
- **Bell**: the top bar shows what needs doing today: enquiries not yet answered, website changes not yet published, new notices. Each line goes away by itself once it is dealt with.
- **Three languages for the team**: each person can read the dashboard in English, Hindi or Bengali, chosen from the top bar.
- **Two roles**: `admin` does everything; `staff` cannot open Team and logins, the Activity log or Settings.
- **Activity log**: who changed what, and when.
- **Reminders**: WhatsApp messages that fall due (a thank-you to a new enquiry; a module adds fee due, birthdays and so on) wait on one screen. Send opens the person's own WhatsApp with the text ready. The wording and on/off switches are in Settings.
- **Trash**: what is deleted can be brought back by an admin, or removed for good.
- **Import from a spreadsheet**: a CSV file or cells pasted from Excel, with the columns matched on screen and bad rows listed with the reason (Enquiries has it; a module reuses `ImportButton` and `runImport`).
- **What to do next**: cards on the overview from plain rules (business details missing, sample photos still up, the daily job stopped).
- **Plan and pause**: the client gets everything; the plan (`website`, `panel`, `platinum`) decides which screens open. Nexvora changes it, or pauses the dashboard, through `/api/platform` with `PLATFORM_SECRET`. A paused account keeps its website up.
- **Daily job**: at 9:00 India time Vercel calls `/api/cron/daily` (`vercel.json`), which makes the reminders and clears old ones.
- **Security headers** on every page (`next.config.ts`).

Work that is special to this client (billing, stock, bookings, members and so on) is added as a business module. See `docs/CONVENTIONS.md`, "Adding a business module".

## Run it on your machine

```
npm install
npm run dev          # http://localhost:3400
```

That is all. With no `DATABASE_URL`, the app uses an embedded Postgres (PGlite) stored in `.data/`. On first start it creates the tables, the admin login and six sample photos.

First login: username `admin`, password `admin123`. The login screen shows this on your own machine only.

`npm run db:reset` (with the server stopped) throws the local database away so the next start rebuilds it.

## Checks

```
npm run typecheck
npm test             # vitest, against an in-memory database
```

## Put it live (Vercel + Neon)

1. **Neon**: create a project and copy the **pooled** connection string (the host contains `-pooler`).
2. **Vercel**: new project from this repository.
   - **Root Directory** = `projects/kishorebharati` (the folder of this project).
   - Framework: Next.js.
   - **Build Command** = `npm run vercel-build`. It creates or updates the tables, then builds.
3. **Photo storage**: in the Vercel project open Storage and create a **Blob** store. Choose **Public** access (a private store cannot show photos on the website). Connect it to this project and keep the **read-write token** box ticked, so Vercel adds `BLOB_READ_WRITE_TOKEN` for you.
4. Environment variables on Vercel:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the Neon pooled connection string |
   | `SESSION_SECRET` | any long random string (for example from `openssl rand -base64 48`) |
   | `NEXT_PUBLIC_SITE_URL` | the live address, for example `https://www.example.com` |
   | `BLOB_READ_WRITE_TOKEN` | added for you in step 3 |
   | `CRON_SECRET` | any random string of 32 characters or more: turns on the daily job (reminders, clean-up) |
   | `PLATFORM_SECRET` | another random string of 32 characters or more: Nexvora's key for the plan and pausing (`/api/platform`) |
   | `ANTHROPIC_API_KEY` | optional: lets the voice assistant understand free-form sentences |

   Redeploy after adding or changing a variable.
5. Create the admin login once, from your machine.

   PowerShell:

   ```
   $env:DATABASE_URL="<neon pooled string>"
   $env:ADMIN_PASSWORD="<a strong password>"
   npm run db:seed
   ```

   Command Prompt uses `set DATABASE_URL=<neon pooled string>` and `set ADMIN_PASSWORD=<a strong password>` instead.

   Close that terminal afterwards, so the next `npm run dev` goes back to the local database. The admin is asked to change the password at the first login.
6. Log in on the live address, open Edit website, and replace the placeholder words and photos. Delete the album "Sample photos" from Gallery.
7. Point the domain at Vercel when the client approves.

## Where things are

```
src/config/brand.ts  the name, logo and app colours of this client
tailwind.config.ts   the colour scales (change `brand` and `accent` per client)
src/app/(site)       the public website
src/app/admin        the dashboard (and /admin/website, the edit panel)
src/app/api          endpoints: the public contact form, media, voice, notifications
src/server           the business logic, one folder per area (testable, no HTTP in it)
src/i18n             the dashboard in Hindi and Bengali (ui-hi.ts, ui-bn.ts)
src/db               schema, connection, seed
src/cms              what is editable on the website, section by section
src/voice            the voice engine and command grammar
src/components       ui kit, dashboard shell, phone app pieces, website pieces, edit-panel pieces
drizzle              SQL migrations (made by: npm run db:generate)
scripts              migrate, seed, reset, app icons, placeholder pictures
tests                vitest
docs                 CONVENTIONS (how the code is built), NEW_PROJECT (checklist for a new client)
```
