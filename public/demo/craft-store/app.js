/* Mati Kotha Crafts, sample store: router, views and cart.
 * Runs only in the browser. Nothing is sent to any server: carts, orders,
 * wishlists and saved details live in this browser's storage (NxShop.store).
 */
(function () {
  "use strict";
  var S = window.NxShop, D = window.MK;
  if (!S || !D) return;

  var BASE = "/demo/craft-store", IMG = BASE + "/images/";
  var STORE = D.STORE;
  var view = document.getElementById("view");
  var esc = S.esc, money = S.money, M = S.moneyHTML;
  var DAY = 864e5, STEP_MS = 25000;

  // ---------- small helpers ----------
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function u(p) { return BASE + (p || ""); }
  function pct(p, mrp) { return mrp > p ? Math.round((1 - p / mrp) * 100) : 0; }
  function plural(n, a, b) { return n + " " + (n === 1 ? a : b); }
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function addDays(n, from) { var d = new Date(from || Date.now()); d.setDate(d.getDate() + n); return d; }
  function fDate(d) { return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); }
  function fDT(t) { return new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); }
  function digits(s) { return S.digits(s).replace(/^91(?=\d{10}$)/, ""); }
  function fmtMobile(s) { var d = digits(s); return d.length === 10 ? "+91 " + d.slice(0, 5) + " " + d.slice(5) : s; }
  function img(key, alt, sizes, extra) {
    return '<img src="' + IMG + key + '-400.webp" srcset="' + IMG + key + "-400.webp 400w, " + IMG + key + '-800.webp 800w" sizes="' + (sizes || "(min-width: 980px) 300px, 50vw") +
      '" width="800" height="800" loading="lazy" decoding="async" alt="' + esc(alt || "") + '"' + (extra || "") + ">";
  }
  var I = {
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8Z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/></svg>',
    ret: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10h11a5 5 0 0 1 0 10H9"/><path d="M8 6 4 10l4 4"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5V4a1.5 1.5 0 0 1 3 0v6m0-4.5a1.5 1.5 0 0 1 3 0V12m0-3a1.5 1.5 0 0 1 3 0v5a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3.2 15a1.5 1.5 0 0 1 2.3-1.9L8 15"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.2 1.3-1.9 1.4-.5.1-1.1.2-3.2-.7-2.7-1.1-4.4-3.9-4.5-4-.1-.2-1.1-1.4-1.1-2.7s.7-1.9 1-2.2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5s.8 2 .9 2.1c.1.2.1.3 0 .5s-.2.4-.3.5l-.4.5c-.1.1-.3.3-.1.6s.6 1.1 1.4 1.8c1 .9 1.8 1.1 2.1 1.3.3.1.4.1.6-.1s.7-.8.9-1.1c.2-.3.4-.2.6-.1s1.6.8 1.8.9c.3.1.4.2.5.3.1.2.1.7-.1 1.3Z"/></svg>'
  };

  // ---------- catalogue lookups ----------
  var P = {}; D.PRODUCTS.forEach(function (p) { P[p.slug] = p; });
  var C = {}; D.CRAFTS.forEach(function (c) { C[c.id] = c; });
  var R = {}; D.ROOMS.forEach(function (r) { R[r.id] = r; });
  function vOf(p, vid) { for (var i = 0; i < p.variants.length; i++) if (p.variants[i].id === vid) return p.variants[i]; return null; }
  function stockOf(p) { return p.variants.reduce(function (a, v) { return a + v.stock; }, 0); }
  function defV(p) { return p.variants.filter(function (v) { return v.stock > 0; })[0] || p.variants[0]; }
  function fromPrice(p) { var v = p.variants.slice().sort(function (a, b) { return a.price - b.price; })[0]; return v; }
  function vLabel(v) { return [v.size, v.colour].filter(Boolean).join(", "); }
  function colours(p) { var o = []; p.variants.forEach(function (v) { if (v.colour && o.indexOf(v.colour) < 0) o.push(v.colour); }); return o; }
  function sizeGroup(s) {
    if (!s) return "";
    if (/large|6 ft|14 in|double|9 in|16 in/i.test(s)) return "Large";
    if (/medium|18 x 18|4 ft|6 in|set of 24/i.test(s)) return "Medium";
    return "Small";
  }
  function swatch(c) { var h = D.COLOURS[c] || "#ccc"; return h === "multi" ? "background:conic-gradient(#A8322B,#D2A12E,#2E6A3A,#2B3A67,#A8322B)" : "background:" + h; }
  function starsHTML(r, n) { return '<span class="stars">' + I.star + "<span><b>" + r.toFixed(1) + "</b>" + (n != null ? " (" + n + ")" : "") + '</span><span class="sr"> out of 5 stars' + (n != null ? ", " + n + " reviews" : "") + "</span></span>"; }
  function priceHTML(v) {
    var off = pct(v.price, v.mrp);
    return '<span class="price notranslate"><span>' + money(v.price) + "</span>" + (off ? "<s><span class=\"sr\">MRP </span>" + money(v.mrp) + '</s><span class="off">' + off + "% off</span>" : "") + "</span>";
  }

  // ---------- storage ----------
  var store = {
    cart: S.store("mk:cart"), saved: S.store("mk:saved"), wish: S.store("mk:wish"), orders: S.store("mk:orders"), recent: S.store("mk:recent"),
    pin: S.store("mk:pin"), details: S.store("mk:details"), coupon: S.store("mk:coupon"), gift: S.store("mk:gift"), user: S.store("mk:user"), news: S.store("mk:news")
  };
  function cart() { return (store.cart.get([]) || []).filter(function (l) { return P[l.slug] && vOf(P[l.slug], l.vid); }); }
  function setCart(c) { store.cart.set(c); badges(); }
  function wish() { return store.wish.get([]) || []; }
  function myOrders() { return store.orders.get([]) || []; }

  // ---------- seeded orders ----------
  var NOW0 = Date.now();
  function snapItems(list) {
    return list.map(function (t) { var p = P[t[0]], v = vOf(p, t[1]); return { slug: p.slug, vid: v.id, name: p.name, var: vLabel(v), price: v.price, qty: t[2], img: v.img, craft: p.craft }; });
  }
  function quickTotals(items, pay) {
    var sub = items.reduce(function (a, l) { return a + l.price * l.qty; }, 0);
    var ship = sub >= STORE.freeShipAt ? 0 : STORE.shipFee, cod = pay === "cod" ? STORE.codFee : 0, total = sub + ship + cod;
    return { subtotal: sub, discount: 0, ship: ship, cod: cod, gift: 0, total: total, gst: Math.round(total * 12 / 112) };
  }
  var SEEDS = D.SEED_ORDERS.map(function (s) {
    var items = snapItems(s.items), created = NOW0 - s.hoursAgo * 36e5;
    return { no: s.no, seed: true, stage: s.stage, created: created, mobile: s.mobile, name: s.name, email: "",
      addr: { house: "Flat 2B", street: "Sample Road", landmark: "", city: s.city, state: s.state, pin: s.pin },
      items: items, delivery: "standard", pay: s.pay, eta: [created + 4 * DAY, created + 6 * DAY], totals: quickTotals(items, s.pay) };
  });
  function findOrder(no) {
    no = String(no || "").trim().toUpperCase();
    var all = myOrders().concat(SEEDS);
    for (var i = 0; i < all.length; i++) if (all[i].no === no) return all[i];
    return null;
  }
  function stageOf(o) { return o.seed ? o.stage : Math.min(4, Math.floor((Date.now() - o.created) / STEP_MS)); }
  function stepTimes(o) {
    if (o.seed) { var h = [0, 3, 20, 60, 70]; return h.map(function (x) { return o.created + x * 36e5; }); }
    return [0, 1, 2, 3, 4].map(function (i) { return o.created + i * STEP_MS; });
  }
  var STATUS = ["New", "Packed", "Shipped", "Shipped", "Delivered"];

  // ---------- delivery rules ----------
  function delivery(pin) {
    pin = String(pin || "").trim();
    if (!S.validPin(pin)) return null;
    var p2 = pin.slice(0, 2), p3 = pin.slice(0, 3), noCod = /^(18|19|79)/.test(pin) || p3 === "744" || /^68255/.test(pin);
    var zone, min, max;
    if (+p2 >= 70 && +p2 <= 74) { zone = "West Bengal"; min = 2; max = 3; }
    else if (["11", "40", "56", "60", "50", "41"].indexOf(p2) > -1) { zone = "metro"; min = 3; max = 5; }
    else { zone = "rest"; min = 5; max = 7; }
    if (noCod) { min += 2; max += 3; }
    var place = D.PINS[p3];
    return { pin: pin, min: min, max: max, cod: !noCod, zone: zone, city: place ? place[0] : "", state: place ? place[1] : "" };
  }

  // ---------- totals and coupons ----------
  function lines() { return cart().map(function (l) { var p = P[l.slug]; return { slug: l.slug, vid: l.vid, qty: l.qty, p: p, v: vOf(p, l.vid) }; }); }
  function couponCheck(code, sub) {
    if (!code) return null;
    var c = D.COUPONS.filter(function (x) { return x.code === code; })[0];
    if (!c) return { ok: false, code: code, msg: "That code does not exist. Check the spelling, or try WELCOME10." };
    if (c.firstOnly && myOrders().length) return { ok: false, code: code, msg: "WELCOME10 is for a first order only, and this device already has a sample order." };
    if (sub < c.min) return { ok: false, code: code, msg: "Add " + money(c.min - sub) + " more to use " + c.code + ". It needs an order of " + money(c.min) + " or more." };
    return { ok: true, code: code, c: c, msg: c.label };
  }
  function totals(opt) {
    opt = opt || {};
    var ls = lines(), sub = 0, count = 0;
    ls.forEach(function (l) { sub += l.v.price * l.qty; count += l.qty; });
    var cp = couponCheck(store.coupon.get(""), sub), disc = 0, freeShip = false;
    if (cp && cp.ok) { if (cp.c.type === "percent") disc = Math.round(sub * cp.c.value / 100); else if (cp.c.type === "flat") disc = cp.c.value; else freeShip = true; }
    var after = sub - disc;
    var ship = opt.express ? STORE.expressFee : (after >= STORE.freeShipAt || freeShip || !count ? 0 : STORE.shipFee);
    var g = store.gift.get({ on: false, msg: "" }), gift = g.on && count ? STORE.giftWrap : 0;
    var cod = opt.cod ? STORE.codFee : 0, total = after + ship + gift + cod;
    return { lines: ls, count: count, subtotal: sub, discount: disc, ship: ship, gift: gift, cod: cod, total: total, gst: Math.round(total * 12 / 112), coupon: cp, freeShip: freeShip };
  }

  // ---------- badges ----------
  function badges() {
    var n = cart().reduce(function (a, l) { return a + l.qty; }, 0), w = wish().length;
    $$("[data-cart-count]").forEach(function (b) { b.textContent = n; b.setAttribute("data-n", n); });
    $$("[data-open-cart]").forEach(function (a) { a.setAttribute("aria-label", "Cart, " + plural(n, "item", "items")); });
    $$("[data-wish-count]").forEach(function (b) { b.textContent = w; b.setAttribute("data-n", w); });
    $$("[data-wish-link]").forEach(function (a) { a.setAttribute("aria-label", "Wishlist, " + plural(w, "item", "items")); });
  }

  // ---------- overlays: sheets, added drawer, search, zoom ----------
  var shade = $("#shade"), openSheetEl = null, releaseSheet = null;
  function openSheet(el, html, first) {
    if (openSheetEl && openSheetEl !== el) closeSheet(false);
    el.innerHTML = html;
    if (openSheetEl === el) return;
    openSheetEl = el; el.classList.add("is-open"); el.setAttribute("aria-hidden", "false"); shade.classList.add("is-open");
    S.lockScroll(true); releaseSheet = S.trap(el, closeSheet, first);
  }
  function closeSheet(restore) {
    if (!openSheetEl) return;
    var el = openSheetEl; openSheetEl = null;
    el.classList.remove("is-open"); el.setAttribute("aria-hidden", "true"); shade.classList.remove("is-open");
    S.lockScroll(false); if (releaseSheet) releaseSheet(restore); releaseSheet = null;
  }
  shade.addEventListener("click", function () { closeSheet(); closeAdded(); });

  var added = $("#added"), releaseAdded = null;
  function openAdded(p, v, qty) {
    var t = totals();
    added.innerHTML = '<div class="added__ok" id="addedTitle">' + I.check + "Added to cart</div>" +
      '<div class="added__row">' + img(v.img, p.name, "64px") + '<div><b>' + esc(p.name) + "</b>" + (vLabel(v) ? '<div class="small muted">' + esc(vLabel(v)) + "</div>" : "") +
      '<div class="small">Qty ' + qty + " &middot; " + M(v.price * qty) + "</div></div></div>" +
      '<p class="small muted" style="margin-bottom:.75rem">Cart subtotal (' + plural(t.count, "item", "items") + "): " + M(t.subtotal) + "</p>" +
      '<div class="added__btns"><button type="button" class="btn btn--line" data-close-added>Keep shopping</button><a class="btn btn--terra" href="' + u("/checkout") + '">Checkout</a></div>' +
      '<p style="text-align:center;margin-top:.5rem"><a class="textbtn" href="' + u("/cart") + '">View cart</a></p>';
    if (!added.classList.contains("is-open")) {
      added.classList.add("is-open"); added.setAttribute("aria-hidden", "false");
      if (window.innerWidth < 700) shade.classList.add("is-open");
      releaseAdded = S.trap(added, closeAdded, "[data-close-added]");
    }
  }
  function closeAdded(restore) {
    if (!added.classList.contains("is-open")) return;
    added.classList.remove("is-open"); added.setAttribute("aria-hidden", "true");
    if (!openSheetEl) shade.classList.remove("is-open");
    if (releaseAdded) releaseAdded(restore); releaseAdded = null;
  }
  added.addEventListener("click", function (e) { if (e.target.closest("[data-close-added]")) closeAdded(); });

  // ---------- cart actions ----------
  function addToCart(slug, vid, qty, quiet) {
    var p = P[slug], v = vOf(p, vid); if (!p || !v) return false;
    if (v.stock <= 0) { S.toast("Sorry, this option is sold out", { icon: false }); return false; }
    var c = cart(), line = c.filter(function (l) { return l.slug === slug && l.vid === vid; })[0];
    var have = line ? line.qty : 0, want = Math.min(v.stock, Math.min(10, have + qty));
    if (want === have) { S.toast("You already have all " + v.stock + " in your cart", { icon: false }); return false; }
    if (line) line.qty = want; else c.push({ slug: slug, vid: vid, qty: want });
    setCart(c);
    if (!quiet) { if (window.innerWidth >= 700) S.toast("Added to cart"); else S.announce("Added to cart. " + plural(cart().reduce(function (a, l) { return a + l.qty; }, 0), "item", "items") + " in cart"); openAdded(p, v, want - have); }
    return true;
  }
  function toggleWish(slug) {
    var w = wish(), i = w.indexOf(slug), p = P[slug];
    if (i > -1) w.splice(i, 1); else w.unshift(slug);
    store.wish.set(w); badges();
    var on = i < 0;
    $$('[data-wish="' + slug + '"]').forEach(function (b) { b.setAttribute("aria-pressed", on ? "true" : "false"); b.setAttribute("aria-label", (on ? "Remove " : "Save ") + p.name + (on ? " from" : " to") + " wishlist"); });
    S.toast(on ? "Saved to wishlist" : "Removed from wishlist");
  }

  // ---------- product card ----------
  function card(p) {
    var v = fromPrice(p), d = defV(p), total = stockOf(p), wl = wish().indexOf(p.slug) > -1, cols = colours(p);
    var tag = total === 0 ? '<span class="tag tag--out">Sold out</span>' : total <= 3 ? '<span class="tag tag--low">Only ' + total + " left</span>" :
      (NOW0 - new Date(p.created).getTime() < 21 * DAY ? '<span class="tag">New</span>' : "");
    var act = total === 0 ? '<button class="btn btn--line btn--sm" type="button" disabled>Sold out</button>' :
      p.variants.length === 1 ? '<button class="btn btn--line btn--sm" type="button" data-quick="' + p.slug + '">Add to cart<span class="sr">: ' + esc(p.name) + "</span></button>" :
      '<a class="btn btn--line btn--sm" href="' + u("/products/" + p.slug) + '">Choose options<span class="sr">: ' + esc(p.name) + "</span></a>";
    return '<article class="card">' +
      '<div class="card__ph">' + tag + img(d.img, p.name) + img(p.imgs.filter(function (k) { return k !== d.img; })[0] || d.img, "") + "</div>" +
      '<button class="heart" type="button" data-wish="' + p.slug + '" aria-pressed="' + wl + '" aria-label="' + (wl ? "Remove " : "Save ") + esc(p.name) + (wl ? " from" : " to") + ' wishlist"><span>' + I.heart + "</span></button>" +
      '<div class="card__body"><span class="card__craft">' + esc(C[p.craft].name) + "</span>" +
      '<a class="card__name" href="' + u("/products/" + p.slug) + '">' + esc(p.name) + "</a>" +
      (p.variants.length > 1 ? '<span class="small muted">From</span>' : "") + priceHTML(v) + starsHTML(p.rating, p.reviews) +
      (cols.length ? '<span class="dots" aria-label="Colours: ' + esc(cols.join(", ")) + '">' + cols.map(function (c) { return '<i class="dot" style="' + swatch(c) + '" title="' + esc(c) + '"></i>'; }).join("") + "</span>" : "") +
      '<div class="card__act">' + act + "</div></div></article>";
  }
  function stripHTML(list, title, kicker, more) {
    if (!list.length) return "";
    return '<section class="sec"><div class="wrap"><div class="sec-head"><div>' + (kicker ? '<p class="kicker">' + kicker + "</p>" : "") + "<h2>" + title + "</h2></div>" +
      (more ? '<a class="link" href="' + more + '">View all</a>' : "") + '</div><ul class="strip">' + list.map(function (p) { return "<li>" + card(p) + "</li>"; }).join("") + "</ul></div></section>";
  }

  // ---------- mega menu and drawer ----------
  function megaHTML(kind) {
    if (kind === "craft") return '<div><h3>Shop by craft</h3>' + D.CRAFTS.slice(0, 3).map(function (c) { return '<a href="' + u("/shop/" + c.id) + '">' + img(c.img, "", "40px") + esc(c.name) + "</a>"; }).join("") + "</div>" +
      '<div><h3>&nbsp;</h3>' + D.CRAFTS.slice(3).map(function (c) { return '<a href="' + u("/shop/" + c.id) + '">' + img(c.img, "", "40px") + esc(c.name) + "</a>"; }).join("") + "</div>" +
      '<div><h3>Popular</h3><a href="' + u("/products/bankura-ghora-classic-horse") + '">Bankura horse</a><a href="' + u("/products/dokra-owl-pair") + '">Dokra owl pair</a><a href="' + u("/products/hand-stitched-kantha-stole") + '">Kantha stoles</a><a href="' + u("/shop") + '">Shop all</a></div>' +
      '<a class="mega__feat" href="' + u("/shop?sort=top") + '">' + img("tc-row", "", "300px") + "<span>Bestsellers this month</span></a>";
    if (kind === "room") return '<div><h3>Shop by room</h3>' + D.ROOMS.map(function (r) { return '<a href="' + u("/shop?room=" + r.id) + '">' + esc(r.name) + "</a>"; }).join("") + "</div>" +
      '<div><h3>Ideas</h3><a href="' + u("/shop?room=puja-corner&max=999") + '">Puja corner under <span class="notranslate">₹999</span></a><a href="' + u("/shop?room=wall-decor&sort=newest") + '">New on the wall</a><a href="' + u("/shop?room=dining&craft=cane-bamboo") + '">Cane for the table</a></div><div></div>' +
      '<a class="mega__feat" href="' + u("/shop?room=living") + '">' + img("kn-cushion", "", "300px") + "<span>Living room picks</span></a>";
    return '<div><h3>Gifts by price</h3>' + D.GIFTS.map(function (g) { return '<a href="' + u("/shop?max=" + g.max) + '">' + img(g.img, "", "40px") + 'Under <span class="notranslate">' + money(g.max) + "</span></a>"; }).join("") + "</div>" +
      '<div><h3>For the occasion</h3><a href="' + u("/shop?q=wedding") + '">Weddings</a><a href="' + u("/shop?room=puja-corner") + '">Pujo and Diwali</a><a href="' + u("/shop?q=gift") + '">Housewarming</a></div><div></div>' +
      '<a class="mega__feat" href="' + u("/shop?max=999") + '">' + img("pc-coconut", "", "300px") + '<span>Gifts under <span class="notranslate">₹999</span></span></a>';
  }
  $$("[data-mega]").forEach(function (el) { el.innerHTML = megaHTML(el.getAttribute("data-mega")); });
  var tops = $$(".nav__top"), megaTimer;
  function closeMega(except) { tops.forEach(function (b) { if (b === except) return; b.setAttribute("aria-expanded", "false"); $("#" + b.getAttribute("aria-controls")).hidden = true; }); }
  var megaAt = 0;
  function openMega(b) { if (b.getAttribute("aria-expanded") !== "true") megaAt = Date.now(); closeMega(b); b.setAttribute("aria-expanded", "true"); $("#" + b.getAttribute("aria-controls")).hidden = false; }
  tops.forEach(function (b) {
    var panel = $("#" + b.getAttribute("aria-controls"));
    b.addEventListener("click", function () {
      // A mouse that hovered opens the menu first; the click that follows
      // must not close it again straight away.
      if (b.getAttribute("aria-expanded") === "true") { if (Date.now() - megaAt > 500) closeMega(); }
      else openMega(b);
    });
    b.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") { clearTimeout(megaTimer); openMega(b); } });
    b.addEventListener("keydown", function (e) { if (e.key === "ArrowDown") { e.preventDefault(); openMega(b); var a = panel.querySelector("a"); if (a) a.focus(); } });
    panel.addEventListener("pointerenter", function () { clearTimeout(megaTimer); });
  });
  $("#header").addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") megaTimer = setTimeout(closeMega, 250); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var open = tops.filter(function (b) { return b.getAttribute("aria-expanded") === "true"; })[0];
    if (open) { closeMega(); open.focus(); }
  });
  document.addEventListener("click", function (e) { if (!e.target.closest(".nav") && !e.target.closest(".mega")) closeMega(); });
  document.addEventListener("focusin", function (e) { if (!e.target.closest(".nav") && !e.target.closest(".mega")) closeMega(); });

  $("[data-drawer-acc]").innerHTML =
    '<details class="acc"><summary>Shop by craft' + I.chev + "</summary><ul>" + D.CRAFTS.map(function (c) { return '<li><a href="' + u("/shop/" + c.id) + '">' + img(c.img, "", "36px") + esc(c.name) + "</a></li>"; }).join("") + "</ul></details>" +
    '<details class="acc"><summary>Shop by room' + I.chev + "</summary><ul>" + D.ROOMS.map(function (r) { return '<li><a href="' + u("/shop?room=" + r.id) + '">' + esc(r.name) + "</a></li>"; }).join("") + "</ul></details>" +
    '<details class="acc"><summary>Gifts' + I.chev + "</summary><ul>" + D.GIFTS.map(function (g) { return '<li><a href="' + u("/shop?max=" + g.max) + '">Under <span class="notranslate">' + money(g.max) + "</span></a></li>"; }).join("") + "</ul></details>";

  // ---------- search ----------
  var search = $("#search"), sInput = $("#searchInput"), sRes = $("#searchRes"), releaseSearch = null;
  function matches(p, q) {
    var hay = (p.name + " " + C[p.craft].name + " " + p.tags.join(" ") + " " + D.MAKERS[p.maker].name + " " + p.rooms.join(" ")).toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every(function (w) { return hay.indexOf(w) > -1; });
  }
  function renderSearch() {
    var q = sInput.value.trim();
    var sugg = '<div class="chips" style="margin-top:.75rem">' + ["Bankura horse", "Dokra", "Kantha stole", "Diya", "Wedding", "Basket"].map(function (s) { return '<button type="button" class="chip" data-sugg="' + s + '">' + s + "</button>"; }).join("") + "</div>";
    if (!q) { sRes.innerHTML = '<p class="kicker">Popular searches</p>' + sugg; return; }
    var res = D.PRODUCTS.filter(function (p) { return matches(p, q); });
    if (!res.length) { sRes.innerHTML = '<div class="empty">' + I.search + "<h2>No results for “" + esc(q) + "”</h2><p>Try a craft name or a simpler word. These are popular right now:</p>" + sugg + "</div>"; return; }
    sRes.innerHTML = '<p class="small muted">' + plural(res.length, "product", "products") + "</p>" + res.slice(0, 6).map(function (p) {
      var v = fromPrice(p);
      return '<a class="sres" href="' + u("/products/" + p.slug) + '">' + img(defV(p).img, "", "56px") + "<span><b>" + esc(p.name) + '</b><br><span class="small muted">' + esc(C[p.craft].name) + " &middot; " + M(v.price) + "</span></span></a>";
    }).join("") + (res.length > 6 ? '<p style="margin-top:1rem"><a class="btn btn--line" href="' + u("/shop?q=" + encodeURIComponent(q)) + '">See all ' + res.length + " results</a></p>" : "");
  }
  function openSearch() {
    search.classList.add("is-open"); search.setAttribute("aria-hidden", "false"); S.lockScroll(true);
    renderSearch(); releaseSearch = S.trap(search, closeSearch, "#searchInput");
  }
  function closeSearch(restore) {
    if (!search.classList.contains("is-open")) return;
    search.classList.remove("is-open"); search.setAttribute("aria-hidden", "true"); S.lockScroll(false);
    if (releaseSearch) releaseSearch(restore); releaseSearch = null;
  }
  var sT; sInput.addEventListener("input", function () { clearTimeout(sT); sT = setTimeout(renderSearch, 120); });
  $("#searchForm").addEventListener("submit", function (e) { e.preventDefault(); var q = sInput.value.trim(); if (q) navigate(u("/shop?q=" + encodeURIComponent(q))); });
  search.addEventListener("click", function (e) {
    var s = e.target.closest("[data-sugg]"); if (s) { sInput.value = s.getAttribute("data-sugg"); renderSearch(); sInput.focus(); }
    if (e.target.closest("[data-close-search]")) closeSearch();
  });

  // ---------- zoom viewer ----------
  var zoom = $("#zoom"), releaseZoom = null, zList = [], zI = 0, zName = "";
  function drawZoom() {
    zoom.innerHTML = '<div class="modal__bar"><span>' + esc(zName) + ' <span class="muted" style="color:#ccc">' + (zI + 1) + " of " + zList.length + '</span></span><button class="icon-btn" type="button" data-zclose aria-label="Close photo viewer">' + I.x + "</button></div>" +
      '<div class="modal__img"><img src="' + IMG + zList[zI] + '-800.webp" alt="' + esc(zName) + ", photo " + (zI + 1) + '" width="800" height="800">' +
      (zList.length > 1 ? '<button class="modal__nav modal__nav--p" type="button" data-zstep="-1" aria-label="Previous photo">' + I.left + '</button><button class="modal__nav modal__nav--n" type="button" data-zstep="1" aria-label="Next photo">' + I.right + "</button>" : "") + "</div>";
  }
  function openZoom(list, i, name) {
    zList = list; zI = i; zName = name; drawZoom(); zoom.hidden = false; zoom.setAttribute("aria-hidden", "false"); S.lockScroll(true);
    releaseZoom = S.trap(zoom, closeZoom, "[data-zclose]");
  }
  function closeZoom() { if (zoom.hidden) return; zoom.hidden = true; zoom.setAttribute("aria-hidden", "true"); S.lockScroll(false); if (releaseZoom) releaseZoom(); releaseZoom = null; }
  zoom.addEventListener("click", function (e) {
    if (e.target.closest("[data-zclose]")) return closeZoom();
    var st = e.target.closest("[data-zstep]");
    if (st) { zI = (zI + +st.getAttribute("data-zstep") + zList.length) % zList.length; drawZoom(); var b = zoom.querySelector('[data-zstep="' + st.getAttribute("data-zstep") + '"]'); if (b) b.focus(); }
  });
  zoom.addEventListener("keydown", function (e) { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { zI = (zI + (e.key === "ArrowRight" ? 1 : -1) + zList.length) % zList.length; drawZoom(); var b = zoom.querySelector("[data-zclose]"); if (b) b.focus(); } });

  // ---------- global clicks ----------
  document.addEventListener("click", function (e) {
    var t = e.target;
    var q = t.closest("[data-quick]"); if (q) { var p = P[q.getAttribute("data-quick")]; addToCart(p.slug, defV(p).id, 1); return; }
    var w = t.closest("[data-wish]"); if (w) { e.preventDefault(); toggleWish(w.getAttribute("data-wish")); return; }
    if (t.closest("[data-open-search]")) { openSearch(); return; }
    var oc = t.closest("[data-open-cart]");
    if (oc && !e.metaKey && !e.ctrlKey && route().name !== "cart" && route().name !== "checkout") { e.preventDefault(); openCart(); return; }
    var a = t.closest("a");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var href = a.getAttribute("href") || "";
    if (href.charAt(0) === "#" && href.length > 1) {
      var tg = document.getElementById(href.slice(1));
      if (tg) { e.preventDefault(); tg.scrollIntoView({ behavior: S.reducedMotion() ? "auto" : "smooth" }); var h = tg.matches("h1,h2,main") ? tg : tg.querySelector("h1,h2") || tg; h.setAttribute("tabindex", "-1"); try { h.focus({ preventScroll: true }); } catch (x) { h.focus(); } }
      return;
    }
    if (a.target === "_blank" || a.hasAttribute("download") || href.indexOf(BASE) !== 0 || href.indexOf(BASE + "/images") === 0) return;
    e.preventDefault(); navigate(href);
  });

  // ---------- cart rendering (sheet and page) ----------
  function shipBar(t) {
    if (!t.count) return "";
    var after = t.subtotal - t.discount, left = STORE.freeShipAt - after, w = Math.min(100, Math.round(after / STORE.freeShipAt * 100));
    return '<div class="ship-bar" role="status">' + (left > 0 && !t.freeShip ? "You are " + M(left) + " away from free shipping." : "<b>You have free shipping.</b> Nice.") +
      '<div class="bar" aria-hidden="true"><i style="width:' + (t.freeShip ? 100 : w) + '%"></i></div></div>';
  }
  function lineHTML(l, saved) {
    var key = l.slug + "|" + l.vid, max = Math.min(10, l.v.stock);
    return '<li class="line">' + img(l.v.img, l.p.name, "84px") + '<div><div class="line__top"><div><a class="line__name" href="' + u("/products/" + l.slug) + '">' + esc(l.p.name) + "</a>" +
      (vLabel(l.v) ? '<div class="line__var">' + esc(vLabel(l.v)) + "</div>" : "") + '<div class="line__var">' + M(l.v.price) + " each</div></div><b>" + M(l.v.price * l.qty) + "</b></div>" +
      '<div class="line__acts">' + (saved ? '<button type="button" class="btn btn--line btn--sm" data-cact="move" data-key="' + key + '" data-fid="mv-' + key + '">Move to cart</button><button type="button" class="textbtn" data-cact="unsave" data-key="' + key + '">Remove</button>' :
      '<div class="qty" role="group" aria-label="Quantity for ' + esc(l.p.name) + '"><button type="button" data-cact="dec" data-key="' + key + '" data-fid="dec-' + key + '" aria-label="Decrease quantity"' + (l.qty <= 1 ? " disabled" : "") + '>&minus;</button><span class="notranslate" aria-live="polite">' + l.qty + '</span><button type="button" data-cact="inc" data-key="' + key + '" data-fid="inc-' + key + '" aria-label="Increase quantity"' + (l.qty >= max ? " disabled" : "") + ">+</button></div>" +
      '<button type="button" class="textbtn" data-cact="save" data-key="' + key + '">Save for later</button><button type="button" class="textbtn" data-cact="remove" data-key="' + key + '">Remove</button>' +
      (l.qty >= max && l.v.stock <= 3 ? '<span class="small" style="color:var(--warn)">Only ' + l.v.stock + " in stock</span>" : "")) + "</div></div></li>";
  }
  function summaryHTML(t, opt) {
    opt = opt || {};
    return '<div class="sum"><div><span>Subtotal (' + plural(t.count, "item", "items") + ")</span><span>" + M(t.subtotal) + "</span></div>" +
      (t.discount ? '<div class="ok"><span>Discount (' + esc(t.coupon.code) + ")</span><span>&minus;" + M(t.discount) + "</span></div>" : "") +
      "<div><span>Shipping" + (opt.express ? " (Express)" : "") + "</span><span>" + (t.ship ? M(t.ship) : '<b class="ok">Free</b>') + "</span></div>" +
      (t.gift ? "<div><span>Gift wrap</span><span>" + M(t.gift) + "</span></div>" : "") +
      (t.cod ? "<div><span>Cash on delivery fee</span><span>" + M(t.cod) + "</span></div>" : "") +
      '<div class="tot"><span>Total</span><span>' + M(t.total) + "</span></div>" +
      '<div class="gst"><span>Includes GST of ' + M(t.gst) + " (sample, 12%). Inclusive of all taxes.</span></div></div>";
  }
  function couponHTML(t, fid) {
    var code = store.coupon.get("");
    if (code && t.coupon) {
      return '<div class="coupon">' + (t.coupon.ok ? '<div class="cpn"><span><b class="notranslate">' + esc(code) + "</b> applied: " + esc(t.coupon.msg) + "</span>" :
        '<div class="cpn" style="border-color:var(--warn);background:#FFF6E5"><span><b class="notranslate">' + esc(code) + "</b> is not applied. " + esc(t.coupon.msg) + "</span>") +
        '<button type="button" class="textbtn" data-cact="uncoupon" data-fid="unc-' + fid + '">Remove</button></div></div>';
    }
    return '<form class="coupon" data-coupon novalidate><label class="lab" for="cp-' + fid + '">Have a coupon?</label><div style="display:flex;gap:.5rem;margin-top:.35rem"><input class="inp notranslate" id="cp-' + fid + '" name="code" autocomplete="off" placeholder="WELCOME10" aria-describedby="cpe-' + fid + '"><button class="btn btn--ink btn--sm" type="submit">Apply</button></div>' +
      '<p class="err" id="cpe-' + fid + '" role="alert"></p><p class="small muted">Try <span class="notranslate">WELCOME10, FREESHIP or CRAFT200</span>.</p></form>';
  }
  function giftHTML(fid) {
    var g = store.gift.get({ on: false, msg: "" });
    return '<div><label class="check"><input type="checkbox" data-gift ' + (g.on ? "checked" : "") + '><span><b>Add gift wrap</b> (' + M(STORE.giftWrap) + ") Handmade paper and a jute bow.</span></label>" +
      (g.on ? '<label class="lab" for="gm-' + fid + '">Gift message (optional)</label><textarea class="inp" id="gm-' + fid + '" data-giftmsg maxlength="150" placeholder="Happy Bijoya, with love">' + esc(g.msg) + "</textarea>" : "") + "</div>";
  }
  function emptyCart(where) {
    return '<div class="empty">' + I.bag + "<h2>Your cart is empty</h2><p>Start with something small and handmade. Our bestsellers ship in 24 to 48 hours.</p>" +
      '<a class="btn btn--terra" href="' + u("/shop?sort=top") + '">Shop bestsellers</a><div class="chips">' + D.CRAFTS.map(function (c) { return '<a class="chip" href="' + u("/shop/" + c.id) + '">' + esc(c.name) + "</a>"; }).join("") + "</div></div>";
  }
  function savedList() {
    var sv = (store.saved.get([]) || []).filter(function (l) { return P[l.slug] && vOf(P[l.slug], l.vid); }).map(function (l) { var p = P[l.slug]; return { slug: l.slug, vid: l.vid, qty: l.qty, p: p, v: vOf(p, l.vid) }; });
    return sv.length ? '<h3 style="margin-top:1.5rem">Saved for later (' + sv.length + ")</h3><ul>" + sv.map(function (l) { return lineHTML(l, true); }).join("") + "</ul>" : "";
  }
  function cartSheetHTML() {
    var t = totals();
    return '<div class="sheet__head"><h2 id="cartTitle">Your cart (' + t.count + ')</h2><button class="icon-btn" type="button" data-close-sheet aria-label="Close cart">' + I.x + "</button></div>" +
      '<div class="sheet__body">' + (t.count ? shipBar(t) + "<ul>" + t.lines.map(function (l) { return lineHTML(l); }).join("") + '</ul><div style="display:grid;gap:1rem;margin-top:1rem">' + giftHTML("s") + couponHTML(t, "s") + "</div>" : emptyCart()) + savedList() + "</div>" +
      (t.count ? '<div class="sheet__foot">' + summaryHTML(t) + '<div style="display:grid;gap:.5rem;margin-top:.9rem"><a class="btn btn--terra btn--block" href="' + u("/checkout") + '">Checkout &middot; ' + M(t.total) + '</a><a class="btn btn--line btn--block" href="' + u("/cart") + '">View full cart</a></div></div>' : "");
  }
  function openCart() { closeAdded(false); openSheet($("#cartSheet"), cartSheetHTML(), "[data-close-sheet]"); }
  function refreshCartUI() {
    var fid = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute("data-fid");
    if (openSheetEl && openSheetEl.id === "cartSheet") openSheetEl.innerHTML = cartSheetHTML();
    var r = route().name;
    if (r === "cart") renderCartPage(true);
    if (r === "checkout" && co) drawCheckout(true);
    if (fid) { var el = $('[data-fid="' + fid + '"]'); if (el && !el.disabled) el.focus(); else { var h = openSheetEl ? openSheetEl.querySelector("h2") : $("#view h1"); if (h) { h.setAttribute("tabindex", "-1"); h.focus(); } } }
  }
  function cartAct(act, key) {
    var parts = (key || "").split("|"), c = cart(), sv = store.saved.get([]) || [];
    var idx = c.findIndex(function (l) { return l.slug === parts[0] && l.vid === parts[1]; });
    var sidx = sv.findIndex(function (l) { return l.slug === parts[0] && l.vid === parts[1]; });
    var p = P[parts[0]];
    if (act === "inc" && idx > -1) { var v = vOf(p, parts[1]); c[idx].qty = Math.min(Math.min(10, v.stock), c[idx].qty + 1); setCart(c); S.announce("Quantity " + c[idx].qty); }
    if (act === "dec" && idx > -1) { c[idx].qty = Math.max(1, c[idx].qty - 1); setCart(c); S.announce("Quantity " + c[idx].qty); }
    if (act === "remove" && idx > -1) { c.splice(idx, 1); setCart(c); S.toast("Removed " + p.name); }
    if (act === "save" && idx > -1) { sv.push(c[idx]); c.splice(idx, 1); store.saved.set(sv); setCart(c); S.toast("Saved for later"); }
    if (act === "move" && sidx > -1) { var l = sv[sidx]; sv.splice(sidx, 1); store.saved.set(sv); var vv = vOf(p, l.vid); if (vv.stock > 0) addToCart(l.slug, l.vid, l.qty, true); S.toast(vv.stock > 0 ? "Moved to cart" : "That option is sold out now"); }
    if (act === "unsave" && sidx > -1) { sv.splice(sidx, 1); store.saved.set(sv); S.toast("Removed from saved items"); }
    if (act === "uncoupon") { store.coupon.remove(); S.toast("Coupon removed"); }
    refreshCartUI();
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cact]"); if (b) { cartAct(b.getAttribute("data-cact"), b.getAttribute("data-key")); return; }
    if (e.target.closest("[data-close-sheet]")) closeSheet();
  });
  document.addEventListener("submit", function (e) {
    var f = e.target.closest("[data-coupon]"); if (!f) return;
    e.preventDefault();
    var ci = f.querySelector("[name=code]"), code = ci.value.trim().toUpperCase(), err = f.querySelector(".err");
    if (!code) { err.textContent = "Type a coupon code first."; ci.setAttribute("aria-invalid", "true"); ci.focus(); return; }
    var t = totals(), chk = couponCheck(code, t.subtotal);
    if (!chk.ok) { err.textContent = chk.msg; ci.setAttribute("aria-invalid", "true"); ci.focus(); return; }
    store.coupon.set(code); S.toast(code + " applied"); refreshCartUI();
    var rm = $('[data-cact="uncoupon"]', openSheetEl || view); if (rm) rm.focus();
  });
  document.addEventListener("change", function (e) {
    if (e.target.matches("[data-gift]")) { var g = store.gift.get({ on: false, msg: "" }); g.on = e.target.checked; store.gift.set(g); S.announce(g.on ? "Gift wrap added" : "Gift wrap removed"); e.target.setAttribute("data-fid", "gift"); refreshCartUI(); var n = $('[data-gift]', openSheetEl || view); if (n) n.focus(); }
  });
  document.addEventListener("input", function (e) {
    if (e.target.matches("[data-giftmsg]")) { var g = store.gift.get({ on: true, msg: "" }); g.msg = e.target.value; store.gift.set(g); }
  });

  // ---------- router ----------
  var cleanups = [], first = true, co = null;
  function route() {
    var path = location.pathname.replace(/\/+$/, "");
    var rest = path.indexOf(BASE) === 0 ? path.slice(BASE.length) : path;
    var seg = rest.split("/").filter(Boolean).map(decodeURIComponent);
    var q = new URLSearchParams(location.search);
    if (!seg.length) return { name: "home", q: q };
    if (seg[0] === "shop" && seg.length <= 2) return { name: "shop", craft: seg[1] || "", q: q };
    if (seg[0] === "products" && seg.length === 2) return { name: "product", slug: seg[1], q: q };
    if (seg.length === 1 && ["cart", "checkout", "track", "account", "admin"].indexOf(seg[0]) > -1) return { name: seg[0], q: q };
    if ((seg[0] === "order" || seg[0] === "invoice") && seg.length === 2) return { name: seg[0], no: seg[1], q: q };
    if (seg[0] === "policies" && seg.length === 2) return { name: "policy", key: seg[1], q: q };
    return { name: "404", q: q };
  }
  // Remember the last path + query so a click on an in-page #anchor (which also fires popstate) does not re-render.
  var lastLoc = location.pathname + location.search;
  ["pushState", "replaceState"].forEach(function (m) {
    var orig = history[m].bind(history);
    history[m] = function () { var r = orig.apply(null, arguments); lastLoc = location.pathname + location.search; return r; };
  });
  function navigate(href, replace) {
    if (replace) history.replaceState(null, "", href); else history.pushState(null, "", href);
    render();
  }
  window.addEventListener("popstate", function () { var now = location.pathname + location.search; if (now === lastLoc) return; lastLoc = now; render(true); });
  // No form on this sample store ever submits anywhere: every handler works in the browser.
  document.addEventListener("submit", function (e) {
    e.preventDefault();
    if (e.target.hasAttribute("data-fpanel") && document.activeElement && document.activeElement.form === e.target) document.activeElement.dispatchEvent(new Event("change", { bubbles: true }));
  }, true);
  function onCleanup(fn) { cleanups.push(fn); }
  function setTitle(t) { document.title = (t ? t + " | " : "") + "Mati Kotha Crafts"; }

  function render(fromPop) {
    cleanups.forEach(function (f) { try { f(); } catch (e) {} }); cleanups = [];
    closeMega(); closeSheet(false); closeAdded(false); closeSearch(false); closeZoom();
    document.body.classList.remove("has-bar");
    var r = route(), isFirst = first; first = false;
    document.documentElement.removeAttribute("data-route");
    document.body.classList.toggle("focus", r.name === "checkout" || r.name === "invoice");
    $(".secure").innerHTML = r.name === "invoice" ? I.lock + "Tax invoice" : I.lock + "Secure checkout";
    $(".owner-pill").hidden = ["admin", "checkout", "invoice"].indexOf(r.name) > -1;
    var fn = { home: vHome, shop: vShop, product: vProduct, cart: vCart, checkout: vCheckout, order: vOrder, invoice: vInvoice, track: vTrack, account: vAccount, admin: vAdmin, policy: vPolicy }[r.name] || v404;
    if (r.name !== "checkout") co = null;
    fn(r, isFirst);
    document.documentElement.classList.add("drawn");
    badges();
    if (!isFirst) {
      if (!fromPop || r.name !== "shop") window.scrollTo(0, 0);
      var h = $("#view h1");
      if (h) { h.setAttribute("tabindex", "-1"); try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
      S.announce(document.title.split(" | ")[0] + " page");
    }
    setTimeout(function () { window.dispatchEvent(new Event("resize")); }, 60);
  }

  // ---------- home ----------
  function vHome(r, isFirst) {
    setTitle("");
    document.title = "Mati Kotha Crafts | Handmade in Bengal, Delivered Across India";
    var hero = $("#hero");
    var heroHTML = hero ? "" : '<section class="hero" id="hero"><picture class="hero__ph"><source media="(max-width: 699px)" srcset="' + IMG + 'hero-m.webp" type="image/webp" width="720" height="900"><source srcset="' + IMG + 'hero.webp" type="image/webp" width="1600" height="900"><img src="' + IMG + 'hero.jpg" alt="Hundreds of hand-pressed terracotta diyas piled together" width="1600" height="900" fetchpriority="high" decoding="async"></picture>' +
      '<div class="wrap hero__in"><p class="kicker">Handmade in Bengal. Delivered across India.</p><h1 tabindex="-1">Crafts from Bengal\'s villages, made by hand for your home.</h1><p class="hero__lede">Terracotta from Bankura, Dokra brass, kantha from Santiniketan and patachitra from Pingla. Bought straight from the families who make them.</p>' +
      '<div class="btn-row"><a class="btn btn--terra" href="' + u("/shop?sort=top") + '">Shop bestsellers</a><a class="btn btn--ghost-w" href="' + u("/shop?max=999") + '">Gifts under <span class="notranslate">₹999</span></a></div></div></section>';
    var best = D.PRODUCTS.filter(function (p) { return p.best; }).sort(function (a, b) { return a.rank - b.rank; });
    var mk = ["haradhan", "shyamali", "rahim"].map(function (k) { return D.MAKERS[k]; });
    var pool = D.REVIEW_POOL;
    var recent = (store.recent.get([]) || []).filter(function (s) { return P[s]; }).map(function (s) { return P[s]; });
    var rest =
      '<section class="sec"><div class="wrap"><div class="sec-head"><div><p class="kicker">Six crafts, six villages</p><h2>Shop by craft</h2></div><a class="link" href="' + u("/shop") + '">Shop all</a></div>' +
      '<ul class="tiles">' + D.CRAFTS.map(function (c) { return '<li><a class="tile" href="' + u("/shop/" + c.id) + '"><div class="tile__ph">' + img(c.img, "", "(min-width: 760px) 33vw, 50vw") + "</div><h3>" + esc(c.name) + "</h3><p>" + esc(c.line) + "</p></a></li>"; }).join("") + "</ul></div></section>" +
      stripHTML(best, "Bestsellers", "Loved across India", u("/shop?sort=top")) +
      '<section class="sec sec--sand"><div class="wrap"><div class="sec-head"><div><p class="kicker">The hands behind it</p><h2>Meet the makers</h2><p>We buy directly from craft families and pay them before the piece leaves the village.</p></div></div><div class="makers">' +
      mk.map(function (m) { return '<article class="maker"><div class="maker__ph">' + img(m.img, "", "(min-width: 860px) 33vw, 100vw") + '</div><div class="maker__b"><p class="kicker">' + esc(C[m.craft].name) + " &middot; " + esc(m.village) + "</p><blockquote>“" + esc(m.quote) + "”</blockquote><p class=\"small muted\">" + esc(m.story) + '</p><div class="who"><span class="avatar" aria-hidden="true">' + m.name.split(" ").map(function (x) { return x[0]; }).join("") + "</span><span><b>" + esc(m.name) + '</b><br><span class="small muted">Making since ' + m.since + "</span></span></div></div></article>"; }).join("") +
      "</div></div></section>" +
      '<section class="sec"><div class="wrap"><div class="sec-head"><div><p class="kicker">Gift guide</p><h2>Gifts by price</h2></div></div><div class="gifts">' +
      D.GIFTS.map(function (g) { return '<a class="gift" href="' + u("/shop?max=" + g.max) + '">' + img(g.img, "", "(min-width: 700px) 33vw, 100vw") + "<span>Under <span class=\"notranslate\">" + money(g.max) + "</span><small>" + D.PRODUCTS.filter(function (p) { return fromPrice(p).price <= g.max; }).length + " handmade gifts</small></span></a>"; }).join("") + "</div></div></section>" +
      '<section class="sec sec--sand"><div class="wrap"><div class="sec-head"><div><p class="kicker">Reviews</p><h2>What customers say</h2></div></div>' +
      '<div class="rsum"><b>4.8</b><span>' + starRow(4.8) + '<br><span class="small muted">from 1,240 reviews (sample)</span></span></div><div class="rgrid">' +
      pool.slice(0, 6).map(function (rv, i) { var p = D.PRODUCTS[(i * 7) % D.PRODUCTS.length]; return '<article class="rcard">' + starRow(rv.s) + "<h3>" + esc(rv.t) + "</h3><p>" + esc(rv.b) + "</p><footer>" + esc(rv.n) + ", " + esc(rv.c) + ' &middot; bought <a href="' + u("/products/" + p.slug) + '">' + esc(p.name) + "</a></footer></article>"; }).join("") +
      "</div></div></section>" +
      '<section class="sec"><div class="wrap"><ul class="trust">' +
      [[I.lock, "Secure payments", "UPI, cards and netbanking on Razorpay"], [I.cash, "Cash on delivery", "Pay at the door on most PIN codes"], [I.ret, "7-day easy returns", "Free pickup if it is not right"], [I.hand, "Handmade", "Straight from Bengal's craft families"]].map(function (x) { return "<li>" + x[0] + "<div><b>" + x[1] + "</b><span>" + x[2] + "</span></div></li>"; }).join("") +
      "</ul></div></section>" +
      (recent.length ? stripHTML(recent.slice(0, 8), "Recently viewed", "Pick up where you left off") : "") +
      '<section class="sec" style="padding-top:0"><div class="wrap"><div class="news"><div><p class="kicker" style="color:#F3C9A6">Newsletter</p><h2>Get 10% off your first order</h2><p style="margin-top:.5rem">One short letter a month: new pieces, maker stories and festival gift ideas.</p></div><div id="newsBox">' + newsForm() + "</div></div></div></section>";
    if (hero && isFirst) {
      $$("#view > *").forEach(function (n) { if (n !== hero) n.remove(); });
      hero.classList.remove("static-hero");
      view.insertAdjacentHTML("beforeend", rest);
    } else view.innerHTML = (hero ? hero.outerHTML.replace("static-hero", "") : heroHTML) + rest;
  }
  function starRow(r) { var full = Math.round(r); var s = ""; for (var i = 1; i <= 5; i++) s += '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:16px;height:16px;fill:' + (i <= full ? "#B97A12" : "#D6CCBF") + '"><path d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8Z"/></svg>'; return '<span class="stars" role="img" aria-label="' + r + ' out of 5 stars">' + s + "</span>"; }
  function newsForm() {
    if (store.news.get(false)) return newsDone();
    return '<form id="newsForm" novalidate><label class="sr" for="newsEmail">Email address</label><input id="newsEmail" type="email" autocomplete="email" placeholder="Your email address" aria-describedby="newsErr"><button class="btn btn--terra" type="submit">Get my code</button><p class="err" id="newsErr" role="alert" style="flex-basis:100%"></p></form>';
  }
  function newsDone() { return '<div role="status"><p><b>You are in.</b> Your code for 10% off your first order:</p><p style="margin:.75rem 0"><span class="code notranslate">WELCOME10</span></p><p class="small">Sample store: nothing was sent and no email was stored. Use the code in the cart.</p></div>'; }
  document.addEventListener("submit", function (e) {
    if (e.target.id !== "newsForm") return;
    e.preventDefault();
    var i = $("#newsEmail"), err = $("#newsErr");
    if (!S.validEmail(i.value)) { err.textContent = "Enter an email address like name@gmail.com."; i.setAttribute("aria-invalid", "true"); i.focus(); return; }
    store.news.set(true); $("#newsBox").innerHTML = newsDone(); S.toast("Code WELCOME10 unlocked");
  });

  // ---------- collection ----------
  var PMAX = 5000;
  function readF(r) {
    var q = r.q, f = {
      craft: (q.get("craft") || "").split(",").filter(function (c) { return C[c]; }),
      room: R[q.get("room")] ? q.get("room") : "", min: Math.max(0, +q.get("min") || 0), max: Math.min(PMAX, +q.get("max") || PMAX),
      colour: (q.get("colour") || "").split(",").filter(function (c) { return D.COLOURS[c]; }), size: (q.get("size") || "").split(",").filter(Boolean),
      stock: q.get("stock") === "1", rating: q.get("rating") === "4", sort: q.get("sort") || "featured", q: (q.get("q") || "").trim()
    };
    if (r.craft && C[r.craft] && f.craft.indexOf(r.craft) < 0) f.craft.push(r.craft);
    if (f.min > f.max) f.min = 0;
    return f;
  }
  function fURL(f) {
    var q = new URLSearchParams(), path = "/shop";
    if (f.craft.length === 1) path += "/" + f.craft[0]; else if (f.craft.length) q.set("craft", f.craft.join(","));
    if (f.room) q.set("room", f.room);
    if (f.min > 0) q.set("min", f.min);
    if (f.max < PMAX) q.set("max", f.max);
    if (f.colour.length) q.set("colour", f.colour.join(","));
    if (f.size.length) q.set("size", f.size.join(","));
    if (f.stock) q.set("stock", "1");
    if (f.rating) q.set("rating", "4");
    if (f.sort !== "featured") q.set("sort", f.sort);
    if (f.q) q.set("q", f.q);
    var s = q.toString();
    return u(path) + (s ? "?" + s : "");
  }
  function applyF(f) {
    var list = D.PRODUCTS.filter(function (p) {
      if (f.craft.length && f.craft.indexOf(p.craft) < 0) return false;
      if (f.room && p.rooms.indexOf(f.room) < 0) return false;
      if (f.rating && p.rating < 4) return false;
      if (f.q && !matches(p, f.q)) return false;
      return p.variants.some(function (v) {
        if (v.price < f.min || v.price > f.max) return false;
        if (f.colour.length && f.colour.indexOf(v.colour) < 0) return false;
        if (f.size.length && f.size.indexOf(sizeGroup(v.size)) < 0) return false;
        if (f.stock && v.stock <= 0) return false;
        return true;
      });
    });
    var by = {
      featured: function (a, b) { return a.rank - b.rank; }, "price-asc": function (a, b) { return fromPrice(a).price - fromPrice(b).price; },
      "price-desc": function (a, b) { return fromPrice(b).price - fromPrice(a).price; }, newest: function (a, b) { return a.created < b.created ? 1 : -1; },
      top: function (a, b) { return b.rating - a.rating || b.reviews - a.reviews; }
    }[f.sort] || function (a, b) { return a.rank - b.rank; };
    return list.sort(by);
  }
  function fCount(f) { return f.craft.length + (f.room ? 1 : 0) + (f.min > 0 || f.max < PMAX ? 1 : 0) + f.colour.length + f.size.length + (f.stock ? 1 : 0) + (f.rating ? 1 : 0); }
  function panelHTML(f, px) {
    var cols = Object.keys(D.COLOURS), sizes = ["Small", "Medium", "Large"];
    return '<form data-fpanel="' + px + '" novalidate>' +
      '<fieldset class="fgroup"><legend>Craft</legend>' + D.CRAFTS.map(function (c) { var n = D.PRODUCTS.filter(function (p) { return p.craft === c.id; }).length; return '<label class="check"><input type="checkbox" name="craft" value="' + c.id + '"' + (f.craft.indexOf(c.id) > -1 ? " checked" : "") + "><span>" + esc(c.name) + "</span><small>" + n + "</small></label>"; }).join("") + "</fieldset>" +
      '<fieldset class="fgroup"><legend>Room</legend>' + D.ROOMS.map(function (r) { return '<label class="check"><input type="radio" name="room" value="' + r.id + '"' + (f.room === r.id ? " checked" : "") + "><span>" + esc(r.name) + "</span></label>"; }).join("") + '<label class="check"><input type="radio" name="room" value=""' + (!f.room ? " checked" : "") + "><span>Any room</span></label></fieldset>" +
      '<fieldset class="fgroup"><legend>Price</legend><div class="range" aria-hidden="false"><div class="range__track"><div class="range__fill"></div></div>' +
      '<input type="range" name="rmin" min="0" max="' + PMAX + '" step="100" value="' + f.min + '" aria-label="Lowest price">' +
      '<input type="range" name="rmax" min="0" max="' + PMAX + '" step="100" value="' + f.max + '" aria-label="Highest price"></div>' +
      '<div class="range-nums"><label class="sr" for="' + px + 'min">Lowest price in rupees</label><input class="inp notranslate" id="' + px + 'min" name="min" inputmode="numeric" value="' + f.min + '"><span class="muted">to</span><label class="sr" for="' + px + 'max">Highest price in rupees</label><input class="inp notranslate" id="' + px + 'max" name="max" inputmode="numeric" value="' + f.max + '"></div></fieldset>' +
      '<fieldset class="fgroup"><legend>Colour</legend><div class="sw">' + cols.map(function (c) { return '<label><input type="checkbox" name="colour" value="' + esc(c) + '"' + (f.colour.indexOf(c) > -1 ? " checked" : "") + '><span><i style="' + swatch(c) + '"></i>' + esc(c) + "</span></label>"; }).join("") + "</div></fieldset>" +
      '<fieldset class="fgroup"><legend>Size</legend><div class="sw">' + sizes.map(function (s) { return '<label><input type="checkbox" name="size" value="' + s + '"' + (f.size.indexOf(s) > -1 ? " checked" : "") + "><span style=\"padding-left:.8rem\">" + s + "</span></label>"; }).join("") + '</div><p class="small muted" style="margin-top:.4rem">For pieces that come in sizes.</p></fieldset>' +
      '<fieldset class="fgroup"><legend>More</legend><label class="check"><input type="checkbox" name="stock" value="1"' + (f.stock ? " checked" : "") + '><span>In stock only</span></label><label class="check"><input type="checkbox" name="rating" value="4"' + (f.rating ? " checked" : "") + "><span>Rated 4 and above</span></label></fieldset></form>";
  }
  function readPanel(form, f) {
    var nf = { craft: [], room: "", min: 0, max: PMAX, colour: [], size: [], stock: false, rating: false, sort: f.sort, q: f.q };
    $$("input:checked", form).forEach(function (i) {
      if (i.name === "craft") nf.craft.push(i.value); if (i.name === "room") nf.room = i.value;
      if (i.name === "colour") nf.colour.push(i.value); if (i.name === "size") nf.size.push(i.value);
      if (i.name === "stock") nf.stock = true; if (i.name === "rating") nf.rating = true;
    });
    var mn = parseInt(form.querySelector("[name=min]").value, 10), mx = parseInt(form.querySelector("[name=max]").value, 10);
    nf.min = isNaN(mn) ? 0 : Math.max(0, Math.min(PMAX, mn)); nf.max = isNaN(mx) ? PMAX : Math.max(0, Math.min(PMAX, mx));
    if (nf.min > nf.max) { var t = nf.min; nf.min = nf.max; nf.max = t; }
    return nf;
  }
  function syncRange(form) {
    var a = form.elements.rmin, b = form.elements.rmax, fill = $(".range__fill", form);
    var lo = Math.min(+a.value, +b.value), hi = Math.max(+a.value, +b.value);
    fill.style.left = lo / PMAX * 100 + "%"; fill.style.right = 100 - hi / PMAX * 100 + "%";
    a.setAttribute("aria-valuetext", money(+a.value)); b.setAttribute("aria-valuetext", money(+b.value));
  }
  function collTitle(f) {
    if (f.q) return { h: "Results for “" + f.q + "”", d: "Search across all six crafts." };
    if (f.craft.length === 1) return { h: C[f.craft[0]].name, d: C[f.craft[0]].line + " From " + C[f.craft[0]].place + "." };
    if (f.room && !f.craft.length) return { h: R[f.room].name, d: "Handmade pieces for the " + R[f.room].name.toLowerCase() + "." };
    if (f.max < PMAX && !f.craft.length && !f.room) return { h: "Gifts under " + money(f.max), d: "Handmade gifts that arrive in a craft-paper box." };
    if (f.sort === "newest" && !fCount(f)) return { h: "New arrivals", d: "Fresh from the villages this season." };
    if (f.sort === "top" && !fCount(f)) return { h: "Bestsellers", d: "Our top rated pieces, loved across India." };
    return { h: "Shop all", d: "Every piece is made by hand in Bengal." };
  }
  function vShop(r) {
    if (r.craft && !C[r.craft]) return v404();
    var f = readF(r), shown = 12, t = collTitle(f), skel = null;
    setTitle(t.h);
    var crumbs = '<ol class="crumbs"><li><a href="' + u() + '">Home</a></li><li><a href="' + u("/shop") + '">Shop</a></li>' + (t.h !== "Shop all" ? '<li aria-current="page">' + esc(t.h) + "</li>" : "") + "</ol>";
    view.innerHTML = '<div class="wrap">' + crumbs + '<div class="page-h"><h1>' + esc(t.h) + '</h1><p class="muted" style="margin-top:.4rem">' + esc(t.d) + "</p></div>" +
      '<div class="coll"><aside class="fpanel" aria-label="Filters">' + panelHTML(f, "d") + "</aside><div>" +
      '<div class="toolbar"><p id="count" class="muted" role="status"></p><div style="display:flex;gap:.5rem;align-items:center"><button class="btn btn--line btn--sm fbtn" type="button" id="openFilters"></button>' +
      '<label class="sr" for="sort">Sort by</label><select id="sort">' + [["featured", "Featured"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"], ["newest", "Newest"], ["top", "Top rated"]].map(function (o) { return '<option value="' + o[0] + '"' + (f.sort === o[0] ? " selected" : "") + ">Sort: " + o[1] + "</option>"; }).join("") + "</select></div></div>" +
      '<div class="applied" id="applied"></div><div id="results" aria-busy="false"></div></div></div></div>';
    var results = $("#results");
    function draw(skeleton) {
      var list = applyF(f), n = fCount(f);
      $("#count").textContent = plural(list.length, "product", "products");
      $("#openFilters").innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>Filters' + (n ? " (" + n + ")" : "");
      var chips = [];
      f.craft.forEach(function (c) { chips.push(["craft", c, C[c].name]); });
      if (f.room) chips.push(["room", f.room, R[f.room].name]);
      if (f.min > 0 || f.max < PMAX) chips.push(["price", "", money(f.min) + " to " + money(f.max)]);
      f.colour.forEach(function (c) { chips.push(["colour", c, c]); }); f.size.forEach(function (s) { chips.push(["size", s, "Size " + s]); });
      if (f.stock) chips.push(["stock", "", "In stock"]); if (f.rating) chips.push(["rating", "", "4 stars and above"]); if (f.q) chips.push(["q", "", "Search: " + f.q]);
      $("#applied").innerHTML = chips.length ? chips.map(function (c) { return '<button type="button" class="chip" data-unf="' + c[0] + '" data-val="' + esc(c[1]) + '"><span' + (c[0] === "price" ? ' class="notranslate"' : "") + ">" + esc(c[2]) + "</span>" + I.x + '<span class="sr">Remove filter</span></button>'; }).join("") + '<button type="button" class="textbtn" data-unf="all">Clear all</button>' : "";
      var fs = $("#filterSheet .sheet__foot [data-close-sheet]"); if (fs) fs.textContent = "Show " + plural(list.length, "result", "results");
      if (skeleton) {
        results.setAttribute("aria-busy", "true");
        results.innerHTML = '<div class="grid">' + Array(Math.min(6, Math.max(2, list.length))).join(".").split(".").map(function () { return '<div class="sk-card" aria-hidden="true"><div class="sk"></div><div class="sk sk-line" style="width:40%"></div><div class="sk sk-line"></div><div class="sk sk-line" style="width:60%"></div></div>'; }).join("") + "</div>";
        clearTimeout(skel); skel = setTimeout(function () { draw(false); }, 250); return;
      }
      results.setAttribute("aria-busy", "false");
      if (!list.length) {
        results.innerHTML = '<div class="empty">' + I.search + "<h2>Nothing matches these filters</h2><p>Try removing a filter or widening the price range. Or start from one of these:</p>" +
          '<button type="button" class="btn btn--terra" data-unf="all">Clear all filters</button><div class="chips">' + ["mati-pradip-diya-set", "dokra-owl-pair", "hand-stitched-kantha-stole", "painted-coconut-shell-hanging"].map(function (s) { return '<a class="chip" href="' + u("/products/" + s) + '">' + esc(P[s].name) + "</a>"; }).join("") + "</div></div>";
        return;
      }
      results.innerHTML = '<ul class="grid">' + list.slice(0, shown).map(function (p) { return "<li>" + card(p) + "</li>"; }).join("") + "</ul>" +
        (list.length > shown ? '<div class="more"><p class="small muted">Showing ' + shown + " of " + list.length + '</p><button class="btn btn--line" type="button" id="loadMore">Load more</button></div>' : (list.length > 12 ? '<div class="more"><p class="small muted">You have seen all ' + list.length + " products</p></div>" : ""));
      $$("#results .grid img").slice(0, 2).forEach(function (im) { im.loading = "eager"; im.setAttribute("fetchpriority", "high"); });
    }
    function update(nf, push) {
      f = nf; shown = 12;
      var url = fURL(f);
      if (push) history.pushState(null, "", url); else history.replaceState(null, "", url);
      var nt = collTitle(f); $("#view h1").textContent = nt.h; setTitle(nt.h);
      draw(true);
    }
    function syncPanels(src) {
      $$("[data-fpanel]").forEach(function (form) { if (form === src) return; form.outerHTML = panelHTML(f, form.getAttribute("data-fpanel")); });
      $$("[data-fpanel]").forEach(syncRange);
    }
    function onPanel(e) {
      var form = e.target.closest("[data-fpanel]"); if (!form) return;
      var el = e.target;
      if (el.name === "rmin" || el.name === "rmax") {
        var a = form.elements.rmin, b = form.elements.rmax;
        if (+a.value > +b.value) { if (el === a) a.value = b.value; else b.value = a.value; }
        form.elements.min.value = a.value; form.elements.max.value = b.value; syncRange(form);
        if (e.type === "input") return;
      }
      if ((el.name === "min" || el.name === "max") && e.type === "input") return;
      var nf = readPanel(form, f);
      form.elements.rmin.value = nf.min; form.elements.rmax.value = nf.max; syncRange(form);
      update(nf, true); syncPanels(form);
    }
    view.addEventListener("change", onPanel); view.addEventListener("input", onPanel);
    var fsEl = $("#filterSheet");
    fsEl.addEventListener("change", onPanel); fsEl.addEventListener("input", onPanel);
    onCleanup(function () { view.removeEventListener("change", onPanel); view.removeEventListener("input", onPanel); fsEl.removeEventListener("change", onPanel); fsEl.removeEventListener("input", onPanel); clearTimeout(skel); });
    function onClick(e) {
      var un = e.target.closest("[data-unf]");
      if (un) {
        var k = un.getAttribute("data-unf"), val = un.getAttribute("data-val"), nf = JSON.parse(JSON.stringify(f));
        if (k === "all") nf = { craft: [], room: "", min: 0, max: PMAX, colour: [], size: [], stock: false, rating: false, sort: f.sort, q: "" };
        else if (k === "craft" || k === "colour" || k === "size") nf[k] = nf[k].filter(function (x) { return x !== val; });
        else if (k === "price") { nf.min = 0; nf.max = PMAX; } else if (k === "room") nf.room = ""; else if (k === "q") nf.q = ""; else nf[k] = false;
        update(nf, true); syncPanels(null); S.announce("Filter removed");
        var nx = $("#applied .chip") || $("#sort"); if (nx) nx.focus();
        return;
      }
      if (e.target.closest("#loadMore")) {
        var before = shown; shown += 12; draw(false);
        var items = $$("#results .card__name"); if (items[before]) items[before].focus();
        S.announce("Showing " + Math.min(shown, applyF(f).length) + " products"); return;
      }
      if (e.target.closest("#openFilters")) {
        openSheet(fsEl, '<div class="sheet__head"><h2 id="filterTitle">Filters</h2><button class="icon-btn" type="button" data-close-sheet aria-label="Close filters">' + I.x + '</button></div><div class="sheet__body">' + panelHTML(f, "m") +
          '</div><div class="sheet__foot" style="display:grid;grid-template-columns:auto 1fr;gap:.6rem"><button type="button" class="btn btn--line" data-unf="all">Clear all</button><button type="button" class="btn btn--terra" data-close-sheet>Show ' + plural(applyF(f).length, "result", "results") + "</button></div>", "[data-close-sheet]");
        syncRange($('[data-fpanel="m"]'));
      }
    }
    view.addEventListener("click", onClick); fsEl.addEventListener("click", onClick);
    onCleanup(function () { view.removeEventListener("click", onClick); fsEl.removeEventListener("click", onClick); });
    $("#sort").addEventListener("change", function (e) { var nf = JSON.parse(JSON.stringify(f)); nf.sort = e.target.value; update(nf, true); S.announce("Sorted: " + e.target.options[e.target.selectedIndex].text.replace("Sort: ", "")); });
    $$("[data-fpanel]").forEach(syncRange);
    draw(false);
  }

  // ---------- product ----------
  function reviewsFor(p) {
    var h = hash(p.slug), pool = D.REVIEW_POOL, out = [];
    for (var i = 0; i < 8; i++) {
      var rv = pool[(h + i * 3) % pool.length], s = rv.s;
      if (p.rating >= 4.8 && s < 4 && i % 2) s = 5;
      out.push({ n: rv.n, c: rv.c, s: s, t: rv.t, b: rv.b, photo: i % 3 === 0 ? p.imgs[i % p.imgs.length] : "", days: 3 + i * 9 + (h % 5) });
    }
    return out;
  }
  function breakdown(r) {
    var p5 = Math.max(20, Math.min(92, Math.round(70 + (r - 4.6) * 110))), rest = 100 - p5, p4 = Math.round(rest * .62), p3 = Math.round((rest - p4) * .6), p2 = Math.round((rest - p4 - p3) * .6);
    return [p5, p4, p3, p2, 100 - p5 - p4 - p3 - p2];
  }
  function vProduct(r) {
    var p = P[r.slug]; if (!p) return v404();
    setTitle(p.name);
    var rec = (store.recent.get([]) || []).filter(function (s) { return s !== p.slug; }); rec.unshift(p.slug); store.recent.set(rec.slice(0, 10));
    var sizes = [], cols = [];
    p.variants.forEach(function (v) { if (v.size && sizes.indexOf(v.size) < 0) sizes.push(v.size); if (v.colour && cols.indexOf(v.colour) < 0) cols.push(v.colour); });
    var showCol = cols.length > 1, d = defV(p), sel = { size: d.size, colour: d.colour }, qty = 1, cur = d, hint = "";
    var maker = D.MAKERS[p.maker], revs = reviewsFor(p), bd = breakdown(p.rating), rf = { star: 0, photo: false };
    var bundle = [p.slug].concat((D.BUNDLES[p.craft] || []).filter(function (s) { return s !== p.slug && P[s]; }).slice(0, 2));
    var also = D.PRODUCTS.filter(function (x) { return x.craft === p.craft && x.slug !== p.slug; }).concat(D.PRODUCTS.filter(function (x) { return x.craft !== p.craft && x.rooms.some(function (rm) { return p.rooms.indexOf(rm) > -1; }); })).slice(0, 8);
    var recent = rec.slice(1, 9).filter(function (s) { return P[s]; }).map(function (s) { return P[s]; });
    var savedPin = store.pin.get("");
    function find(size, colour) { for (var i = 0; i < p.variants.length; i++) { var v = p.variants[i]; if ((v.size || "") === (size || "") && (v.colour || "") === (colour || "")) return v; } return null; }
    function gallery() { var list = [cur.img].concat(p.imgs.filter(function (k) { return k !== cur.img; })); return list; }
    function galHTML() {
      var g = gallery();
      return '<figure class="gal__track" id="galTrack" aria-label="Photos of ' + esc(p.name) + '">' + g.map(function (k, i) {
        return '<button type="button" class="gal__slide" data-zi="' + i + '" aria-label="Open photo ' + (i + 1) + ' of ' + g.length + ' full screen">' +
          '<img src="' + IMG + k + '-800.webp" srcset="' + IMG + k + "-400.webp 400w, " + IMG + k + '-800.webp 800w" sizes="(min-width: 900px) 50vw, 100vw" width="800" height="800" alt="' + esc(p.name) + (i ? ", view " + (i + 1) : "") + '"' + (i ? ' loading="lazy"' : ' fetchpriority="high"') + ' decoding="async"></button>';
      }).join("") + '</figure><span class="gal__count notranslate" id="galCount" aria-hidden="true">1 / ' + g.length + "</span>" +
        '<div class="thumbs" role="group" aria-label="Choose photo">' + g.map(function (k, i) { return '<button type="button" data-ti="' + i + '" aria-label="Show photo ' + (i + 1) + '"' + (i ? "" : ' aria-current="true"') + ">" + img(k, "", "68px") + "</button>"; }).join("") + "</div>";
    }
    function optHTML() {
      var out = "";
      if (sizes.length) out += '<div class="opt" role="group" aria-labelledby="optSize"><div class="lab"><span id="optSize">Size: <b>' + esc(sel.size) + "</b></span></div><div class=\"opts\">" + sizes.map(function (s) {
        var v = find(s, sel.colour), why = !v ? "Size " + s + " is not made in " + sel.colour : v.stock <= 0 ? "Size " + s + (showCol ? " is sold out in " + sel.colour : " is sold out") : "";
        return '<button type="button" class="optbtn" data-size="' + esc(s) + '" aria-pressed="' + (s === sel.size) + '"' + (why ? ' aria-disabled="true" title="' + esc(why) + '"' : "") + ">" + esc(s) + (why ? '<span class="sr">, unavailable</span>' : "") + "</button>";
      }).join("") + "</div></div>";
      if (showCol) out += '<div class="opt" role="group" aria-labelledby="optCol"><div class="lab"><span id="optCol">Colour: <b>' + esc(sel.colour) + "</b></span></div><div class=\"opts\">" + cols.map(function (c) {
        var v = find(sel.size, c), why = !v ? c + " is not made in size " + sel.size : v.stock <= 0 ? c + (sel.size ? " is sold out in size " + sel.size : " is sold out") : "";
        return '<button type="button" class="optbtn optbtn--sw" data-colour="' + esc(c) + '" aria-pressed="' + (c === sel.colour) + '"' + (why ? ' aria-disabled="true" title="' + esc(why) + '"' : "") + '><i style="' + swatch(c) + '"></i>' + esc(c) + (why ? '<span class="sr">, unavailable</span>' : "") + "</button>";
      }).join("") + "</div></div>";
      if (hint) out += '<p class="small" role="status" style="margin-top:.5rem;color:var(--warn)">' + esc(hint) + "</p>";
      return out;
    }
    function stockHTML() {
      if (cur.stock <= 0) return '<p class="stock stock--out"><i></i>Sold out in this option. Try another size or colour.</p>';
      if (cur.stock <= 3) return '<p class="stock stock--low"><i></i>Only ' + cur.stock + " left. Ships in 24 to 48 hours.</p>";
      return '<p class="stock stock--ok"><i></i>In stock. Ships in 24 to 48 hours.</p>';
    }
    function buyHTML() {
      var max = Math.min(10, cur.stock), out = cur.stock <= 0;
      if (qty > max) qty = Math.max(1, max);
      return '<div class="qty" role="group" aria-label="Quantity"><button type="button" data-q="-1" aria-label="Decrease quantity"' + (qty <= 1 || out ? " disabled" : "") + '>&minus;</button><output class="notranslate" aria-live="polite">' + qty + '</output><button type="button" data-q="1" aria-label="Increase quantity"' + (qty >= max || out ? " disabled" : "") + ">+</button></div>" +
        '<button class="btn btn--terra" type="button" id="buyMain" data-add' + (out ? " disabled" : "") + ">" + (out ? "Sold out" : "Add to cart") + "</button>" +
        '<button class="btn btn--line" type="button" data-buynow' + (out ? " disabled" : "") + ">Buy now</button>";
    }
    function pinHTML(res, err) {
      return '<p class="lab" style="display:flex;gap:.5rem;align-items:center">' + I.truck.replace("<svg", '<svg style="width:20px;height:20px"') + "Check delivery to your PIN code</p>" +
        '<form id="pinForm" novalidate><label class="sr" for="pinIn">PIN code</label><input class="inp notranslate" id="pinIn" inputmode="numeric" maxlength="6" autocomplete="postal-code" placeholder="e.g. 700029" value="' + esc(res ? res.pin : savedPin) + '" aria-describedby="pinOut"' + (err ? ' aria-invalid="true"' : "") + '><button class="btn btn--ink btn--sm" type="submit">Check</button></form>' +
        '<div class="pinres" id="pinOut" role="status">' + (err ? '<p class="err">' + err + "</p>" : res ? "<ul><li>" + I.check.replace("<svg", '<svg style="color:var(--ok)"') + "<span>Delivery to <b class=\"notranslate\">" + res.pin + "</b>" + (res.city ? " (" + esc(res.city) + ")" : "") + " by <b>" + fDate(addDays(res.min)) + "</b> to <b>" + fDate(addDays(res.max)) + "</b></span></li>" +
          "<li>" + (res.cod ? I.check.replace("<svg", '<svg style="color:var(--ok)"') + "<span>Cash on delivery available (" + M(STORE.codFee) + " fee)</span>" : I.x.replace("<svg", '<svg style="color:var(--err)"') + "<span>Cash on delivery is not available here. Pay by UPI, card or netbanking.</span>") + "</li>" +
          "<li>" + I.check.replace("<svg", '<svg style="color:var(--ok)"') + "<span>Free shipping on orders of " + M(STORE.freeShipAt) + " or more</span></li></ul>" : '<p class="small muted">Free shipping above ' + M(STORE.freeShipAt) + ". Dispatch in 24 to 48 hours.</p>") + "</div>";
    }
    function fbtHTML() {
      var items = bundle.map(function (s) { return P[s]; }).filter(function (x) { return stockOf(x) > 0; });
      if (items.length < 2) return "";
      var tot = items.reduce(function (a, x) { return a + defV(x).price; }, 0);
      return '<section class="sec" style="padding-bottom:0"><div class="wrap"><h2 style="margin-bottom:1rem">Frequently bought together</h2><form class="fbt" id="fbt" novalidate><div class="fbt__items">' + items.map(function (x, i) {
        var dv = defV(x);
        return '<label class="fbt__item check"><input type="checkbox" name="fbt" value="' + x.slug + '" checked>' + img(dv.img, "", "60px") + '<span><a href="' + u("/products/" + x.slug) + '">' + esc(x.name) + "</a>" + (i === 0 ? ' <span class="small muted">(this item)</span>' : "") + "<br><span class=\"small\">" + (vLabel(dv) ? esc(vLabel(dv)) + " &middot; " : "") + M(dv.price) + "</span></span></label>";
      }).join("") + '</div><div><p>Bundle total: <b id="fbtTot" class="notranslate">' + money(tot) + '</b></p><button class="btn btn--terra" type="submit" style="margin-top:.6rem">Add all to cart</button></div></form></div></section>';
    }
    function revListHTML() {
      var list = revs.filter(function (x) { return (!rf.star || x.s === rf.star) && (!rf.photo || x.photo); });
      if (!list.length) return '<p class="muted">No reviews match. <button type="button" class="textbtn" data-rf="0">Show all reviews</button></p>';
      return list.map(function (x) { return '<article class="rcard">' + starRow(x.s) + "<h3>" + esc(x.t) + "</h3><p>" + esc(x.b) + "</p>" + (x.photo ? img(x.photo, "Customer photo of " + p.name, "72px", ' class="rphoto"') : "") + "<footer>" + esc(x.n) + ", " + esc(x.c) + " &middot; Verified buyer &middot; " + x.days + " days ago</footer></article>"; }).join("");
    }
    var cr = C[p.craft];
    view.innerHTML = '<div class="wrap"><ol class="crumbs"><li><a href="' + u() + '">Home</a></li><li><a href="' + u("/shop/" + p.craft) + '">' + esc(cr.name) + '</a></li><li aria-current="page">' + esc(p.name) + "</li></ol>" +
      '<div class="pdp" style="margin-top:1rem"><div class="gal" id="gal">' + galHTML() + "</div>" +
      '<div class="pinfo"><p class="kicker">' + esc(cr.name) + " &middot; " + esc(cr.place) + "</p><h1>" + esc(p.name) + "</h1>" +
      '<p style="margin-top:.5rem"><a href="#reviews" class="stars" style="text-decoration:none">' + starRow(p.rating) + ' <span style="color:var(--indigo);text-decoration:underline">' + p.rating.toFixed(1) + " from " + p.reviews + " reviews</span></a></p>" +
      '<div id="priceBox"></div><p class="taxnote">Inclusive of all taxes</p><div id="opts">' + optHTML() + '</div><div id="stockBox"></div>' +
      '<div class="buy" id="buyBox"></div>' +
      '<div class="pincheck" id="pinBox">' + pinHTML(null) + "</div>" +
      '<div class="perks"><div>' + I.cash + "COD available</div><div>" + I.ret + "7-day returns</div><div>" + I.hand + "Handmade in Bengal</div></div>" +
      '<div class="accs">' +
      '<details class="acc" open><summary>Description' + I.chev + "</summary><div><p>" + esc(p.desc) + "</p></div></details>" +
      '<details class="acc"><summary>Materials and care' + I.chev + "</summary><div><p><b>Materials:</b> " + esc(p.materials) + "</p><p style=\"margin-top:.5rem\"><b>Care:</b> " + esc(p.care) + "</p></div></details>" +
      '<details class="acc"><summary>Dimensions' + I.chev + "</summary><div><p>" + esc(p.dims) + "</p><p class=\"small muted\" style=\"margin-top:.4rem\">Handmade, so each piece can vary a little.</p></div></details>" +
      '<details class="acc"><summary>Shipping and returns' + I.chev + "</summary><div><p>Free shipping above " + M(STORE.freeShipAt) + ", otherwise " + M(STORE.shipFee) + ". Cash on delivery for " + M(STORE.codFee) + ". Dispatch in 24 to 48 hours. 7-day easy returns. <a href=\"" + u("/policies/shipping") + "\">Shipping policy</a> &middot; <a href=\"" + u("/policies/returns") + "\">Returns</a></p></div></details>" +
      '<details class="acc"><summary>About the maker' + I.chev + '</summary><div><div class="who" style="margin-bottom:.6rem"><span class="avatar" aria-hidden="true">' + maker.name.split(" ").map(function (x) { return x[0]; }).join("") + "</span><span><b>" + esc(maker.name) + "</b><br><span class=\"small muted\">" + esc(maker.village) + ", making since " + maker.since + "</span></span></div><p>" + esc(maker.story) + "</p></div></details>" +
      "</div></div></div></div>" +
      fbtHTML() +
      '<section class="sec" id="reviews"><div class="wrap"><h2 style="margin-bottom:1.25rem">Reviews</h2><div class="rev"><div><div class="rsum"><b>' + p.rating.toFixed(1) + "</b><span>" + starRow(p.rating) + '<br><span class="small muted">' + p.reviews + " reviews</span></span></div>" +
      '<ul class="bars">' + bd.map(function (v, i) { return "<li><span>" + (5 - i) + ' star</span><span class="bar" role="img" aria-label="' + v + "% of reviews gave " + (5 - i) + ' stars"><i style="width:' + v + '%"></i></span><span class="muted">' + v + "%</span></li>"; }).join("") + "</ul>" +
      '<button class="btn btn--line btn--block" type="button" id="writeRev" aria-expanded="false" aria-controls="revForm" style="margin-top:1rem">Write a review</button><div id="revForm" hidden></div></div>' +
      '<div><div class="rfilters" role="group" aria-label="Filter reviews">' + [0, 5, 4, 3, 2, 1].map(function (s) { return '<button type="button" class="chip" data-rf="' + s + '" aria-pressed="' + (s === 0) + '">' + (s ? s + " star" : "All") + "</button>"; }).join("") +
      '<button type="button" class="chip" data-rphoto aria-pressed="false">With photos</button></div><div class="rlist" id="rlist">' + revListHTML() + "</div></div></div></div></section>" +
      '<section class="sec sec--sand"><div class="wrap"><h2>Questions and answers</h2><dl class="qa">' + (D.QA[p.craft] || []).map(function (x) { return "<dt>Q: " + esc(x[0]) + "</dt><dd>A: " + esc(x[1]) + "</dd>"; }).join("") + "</dl></div></section>" +
      stripHTML(also, "You may also like", "More to explore") + stripHTML(recent, "Recently viewed", "") +
      '<div class="sticky-buy" id="stickyBuy" aria-hidden="true"><div><span class="small muted" id="sbName">' + esc(p.name) + '</span><b id="sbPrice" class="notranslate"></b></div><button class="btn btn--terra" type="button" data-add tabindex="-1">Add to cart</button></div>';
    function paint(all) {
      $("#priceBox").innerHTML = priceHTML(cur);
      $("#stockBox").innerHTML = stockHTML();
      $("#buyBox").innerHTML = buyHTML();
      $("#sbPrice").textContent = money(cur.price);
      var sb = $("#stickyBuy [data-add]"); sb.disabled = cur.stock <= 0; sb.textContent = cur.stock <= 0 ? "Sold out" : "Add to cart";
      if (all) { $("#gal").innerHTML = galHTML(); bindGallery(); }
      observeBuy();
    }
    function choose(kind, val, btn) {
      if (btn.getAttribute("aria-disabled") === "true") { hint = btn.title + ". Try another option."; $("#opts").innerHTML = optHTML(); var nb = $('#opts [data-' + kind + '="' + val + '"]'); if (nb) nb.focus(); S.announce(hint); return; }
      var ns = { size: sel.size, colour: sel.colour }; ns[kind] = val;
      var v = find(ns.size, ns.colour);
      if (!v) { var alt = p.variants.filter(function (x) { return x[kind] === val; }); v = alt.filter(function (x) { return x.stock > 0; })[0] || alt[0]; ns = { size: v.size, colour: v.colour }; }
      hint = ""; var imgChanged = v.img !== cur.img; sel = ns; cur = v; qty = 1;
      $("#opts").innerHTML = optHTML(); paint(imgChanged);
      var fb = $('#opts [data-' + kind + '="' + val + '"]'); if (fb) fb.focus();
      S.announce(vLabel(v) + ", " + money(v.price) + ". " + (v.stock <= 0 ? "Sold out" : v.stock <= 3 ? "Only " + v.stock + " left" : "In stock"));
    }
    function bindGallery() {
      var track = $("#galTrack"), count = $("#galCount"), g = gallery();
      track.addEventListener("scroll", function () {
        var i = Math.round(track.scrollLeft / track.clientWidth);
        count.textContent = i + 1 + " / " + g.length;
        $$(".thumbs button").forEach(function (b, j) { b.setAttribute("aria-current", j === i ? "true" : "false"); });
      }, { passive: true });
      var fine = window.matchMedia("(hover: hover) and (min-width: 900px)").matches && !S.reducedMotion();
      $$(".gal__slide", track).forEach(function (s) {
        if (fine) {
          s.addEventListener("mousemove", function (e) { var r = s.getBoundingClientRect(), im = s.firstChild; im.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + "% " + ((e.clientY - r.top) / r.height * 100) + "%"; im.style.transform = "scale(1.9)"; });
          s.addEventListener("mouseleave", function () { s.firstChild.style.transform = ""; });
        }
        s.addEventListener("click", function () { openZoom(g, +s.getAttribute("data-zi"), p.name); });
      });
      $$(".thumbs button").forEach(function (b) { b.addEventListener("click", function () { var i = +b.getAttribute("data-ti"); track.scrollTo({ left: i * track.clientWidth, behavior: S.reducedMotion() ? "auto" : "smooth" }); $$(".thumbs button").forEach(function (x) { x.setAttribute("aria-current", x === b ? "true" : "false"); }); }); });
    }
    var io = null;
    function observeBuy() {
      if (!("IntersectionObserver" in window)) return;
      if (io) io.disconnect();
      var bar = $("#stickyBuy"), target = $("#buyMain");
      io = new IntersectionObserver(function (en) {
        var e = en[0], on = !e.isIntersecting && e.boundingClientRect.top < 0 && window.innerWidth < 900;
        bar.classList.toggle("is-on", on); bar.setAttribute("aria-hidden", on ? "false" : "true");
        $("#stickyBuy [data-add]").tabIndex = on ? 0 : -1; document.body.classList.toggle("has-bar", on);
      });
      io.observe(target);
    }
    onCleanup(function () { if (io) io.disconnect(); });
    paint(false); bindGallery();
    function onClick(e) {
      var t = e.target, b;
      if ((b = t.closest("[data-size]"))) return choose("size", b.getAttribute("data-size"), b);
      if ((b = t.closest("[data-colour]"))) return choose("colour", b.getAttribute("data-colour"), b);
      if ((b = t.closest("[data-q]"))) { qty = Math.max(1, Math.min(Math.min(10, cur.stock), qty + +b.getAttribute("data-q"))); var dir = b.getAttribute("data-q"); $("#buyBox").innerHTML = buyHTML(); observeBuy(); var nb = $('#buyBox [data-q="' + dir + '"]'); (nb && !nb.disabled ? nb : $("#buyMain")).focus(); S.announce("Quantity " + qty); return; }
      if (t.closest("[data-add]")) { addToCart(p.slug, cur.id, qty); return; }
      if (t.closest("[data-buynow]")) { var c = cart(), has = c.some(function (l) { return l.slug === p.slug && l.vid === cur.id; }); if (has || addToCart(p.slug, cur.id, qty, true)) navigate(u("/checkout")); return; }
      if ((b = t.closest("[data-rf]"))) { rf.star = +b.getAttribute("data-rf"); $$("[data-rf]").forEach(function (x) { x.setAttribute("aria-pressed", x === b || (+x.getAttribute("data-rf") === rf.star && x.classList.contains("chip")) ? "true" : "false"); }); $("#rlist").innerHTML = revListHTML(); S.announce("Reviews filtered"); return; }
      if ((b = t.closest("[data-rphoto]"))) { rf.photo = !rf.photo; b.setAttribute("aria-pressed", rf.photo); $("#rlist").innerHTML = revListHTML(); S.announce(rf.photo ? "Showing reviews with photos" : "Showing all reviews"); return; }
      if (t.closest("#writeRev")) {
        var box = $("#revForm"), btn = $("#writeRev"), open = box.hidden;
        box.hidden = !open; btn.setAttribute("aria-expanded", open);
        if (open) {
          box.innerHTML = '<form id="rvf" class="form-grid" novalidate style="margin-top:1rem"><fieldset style="border:0;padding:0;margin:0"><legend class="lab">Your rating</legend><div class="opts" style="margin-top:.4rem">' + [5, 4, 3, 2, 1].map(function (s) { return '<label class="optbtn" style="display:inline-flex;align-items:center;gap:.3rem;cursor:pointer"><input type="radio" name="star" value="' + s + '" style="accent-color:var(--terra)">' + s + " star</label>"; }).join("") + '</div><p class="err" id="rvStarErr"></p></fieldset>' +
            '<div class="field"><label for="rvName">Your name</label><input class="inp" id="rvName" autocomplete="given-name" aria-describedby="rvNameErr"><p class="err" id="rvNameErr"></p></div>' +
            '<div class="field"><label for="rvText">Your review</label><textarea class="inp" id="rvText" aria-describedby="rvTextErr"></textarea><p class="err" id="rvTextErr"></p></div><button class="btn btn--terra" type="submit">Submit review</button></form>';
          $("#rvf input").focus();
        }
        return;
      }
    }
    view.addEventListener("click", onClick);
    function onSubmit(e) {
      if (e.target.id === "pinForm") {
        e.preventDefault(); var v = $("#pinIn").value.trim(), res = delivery(v);
        if (!res) { $("#pinBox").innerHTML = pinHTML(null, "Enter a 6-digit PIN code, for example 700029."); $("#pinIn").focus(); return; }
        store.pin.set(v); savedPin = v; $("#pinBox").innerHTML = pinHTML(res); $("#pinIn").focus(); return;
      }
      if (e.target.id === "fbt") {
        e.preventDefault(); var picked = $$('#fbt input[name="fbt"]:checked').map(function (i) { return i.value; });
        if (!picked.length) { S.toast("Tick at least one item", { icon: false }); return; }
        var last = null; picked.forEach(function (s) { var x = P[s]; if (addToCart(s, defV(x).id, 1, true)) last = x; });
        if (last) { S.toast("Added " + plural(picked.length, "item", "items") + " to cart"); openAdded(last, defV(last), 1); }
        return;
      }
      if (e.target.id === "rvf") {
        e.preventDefault(); var ok = true, star = $('#rvf input[name="star"]:checked'), nm = $("#rvName"), tx = $("#rvText");
        $("#rvStarErr").textContent = star ? "" : "Choose a star rating from 1 to 5."; if (!star) ok = false;
        $("#rvNameErr").textContent = nm.value.trim() ? "" : "Add your first name so others know who wrote it."; nm.setAttribute("aria-invalid", !nm.value.trim()); if (!nm.value.trim()) ok = false;
        $("#rvTextErr").textContent = tx.value.trim().length >= 10 ? "" : "Write at least a short sentence, 10 letters or more."; tx.setAttribute("aria-invalid", tx.value.trim().length < 10); if (tx.value.trim().length < 10) ok = false;
        if (!ok) { var fe = $("#rvf [aria-invalid=true]") || $('#rvf input[name="star"]'); if (!star) fe = $('#rvf input[name="star"]'); fe.focus(); return; }
        $("#revForm").innerHTML = '<div class="note" role="status" style="margin-top:1rem">' + I.check + "<span><b>Thank you, " + esc(nm.value.trim()) + ".</b> In the real store your review appears after a quick check. This is a sample, so nothing was saved or sent.</span></div>";
        $("#writeRev").hidden = true;
      }
    }
    view.addEventListener("submit", onSubmit);
    function onChange(e) {
      if (e.target.name === "fbt") { var tot = $$('#fbt input[name="fbt"]:checked').reduce(function (a, i) { return a + defV(P[i.value]).price; }, 0); $("#fbtTot").textContent = money(tot); }
    }
    view.addEventListener("change", onChange);
    onCleanup(function () { view.removeEventListener("click", onClick); view.removeEventListener("submit", onSubmit); view.removeEventListener("change", onChange); document.body.classList.remove("has-bar"); });
    if (savedPin && delivery(savedPin)) $("#pinBox").innerHTML = pinHTML(delivery(savedPin));
  }

  // ---------- cart page ----------
  function renderCartPage(keep) {
    var t = totals();
    var html = '<div class="wrap"><ol class="crumbs"><li><a href="' + u() + '">Home</a></li><li aria-current="page">Cart</li></ol><div class="page-h"><h1>Your cart</h1></div>';
    if (!t.count) html += emptyCart() + '<div style="margin-top:1rem">' + savedList() + "</div></div>";
    else html += '<div class="cartpage"><div>' + shipBar(t) + "<ul>" + t.lines.map(function (l) { return lineHTML(l); }).join("") + "</ul>" + savedList() + "</div>" +
      '<aside><div class="box"><h2>Order summary</h2><div style="display:grid;gap:1rem">' + giftHTML("p") + couponHTML(t, "p") + summaryHTML(t) +
      '<a class="btn btn--terra btn--block" href="' + u("/checkout") + '">Checkout securely</a><p class="small muted" style="text-align:center">UPI, cards, netbanking or cash on delivery</p></div></div></aside></div></div>' +
      '<div class="sticky-buy is-on" style="display:flex"><div><span class="small muted">Total</span><b class="notranslate">' + money(t.total) + '</b></div><a class="btn btn--terra" href="' + u("/checkout") + '">Checkout</a></div>';
    view.innerHTML = html;
    var bar = $(".sticky-buy", view); if (bar) { var mob = window.innerWidth < 960; bar.style.display = mob ? "flex" : "none"; document.body.classList.toggle("has-bar", mob); }
  }
  function vCart() { setTitle("Cart"); renderCartPage(); onCleanup(function () { document.body.classList.remove("has-bar"); }); }

  // ---------- checkout ----------
  var STATES_OPT = D.STATES;
  function vCheckout() {
    setTitle("Checkout");
    if (!cart().length) { view.innerHTML = '<div class="wrap" style="padding-block:2rem"><h1 class="sr">Checkout</h1>' + emptyCart() + "</div>"; return; }
    var sd = store.details.get(null);
    co = { step: 1, save: !!sd, d: sd ? JSON.parse(JSON.stringify(sd)) : { mobile: "", email: "", name: "", house: "", street: "", landmark: "", city: "", state: "", pin: store.pin.get("") || "" }, delivery: "standard", pay: "upi", errs: {}, auto: false };
    if (co.d.pin && !co.d.city) { var dd = delivery(co.d.pin); if (dd && dd.city) { co.d.city = dd.city; co.d.state = dd.state; co.auto = true; } }
    drawCheckout();
  }
  function coTotals() { return totals({ express: co.delivery === "express", cod: co.pay === "cod" && co.step === 3 }); }
  function field(id, label, opt) {
    opt = opt || {}; var v = co.d[id] || "", e = co.errs[id];
    var input = opt.select ? '<select class="inp" id="f-' + id + '" name="' + id + '" autocomplete="' + (opt.ac || "off") + '"' + (e ? ' aria-invalid="true" aria-describedby="e-' + id + '"' : "") + '><option value="">Choose your state</option>' + STATES_OPT.map(function (s) { return "<option" + (s === v ? " selected" : "") + ">" + s + "</option>"; }).join("") + "</select>" :
      '<input class="inp' + (opt.nt ? " notranslate" : "") + '" id="f-' + id + '" name="' + id + '" value="' + esc(v) + '" autocomplete="' + (opt.ac || "off") + '"' + (opt.type ? ' type="' + opt.type + '"' : "") + (opt.im ? ' inputmode="' + opt.im + '"' : "") + (opt.max ? ' maxlength="' + opt.max + '"' : "") + (opt.req === false ? "" : ' aria-required="true"') + ' aria-describedby="' + (opt.hint ? "h-" + id + " " : "") + "e-" + id + '"' + (e ? ' aria-invalid="true"' : "") + ">";
    return '<div class="field' + (opt.span ? " span2" : "") + '"><label for="f-' + id + '">' + label + (opt.req === false ? ' <span class="muted">(optional)</span>' : "") + "</label>" + input + (opt.hint ? '<span class="hint" id="h-' + id + '">' + opt.hint + "</span>" : "") + '<p class="err" id="e-' + id + '">' + (e || "") + "</p></div>";
  }
  function validate() {
    var d = co.d, e = {};
    if (!S.validMobile(d.mobile)) e.mobile = "Enter a 10-digit mobile number starting with 6, 7, 8 or 9.";
    if (d.email && !S.validEmail(d.email)) e.email = "Check the email address, for example name@gmail.com. Or leave it empty.";
    if (d.name.trim().length < 2) e.name = "Enter the name of the person receiving the parcel.";
    if (!d.house.trim()) e.house = "Enter your house or flat number and building name.";
    if (!d.street.trim()) e.street = "Enter the street, road or area.";
    if (!d.city.trim()) e.city = "Enter your town or city.";
    if (!d.state) e.state = "Choose your state from the list.";
    if (!S.validPin(d.pin)) e.pin = "Enter a 6-digit PIN code, for example 700029.";
    co.errs = e; return Object.keys(e);
  }
  function etaRange(kind) { return kind === "express" ? [addDays(2), addDays(3)] : [addDays(4), addDays(7)]; }
  function payName(k) { return { upi: "UPI", card: "Card", netbanking: "Netbanking", cod: "Cash on delivery" }[k] || k; }
  function drawCheckout(keep) {
    if (!co) return;
    if (!cart().length) { vCheckout(); return; }
    var t = coTotals(), d = co.d, dv = delivery(d.pin), codOk = !dv || dv.cod;
    if (!codOk && co.pay === "cod") co.pay = "upi";
    var stepsNames = ["Address", "Delivery", "Payment"];
    var steps = '<ol class="steps" aria-label="Checkout progress">' + stepsNames.map(function (n, i) { var s = i + 1 < co.step ? "done" : i + 1 === co.step ? "now" : "todo"; return '<li data-s="' + s + '"' + (s === "now" ? ' aria-current="step"' : "") + ">" + (i + 1) + ". " + n + (s === "done" ? '<span class="sr"> (done)</span>' : "") + "</li>"; }).join("") + "</ol>";
    var sumItems = t.lines.map(function (l) { return '<div class="mini">' + img(l.v.img, "", "52px") + "<span>" + esc(l.p.name) + (vLabel(l.v) ? '<br><span class="muted">' + esc(vLabel(l.v)) + "</span>" : "") + "<br>Qty " + l.qty + "</span><b>" + M(l.v.price * l.qty) + "</b></div>"; }).join("");
    var sumBody = sumItems + '<div style="margin:.75rem 0">' + couponHTML(t, "c") + "</div>" + summaryHTML(t, { express: co.delivery === "express" });
    var main = "";
    var done1 = '<div class="co-done"><span><b>Deliver to</b><br>' + esc(d.name) + ", " + esc(d.house) + ", " + esc(d.street) + (d.landmark ? ", " + esc(d.landmark) : "") + ", " + esc(d.city) + ", " + esc(d.state) + ' <span class="notranslate">' + esc(d.pin) + '</span><br><span class="notranslate">' + fmtMobile(d.mobile) + "</span></span>" + '<button type="button" class="textbtn" data-co-go="1">Change<span class="sr"> address</span></button></div>';
    var er = etaRange(co.delivery);
    var done2 = '<div class="co-done"><span><b>' + (co.delivery === "express" ? "Express" : "Standard") + " delivery</b><br>Arrives " + fDate(er[0]) + " to " + fDate(er[1]) + '</span><button type="button" class="textbtn" data-co-go="2">Change<span class="sr"> delivery</span></button></div>';
    if (co.step === 1) {
      main = '<form class="co-step" id="coForm" novalidate><h2>Contact and address</h2><p class="small muted">Guest checkout. No account needed.</p>' +
        (Object.keys(co.errs).length ? '<div class="note" role="alert" style="background:#FBE9E6">' + I.info.replace("<svg", '<svg style="color:var(--err)"') + "<span>Please fix " + plural(Object.keys(co.errs).length, "field", "fields") + " below.</span></div>" : "") +
        '<div class="form-grid form-grid--2">' +
        field("mobile", "Mobile number", { type: "tel", im: "numeric", ac: "tel-national", max: 14, nt: true, hint: "10 digits. Order updates come on WhatsApp." }) +
        field("email", "Email", { type: "email", ac: "email", req: false, nt: true }) +
        field("name", "Full name", { ac: "name", span: true }) +
        field("house", "House or flat number, building", { ac: "address-line1", span: true }) +
        field("street", "Street, road or area", { ac: "address-line2", span: true }) +
        field("landmark", "Landmark", { req: false, span: true, hint: "Near a school, temple or shop" }) +
        field("city", "Town or city", { ac: "address-level2" }) +
        field("state", "State", { select: true, ac: "address-level1" }) +
        field("pin", "PIN code", { im: "numeric", ac: "postal-code", max: 6, nt: true, hint: "City and state fill in from the PIN." }) +
        '</div><label class="check"><input type="checkbox" id="saveMe"' + (co.save ? " checked" : "") + '><span>Save my details on this device for next time</span></label>' +
        '<div class="co-nav"><a class="textbtn" href="' + u("/cart") + '">Back to cart</a><button class="btn btn--terra" type="submit">Continue to delivery</button></div></form>';
    } else if (co.step === 2) {
      var ship = (t.subtotal - t.discount >= STORE.freeShipAt || t.freeShip) ? 0 : STORE.shipFee, es = etaRange("standard"), ee = etaRange("express");
      main = done1 + '<form class="co-step" id="coForm" novalidate><h2>Delivery</h2><fieldset style="border:0;padding:0;margin:0;display:grid;gap:.75rem"><legend class="sr">Delivery speed</legend>' +
        '<label class="radio-card"><input type="radio" name="dl" value="standard"' + (co.delivery === "standard" ? " checked" : "") + "><span><b>Standard</b><span class=\"small muted\">4 to 7 days: " + fDate(es[0]) + " to " + fDate(es[1]) + '</span></span><span class="r">' + (ship ? M(ship) : '<span class="ok">Free</span>') + "</span></label>" +
        '<label class="radio-card"><input type="radio" name="dl" value="express"' + (co.delivery === "express" ? " checked" : "") + "><span><b>Express</b><span class=\"small muted\">2 to 3 days: " + fDate(ee[0]) + " to " + fDate(ee[1]) + '</span></span><span class="r">' + M(STORE.expressFee) + "</span></label></fieldset>" +
        (ship ? '<p class="small muted">Standard shipping is free on orders of ' + M(STORE.freeShipAt) + " or more.</p>" : "") +
        '<div class="co-nav"><button type="button" class="textbtn" data-co-go="1">Back</button><button class="btn btn--terra" type="submit">Continue to payment</button></div></form>';
    } else {
      var pays = [["upi", "UPI", "Google Pay, PhonePe, Paytm or any UPI app"], ["card", "Credit or debit card", "Visa, Mastercard, RuPay"], ["netbanking", "Netbanking", "All major Indian banks"], ["cod", "Cash on delivery", codOk ? "Pay when it arrives. Extra " + money(STORE.codFee) + "." : "Not available for PIN " + d.pin]];
      main = done1 + done2 + '<form class="co-step" id="coForm" novalidate><h2>Payment</h2><fieldset style="border:0;padding:0;margin:0;display:grid;gap:.75rem"><legend class="sr">Payment method</legend>' +
        pays.map(function (x) { var dis = x[0] === "cod" && !codOk; return '<label class="radio-card"' + (dis ? ' style="opacity:.6;cursor:not-allowed"' : "") + '><input type="radio" name="pay" value="' + x[0] + '"' + (co.pay === x[0] ? " checked" : "") + (dis ? " disabled" : "") + "><span><b>" + x[1] + '</b><span class="small muted">' + esc(x[2]) + "</span></span>" + (x[0] === "cod" && codOk ? '<span class="r">+' + M(STORE.codFee) + "</span>" : "") + "</label>"; }).join("") +
        '</fieldset><div class="note">' + I.lock + "<span>In the real store, you pay on Razorpay's secure page. This sample only shows the step and takes no money.</span></div>" +
        '<div class="co-nav"><button type="button" class="textbtn" data-co-go="2">Back</button><button class="btn btn--terra" type="submit" id="payBtn">' + (co.pay === "cod" ? "Place order" : "Pay " + money(t.total)) + "</button></div></form>";
    }
    view.innerHTML = '<div class="wrap"><div class="page-h" style="padding-top:1.5rem"><h1>Checkout</h1></div>' + steps +
      '<div class="co"><div><details class="box co-sum-mob"><summary>Order summary (' + t.count + ') <span class="notranslate">' + money(t.total) + "</span></summary>" + sumBody.replace(/id="cp-c"/, 'id="cp-cm"').replace(/for="cp-c"/, 'for="cp-cm"').replace(/cpe-c/g, "cpe-cm").replace(/unc-c/, "unc-cm") + "</details>" +
      '<div style="margin-top:1rem">' + main + '</div></div><aside class="co-sum-desk"><div class="box"><h2>Order summary</h2>' + sumBody + "</div></aside></div></div>";
    if (!keep) {
      var fe = co.step === 1 ? $("#coForm [aria-invalid=true]") : null;
      if (fe) fe.focus();
    }
  }
  document.addEventListener("input", function (e) {
    if (!co || route().name !== "checkout" || !e.target.closest("#coForm")) return;
    var n = e.target.name; if (!n || !(n in co.d)) return;
    co.d[n] = e.target.value;
    if (co.errs[n]) { delete co.errs[n]; e.target.removeAttribute("aria-invalid"); var er = $("#e-" + n); if (er) er.textContent = ""; }
    if (n === "pin" && S.validPin(e.target.value)) {
      var dv = delivery(e.target.value);
      if (dv && dv.city && (!co.d.city || co.auto)) { co.d.city = dv.city; co.d.state = dv.state; co.auto = true; $("#f-city").value = dv.city; $("#f-state").value = dv.state; S.announce("City and state filled in: " + dv.city + ", " + dv.state); }
      else if (dv && !dv.city) S.announce("PIN accepted. Please type your city and choose your state.");
    }
    if (n === "city") co.auto = false;
  });
  document.addEventListener("change", function (e) {
    if (!co || route().name !== "checkout") return;
    if (e.target.name === "state") { co.d.state = e.target.value; co.auto = false; }
    if (e.target.id === "saveMe") co.save = e.target.checked;
    if (e.target.name === "dl") { co.delivery = e.target.value; drawCheckout(true); var r = $('input[name="dl"][value="' + co.delivery + '"]'); if (r) r.focus(); S.announce((co.delivery === "express" ? "Express" : "Standard") + " delivery chosen"); }
    if (e.target.name === "pay") { co.pay = e.target.value; drawCheckout(true); var p = $('input[name="pay"][value="' + co.pay + '"]'); if (p) p.focus(); S.announce(payName(co.pay) + " chosen. Total " + money(coTotals().total)); }
  });
  document.addEventListener("click", function (e) {
    var g = e.target.closest("[data-co-go]"); if (!g || !co) return;
    co.step = +g.getAttribute("data-co-go"); drawCheckout(); var h = $("#coForm h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
  });
  document.addEventListener("submit", function (e) {
    if (e.target.id !== "coForm" || !co) return;
    e.preventDefault();
    if (co.step === 1) {
      var bad = validate();
      if (bad.length) { drawCheckout(); S.announce("Please fix " + plural(bad.length, "field", "fields")); return; }
      co.d.mobile = digits(co.d.mobile);
      if (co.save) store.details.set(co.d); else store.details.remove();
      store.pin.set(co.d.pin);
      co.step = 2; drawCheckout(); var h = $("#coForm h2"); h.setAttribute("tabindex", "-1"); h.focus(); window.scrollTo(0, 0); return;
    }
    if (co.step === 2) { co.step = 3; drawCheckout(); var h3 = $("#coForm h2"); h3.setAttribute("tabindex", "-1"); h3.focus(); return; }
    placeOrder();
  });
  function placeOrder() {
    var btn = $("#payBtn"); if (!btn || btn.classList.contains("is-busy")) return;
    btn.classList.add("is-busy"); btn.innerHTML = '<span class="spin" aria-hidden="true"></span>Processing';
    var ov = document.createElement("div"); ov.className = "processing"; ov.setAttribute("role", "status");
    ov.innerHTML = '<div><span class="spin"></span><p><b>' + (co.pay === "cod" ? "Placing your order" : "Processing your sample payment") + '</b></p><p class="small muted">Sample only: no money is taken.</p></div>';
    document.body.appendChild(ov);
    setTimeout(function () {
      var t = coTotals(), er = etaRange(co.delivery), n = 100400 + myOrders().length * 7 + Math.floor(Math.random() * 90);
      var o = { no: "MKC-" + n, created: Date.now(), mobile: digits(co.d.mobile), email: co.d.email, name: co.d.name,
        addr: { house: co.d.house, street: co.d.street, landmark: co.d.landmark, city: co.d.city, state: co.d.state, pin: co.d.pin },
        items: t.lines.map(function (l) { return { slug: l.slug, vid: l.vid, name: l.p.name, var: vLabel(l.v), price: l.v.price, qty: l.qty, img: l.v.img, craft: l.p.craft }; }),
        delivery: co.delivery, pay: co.pay, eta: [er[0].getTime(), er[1].getTime()],
        totals: { subtotal: t.subtotal, discount: t.discount, ship: t.ship, cod: t.cod, gift: t.gift, total: t.total, gst: t.gst },
        coupon: t.coupon && t.coupon.ok ? t.coupon.code : "", giftMsg: t.gift ? store.gift.get({}).msg || "" : "" };
      var os = myOrders(); os.unshift(o); store.orders.set(os);
      store.cart.set([]); store.coupon.remove(); store.gift.set({ on: false, msg: "" });
      ov.remove(); co = null; navigate(u("/order/" + o.no), true); S.toast("Order placed");
    }, 1500);
  }

  // ---------- order confirmation ----------
  function addrHTML(o) { var a = o.addr; return esc(o.name) + "<br>" + esc(a.house) + ", " + esc(a.street) + (a.landmark ? "<br>Near " + esc(a.landmark) : "") + "<br>" + esc(a.city) + ", " + esc(a.state) + ' <span class="notranslate">' + esc(a.pin) + '</span><br><span class="notranslate">' + fmtMobile(o.mobile) + "</span>"; }
  function itemsHTML(o) { return o.items.map(function (l) { return '<div class="mini">' + img(l.img, "", "52px") + "<span>" + esc(l.name) + (l.var ? '<br><span class="muted">' + esc(l.var) + "</span>" : "") + "<br>Qty " + l.qty + "</span><b>" + M(l.price * l.qty) + "</b></div>"; }).join(""); }
  function totalsHTML(o) { var t = o.totals; return summaryHTML({ count: o.items.reduce(function (a, l) { return a + l.qty; }, 0), subtotal: t.subtotal, discount: t.discount, coupon: { code: o.coupon }, ship: t.ship, gift: t.gift, cod: t.cod, total: t.total, gst: t.gst }, { express: o.delivery === "express" }); }
  function waSummary(o) {
    return "Hello, this is my sample order from the Mati Kotha Crafts demo store.\nOrder: " + o.no + "\n" + o.items.map(function (l) { return "- " + l.name + (l.var ? " (" + l.var + ")" : "") + " x " + l.qty + ": " + money(l.price * l.qty); }).join("\n") +
      "\nTotal: " + money(o.totals.total) + " (" + payName(o.pay) + ")\nDeliver to: " + o.addr.city + " " + o.addr.pin + "\nExpected: " + fDate(o.eta[0]) + " to " + fDate(o.eta[1]);
  }
  function vOrder(r) {
    var o = findOrder(r.no);
    if (!o) { setTitle("Order not found"); view.innerHTML = '<div class="wrap" style="padding-block:2rem"><h1 class="sr">Order not found</h1><div class="empty">' + I.box + "<h2>We could not find that order</h2><p>Sample orders are saved only in the browser where they were placed.</p><a class=\"btn btn--terra\" href=\"" + u("/track") + '">Track an order</a></div></div>'; return; }
    setTitle("Order " + o.no);
    view.innerHTML = '<div class="wrap" style="max-width:960px"><div class="thanks">' + I.check.replace("<svg", '<svg style="width:64px;height:64px;color:var(--ok)"') + "<h1>Thank you, " + esc(o.name.split(" ")[0]) + '. Your order is placed.</h1><p style="margin-top:.6rem">Order number <b class="ono notranslate">' + o.no + "</b> &middot; " + fDT(o.created) + "</p>" +
      '<p class="muted" style="margin-top:.4rem">You\'ll get updates on WhatsApp and email. (Sample: nothing is actually sent.)</p>' +
      '<div class="btn-row" style="justify-content:center"><a class="btn btn--terra" href="' + u("/track?order=" + o.no + "&mobile=" + o.mobile) + '">Track your order</a><a class="btn btn--line" href="' + u("/invoice/" + o.no) + '" target="_blank" rel="noopener">Download invoice</a><a class="btn btn--line" href="' + u("/shop") + '">Continue shopping</a></div>' +
      '<p style="margin-top:1rem"><a class="link" href="' + S.wa(waSummary(o)) + '" target="_blank" rel="noopener">' + I.wa.replace("<svg", '<svg style="width:18px;height:18px;display:inline;vertical-align:-3px;color:#1E8E4E"') + " Send me the summary on WhatsApp</a></p></div>" +
      '<div class="og"><div class="box"><h2>Items</h2>' + itemsHTML(o) + '<div style="margin-top:.75rem">' + totalsHTML(o) + "</div></div>" +
      '<div><div class="box"><h2>Delivery</h2><p>' + addrHTML(o) + '</p><p style="margin-top:.75rem"><b>' + (o.delivery === "express" ? "Express" : "Standard") + " delivery:</b> " + fDate(o.eta[0]) + " to " + fDate(o.eta[1]) + "</p></div>" +
      '<div class="box"><h2>Payment</h2><p>' + payName(o.pay) + (o.pay === "cod" ? ": pay " + M(o.totals.total) + " when it arrives." : ": paid (sample).") + "</p>" + (o.giftMsg ? '<p style="margin-top:.5rem"><b>Gift message:</b> ' + esc(o.giftMsg) + "</p>" : "") + "</div></div></div></div>";
    view.lastChild.style.paddingBottom = "3rem";
  }

  // ---------- invoice ----------
  function vInvoice(r) {
    var o = findOrder(r.no);
    if (!o) { setTitle("Invoice not found"); view.innerHTML = '<div class="wrap" style="padding-block:2rem"><div class="empty"><h1 style="font-size:1.6rem">Invoice not found</h1><p>Sample invoices exist only in the browser where the order was placed.</p><a class="btn btn--terra" href="' + u() + '">Go to the store</a></div></div>'; return; }
    setTitle("Invoice " + o.no);
    var wb = o.addr.state === "West Bengal", t = o.totals;
    var rows = o.items.map(function (l) { var amt = l.price * l.qty, tax = amt / 1.12; return [l.name + (l.var ? " (" + l.var + ")" : ""), STORE.hsn[l.craft] || "4602", l.qty, l.price, tax, amt]; });
    if (t.ship) rows.push(["Shipping and handling", "996812", 1, t.ship, t.ship / 1.12, t.ship]);
    if (t.gift) rows.push(["Gift wrap", "4823", 1, t.gift, t.gift / 1.12, t.gift]);
    if (t.cod) rows.push(["Cash on delivery fee", "996812", 1, t.cod, t.cod / 1.12, t.cod]);
    if (t.discount) rows.push(["Less: discount (" + (o.coupon || "coupon") + ")", "", 1, -t.discount, -t.discount / 1.12, -t.discount]);
    var taxable = rows.reduce(function (a, x) { return a + x[4]; }, 0), gst = t.total - taxable;
    function m2(n) { return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    view.innerHTML = '<div class="wrap"><div class="inv-acts" style="margin-top:1rem"><button class="btn btn--terra" type="button" onclick="window.print()">Print / Save as PDF</button><a class="btn btn--line" href="' + u("/order/" + o.no) + '">Back to order</a></div>' +
      '<article class="inv"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem"><div><h1>Tax invoice <span class="sample-tag">Sample</span></h1><p class="small muted">Not a valid tax document. Made by a demo store.</p></div>' +
      '<div style="text-align:right"><b class="notranslate">Mati Kotha Crafts</b><br>14 Lake Terrace, Kolkata 700029<br>West Bengal (state code 19)<br>GSTIN: <span class="notranslate">' + STORE.gstin + '</span> <span class="sample-tag">Sample</span></div></div>' +
      '<div class="meta"><div><b>Billed and shipped to</b><br>' + addrHTML(o) + "</div><div><b>Invoice no:</b> <span class=\"notranslate\">INV-" + o.no.replace("MKC-", "") + "</span><br><b>Order no:</b> <span class=\"notranslate\">" + o.no + "</span><br><b>Date:</b> " + new Date(o.created).toLocaleDateString("en-IN") + "<br><b>Place of supply:</b> " + esc(o.addr.state) + "<br><b>Payment:</b> " + payName(o.pay) + "</div></div>" +
      '<div class="inv-wrap"><table><thead><tr><th>#</th><th>Item</th><th>HSN/SAC</th><th class="n">Qty</th><th class="n">Rate (incl. GST)</th><th class="n">Taxable value</th><th class="n">Amount</th></tr></thead><tbody>' +
      rows.map(function (x, i) { return "<tr><td>" + (i + 1) + "</td><td>" + esc(x[0]) + '</td><td class="notranslate">' + x[1] + '</td><td class="n">' + x[2] + '</td><td class="n notranslate">' + m2(x[3]) + '</td><td class="n notranslate">' + m2(x[4]) + '</td><td class="n notranslate">' + m2(x[5]) + "</td></tr>"; }).join("") +
      '</tbody><tfoot><tr><th colspan="5" class="n">Total taxable value</th><td class="n notranslate" colspan="2">' + m2(taxable) + "</td></tr>" +
      (wb ? '<tr><th colspan="5" class="n">CGST @ 6%</th><td class="n notranslate" colspan="2">' + m2(gst / 2) + '</td></tr><tr><th colspan="5" class="n">SGST @ 6%</th><td class="n notranslate" colspan="2">' + m2(gst / 2) + "</td></tr>" :
        '<tr><th colspan="5" class="n">IGST @ 12%</th><td class="n notranslate" colspan="2">' + m2(gst) + "</td></tr>") +
      '<tr><th colspan="5" class="n">Invoice total</th><td class="n notranslate" colspan="2"><b>' + m2(t.total) + "</b></td></tr></tfoot></table></div>" +
      '<p class="small muted" style="margin-top:1rem">' + (wb ? "Delivery within West Bengal: CGST and SGST apply." : "Delivery outside West Bengal: IGST applies.") + " Prices on the store include GST. This sample invoice was made in your browser and is not a real tax document.</p></article></div>";
  }

  // ---------- track ----------
  function vTrack(r) {
    setTitle("Track your order");
    var qo = (r.q.get("order") || "").toUpperCase(), qm = r.q.get("mobile") || "", timer = null;
    view.innerHTML = '<div class="wrap" style="max-width:760px;padding-bottom:3rem"><ol class="crumbs"><li><a href="' + u() + '">Home</a></li><li aria-current="page">Track order</li></ol><div class="page-h"><h1>Track your order</h1><p class="muted" style="margin-top:.4rem">Enter the order number from your confirmation and the mobile number you used.</p></div>' +
      '<form class="box" id="trackForm" novalidate><div class="form-grid form-grid--2"><div class="field"><label for="tOrder">Order number</label><input class="inp notranslate" id="tOrder" value="' + esc(qo) + '" placeholder="MKC-100311" autocomplete="off" aria-describedby="tOrderErr"><p class="err" id="tOrderErr"></p></div>' +
      '<div class="field"><label for="tMob">Mobile number</label><input class="inp notranslate" id="tMob" type="tel" inputmode="numeric" value="' + esc(qm) + '" placeholder="98300 12345" autocomplete="tel-national" aria-describedby="tMobErr"><p class="err" id="tMobErr"></p></div></div>' +
      '<button class="btn btn--terra" type="submit" style="margin-top:.5rem">Track</button>' +
      '<p class="note" style="margin-top:1rem">' + I.info + '<span>Sample orders to try: <button type="button" class="textbtn notranslate" data-try="MKC-100311|9830012345">MKC-100311</button> (delivered), <button type="button" class="textbtn notranslate" data-try="MKC-100298|9876543210">MKC-100298</button> (shipped), <button type="button" class="textbtn notranslate" data-try="MKC-100305|9123456780">MKC-100305</button> (packed). Orders you place here move one step every 25 seconds.</span></p></form><div id="trackOut" style="margin-top:1.5rem"></div></div>';
    function show(no, mob) {
      clearInterval(timer);
      var out = $("#trackOut"), o = findOrder(no);
      if (!o || digits(o.mobile) !== digits(mob)) {
        out.innerHTML = '<div class="empty" role="status">' + I.box + "<h2>No order found</h2><p>Check the order number (it starts with MKC-) and use the same mobile number you gave at checkout. Sample orders are only saved in the browser where they were placed.</p></div>";
        return;
      }
      function paintT() {
        var st = stageOf(o), times = stepTimes(o), trk = "SX" + o.no.replace(/\D/g, "") + "IN";
        var steps = [["Order placed", "We have your order and payment details."], ["Packed", "Wrapped in straw and a double box at our Kolkata packing room."], ["Shipped", "With Sample Express, tracking number " + trk + "."], ["Out for delivery", "The courier will call before arriving."], ["Delivered", "Enjoy your handmade piece."]];
        out.innerHTML = '<div class="box"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:.5rem"><h2 style="margin:0">Order <span class="notranslate">' + o.no + '</span></h2><span class="st st--' + STATUS[st] + '">' + (st === 3 ? "Out for delivery" : STATUS[st]) + "</span></div>" +
          '<p class="small muted">Courier: Sample Express &middot; Tracking no. <span class="notranslate">' + trk + "</span> &middot; Expected " + fDate(o.eta[0]) + " to " + fDate(o.eta[1]) + "</p>" +
          '<ol class="tl" aria-label="Order progress">' + steps.map(function (s, i) { var state = i <= st ? "done" : i === st + 1 ? "now" : "todo";
            return '<li data-s="' + state + '"><i>' + (state === "done" ? I.check : "") + "</i><b>" + s[0] + '<span class="sr"> ' + (state === "done" ? "done" : state === "now" ? "next" : "not yet") + "</span></b><small>" + (i <= st ? fDT(times[i]) + " &middot; " + s[1] : i === 4 ? "Expected by " + fDate(o.eta[1]) : "Not yet") + "</small></li>"; }).join("") + "</ol>" +
          '<div class="btn-row" style="margin-top:0"><a class="btn btn--line btn--sm" href="' + u("/order/" + o.no) + '">View order</a>' + (o.seed ? "" : '<a class="btn btn--line btn--sm" href="' + u("/invoice/" + o.no) + '" target="_blank" rel="noopener">Invoice</a>') + "</div></div>";
        if (st >= 4) clearInterval(timer);
      }
      paintT();
      if (!o.seed && stageOf(o) < 4) timer = setInterval(function () { var before = out.querySelector(".st").textContent; paintT(); var after = out.querySelector(".st").textContent; if (before !== after) S.announce("Order status: " + after); }, 5000);
    }
    onCleanup(function () { clearInterval(timer); });
    function submit() {
      var no = $("#tOrder").value.trim().toUpperCase(), mob = $("#tMob").value, ok = true;
      $("#tOrderErr").textContent = /^MKC-\d{6}$/.test(no) ? "" : "Order numbers look like MKC-100311.";
      $("#tMobErr").textContent = S.validMobile(mob) ? "" : "Enter the 10-digit mobile number used for the order.";
      if (!/^MKC-\d{6}$/.test(no)) { ok = false; $("#tOrder").setAttribute("aria-invalid", "true"); } else $("#tOrder").removeAttribute("aria-invalid");
      if (!S.validMobile(mob)) { ok = false; $("#tMob").setAttribute("aria-invalid", "true"); } else $("#tMob").removeAttribute("aria-invalid");
      if (!ok) { $("#trackForm [aria-invalid=true]").focus(); return; }
      history.replaceState(null, "", u("/track?order=" + no + "&mobile=" + digits(mob)));
      show(no, mob); var h = $("#trackOut h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
    }
    $("#trackForm").addEventListener("submit", function (e) { e.preventDefault(); submit(); });
    $("#trackForm").addEventListener("click", function (e) { var b = e.target.closest("[data-try]"); if (!b) return; var x = b.getAttribute("data-try").split("|"); $("#tOrder").value = x[0]; $("#tMob").value = x[1]; submit(); });
    if (qo && qm) show(qo, qm);
  }

  // ---------- account ----------
  function vAccount(r) {
    setTitle("My account");
    var tab = ["orders", "addresses", "wishlist"].indexOf(r.q.get("tab")) > -1 ? r.q.get("tab") : "orders", otpFor = "";
    function loginHTML(step, err) {
      if (step === 2) return '<form class="box" id="otpForm" novalidate style="max-width:440px"><h2>Enter the code</h2><p class="small muted">We sent a 6-digit code to <span class="notranslate">' + fmtMobile(otpFor) + '</span>. <span class="sample-tag">Sample</span> Any 6 digits work, nothing was sent.</p>' +
        '<div class="field" style="margin-top:1rem"><label for="otp">6-digit code</label><input class="inp otp notranslate" id="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" aria-describedby="otpErr"' + (err ? ' aria-invalid="true"' : "") + '><p class="err" id="otpErr">' + (err || "") + '</p></div><div class="btn-row" style="margin-top:.5rem"><button class="btn btn--terra" type="submit">Verify and log in</button><button class="textbtn" type="button" data-relogin>Change number</button></div></form>';
      return '<form class="box" id="loginForm" novalidate style="max-width:440px"><h2>Log in with mobile OTP</h2><p class="small muted">See your sample orders and saved addresses. <span class="sample-tag">Sample</span></p>' +
        '<div class="field" style="margin-top:1rem"><label for="lMob">Mobile number</label><input class="inp notranslate" id="lMob" type="tel" inputmode="numeric" autocomplete="tel-national" aria-describedby="lMobErr"' + (err ? ' aria-invalid="true"' : "") + ' value="' + esc((store.details.get({}) || {}).mobile || "") + '"><p class="err" id="lMobErr">' + (err || "") + '</p></div><button class="btn btn--terra" type="submit" style="margin-top:.5rem">Send OTP</button></form>';
    }
    function tabBody() {
      var user = store.user.get(null);
      if (tab === "wishlist") {
        var w = wish().filter(function (s) { return P[s]; });
        return w.length ? '<ul class="grid">' + w.map(function (s) { return "<li>" + card(P[s]) + "</li>"; }).join("") + "</ul>" : '<div class="empty">' + I.heart.replace("<svg", '<svg style="width:48px;height:48px;color:var(--terra);margin:0 auto 1rem"') + "<h2>Your wishlist is empty</h2><p>Tap the heart on any product to save it here for later.</p><a class=\"btn btn--terra\" href=\"" + u("/shop") + '">Browse the store</a></div>';
      }
      if (!user) return '<div id="loginBox">' + loginHTML(1) + "</div>";
      if (tab === "orders") {
        var os = myOrders();
        return os.length ? '<div class="olist">' + os.map(function (o) { var st = stageOf(o); return '<div class="orow"><div><b class="notranslate">' + o.no + '</b> <span class="st st--' + STATUS[st] + '">' + (st === 3 ? "Out for delivery" : STATUS[st]) + '</span><br><span class="small muted">' + fDT(o.created) + " &middot; " + plural(o.items.reduce(function (a, l) { return a + l.qty; }, 0), "item", "items") + " &middot; " + M(o.totals.total) + '</span></div><div class="btn-row" style="margin:0"><a class="btn btn--line btn--sm" href="' + u("/order/" + o.no) + '">View</a><a class="btn btn--line btn--sm" href="' + u("/track?order=" + o.no + "&mobile=" + o.mobile) + '">Track</a></div></div>'; }).join("") + "</div>" :
          '<div class="empty">' + I.box + "<h2>No orders yet</h2><p>Orders you place on this sample store appear here, with live tracking.</p><a class=\"btn btn--terra\" href=\"" + u("/shop?sort=top") + '">Shop bestsellers</a></div>';
      }
      var seen = {}, list = [];
      var sd = store.details.get(null); if (sd && sd.house) list.push(sd);
      myOrders().forEach(function (o) { list.push({ name: o.name, mobile: o.mobile, house: o.addr.house, street: o.addr.street, landmark: o.addr.landmark, city: o.addr.city, state: o.addr.state, pin: o.addr.pin }); });
      list = list.filter(function (a) { var k = a.house + a.pin; if (seen[k]) return false; seen[k] = 1; return true; });
      return list.length ? '<div class="og">' + list.map(function (a, i) { return '<div class="box">' + (i === 0 ? '<span class="sample-tag" style="background:var(--sand);color:var(--ink)">Default</span>' : "") + "<p style=\"margin-top:.4rem\">" + addrHTML({ name: a.name, mobile: a.mobile, addr: a }) + "</p></div>"; }).join("") + "</div>" :
        '<div class="empty">' + I.box + "<h2>No saved addresses</h2><p>Tick “Save my details” at checkout and your address will be ready next time.</p></div>";
    }
    function draw(focusTab) {
      var user = store.user.get(null);
      view.innerHTML = '<div class="wrap" style="padding-bottom:3rem"><ol class="crumbs"><li><a href="' + u() + '">Home</a></li><li aria-current="page">Account</li></ol><div class="page-h" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:1rem"><div><h1>My account</h1>' +
        (user ? '<p class="muted">Logged in as <span class="notranslate">' + fmtMobile(user.mobile) + "</span> (sample)</p>" : '<p class="muted">Log in to see orders and addresses. The wishlist works without logging in.</p>') + "</div>" + (user ? '<button class="btn btn--line btn--sm" type="button" id="logout">Log out</button>' : "") + "</div>" +
        '<div class="tabs" role="tablist" aria-label="Account sections">' + [["orders", "My orders"], ["addresses", "Addresses"], ["wishlist", "Wishlist (" + wish().length + ")"]].map(function (x) { return '<button type="button" role="tab" id="tab-' + x[0] + '" aria-controls="tp" aria-selected="' + (tab === x[0]) + '" tabindex="' + (tab === x[0] ? 0 : -1) + '" data-tab="' + x[0] + '">' + x[1] + "</button>"; }).join("") + "</div>" +
        '<div id="tp" role="tabpanel" aria-labelledby="tab-' + tab + '">' + tabBody() + "</div></div>";
      if (focusTab) $("#tab-" + tab).focus();
    }
    draw();
    function onClick(e) {
      var t = e.target.closest("[data-tab]");
      if (t) { tab = t.getAttribute("data-tab"); history.replaceState(null, "", u("/account" + (tab === "orders" ? "" : "?tab=" + tab))); draw(true); return; }
      if (e.target.closest("#logout")) { store.user.remove(); S.toast("Logged out"); draw(); $("#view h1").focus(); return; }
      if (e.target.closest("[data-relogin]")) { $("#loginBox").innerHTML = loginHTML(1); $("#lMob").focus(); }
    }
    function onKey(e) {
      var t = e.target.closest("[role=tab]"); if (!t || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
      var tabs = $$("[role=tab]"), i = tabs.indexOf(t) + (e.key === "ArrowRight" ? 1 : -1);
      tab = tabs[(i + tabs.length) % tabs.length].getAttribute("data-tab"); draw(true);
    }
    function onSubmit(e) {
      if (e.target.id === "loginForm") { e.preventDefault(); var m = $("#lMob").value; if (!S.validMobile(m)) { $("#loginBox").innerHTML = loginHTML(1, "Enter a 10-digit mobile number starting with 6, 7, 8 or 9."); $("#lMob").focus(); return; } otpFor = digits(m); $("#loginBox").innerHTML = loginHTML(2); $("#otp").focus(); S.announce("Code sent (sample). Enter any 6 digits."); }
      if (e.target.id === "otpForm") { e.preventDefault(); var c = $("#otp").value.trim(); if (!/^\d{6}$/.test(c)) { $("#loginBox").innerHTML = loginHTML(2, "Enter all 6 digits of the code. In this sample any 6 digits work."); $("#otp").focus(); return; } store.user.set({ mobile: otpFor }); S.toast("Logged in (sample)"); draw(); $("#view h1").focus(); }
    }
    view.addEventListener("click", onClick); view.addEventListener("keydown", onKey); view.addEventListener("submit", onSubmit);
    onCleanup(function () { view.removeEventListener("click", onClick); view.removeEventListener("keydown", onKey); view.removeEventListener("submit", onSubmit); });
  }

  // ---------- owner's dashboard ----------
  function vAdmin() {
    setTitle("Owner's dashboard (sample)");
    var now = Date.now();
    var orders = myOrders().map(function (o) { return { no: o.no, name: o.name, city: o.addr.city, created: o.created, status: STATUS[stageOf(o)], pay: o.pay, total: o.totals.total, items: o.items, addr: o.addr, mobile: o.mobile, mine: true }; })
      .concat(SEEDS.map(function (o) { return { no: o.no, name: o.name, city: o.addr.city, created: o.created, status: STATUS[o.stage], pay: o.pay, total: o.totals.total, items: o.items, addr: o.addr, mobile: o.mobile }; }))
      .concat(D.ADMIN_ORDERS.map(function (a) { var items = snapItems(a[6]); return { no: a[0], name: a[1], city: a[2], created: now - a[3] * 36e5, status: a[4], pay: a[5], total: quickTotals(items, a[5]).total, items: items, addr: { city: a[2], state: "", pin: "", house: "", street: "" }, mobile: "" }; }))
      .sort(function (a, b) { return b.created - a.created; });
    var today = orders.filter(function (o) { return o.created >= now - DAY && o.status !== "Returned"; });
    var sales = today.reduce(function (a, o) { return a + o.total; }, 0), aov = today.length ? Math.round(sales / today.length) : 0;
    var prepaid = today.filter(function (o) { return o.pay !== "cod"; }).length, prePct = today.length ? Math.round(prepaid / today.length * 100) : 0;
    var days = D.SALES_7.concat([sales]), maxV = Math.max.apply(null, days), labels = days.map(function (_, i) { var d = addDays(i - 6); return i === 6 ? "Today" : d.toLocaleDateString("en-IN", { weekday: "short" }); });
    var W = 640, H = 240, pad = 30, bw = (W - pad * 2) / 7;
    var chart = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-labelledby="chT chD"><title id="chT">Sales in the last 7 days</title><desc id="chD">' + days.map(function (v, i) { return labels[i] + ": " + money(v); }).join(", ") + "</desc>" +
      '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + (H - 30) + '" y2="' + (H - 30) + '" stroke="#CFC5B8"/>' +
      days.map(function (v, i) { var h = Math.max(2, (v / maxV) * (H - 70)), x = pad + i * bw + bw * .18, y = H - 30 - h; return '<rect x="' + x + '" y="' + y + '" width="' + bw * .64 + '" height="' + h + '" rx="6" fill="' + (i === 6 ? "#B5532D" : "#2B3A67") + '"/>' +
        '<text x="' + (x + bw * .32) + '" y="' + (y - 7) + '" text-anchor="middle" font-size="12" font-weight="700" fill="#1F1B18" class="notranslate">' + (v >= 1000 ? "₹" + (v / 1000).toFixed(1) + "k" : money(v)) + "</text>" +
        '<text x="' + (x + bw * .32) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="12" fill="#5E554D">' + labels[i] + "</text>"; }).join("") + "</svg>";
    var low = []; D.PRODUCTS.forEach(function (p) { p.variants.forEach(function (v) { if (v.stock > 0 && v.stock <= 3) low.push([p, v]); }); });
    var outN = 0; D.PRODUCTS.forEach(function (p) { p.variants.forEach(function (v) { if (!v.stock) outN++; }); });
    var filt = "All", STS = ["All", "New", "Packed", "Shipped", "Delivered", "Returned"];
    function payTag(p) { return p === "cod" ? "COD" : "Prepaid"; }
    function ordersHTML() {
      var list = orders.filter(function (o) { return filt === "All" || o.status === filt; });
      if (!list.length) return '<p class="muted">No ' + filt.toLowerCase() + " orders right now.</p>";
      return '<table class="otable"><caption class="sr">Orders, newest first</caption><thead><tr><th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Items</th><th scope="col">Total</th><th scope="col">Payment</th><th scope="col">Status</th></tr></thead><tbody>' +
        list.map(function (o) { return '<tr class="click" data-ord="' + o.no + '"><td><button type="button" data-ord="' + o.no + '" class="notranslate">' + o.no + "</button>" + (o.mine ? ' <span class="sample-tag">Yours</span>' : "") + '<br><span class="small muted">' + fDT(o.created) + "</span></td><td>" + esc(o.name) + '<br><span class="small muted">' + esc(o.city) + "</span></td><td>" + o.items.reduce(function (a, l) { return a + l.qty; }, 0) + "</td><td>" + M(o.total) + "</td><td>" + payTag(o.pay) + '</td><td><span class="st st--' + o.status + '">' + o.status + "</span></td></tr>"; }).join("") + "</tbody></table>" +
        '<div class="ocards">' + list.map(function (o) { return '<button type="button" class="ocard" data-ord="' + o.no + '"><b class="notranslate">' + o.no + (o.mine ? " (yours)" : "") + '</b><span class="st st--' + o.status + '">' + o.status + '</span><span class="small muted">' + esc(o.name) + ", " + esc(o.city) + " &middot; " + payTag(o.pay) + "</span><b>" + M(o.total) + "</b></button>"; }).join("") + "</div>";
    }
    view.innerHTML = '<div class="admin-head"><div class="wrap"><span class="sample-tag">Owner\'s view (sample)</span><h1>Mati Kotha Crafts: your shop today</h1><p style="margin-top:.4rem">Orders, payments, stock and reminders run on their own. You just pack and ship.</p></div></div>' +
      '<div class="wrap" style="padding-bottom:3rem"><div class="kpis">' +
      '<div class="kpi"><span>Today\'s sales</span><b class="notranslate">' + money(sales) + "</b>" + (sales > D.SALES_7[5] ? "<small>Up from yesterday (" + money(D.SALES_7[5]) + ")</small>" : '<small class="flat">Yesterday: ' + money(D.SALES_7[5]) + "</small>") + "</div>" +
      '<div class="kpi"><span>Orders today</span><b>' + today.length + "</b><small>" + today.filter(function (o) { return o.status === "New"; }).length + " waiting to be packed</small></div>" +
      '<div class="kpi"><span>Average order value</span><b class="notranslate">' + money(aov) + '</b><small style="color:var(--muted)">Across today\'s orders</small></div>' +
      '<div class="kpi"><span>Prepaid vs COD</span><b>' + prePct + "% / " + (100 - prePct) + '%</b><small style="color:var(--muted)">' + prepaid + " prepaid, " + (today.length - prepaid) + " COD</small></div></div>" +
      '<div class="agrid"><div class="box chart"><h2>Sales, last 7 days</h2>' + chart + "</div>" +
      '<div class="box"><h2>Low stock alerts</h2><ul class="alist">' + low.map(function (x) { return '<li><a href="' + u("/products/" + x[0].slug) + '">' + esc(x[0].name) + (vLabel(x[1]) && x[0].variants.length > 1 ? " (" + esc(vLabel(x[1])) + ")" : "") + '</a><span class="st st--Packed">' + x[1].stock + " left</span></li>"; }).join("") + '</ul><p class="small muted" style="margin-top:.5rem">' + outN + " options are sold out and hidden from “in stock” filters automatically.</p></div></div>" +
      '<div class="box" style="margin-top:1rem"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:.75rem;align-items:center;margin-bottom:.75rem"><h2 style="margin:0">Orders</h2><div class="rfilters" role="group" aria-label="Filter orders by status" style="margin:0">' +
      STS.map(function (s) { var n = s === "All" ? orders.length : orders.filter(function (o) { return o.status === s; }).length; return '<button type="button" class="chip" data-sf="' + s + '" aria-pressed="' + (s === filt) + '">' + s + " (" + n + ")</button>"; }).join("") + '</div></div><div id="olist">' + ordersHTML() + "</div></div>" +
      '<div class="agrid"><div class="box"><h2>Abandoned carts</h2><p class="small muted">People who added items but did not pay. One tap sends a friendly reminder.</p><ul class="alist">' +
      D.ABANDONED.map(function (a, i) { return "<li><span><b>" + esc(a.name) + '</b> <span class="small muted notranslate">' + a.mobile + "</span><br><span class=\"small\">" + esc(a.items) + " &middot; " + M(a.value) + " &middot; " + a.ago + '</span></span><button type="button" class="btn btn--line btn--sm" data-remind="' + i + '">' + I.wa.replace("<svg", '<svg style="color:#1E8E4E"') + "Send WhatsApp reminder</button></li>"; }).join("") + "</ul></div>" +
      '<div class="box"><h2>Top products this month</h2><ul class="alist">' + D.TOP_MONTH.map(function (x) { var p = P[x[0]]; return '<li><span style="display:flex;gap:.6rem;align-items:center">' + img(defV(p).img, "", "40px", ' style="width:40px;height:40px;border-radius:8px"') + '<a href="' + u("/products/" + p.slug) + '">' + esc(p.name) + "</a></span><b>" + x[1] + " sold</b></li>"; }).join("") + "</ul></div></div></div>";
    function onClick(e) {
      var b = e.target.closest("[data-sf]");
      if (b) { filt = b.getAttribute("data-sf"); $$("[data-sf]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); $("#olist").innerHTML = ordersHTML(); S.announce("Showing " + filt.toLowerCase() + " orders"); return; }
      var rm = e.target.closest("[data-remind]");
      if (rm) { rm.disabled = true; rm.innerHTML = I.check + "Reminder sent (sample)"; S.toast("Reminder sent (sample)"); return; }
      var o = e.target.closest("[data-ord]");
      if (o) {
        var ord = orders.filter(function (x) { return x.no === o.getAttribute("data-ord"); })[0]; if (!ord) return;
        openSheet($("#detailSheet"), '<div class="sheet__head"><h2 id="detailTitle">Order <span class="notranslate">' + ord.no + '</span></h2><button class="icon-btn" type="button" data-close-sheet aria-label="Close order details">' + I.x + '</button></div><div class="sheet__body">' +
          '<p><span class="st st--' + ord.status + '">' + ord.status + "</span> &middot; " + fDT(ord.created) + "</p><h3 style=\"margin-top:1rem\">Customer</h3><p>" + esc(ord.name) + "<br>" + esc(ord.city) + (ord.addr.pin ? ' <span class="notranslate">' + esc(ord.addr.pin) + "</span>" : "") + (ord.mobile ? '<br><span class="notranslate">' + fmtMobile(ord.mobile) + "</span>" : "") + "</p>" +
          '<h3 style="margin-top:1rem">Items</h3>' + itemsHTML(ord) + '<div class="sum" style="margin-top:.75rem"><div class="tot"><span>Total</span><span>' + M(ord.total) + "</span></div><div><span>Payment</span><span>" + payName(ord.pay) + "</span></div></div>" +
          '<div style="display:grid;gap:.5rem;margin-top:1.25rem"><button type="button" class="btn btn--terra" data-fake="Packing slip printed (sample)">Print packing slip</button><button type="button" class="btn btn--line" data-fake="WhatsApp update sent (sample)">Send WhatsApp update</button></div><p class="small muted" style="margin-top:.75rem">In the real dashboard, the courier booking and the customer messages happen on their own when you mark an order as packed.</p></div>', "[data-close-sheet]");
      }
    }
    function sheetClick(e) { var f = e.target.closest("[data-fake]"); if (f) { S.toast(f.getAttribute("data-fake")); f.disabled = true; } }
    view.addEventListener("click", onClick); $("#detailSheet").addEventListener("click", sheetClick);
    onCleanup(function () { view.removeEventListener("click", onClick); $("#detailSheet").removeEventListener("click", sheetClick); });
  }

  // ---------- policies and 404 ----------
  function vPolicy(r) {
    var pol = D.POLICIES[r.key]; if (!pol) return v404();
    setTitle(pol.title);
    view.innerHTML = '<div class="wrap"><ol class="crumbs"><li><a href="' + u() + '">Home</a></li><li aria-current="page">' + esc(pol.title) + '</li></ol><div class="prose"><div class="page-h"><span class="sample-tag">Sample policy</span><h1 style="margin-top:.6rem">' + esc(pol.title) + '</h1><p class="muted" style="margin-top:.4rem">A short example of what a real store would say. Mati Kotha Crafts is a sample business.</p></div>' +
      pol.body.map(function (b) { return "<h2>" + esc(b[0]) + "</h2><p>" + esc(b[1]).replace(/₹[\d,]+/g, function (m) { return '<span class="notranslate">' + m + "</span>"; }) + "</p>"; }).join("") +
      '<p style="margin-top:2rem" class="chips">' + Object.keys(D.POLICIES).filter(function (k) { return k !== r.key; }).map(function (k) { return '<a class="chip" href="' + u("/policies/" + k) + '">' + esc(D.POLICIES[k].title) + "</a>"; }).join("") + "</p></div></div>";
  }
  function v404() {
    setTitle("Page not found");
    view.innerHTML = '<div class="wrap" style="padding-block:2rem 3rem"><div class="empty">' + I.box + '<h1 style="font-size:1.8rem">This page is not on our shelves</h1><p>The link may be old, or the piece has moved. Try one of these instead.</p><a class="btn btn--terra" href="' + u("/shop") + '">Shop all crafts</a><div class="chips">' +
      D.CRAFTS.map(function (c) { return '<a class="chip" href="' + u("/shop/" + c.id) + '">' + esc(c.name) + "</a>"; }).join("") + '<a class="chip" href="' + u("/track") + '">Track an order</a></div></div></div>';
  }

  // ---------- start ----------
  function nearTop() { document.body.classList.toggle("near-top", window.scrollY < 480); }
  window.addEventListener("scroll", nearTop, { passive: true });
  nearTop();
  window.addEventListener("resize", function () {
    var bar = $(".cartpage") && $(".sticky-buy", view); if (bar) { var mob = window.innerWidth < 960; bar.style.display = mob ? "flex" : "none"; document.body.classList.toggle("has-bar", mob); }
  });
  window.addEventListener("storage", function (e) { if (e.key && e.key.indexOf("nxshop:mk:") === 0) badges(); });
  render();
})();
