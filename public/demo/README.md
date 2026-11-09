# The client demos

One folder per kind of business. **The folder name is the URL.**

```
public/demo/yoga/index.html      ->  https://www.nexvoratechnologies.co.in/demo/yoga
public/demo/abacus/index.html    ->  https://www.nexvoratechnologies.co.in/demo/abacus
public/demo/dance/index.html     ->  https://www.nexvoratechnologies.co.in/demo/dance
```

That is the whole system. To add a category: make the folder, put `index.html`
in it, push. There is no route to register. To show it on the /demos page of
the main site, add one entry to `src/lib/demos.ts` — the page reads from that
list and nothing else.

## What every demo carries

- **A strip at the very top** saying it is a sample website by Nexvora
  Technologies, with links to the main site, to `/demos` ("See all samples")
  and a WhatsApp link ("Get one like this"). A line in the footer says the
  business, address and prices are examples.
- **Every WhatsApp and call button goes to Nexvora's own number**
  (`wa.me/919804243159`, `tel:+919804243159`), with a message that names the
  sample. A curious visitor reaches Santanu, not a dead placeholder.
- **A floating dock of social buttons** — WhatsApp, call, Facebook, YouTube,
  Instagram and Google Maps — small (36px) on the right edge, halfway down,
  on every screen size. It sits off-screen while the page is scrolling and
  slides in 2.5 seconds after scrolling stops, so it never covers the words
  somebody is reading.
- **A right-side drawer for the phone menu**, sliding in with a backdrop,
  a close button, Escape to close and focus handled. The drawer markup sits
  outside the header, because a header with `backdrop-filter` becomes the
  containing block for anything `position:fixed` inside it.
- **A back-to-top button**, bottom-right, shown after about 700px of scroll.
- **Indian photographs only.** Where Pexels has no Indian-subject photo for a
  scene, use a photo with no people (the room, the objects, hands) rather
  than a non-Indian person.
- **A hero photograph named `hero.jpg`** in `images/`, because the card on
  `/demos` uses that file.
- **A dummy Kolkata address, dummy hours and dummy prices.** A Google Maps
  embed and a "Get directions" link to the dummy address are fine.

## What no demo may carry

**No Google rating or Google review claims.** No "5.0 Google Rating", no
"50+ reviews", no star counts, no "See Google Reviews" button. An invented
business cannot have a real rating, and a sample that shows one teaches the
customer to expect a lie. Build trust with facts instead — years open, class
size, hours, a price list, the process. One or two short plain testimonials
with a first name are acceptable; stars and counts are not.

## The rules

**`index.html` is the only required name.** The clean URL `/demo/yoga` is a
rewrite to `/demo/yoga/index.html`, set in `next.config.mjs`. A file called
anything else will not answer on the short link.

**Keep each demo self-contained.** Its own CSS, its own fonts, its own images —
inside its own folder, or loaded from a URL. A demo must not import anything
from the main site, because the point of it is to look like the customer's own
website rather than like a page of ours with their name on it.

**Anything else in the folder is served as itself.** `public/demo/yoga/images/hero.jpg`
answers at `/demo/yoga/images/hero.jpg`. Reference assets with absolute paths
(`/demo/yoga/images/hero.jpg`): the clean URL `/demo/yoga` has no trailing
slash, so a relative `./images/hero.jpg` resolves to `/demo/images/hero.jpg`
and breaks. When a demo is handed to a client, a search-and-replace of the
`/demo/<slug>/` prefix is the one change needed.

**Slugs stay lowercase and hyphenated.** `beauty-salon`, not `Beauty Salon` or
`beauty_salon`. URLs are case-sensitive on the server even though Windows is
not, and a capital letter in a folder name is the kind of thing that works on
your laptop and 404s in front of a customer.

## Google

Every demo is served with `X-Robots-Tag: noindex, nofollow`, set for
`/demo/*` in `next.config.mjs`. This is deliberate. These are invented
businesses with invented addresses; a dozen of them indexed under our domain
would dilute the real pages and put shops that do not exist into search
results. The links still work perfectly when you send one to somebody — being
out of the index is not the same as being hidden.

Nothing extra needs doing per demo. The header covers the whole folder,
including demos added later.

## Before sending a link

Run this from the repo root and fix anything it prints:

```
f=public/demo/<slug>/index.html
grep -n -i -E "google rating|google review|_HERE|lorem" $f
grep -o '/demo/<slug>/images/[^" ]*' $f | sort -u | while read p; do [ -f "public$p" ] || echo "MISSING $p"; done
```

Also check the demo says somewhere that it is a demonstration. `/disclaimer`
promises that every example on this site is labelled for what it is — a real
client's work, our own product, or something built to show what is possible —
and a demo site with an invented business name is exactly the case that
promise was written for.
