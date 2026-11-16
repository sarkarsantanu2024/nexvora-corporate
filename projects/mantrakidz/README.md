# Mantra Kidz

Website, edit panel and franchise management software for Mantra Kidz (a play school chain, a unit of Mind Mantra Abacus). One Next.js app, one Postgres database.

| Who | Where | What they do |
|---|---|---|
| Visitors | `/` | Read about the school, find a centre, send an admission or franchise enquiry |
| Head office | `/hq` | Franchise leads, centres, royalty, reports, logins, and editing the website (by hand or by voice) |
| A centre | `/centre` | Enquiries, children, classes, attendance, fees and receipts, expenses, staff, notices |
| A parent | `/parent` | Their child's attendance, bills, receipts and notices |

Everyone logs in at `/login`; the role decides where they land.

## Run it on your machine

```
npm install
npm run dev          # http://localhost:3400
```

That is all. With no `DATABASE_URL`, the app uses an embedded Postgres (PGlite) stored in `.data/`, creates the tables and loads sample data on first start.

Sample logins, password `mantra123`:

| Username | Role |
|---|---|
| `admin` | Head office admin |
| `hqstaff` | Head office staff |
| `laketown` | Centre head of a sample franchise centre (has children, fees, attendance) |
| `laketown.desk` | Centre staff |
| `9000001005` | Parent |

`npm run db:reset` (with the server stopped) throws the local database away so the next start rebuilds it.

## Checks

```
npm run typecheck
npm test             # vitest, against an in-memory database
```

## Put it live (Vercel + Neon)

1. **Neon**: create a project, copy the **pooled** connection string (host contains `-pooler`).
2. **Vercel**: new project from this repository, **Root Directory = `projects/mantrakidz`**. Framework: Next.js. The build command is picked up from `vercel-build` (it creates or updates the tables, then builds).
3. Environment variables on Vercel:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the Neon pooled connection string |
   | `SESSION_SECRET` | any long random string (for example `openssl rand -base64 48`) |
   | `NEXT_PUBLIC_SITE_URL` | `https://www.mantrakidz.com` |
   | `BLOB_READ_WRITE_TOKEN` | added for you when you create a Blob store under Storage (photo uploads) |
   | `ANTHROPIC_API_KEY` | optional: lets the voice assistant understand free-form sentences |
   | `ADMIN_PASSWORD` | the starting password of the `admin` login (used once, by the seed) |

4. Load the first data once, from your machine:

   ```
   set DATABASE_URL=<neon string>      (PowerShell: $env:DATABASE_URL="…")
   set ADMIN_PASSWORD=<a strong one>
   npm run db:seed                     # admin login, the four programmes, academic year, head centre
   npm run db:seed -- --demo           # use this instead to also load the two sample centres for a client demo
   ```

   The admin is asked to change the password at first login. Sample centres are removed from HQ › Settings › Remove sample data.
5. Point the domain at Vercel when the client approves.

## Where things are

```
src/app/(site)      the public website
src/app/hq          head office dashboard (and /hq/website, the edit panel)
src/app/centre      centre dashboard
src/app/parent      parent corner
src/app/api         REST endpoints (public forms, /api/v1, media, voice)
src/server          the business logic, one folder per area (testable, no HTTP in it)
src/db              schema, connection, seed
src/cms             what is editable on the website, section by section
src/voice           the voice engine and command grammar
src/components      ui kit, dashboard shell, website pieces, edit-panel pieces
drizzle             SQL migrations (generated: npm run db:generate)
tests               vitest
docs                ARCHITECTURE, COSTING, CONVENTIONS, CONTENT_TO_CONFIRM
```
