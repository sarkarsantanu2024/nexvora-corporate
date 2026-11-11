# Nexvora platform plan

Written 2026-11-10 from Santanu's brief. The goal, in one paragraph:

Every real client gets three things built together, in one project under
`projects/`, on Santanu's Vercel and Neon: the website, an edit panel for the
website, and a business dashboard. The client (and their staff) log in or
sign up from their own website and land on one common dashboard. What they
see there depends on the plan they bought and on the kind of business. A
super admin login lets Santanu run every project, demo and client from one
place. Every client should bring in regular monthly income.

## Plans and what they switch on

| Plan | One-time | Monthly service (optional) | Edit panel | Dashboard |
| --- | --- | --- | --- | --- |
| Just get me started | ₹5,999 | ₹399 | no | no |
| Get my business online | ₹11,999 | ₹599 | no | no |
| Run it yourself | ₹15,999 | ₹799 | yes | add-on, ₹500 a month with the service |

Every plan is a five-page website. Revised by Santanu on 2026-11-11: the
Platinum plan is gone; the business dashboard is a ₹500 a month add-on for
Run it yourself clients, paid on top of the plan's monthly service. The plan
cards carry one price only; the monthly service (hosting, domain, backups,
security and small changes) is shown in the Nexvora Care section, with
the two bigger Care plans (₹1,499 / ₹2,999 a month) for content work.

The code is always built with everything in. Two switches per site, set by
the super admin at /admin, decide what the client can use:

- **Website editing**: switched on when Run it yourself is paid. Only then
  does the Login button appear on the client's website. After login the
  client lands on My website, not the dashboard.
- **Dashboard**: switched on when the ₹500 month is paid, off if it lapses.
  Until then every business menu shows a lock and a screen that says so.

Nexvora is never locked out: the owner account (admin / 123 on the samples)
opens every site's panel and dashboard whatever is switched on. On the
samples both switches default to on so a prospect sees the whole product.

## The dashboard

Signup form: full name, phone, full address, username, password, confirm
password. Nothing else. No password rules.

Common to every business type:

- Home: today's collection, this month, pending, who owes, expenses, profit or
  loss, and "what to do next" suggestions (as EduFlow does).
- People: customers, students, patients, members, parents. One list, labelled
  by business type.
- Money in: fees, bills, orders, advances. Partial payments. UPI QR with the
  amount filled in. One-tap WhatsApp reminder.
- Money out: expenses by category, recurring expenses, staff salary.
- Items: stock, products, services with prices (shops, pharmacies, hardware).
- Staff logins with limited screens.
- Reports: day, month, year; save as PDF; export CSV.
- Website: the edit panel, as built.
- Settings: business details, UPI id, logo, plan.

Per business type, the same modules wear different words and some are hidden:

| Group | People | Money in | Extra modules |
|---|---|---|---|
| Classes, coaching, dance, music, abacus, activity centre, play school | Students, parents | Monthly fees, admission | Batches, attendance, levels, certificates, ID cards, exams |
| Gym, yoga | Members | Membership plans | Batches, attendance, trainers, renewals due |
| Clinic, dental, homeopathy, pathology lab | Patients | Consultation fees, test bills | Appointments, doctors, reports sent |
| Shops: sweets, saree, tailor, jewellery, optical, mobile, furniture, hardware, pharmacy, bakery | Customers | Bills, advances, udhaar | Items and stock, low-stock alerts, orders due |
| Restaurant, caterer, banquet, decorator, photo studio, printing press | Customers | Bookings with advance, bills | Booking calendar, deliveries due, packages |
| Services: advocate, tax consultant, real estate, travel agent, garage, idol maker | Clients | Fees, instalments | Cases or jobs with status, deadlines, documents |

Reference for the look and the rules: EduFlow (`G:\1.AI-project\eduflow-saas`,
read only). Its `money.ts`, `wa-link.ts`, tenant resolver, sector config and
plan gating are the patterns to copy.

## Build order

1. Done: generic edit panel for all 38 demos, storage with Neon support,
   owner and client logins, admin list of sites.
2. Done (2026-11-11): admin "Add a client site" form (business, slug,
   template, website address, client phone, first password) at /admin. The
   site is stored in `nx_sites`, uses the template demo's sections, and
   appears in the admin table with the same switches and buttons as a
   demo; with a database the client's login is created too. The client's
   own HTML gets its data-nx attributes from `npm run nx:annotate` run on
   that project, plus `<meta name="nx-api" content="https://www.nexvoratechnologies.co.in">`
   so its `nx-content.js` and `nx-lang.js` read content, access and the
   Login link from this server (the public GETs answer with CORS).
   Still to do: the WhatsApp message to the client with their login.
3. Dashboard shell: signup and login from the client's site, the common Home
   with real numbers, plan-gated menu, super admin.
4. Modules in the order clients ask: Money in and People first (every
   business), then Items and stock, then the per-type extras.
5. Billing for the monthly running fee: UPI, manual approval, then Razorpay.

## Rules

- Every database query is scoped by site id. A client can never see another
  client's data, even by changing an id in a URL.
- Every screen works on a 360px Android phone on 4G, in English and Bengali.
- No em dashes in anything a client reads.
- Nothing is committed without Santanu's confirmation.
