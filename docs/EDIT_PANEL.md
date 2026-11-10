# The Edit Panel

One panel for every demo and every client website. The panel has no code for
any particular business type. It reads a small schema per site and builds its
screens from that.

## How it works

```
public/demo/<slug>/index.html      the website, with data-nx ids on editable things
src/nx/demos/<slug>.json           its schema: sections, fields, lists, default values
public/nx/nx-content.js            runs on the page, applies saved content on load
src/nx/*                           types, schema helpers, storage, auth, i18n
src/nx/panel/*                     the panel's React pieces (provider, fields, lists)
src/app/panel/**                   /panel, /panel/<site>, /panel/<site>/<section>
src/app/admin/page.tsx             /admin, the owner's list of all sites
src/app/api/nx/**                  content and session API
scripts/nx-annotate.mjs            writes the ids and the schema for every demo
```

1. `npm run nx:annotate` reads each demo's HTML and marks every heading,
   paragraph, list line, button, link and photo with a stable `data-nx` id.
   Repeated items (price rows, service cards, gallery photos, testimonials)
   become lists the owner can add to, remove from and reorder. Phone,
   WhatsApp, map and social links become one "Contact" section that changes
   every button on the page at once. Page title and description become an
   "SEO" section. The rest of the file is left byte for byte as it was.
2. The panel shows one card per section, in page order, with the labels in
   English and Bengali. Every change saves as a draft by itself.
3. "Publish changes" copies the draft to the published content. The page's
   `nx-content.js` fetches the published content and writes it into the
   `data-nx` elements. "Undo last publish" goes back one version (up to 30
   are kept). Preview opens the page with `?nx-preview=1` and a banner.

Clients can never add, remove, rename or move sections, or touch the design.
They can only change what is inside the fields the schema lists.

## Where content is stored

Decided by `storageMode()` in `src/nx/store.ts`:

| Mode | When | Where it saves |
|---|---|---|
| `browser` | Deployed with no `DATABASE_URL` | Nowhere on the server. The panel and the demo page share the visitor's own localStorage, so a prospect can try the panel on the live site and see the change on the demo. |
| `file` | Local development | `.nx-data/<site>.json` (gitignored). |
| `neon` | `DATABASE_URL` is set | Neon Postgres. Tables `nx_content`, `nx_history`, `nx_users` are created on first use. |

`NX_STORAGE=browser|file|neon` forces a mode for testing.

## Logins

Only in `neon` mode. `nx_users` holds name, phone, bcrypt hash, role (`owner`
or `client`), the sites a client may edit, and `must_change_password`. The
owner may edit every site. Five wrong passwords lock an account for fifteen
minutes. The session is a signed httpOnly cookie (`NX_SESSION_SECRET`).

Create the owner once:

```
OWNER_NAME="Santanu Sarkar" OWNER_PHONE=98042xxxxx OWNER_PASSWORD=... npm run nx:seed-owner
```

Client users are created with `upsertUser()` in `src/nx/auth.ts` (an admin
screen for this is the next step).

## Going live with a real client

1. Build the client's site the same way as a demo (any HTML or React page
   works as long as the editable things carry `data-nx` ids; the annotator
   does this for static HTML).
2. Register it in `src/nx/demos/index.ts` (or a future `sites` table) with its
   schema and URL.
3. Set `DATABASE_URL` and `NX_SESSION_SECRET` on Vercel, seed the owner,
   create the client user with their site slug.
4. Send the client the panel link, their phone number and temporary
   password. They are asked to change it on first login.

## Photos

The browser fixes rotation, crops to the field's shape, shrinks to 1600px and
to under about 300 KB, and saves WebP. Today the result is stored inside the
content as a data URL, which is fine for the demo and for small sites. For
clients with many photos, add Cloudflare R2 behind `src/nx/store.ts` and save
the URL instead; the panel's `compressImage()` already produces the file.

## Known limits (first version)

- Lists are detected only where items are true siblings with the same shape.
  A few one-off blocks are plain fields, which is correct but means no "add".
- Inline-styled headings (an italic word, a coloured span) are edited as text
  with their styling kept; the owner cannot add new styling, by design.
- The `ld+json` structured data in each demo is not yet rewritten from
  content.
- Hideable sections and per-site extra sections are not yet supported.
