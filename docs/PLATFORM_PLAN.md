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

| Plan | One-time | Monthly after 3 free months | Website | Edit panel | Dashboard |
|---|---|---|---|---|---|
| Just get me started | ₹5,999 | none | 1 page | no | no |
| Get my business online | ₹12,999 | none | 5 pages | no | no |
| Run it yourself | ₹14,999 | ₹299 | 5 pages | yes | no |
| Run my whole business (Platinum) | ₹24,999 | ₹999 | 5 pages | yes | yes |

Nexvora Care (₹1,499 / ₹2,999 a month) stays optional on top: that is
Santanu doing the content work. The running fee is different: it keeps the
panel or dashboard online. These numbers are a first proposal and need
review before they go live.

The code is always built with everything in. The plan only decides which
menu items are enabled. A client who upgrades gets the extra menus switched
on, nothing is rebuilt.

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
2. Next: admin "add a client site" form (business, slug, template, plan,
   client phone) that creates the site, the user and the WhatsApp message.
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
