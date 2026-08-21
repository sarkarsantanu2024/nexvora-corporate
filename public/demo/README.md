# The client demos

One folder per kind of business. **The folder name is the URL.**

```
public/demo/yoga/index.html      ->  https://www.nexvoratechnologies.co.in/demo/yoga
public/demo/abacus/index.html    ->  https://www.nexvoratechnologies.co.in/demo/abacus
public/demo/dance/index.html     ->  https://www.nexvoratechnologies.co.in/demo/dance
```

That is the whole system. To add a category: make the folder, put `index.html`
in it, push. There is no route to register and no code to change.

## The rules

**`index.html` is the only required name.** The clean URL `/demo/yoga` is a
rewrite to `/demo/yoga/index.html`, set in `next.config.mjs`. A file called
anything else will not answer on the short link.

**Keep each demo self-contained.** Its own CSS, its own fonts, its own images —
inside its own folder, or loaded from a URL. A demo must not import anything
from the main site, because the point of it is to look like the customer's own
website rather than like a page of ours with their name on it.

**Anything else in the folder is served as itself.** `public/demo/yoga/hero.jpg`
answers at `/demo/yoga/hero.jpg`. Reference assets with paths relative to the
demo folder (`./hero.jpg`), so the folder can be renamed or handed to a client
whole without every link breaking.

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

Check the demo does not still carry template placeholders — `WHATSAPP_NUMBER_HERE`,
`WEBSITE_URL_HERE`, `PHONE_NUMBER_HERE`. A customer clicking a WhatsApp button
that goes nowhere is worse than a demo with no button at all.

Also check the demo says somewhere that it is a demonstration. `/disclaimer`
promises that every example on this site is labelled for what it is — a real
client's work, our own product, or something built to show what is possible —
and a demo site with an invented business name is exactly the case that
promise was written for.
