/* Kolom Khata Stationers, sample store: router, views, cart, quotes.
 * Runs only in the browser. Nothing is sent to any server: carts, orders,
 * quotes, designs and saved details live in this browser's storage
 * (NxShop.store). The only thing that leaves is a WhatsApp link the visitor
 * taps. The design studio lives in design.js and loads only on /design/*.
 */
(function () {
  "use strict";
  var S = window.NxShop, D = window.KK;
  if (!S || !D) return;

  var BASE = "/demo/stationery-store", IMG = BASE + "/images/";
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
  function hash(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function addDays(n, from) { var d = new Date(from || Date.now()); d.setDate(d.getDate() + n); return d; }
  function fDate(d) { return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }); }
  function fDT(t) { return new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); }
  function digits(s) { return S.digits(s).replace(/^91(?=\d{10}$)/, ""); }
  function fmtMobile(s) { var d = digits(s); return d.length === 10 ? "+91 " + d.slice(0, 5) + " " + d.slice(5) : s; }
  function validGstin(s) { return /^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(String(s || "").trim().toUpperCase()); }
  function img(key, alt, sizes, extra) {
    return '<img src="' + IMG + key + '-400.webp" srcset="' + IMG + key + "-400.webp 400w, " + IMG + key + '-800.webp 800w" sizes="' + (sizes || "(min-width: 1000px) 300px, (min-width: 640px) 45vw, 108px") +
      '" width="400" height="400" loading="lazy" decoding="async" alt="' + esc(alt || "") + '"' + (extra || "") + ">";
  }
  function thumbImg(src, alt, size) { return '<img src="' + esc(src) + '" width="' + size + '" height="' + size + '" alt="' + esc(alt || "") + '" loading="lazy" decoding="async">'; }
  var I = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8Z"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2.5l2.2 11h10.6L20.5 7H7"/><circle cx="9.5" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/></svg>',
    brushPen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 4.5l5 5L9 20H4v-5z"/><path d="M12.5 6.5l5 5"/></svg>',
    quote: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4M10 12h6M10 16h6"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.2 1.3-1.9 1.4-.5.1-1.1.2-3.2-.7-2.7-1.1-4.4-3.9-4.5-4-.1-.2-1.1-1.4-1.1-2.7s.7-1.9 1-2.2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5s.8 2 .9 2.1c.1.2.1.3 0 .5s-.2.4-.3.5l-.4.5c-.1.1-.3.3-.1.6s.6 1.1 1.4 1.8c1 .9 1.8 1.1 2.1 1.3.3.1.4.1.6-.1s.7-.8.9-1.1c.2-.3.4-.2.6-.1s1.6.8 1.8.9c.3.1.4.2.5.3.1.2.1.7-.1 1.3Z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>',
    since: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21V9l8-5 8 5v12"/><path d="M9 21v-6h6v6M4 21h16"/></svg>',
    bill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
    cat: {
      file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
      pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 4l5 5L9 20H4v-5z"/><path d="M13 6l5 5"/></svg>',
      brush: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 4L10 14"/><path d="M10 14c-3 0-5 2-5 5-1 0-2-.4-2-.4S4 21 7 21c3.3 0 5-2 5-5z"/></svg>',
      blocks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/><rect x="8" y="3" width="8" height="8" rx="1"/></svg>',
      cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/></svg>',
      gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13M12 8c-2-4-6-4-6-1.5S10 8 12 8zm0 0c2-4 6-4 6-1.5S14 8 12 8z"/></svg>',
      trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6v4H9z"/></svg>',
      bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z"/><path d="M9 8V6a3 3 0 0 1 6 0v2M8 14h8v4H8z"/></svg>',
      cap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15a8 8 0 0 1 16 0z"/><path d="M12 7V5M4 15h-1c0 2 4 3 9 3s9-1 9-3"/></svg>',
      calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M7 14h2M11 14h2M15 14h2M7 17h2M11 17h2"/></svg>',
      all: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>'
    }
  };

  // ---------- catalogue and prices ----------
  var P = {}; D.PRODUCTS.forEach(function (p) { P[p.slug] = p; });
  var C = {}; D.CATS.forEach(function (c) { C[c.id] = c; });
  var B = {}; D.BUYERS.forEach(function (b) { B[b.id] = b; });
  function vOf(p, vid) { for (var i = 0; i < p.variants.length; i++) if (p.variants[i].id === vid) return p.variants[i]; return null; }
  function stockOf(p) { return p.variants.reduce(function (a, v) { return a + v.stock; }, 0); }
  function defV(p) { return p.variants.filter(function (v) { return v.stock > 0; })[0] || p.variants[0]; }
  function cheapest(p) { return p.variants.slice().sort(function (a, b) { return a.price - b.price; })[0]; }
  /** Price per unit for a quantity: shop price, wholesale from wq, bulk from bq. */
  function tierOf(p, v, qty) {
    if (p.bq && v.bp && qty >= p.bq) return { k: "bulk", name: "Bulk price", price: v.bp };
    if (qty >= p.wq) return { k: "whole", name: "Wholesale price", price: v.wp };
    return { k: "retail", name: "Shop price", price: v.price };
  }
  function bestOf(p, v) { return p.bq && v.bp ? v.bp : v.wp; }
  function unitWord(p, n) {
    var un = p.unit.replace(/\s*\(.*\)/, ""), sp = un.indexOf(" "), w = sp < 0 ? un : un.slice(0, sp), rest = sp < 0 ? "" : un.slice(sp);
    if (n !== 1) w = w === "pc" ? "pcs" : /(x|s|ch)$/.test(w) ? w + "es" : w + "s";
    return w + rest;
  }
  function qtyText(p, n) { return n + " " + unitWord(p, n); }
  function perText(p) { return p.unit === "pc" ? "each" : "per " + p.unit.replace(/\s*\(.*\)/, ""); }
  /** Snap a typed quantity to the product's steps, never below min. */
  function snap(p, q, min, max) {
    q = parseInt(q, 10); min = min || p.min;
    if (isNaN(q) || q < min) return min;
    q = min + Math.ceil((q - min) / p.step) * p.step;
    if (max && q > max) q = Math.max(min, min + Math.floor((max - min) / p.step) * p.step);
    return q;
  }
  function methodOf(p, id) { return p.pr.methods.filter(function (m) { return m.id === id; })[0] || p.pr.methods[0]; }
  /** Print charges on a custom line: per unit rate (extra sides at half rate) and one-time setup. */
  function printOf(p, d, qty) {
    if (!d) return null;
    var m = methodOf(p, d.method), sides = Math.max(1, (d.sides || []).length);
    var rate = qty >= p.wq ? m.rate[1] : m.rate[0];
    rate = Math.round(rate * (1 + 0.5 * (sides - 1)));
    return { m: m, rate: rate, setup: m.setup, name: D.METHODS[m.id].name, short: D.METHODS[m.id].short, min: m.min };
  }
  function lineMin(p, d) { if (!d) return p.min; var m = methodOf(p, d.method); return snap(p, Math.max(p.min, m.min), p.min); }
  function customText(d) { if (!d) return ""; return "Custom: " + D.METHODS[d.method].name.replace(/^[A-Z]/, function (c) { return c.toLowerCase(); }) + ", " + (d.sides && d.sides.length ? d.sides.join(" + ") : "front") + (d.names ? " (" + plural(d.names, "name", "names") + ")" : ""); }
  function starRow(r) { var full = Math.round(r), s = ""; for (var i = 1; i <= 5; i++) s += '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:15px;height:15px;fill:' + (i <= full ? "#B7790B" : "#D9D1C2") + '"><path d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8Z"/></svg>'; return '<span class="stars" role="img" aria-label="' + r + ' out of 5 stars">' + s + "</span>"; }

  // ---------- storage ----------
  var store = {
    cart: S.store("kk:cart"), orders: S.store("kk:orders"), recent: S.store("kk:recent"), pin: S.store("kk:pin"), details: S.store("kk:details"),
    coupon: S.store("kk:coupon"), user: S.store("kk:user"), quote: S.store("kk:quote"), quotes: S.store("kk:quotes"), designs: S.store("kk:designs"), quoteForm: S.store("kk:quoteform")
  };
  function cart() { return (store.cart.get([]) || []).filter(function (l) { return P[l.slug] && vOf(P[l.slug], l.vid); }); }
  function setCart(c) { store.cart.set(c); badges(); }
  function myOrders() { return store.orders.get([]) || []; }
  function quoteList() { return (store.quote.get([]) || []).filter(function (l) { return P[l.slug] && vOf(P[l.slug], l.vid); }); }
  function myQuotes() { return store.quotes.get([]) || []; }
  function designs() { return store.designs.get([]) || []; }
  function designById(id) { return designs().filter(function (d) { return d.id === id; })[0] || memDesigns[id] || null; }
  var memDesigns = {};
  /** True when localStorage really holds the key (private mode or a full quota fall back to memory). */
  function persisted(key) { try { return window.localStorage.getItem("nxshop:" + key) !== null; } catch (e) { return false; } }
  function lineKey(l) { return l.slug + "|" + l.vid + "|" + (l.d ? l.d.id : "") + "|" + (l.note ? hash(l.note) : ""); }

  // ---------- stock left in this browser ----------
  // Sample orders placed here reduce stock: data.js holds the opening stock,
  // kk:sold counts what this browser has "sold" per variant.
  var soldStore = S.store("kk:sold");
  D.PRODUCTS.forEach(function (p) { p.variants.forEach(function (v) { v.stock0 = v.stock; }); });
  function applySold() { var sold = soldStore.get({}) || {}; D.PRODUCTS.forEach(function (p) { p.variants.forEach(function (v) { v.stock = Math.max(0, v.stock0 - (sold[p.slug + "|" + v.id] || 0)); }); }); }
  applySold();
  function recordSold(items) { var sold = soldStore.get({}) || {}; items.forEach(function (l) { var k = l.slug + "|" + l.vid; sold[k] = (sold[k] || 0) + l.qty; }); soldStore.set(sold); applySold(); }
  function n0(n) { return Number(n).toLocaleString("en-IN"); }
  function lowAt(p) { return D.DELIVERY.lowAt(p); }
  /** Short stock text for a variant: [text, kind] kind = ok | low | out. */
  function stockText(p, v) {
    if (v.stock <= 0) return ["Out of stock · Back in stock soon", "out"];
    if (v.stock <= lowAt(p)) return ["Only " + n0(v.stock) + " left", "low"];
    return [n0(v.stock) + " " + unitWord(p, v.stock) + " in stock", "ok"];
  }
  function cardStock(p) {
    var tot = stockOf(p), anyLow = p.variants.some(function (v) { return v.stock > 0 && v.stock <= lowAt(p); });
    if (!tot) return ['<span class="pc__stock is-out">Out of stock</span>', "out"];
    if (p.variants.length > 1 && anyLow && p.variants.some(function (v) { return v.stock > lowAt(p); })) return ['<span class="pc__stock is-low">Low stock in some options</span>', "low"];
    if (tot <= lowAt(p)) return ['<span class="pc__stock is-low">Only <span class="notranslate">' + n0(tot) + "</span> left</span>", "low"];
    return ['<span class="pc__stock"><span class="notranslate">' + n0(tot) + "</span> in stock</span>", "ok"];
  }

  // ---------- ratings from the reviews ----------
  var myRevStore = S.store("kk:myreviews"), helpStore = S.store("kk:helpful"), replyStore = S.store("kk:replies");
  function myReviews() { return myRevStore.get([]) || []; }
  /** Public reviews for a product: seeded ones plus the visitor's approved ones. */
  function reviewsOf(p, withPending) {
    var mine = myReviews().filter(function (r) { return r.slug === p.slug && (r.status === "Approved" || (withPending && r.status === "Pending")); });
    return mine.concat(D.REVIEWS[p.slug] || []);
  }
  function ratingOf(p) { var rs = reviewsOf(p); if (!rs.length) return { avg: 0, n: 0 }; var s = rs.reduce(function (a, r) { return a + r.stars; }, 0); return { avg: Math.round(s / rs.length * 10) / 10, n: rs.length }; }
  var STAR1 = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8Z"/></svg>';
  function rateHTML(p) { var r = ratingOf(p); return r.n ? '<span class="rate">' + STAR1 + '<b class="notranslate">' + r.avg.toFixed(1) + '</b><span class="notranslate">(' + r.n + ')</span><span class="sr"> out of 5 from ' + r.n + " reviews</span></span>" : ""; }

  // ---------- delivery dates ----------
  function nowD() { return new Date(); }
  function ymd(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function working(d) { return d.getDay() !== 0 && D.DELIVERY.holidays.indexOf(ymd(d)) < 0; }
  function addWorking(d, n) { var x = new Date(d); x.setHours(12, 0, 0, 0); while (!working(x)) x.setDate(x.getDate() + 1); for (var i = 0; i < n; i++) { x.setDate(x.getDate() + 1); while (!working(x)) x.setDate(x.getDate() + 1); } return x; }
  function zoneOf(dv) { var p3 = dv.pin.slice(0, 3); if (dv.zone === "kolkata") return "kolkata"; if (D.DELIVERY.northPins.indexOf(p3) > -1) return "north"; if (dv.zone === "wb") return "wb"; if (D.DELIVERY.metroPins.indexOf(p3) > -1) return "metro"; return "india"; }
  /**
   * The one delivery estimate used everywhere: cards, product page, studio,
   * cart, quote list, checkout and the order confirmation.
   * o: { p, v, qty, method (print method id or ""), pin, now }
   */
  function eta(o) {
    var R = D.DELIVERY, p = o.p, v = o.v, now = o.now || nowD();
    if (v && v.stock <= 0) return null;
    var pin = o.pin || store.pin.get("") || "", dv = delivery(pin), assumed = !dv;
    if (!dv) dv = delivery("700009");
    var z = zoneOf(dv), base = R.zones[z].slice();
    if (dv.remote) { base[0] += R.remoteExtra[0]; base[1] += R.remoteExtra[1]; }
    var notes = [], extra = 0;
    var todayOk = working(now) && now.getHours() < R.cutoff;
    var start = todayOk ? new Date(now) : addWorking(new Date(now.getTime() + DAY), 0);
    if (!todayOk && working(now)) start = addWorking(now, 1);
    if (v && v.stock <= lowAt(p)) { extra += R.lowStockExtra; notes.push("Low stock is counted by hand: 1 extra day"); }
    if (o.qty && o.qty >= p.wq * 5 && p.wq > 1) { extra += R.bigOrderExtra; notes.push("Large quantity: packing takes 1 more day"); }
    var prod = 0;
    if (p.pr.months && o.method) prod = R.calendarProduction;
    else if (o.method) prod = R.production[o.method] || 1;
    if (prod) notes.push((o.method === "laser" ? "Engraving" : o.method === "embroidery" ? "Embroidery" : "Printing") + " takes " + plural(prod, "working day", "working days"));
    var dispatch = addWorking(start, extra + prod);
    var from = addWorking(dispatch, base[0]), to = addWorking(dispatch, base[1]);
    var ex = R.express[z] && !dv.remote ? [addWorking(dispatch, R.express[z][0]), addWorking(dispatch, R.express[z][1])] : null;
    var cut = null;
    if (todayOk && !extra && !prod) { var c = new Date(now); c.setHours(R.cutoff, 0, 0, 0); cut = c - now; }
    return { from: from, to: to, dispatch: dispatch, express: ex, notes: notes, cutMs: cut, dv: dv, assumed: assumed, zone: z };
  }
  function etaShort(e) { if (!e) return "Back in stock soon"; return "Delivery by " + fDate(e.to); }
  function cutText(ms) { var m = Math.max(1, Math.round(ms / 60000)), h = Math.floor(m / 60); return "Order within " + (h ? h + " h " : "") + (m % 60) + " min for dispatch today"; }

  // ---------- delivery rules ----------
  /** Zone, fee, COD and days for a PIN. Kolkata PINs start 700; West Bengal 70 to 74. */
  function delivery(pin) {
    pin = String(pin || "").trim();
    if (!S.validPin(pin)) return null;
    var p2 = +pin.slice(0, 2), p3 = pin.slice(0, 3), remote = /^(18|19|79)/.test(pin) || p3 === "744" || p3 === "194";
    var zone = p3 === "700" ? "kolkata" : p2 >= 70 && p2 <= 74 ? "wb" : "india";
    var place = D.PINS[p3];
    var days = zone === "kolkata" ? [1, 2] : zone === "wb" ? [2, 4] : [4, 7];
    if (remote) days = [days[0] + 2, days[1] + 4];
    return { pin: pin, zone: zone, remote: remote, fee: STORE.ship[zone === "kolkata" ? "kolkata" : zone === "wb" ? "wb" : "india"], min: days[0], max: days[1],
      city: place ? place[0] : "", state: place ? place[1] : "", zoneName: zone === "kolkata" ? "Kolkata" : zone === "wb" ? "West Bengal" : "rest of India" };
  }
  /** Delivery charge for an order value. transport = big order outside West Bengal, charge confirmed later. */
  function shipFor(dv, after, freeShip) {
    if (!dv) return { fee: null };
    if (freeShip) return { fee: 0, why: "coupon" };
    if (dv.zone === "india" && after >= STORE.ship.bigAt) return { fee: 0, transport: true };
    if (after >= STORE.ship.freeAt) return { fee: 0, why: "free" };
    return { fee: dv.fee };
  }
  function codAllowed(dv, total) { if (!dv) return true; if (dv.remote) return false; return dv.zone !== "india" || total <= STORE.codMaxOutside; }

  // ---------- totals and coupons ----------
  function lineCalc(l) {
    var p = P[l.slug], v = vOf(p, l.vid), t = tierOf(p, v, l.qty), pr = printOf(p, l.d, l.qty);
    var unit = t.price + (pr ? pr.rate : 0), total = unit * l.qty + (pr ? pr.setup : 0);
    return { l: l, p: p, v: v, key: lineKey(l), qty: l.qty, tier: t, print: pr, unit: unit, total: total, save: (v.price - t.price) * l.qty, min: lineMin(p, l.d), e: eta({ p: p, v: v, qty: l.qty, method: l.d ? l.d.method : l.note ? "laser" : "" }) };
  }
  function lines() { return cart().map(lineCalc); }
  var cpnOff = S.store("kk:couponoff");
  function inScope(c, l) { var s = c.scope; if (!s || s === "all") return true; if (s === "custom") return !!l.l.d; if (s === "kolkata") return !!l.p.kolkata; if (s.cats) return s.cats.indexOf(l.p.cat) > -1; if (s.slugs) return s.slugs.indexOf(l.p.slug) > -1; return false; }
  /** The one coupon check used by the product page, quick view, cart and checkout. ls: line calcs. */
  function couponEval(c, ls) {
    if ((cpnOff.get([]) || []).indexOf(c.code) > -1) return { ok: false, c: c, code: c.code, msg: c.code + " is switched off at the moment." };
    if (c.firstOnly && myOrders().length) return { ok: false, c: c, code: c.code, msg: c.code + " is for a first order only, and this device already has a sample order." };
    if (c.till && new Date(c.till + "T23:59:59") < new Date()) return { ok: false, c: c, code: c.code, msg: c.code + " has expired." };
    var inl = ls.filter(function (l) { return inScope(c, l); }), base = inl.reduce(function (a, l) { return a + l.total; }, 0);
    if (!inl.length) return { ok: false, c: c, code: c.code, short: c.min, msg: c.code + " works on " + (c.where || "other items") + ". Add one to use it." };
    if (base < c.min) return { ok: false, c: c, code: c.code, short: c.min - base, msg: "Add " + money(c.min - base) + " more" + (c.where ? " of " + c.where : "") + " to use " + c.code + "." };
    var disc = c.type === "percent" ? Math.min(c.cap || 1e9, Math.round(base * c.value / 100)) : c.type === "flat" ? c.value : c.type === "setup" ? (inl.map(function (l) { return l.print ? l.print.setup : 0; }).sort(function (a, b) { return b - a; })[0] || 0) : 0;
    return { ok: true, c: c, code: c.code, disc: disc, msg: c.label + (disc ? ": you save " + money(disc) : "") };
  }
  function couponCheck(code, ls) {
    if (!code) return null;
    var c = D.COUPONS.filter(function (x) { return x.code === code; })[0];
    if (!c) return { ok: false, code: code, msg: "That code does not exist. Check the spelling, or try FIRST50." };
    return couponEval(c, Array.isArray(ls) ? ls : lines());
  }
  function bestCoupon(ls) { var best = null; D.COUPONS.forEach(function (c) { var r = couponEval(c, ls); if (r.ok && r.disc && (!best || r.disc > best.disc)) best = r; }); return best; }
  function totals(opt) {
    opt = opt || {};
    var ls = lines(), sub = 0, count = 0, save = 0, setup = 0;
    ls.forEach(function (l) { sub += l.total; count += l.qty; save += l.save; if (l.print) setup += l.print.setup; });
    var cp = couponCheck(store.coupon.get(""), ls), disc = 0, freeShip = false;
    if (cp && cp.ok) { if (cp.c.type === "ship") freeShip = true; else disc = cp.disc; }
    var after = sub - disc, dv = delivery(opt.pin !== undefined ? opt.pin : store.pin.get(""));
    var sh = opt.pickup ? { fee: 0, pickup: true } : shipFor(dv, after, freeShip);
    var total = after + (sh.fee || 0);
    return { lines: ls, count: count, n: ls.length, subtotal: sub, save: save, setup: setup, discount: disc, coupon: cp, freeShip: freeShip, after: after, dv: dv, ship: sh, total: total, gst: Math.round(total * 12 / 112) };
  }

  // ---------- seeded orders ----------
  var NOW0 = Date.now();
  function snapItems(list) {
    return list.map(function (t) {
      var p = P[t[0]], v = vOf(p, t[1]), tr = tierOf(p, v, t[2]);
      return { slug: p.slug, vid: v.id, name: p.name, var: v.label, unit: tr.price, tier: tr.k, retail: v.price, qty: t[2], img: v.img, cat: p.cat, total: tr.price * t[2], uw: unitWord(p, t[2]) };
    });
  }
  function quickTotals(items, pin) {
    var sub = items.reduce(function (a, l) { return a + l.total; }, 0), save = items.reduce(function (a, l) { return a + (l.retail - l.unit) * l.qty; }, 0);
    var sh = shipFor(delivery(pin), sub, false), total = sub + (sh.fee || 0);
    return { subtotal: sub, save: save, discount: 0, ship: sh.fee || 0, transport: !!sh.transport, total: total, gst: Math.round(total * 12 / 112) };
  }
  var SEEDS = D.SEED_ORDERS.map(function (s) {
    var items = snapItems(s.items), created = NOW0 - s.hoursAgo * 36e5;
    return { no: s.no, seed: true, stage: s.stage, created: created, mobile: s.mobile, name: s.name, biz: s.biz, gstin: "", email: "",
      addr: { house: "12B", street: "Sample Road", landmark: "", city: s.city, state: s.state, pin: s.pin },
      items: items, delivery: "ship", pay: s.pay, eta: [created + 2 * DAY, created + 4 * DAY], totals: quickTotals(items, s.pin) };
  });
  function findOrder(no) {
    no = String(no || "").trim().toUpperCase();
    var all = myOrders().concat(SEEDS);
    for (var i = 0; i < all.length; i++) if (all[i].no === no) return all[i];
    return null;
  }
  function stageOf(o) { return o.seed ? o.stage : Math.min(4, Math.floor((Date.now() - o.created) / STEP_MS)); }
  function stepTimes(o) {
    if (o.seed) { var h = [0, 3, 20, 40, 60]; return h.map(function (x) { return o.created + x * 36e5; }); }
    return [0, 1, 2, 3, 4].map(function (i) { return o.created + i * STEP_MS; });
  }
  var STATUS = ["New", "Packed", "Shipped", "Shipped", "Delivered"];

  // ---------- badges ----------
  function badges() {
    var n = cart().length, q = quoteList().length;
    $$("[data-cart-count]").forEach(function (b) { b.textContent = n; b.setAttribute("data-n", n); });
    $$("[data-open-cart]").forEach(function (a) { a.setAttribute("aria-label", "Cart, " + plural(n, "line", "lines")); });
    $$("[data-quote-count]").forEach(function (b) { b.textContent = q; b.setAttribute("data-n", q); });
    var wn = (S.store("kk:wish").get([]) || []).length; $$("[data-wish-count]").forEach(function (b) { b.textContent = wn; b.setAttribute("data-n", wn); }); $$("[data-wish-link]").forEach(function (a) { a.setAttribute("aria-label", "Wishlist, " + plural(wn, "item", "items")); });
    $$("[data-quote-link]").forEach(function (a) { a.setAttribute("aria-label", "Quote list, " + plural(q, "item", "items")); });
  }

  // ---------- overlays: sheets and the added drawer ----------
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

  // Photo viewer for product and review photos.
  var zoomEl = $("#zoom"), releaseZoom = null;
  function openZoom(src, alt) {
    zoomEl.innerHTML = '<div class="zoom__bar"><button class="icon-btn" type="button" data-zclose aria-label="Close photo">' + I.x + '</button></div><div class="zoom__img"><img src="' + esc(src) + '" alt="' + esc(alt || "") + '"></div>';
    zoomEl.hidden = false; S.lockScroll(true); releaseZoom = S.trap(zoomEl, closeZoom, "[data-zclose]");
  }
  function closeZoom() { if (!zoomEl || zoomEl.hidden) return; zoomEl.hidden = true; S.lockScroll(false); if (releaseZoom) releaseZoom(); releaseZoom = null; }
  zoomEl.addEventListener("click", function (e) { if (e.target.closest("[data-zclose]") || e.target === zoomEl || e.target.classList.contains("zoom__img")) closeZoom(); });

  var added = $("#added"), releaseAdded = null;
  function openAdded(lc) {
    var t = totals();
    added.innerHTML = '<div class="added__ok" id="addedTitle">' + I.check + "Added to cart</div>" +
      '<div class="added__row">' + (lc.l.d && lc.l.d.thumb ? thumbImg(lc.l.d.thumb, "Your design", 60) : img(lc.v.img, "", "60px")) + "<div><b>" + esc(lc.p.name) + "</b>" + (lc.p.variants.length > 1 ? '<div class="small muted">' + esc(lc.v.label) + "</div>" : "") +
      '<div class="small">' + calcText(lc) + "</div>" + (lc.tier.k !== "retail" ? '<div class="small ok">' + lc.tier.name + " applied</div>" : "") + "</div></div>" +
      '<p class="small muted" style="margin-bottom:.7rem">Cart: ' + plural(t.n, "line", "lines") + ", " + M(t.subtotal) + "</p>" +
      '<div class="added__btns"><button type="button" class="btn btn--ghost" data-close-added>Keep shopping</button><a class="btn btn--blue" href="' + u("/cart") + '">View cart</a></div>';
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
  /** "50 pcs × ₹4 = ₹200", with print charges and setup when the line is custom. */
  function calcText(lc) {
    var q = qtyText(lc.p, lc.qty);
    if (!lc.print) return '<span class="notranslate">' + q + " × " + money(lc.tier.price) + " = " + money(lc.total) + "</span>";
    return '<span class="notranslate">' + q + " × (" + money(lc.tier.price) + " + " + money(lc.print.rate) + " print)" + (lc.print.setup ? " + setup " + money(lc.print.setup) : "") + " = " + money(lc.total) + "</span>";
  }

  // ---------- WhatsApp orders ----------
  var WA_END = "(Sent from the Kolom Khata Stationers sample website by Nexvora)";
  /** One readable block for a product line: name, option, quantity, tier, print. */
  function waLine(p, v, qty, extra) {
    extra = extra || {};
    var t = tierOf(p, v, qty), pr = printOf(p, extra.d, qty), unit = t.price + (pr ? pr.rate : 0), total = unit * qty + (pr ? pr.setup : 0);
    var out = [p.name + (p.variants.length > 1 ? " (" + v.label + ")" : ""), "Quantity: " + qtyText(p, qty)];
    out.push((t.k === "retail" ? "Shop price: " : t.name + " applied: ") + money(t.price) + " " + perText(p) + (pr ? " + " + money(pr.rate) + " print" : ""));
    if (pr && pr.setup) out.push("Print setup (one time): " + money(pr.setup));
    out.push("Line total: " + money(total));
    if (extra.d) out.push(customText(extra.d) + (extra.texts && extra.texts.length ? ". Text: " + extra.texts.join(" / ") : ""));
    if (extra.note) out.push("Text to engrave: " + extra.note);
    if (extra.logo) out.push("I will send the logo/proof image in this chat.");
    return { text: out.join("\n"), total: total };
  }
  function waPin() { var dv = delivery(store.pin.get("")); return dv ? "Delivery PIN: " + dv.pin + (dv.city ? " (" + dv.city + ")" : "") : ""; }
  function waProduct(p, v, qty, extra) {
    var l = waLine(p, v, qty, extra), pin = waPin();
    return "Hello Kolom Khata Stationers, I want to order:\n\n" + l.text + (pin ? "\n" + pin : "") + "\n\n" + WA_END;
  }
  function waCart() {
    var t = totals(), pin = waPin();
    return "Hello Kolom Khata Stationers, I want to order these items:\n\n" + t.lines.map(function (l, i) { return (i + 1) + ". " + waLine(l.p, l.v, l.qty, { d: l.l.d, note: l.l.note, logo: !!l.l.d }).text; }).join("\n\n") +
      "\n\nItems total: " + money(t.subtotal) + (t.save > 0 ? "\nYou saved " + money(t.save) + " with wholesale prices" : "") + (t.discount ? "\nCoupon " + t.coupon.code + ": -" + money(t.discount) : "") + (pin ? "\n" + pin : "") + "\n\n" + WA_END;
  }
  var WA_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.2 1.3-1.9 1.4-.5.1-1.1.2-3.2-.7-2.7-1.1-4.4-3.9-4.5-4-.1-.2-1.1-1.4-1.1-2.7s.7-1.9 1-2.2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5s.8 2 .9 2.1c.1.2.1.3 0 .5s-.2.4-.3.5l-.4.5c-.1.1-.3.3-.1.6s.6 1.1 1.4 1.8c1 .9 1.8 1.1 2.1 1.3.3.1.4.1.6-.1s.7-.8.9-1.1c.2-.3.4-.2.6-.1s1.6.8 1.8.9c.3.1.4.2.5.3.1.2.1.7-.1 1.3Z"/></svg>';
  // Count WhatsApp orders for the owner's dashboard (this device only).
  var waCount = S.store("kk:waorders");
  document.addEventListener("click", function (e) { if (e.target.closest("[data-wa-order]")) waCount.set((waCount.get(0) || 0) + 1); }, true);

  // ---------- cart actions ----------
  /** Add to cart. opts: { d: design summary, note, quiet, replaceKey }. Returns the line calc or null. */
  function addToCart(slug, vid, qty, opts) {
    opts = opts || {};
    var p = P[slug], v = p && vOf(p, vid); if (!p || !v) return null;
    if (v.stock <= 0) { S.toast("Sorry, this option is out of stock", { icon: false }); return null; }
    var c = cart(), nl = { slug: slug, vid: vid, qty: 0 };
    if (opts.d) nl.d = opts.d; if (opts.note) nl.note = opts.note;
    var key = lineKey(nl), min = lineMin(p, nl.d);
    if (opts.replaceKey) c = c.filter(function (l) { return lineKey(l) !== opts.replaceKey; });
    var line = c.filter(function (l) { return lineKey(l) === key; })[0];
    var have = line ? line.qty : 0, want = snap(p, have + qty, min, v.stock);
    if (want > v.stock) { S.toast("Only " + v.stock + " in stock", { icon: false }); return null; }
    if (want === have) { S.toast("You already have all " + v.stock + " in stock in your cart", { icon: false }); return null; }
    var wasTier = line ? tierOf(p, v, have).k : "retail";
    if (line) line.qty = want; else { nl.qty = want; c.push(nl); line = nl; }
    setCart(c);
    var lc = lineCalc(line);
    if (!opts.quiet) {
      var msg = "Added to cart. " + qtyText(p, want) + " in this line.";
      if (lc.tier.k !== wasTier && lc.tier.k !== "retail") msg += " " + lc.tier.name + " applied: " + money(lc.tier.price) + " " + perText(p) + ".";
      S.announce(msg); openAdded(lc);
    }
    return lc;
  }

  // ---------- product card ----------
  function card(p, opt) {
    opt = opt || {};
    var v = defV(p), total = stockOf(p), off = pct(v.price, v.mrp), cs = cardStock(p), e = eta({ p: p, v: v, qty: p.min });
    var hasOffer = D.COUPONS.some(function (c) { return c.scope && c.scope !== "all" && c.scope !== "custom" && (c.scope === "kolkata" ? p.kolkata : c.scope.cats && c.scope.cats.indexOf(p.cat) > -1); });
    var tag = total === 0 ? '<span class="tag tag--out">Out of stock</span>' : p.kolkata ? '<span class="tag tag--kk">Kolkata special</span>' : hasOffer ? '<span class="tag">Offer</span>' : (NOW0 - new Date(p.created).getTime() < 30 * DAY ? '<span class="tag">New</span>' : "");
    var imgTag = img(v.img, p.name, "(min-width: 1100px) 300px, (min-width: 760px) 30vw, 46vw");
    if (opt.eager) imgTag = imgTag.replace('loading="lazy"', 'loading="eager" fetchpriority="high"');
    var act = total === 0 ?
      '<a class="btn btn--ghost" data-wa-order href="' + esc(S.wa("Hello Kolom Khata Stationers, please tell me on WhatsApp when " + p.name + " is back in stock.\n\n" + WA_END)) + '" target="_blank" rel="noopener">Notify me on WhatsApp</a>' :
      '<button class="btn btn--blue" type="button" data-quick="' + p.slug + '" data-q="' + p.min + '">Add' + (p.min > 1 ? " " + p.min : "") + '<span class="sr"> ' + esc(unitWord(p, p.min)) + " of " + esc(p.name) + (p.variants.length > 1 ? ", " + esc(v.label) : "") + " to cart</span></button>" +
      '<a class="btn btn--wa btn--icon" data-wa-order href="' + esc(S.wa(waProduct(p, v, p.min))) + '" target="_blank" rel="noopener" aria-label="Order ' + esc(p.name) + ' on WhatsApp">' + WA_ICON + "</a>";
    return '<article class="pc' + (total === 0 ? " is-out" : "") + '">' +
      '<div class="pc__ph">' + tag + imgTag + heartBtn(p, "pc__heart") + '<button type="button" class="pc__qv" data-qv="' + p.slug + '" aria-label="Quick view of ' + esc(p.name) + '">' + EYE + '<span>Quick view</span></button></div>' +
      '<div class="pc__b"><a class="pc__name" href="' + u("/products/" + p.slug) + '">' + esc(p.name) + "</a>" +
      '<div class="pc__meta">' + rateHTML(p) + (p.min > 1 ? "<span>Min " + p.min + "</span>" : "") + "</div>" +
      '<div class="pp notranslate"><span class="pp__now">' + money(v.price) + '</span><span class="pp__per">' + perText(p) + "</span>" + (off ? "<s><span class=\"sr\">MRP </span>" + money(v.mrp) + '</s><span class="off">' + off + "% off</span>" : "") + "</div>" +
      '<p class="whl">Wholesale <span class="notranslate">' + money(v.wp) + "</span> from " + p.wq + " · " + esc(mkName(p)) + "</p>" +
      '<p class="pc__line">' + cs[0] + (e ? " · " + fDate(e.to) : "") + "</p>" +
      '<div class="pc__act">' + act + "</div>" +
      '<div class="pc__links">' + (p.custom ? '<a href="' + u("/design/" + p.slug) + '">Customise<span class="sr"> ' + esc(p.name) + "</span></a>" : "") + '<button type="button" data-quote="' + p.slug + "|" + v.id + "|" + p.wq * 2 + '">Bulk quote<span class="sr"> for ' + esc(p.name) + "</span></button>" + cmpBtn(p, "") + "</div>" +
      "</div></article>";
  }
  function gridHTML(list, cls) { return '<ul class="grid ' + (cls || "") + '">' + list.map(function (p) { return "<li>" + card(p) + "</li>"; }).join("") + "</ul>"; }
  function stripHTML(list, title, kicker, more) {
    if (!list.length) return "";
    return '<section class="sec"><div class="wrap"><div class="sec-head"><div>' + (kicker ? '<p class="kicker">' + kicker + "</p>" : "") + "<h2>" + title + "</h2></div>" +
      (more ? '<a class="link" href="' + more + '">View all</a>' : "") + '</div><ul class="strip">' + list.map(function (p) { return "<li>" + card(p) + "</li>"; }).join("") + "</ul></div></section>";
  }

  // ---------- category bar, drawer, search ----------
  $("#catbar").innerHTML = '<li><a href="' + u("/shop") + '" data-catlink="">All</a></li>' + D.CATS.map(function (c) { return '<li><a href="' + u("/shop/" + c.id) + '" data-catlink="' + c.id + '">' + esc(c.short) + "</a></li>"; }).join("");
  $("#megaGrid").innerHTML = D.CATS.map(function (c) { return '<a href="' + u("/shop/" + c.id) + '">' + img(c.img, "", "56px") + "<span><b>" + esc(c.name) + "</b><span>" + esc(c.line) + "</span></span></a>"; }).join("");
  $("[data-drawer-cats]").innerHTML = D.CATS.map(function (c) { return '<a href="' + u("/shop/" + c.id) + '">' + img(c.img, "", "40px") + esc(c.name) + "</a>"; }).join("");
  var catAll = $("#catAll"), catMega = $("#catMega");
  function megaOpen(on) { catAll.setAttribute("aria-expanded", on ? "true" : "false"); catMega.hidden = !on; }
  catAll.addEventListener("click", function () { megaOpen(catMega.hidden); if (!catMega.hidden) { var a = catMega.querySelector("a"); if (a) a.focus(); } });
  document.addEventListener("click", function (e) { if (!e.target.closest(".catnav")) megaOpen(false); else if (e.target.closest("#catMega a")) megaOpen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !catMega.hidden) { megaOpen(false); catAll.focus(); } });
  document.addEventListener("focusin", function (e) { if (!e.target.closest(".catnav")) megaOpen(false); });
  var sInput = $("#searchInput"), sRes = $("#searchRes");
  function matches(p, q) {
    var hay = (p.name + " " + C[p.cat].name + " " + p.tags.join(" ") + " " + p.variants.map(function (v) { return v.label; }).join(" ")).toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every(function (w) { return hay.indexOf(w) > -1 || (w.length > 3 && hay.indexOf(w.replace(/s$/, "")) > -1); });
  }
  function renderSearch() {
    var q = sInput.value.trim();
    if (!q) { var rec = recentList([]).slice(0, 4); if (!rec.length) { closeSearch(); return; } sRes.hidden = false; sInput.setAttribute("aria-expanded", "true"); sRes.innerHTML = '<p class="small muted" style="padding:.2rem .4rem">Recently viewed</p>' + rec.map(function (x) { var p = P[x.slug]; return '<a class="sres" href="' + u("/products/" + p.slug) + '">' + img(defV(p).img, "", "44px") + "<span><b>" + esc(p.name) + "</b></span></a>"; }).join(""); return; }
    var res = D.PRODUCTS.filter(function (p) { return matches(p, q); });
    sRes.hidden = false; sInput.setAttribute("aria-expanded", "true");
    if (!res.length) { var rr = recentList([]).slice(0, 3); sRes.innerHTML = '<p class="small" role="status" style="padding:.6rem">No products match “' + esc(q) + '”. Try pen, notebook, medal or cap.</p>' + (rr.length ? '<p class="small muted" style="padding:0 .4rem">Recently viewed</p>' + rr.map(function (x) { var p = P[x.slug]; return '<a class="sres" href="' + u("/products/" + p.slug) + '">' + img(defV(p).img, "", "44px") + "<span><b>" + esc(p.name) + "</b></span></a>"; }).join("") : ""); return; }
    sRes.innerHTML = '<p class="small muted" role="status" style="padding:.2rem .4rem">' + plural(res.length, "product", "products") + "</p>" + res.slice(0, 6).map(function (p) {
      var v = defV(p);
      return '<div class="sresrow"><a class="sres" href="' + u("/products/" + p.slug) + '">' + img(v.img, "", "44px") + "<span><b>" + esc(p.name) + '</b><small><span class="notranslate">' + money(v.price) + "</span> " + perText(p) + " · " + rateHTML(p) + "</small></span></a>" + heartBtn(p, "icon-btn") + "</div>";
    }).join("") + (res.length > 6 ? '<a class="sres" href="' + u("/shop?q=" + encodeURIComponent(q)) + '"><b>See all ' + res.length + " results</b></a>" : "");
  }
  function closeSearch() { sRes.hidden = true; sInput.setAttribute("aria-expanded", "false"); }
  var sT; sInput.addEventListener("input", function () { clearTimeout(sT); sT = setTimeout(renderSearch, 120); });
  sInput.addEventListener("focus", function () { if (sInput.value.trim()) renderSearch(); });
  $("#searchForm").addEventListener("submit", function (e) { e.preventDefault(); var q = sInput.value.trim(); closeSearch(); if (q) navigate(u("/shop?q=" + encodeURIComponent(q))); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sRes.hidden) { closeSearch(); sInput.focus(); } });
  document.addEventListener("click", function (e) { if (!e.target.closest("#searchForm")) closeSearch(); });
  document.addEventListener("focusin", function (e) { if (!e.target.closest("#searchForm")) closeSearch(); });

  // ---------- global clicks ----------
  document.addEventListener("click", function (e) {
    var t = e.target;
    var q = t.closest("[data-quick]");
    if (q) { var p = P[q.getAttribute("data-quick")]; addToCart(p.slug, defV(p).id, +q.getAttribute("data-q") || p.min); return; }
    var qt = t.closest("[data-quote]");
    if (qt) { var x = qt.getAttribute("data-quote").split("|"); openQuote({ slug: x[0], vid: x[1], qty: +x[2] || 0, dtext: x[3] || "" }); return; }
    if (t.closest("[data-quote-cart]")) { openQuote({ fromCart: true }); return; }
    var oc = t.closest("[data-open-cart]");
    if (oc && !e.metaKey && !e.ctrlKey && ["cart", "checkout", "design"].indexOf(route().name) < 0) { e.preventDefault(); openCart(); return; }
    var a = t.closest("a");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var href = a.getAttribute("href") || "";
    if (href.charAt(0) === "#" && href.length > 1) {
      var tg = document.getElementById(href.slice(1));
      if (tg) { e.preventDefault(); tg.scrollIntoView({ behavior: S.reducedMotion() ? "auto" : "smooth" }); var h = tg.matches("h1,h2,main") ? tg : tg.querySelector("h1,h2") || tg; h.setAttribute("tabindex", "-1"); try { h.focus({ preventScroll: true }); } catch (x2) { h.focus(); } }
      return;
    }
    if (a.target === "_blank" || a.hasAttribute("download") || href.indexOf(BASE) !== 0 || href.indexOf(BASE + "/images") === 0 || /\.js$/.test(href)) return;
    e.preventDefault(); navigate(href);
  });

  // ---------- quote list and form ----------
  function addToQuote(item) {
    var p = P[item.slug], v = p && vOf(p, item.vid); if (!p || !v) return;
    var list = store.quote.get([]) || [], k = item.slug + "|" + item.vid + "|" + (item.dtext || "");
    var ex = list.filter(function (l) { return l.slug + "|" + l.vid + "|" + (l.dtext || "") === k; })[0];
    var qty = Math.max(p.min, item.qty || p.wq);
    if (ex) ex.qty = Math.max(ex.qty, qty); else list.push({ slug: item.slug, vid: item.vid, qty: qty, dtext: item.dtext || "", thumb: item.thumb || "" });
    store.quote.set(list); badges();
  }
  function estOf(l) {
    var p = P[l.slug], v = vOf(p, l.vid), best = bestOf(p, v);
    if (l.qty >= p.wq * 10) return { special: true, best: best };
    return { special: false, best: best, total: best * l.qty };
  }
  function quoteItemsHTML(px) {
    var list = quoteList();
    if (!list.length) return '<p class="muted">No products in this quote yet. Add products from any product page with “Get a bulk quote”.</p>';
    var est = 0, special = false;
    var html = "<ul>" + list.map(function (l, i) {
      var p = P[l.slug], v = vOf(p, l.vid), e = estOf(l);
      if (e.special) special = true; else est += e.total;
      return '<li class="qitem">' + (l.thumb ? thumbImg(l.thumb, "Your design", 52) : img(v.img, "", "52px")) + "<div><b>" + esc(p.name) + "</b>" + (p.variants.length > 1 ? ' <span class="small muted">' + esc(v.label) + "</span>" : "") +
        (l.dtext ? '<div class="small" style="font-weight:600;color:var(--blue-deep)">' + esc(l.dtext) + "</div>" : "") + '<div class="small muted">' + rateHTML(p) + " · " + etaShort(eta({ p: p, v: v, qty: l.qty, method: l.dtext ? p.pr.methods[0].id : "" })) + "</div>" +
        '<div class="row"><label class="small" for="' + px + "qq" + i + '">Quantity (' + esc(unitWord(p, 2)) + ')</label><input class="inp notranslate" style="width:7rem;min-height:44px" id="' + px + "qq" + i + '" inputmode="numeric" data-qqty="' + i + '" value="' + l.qty + '">' +
        '<button type="button" class="textbtn" data-qrm="' + i + '">Remove<span class="sr"> ' + esc(p.name) + "</span></button></div>" +
        '<p class="small ' + (e.special ? "" : "muted") + '">' + (e.special ? "<b>Special rate on request</b> for this quantity." : "Estimate " + M(e.best) + " " + perText(p) + " × " + l.qty + " = " + M(e.total)) + "</p></div></li>";
    }).join("") + "</ul>";
    return html + '<p class="est" style="margin-top:.75rem" id="' + px + 'est"><b>Estimate: ' + M(est) + (special ? " + special rate items" : "") + "</b><br>Estimate. Your final school rate may be lower.</p>";
  }
  function quoteFormHTML(px, err) {
    var f = store.quoteForm.get({}) || {}, sd = store.details.get({}) || {};
    err = err || {};
    function fld(id, label, opt) {
      opt = opt || {}; var val = f[id] != null ? f[id] : (opt.def || "");
      return '<div class="field' + (opt.span ? " span2" : "") + '"><label for="' + px + id + '">' + label + (opt.opt ? ' <span class="muted">(optional)</span>' : "") + "</label>" +
        (opt.area ? '<textarea class="inp" id="' + px + id + '" name="' + id + '" maxlength="400">' + esc(val) + "</textarea>" :
          '<input class="inp' + (opt.nt ? " notranslate" : "") + '" id="' + px + id + '" name="' + id + '" value="' + esc(val) + '"' + (opt.type ? ' type="' + opt.type + '"' : "") + (opt.im ? ' inputmode="' + opt.im + '"' : "") + (opt.ac ? ' autocomplete="' + opt.ac + '"' : "") + (opt.max ? ' maxlength="' + opt.max + '"' : "") + (opt.minv ? ' min="' + opt.minv + '"' : "") + ' aria-describedby="' + px + id + 'e"' + (err[id] ? ' aria-invalid="true"' : "") + ">") +
        '<p class="err" id="' + px + id + 'e">' + (err[id] || "") + "</p></div>";
    }
    var today = new Date().toISOString().slice(0, 10);
    return '<form class="form-grid form-grid--2" data-quoteform="' + px + '" novalidate style="margin-top:1rem">' +
      fld("school", "School or institution name", { span: true, ac: "organization" }) + fld("contact", "Contact person", { ac: "name", def: sd.name || "" }) +
      fld("mobile", "Mobile number", { type: "tel", im: "numeric", nt: true, max: 14, ac: "tel-national", def: sd.mobile || "" }) + fld("email", "Email", { opt: true, type: "email", nt: true, ac: "email" }) +
      fld("city", "City or town", { ac: "address-level2" }) + fld("pin", "PIN code", { im: "numeric", max: 6, nt: true, ac: "postal-code", def: store.pin.get("") || "" }) +
      fld("needby", "Needed by", { type: "date", minv: today }) +
      '<fieldset class="span2" style="border:0;padding:0;margin:0"><legend class="lab">Custom printing?</legend><div class="opts" style="margin-top:.35rem">' +
      ["No", "Yes"].map(function (x) { return '<label class="optbtn"><input type="radio" name="print" value="' + x + '"' + ((f.print || "No") === x ? " checked" : "") + ' style="accent-color:var(--blue)"> ' + x + "</label>"; }).join("") +
      '<select class="inp" name="method" aria-label="Printing method" style="width:auto;flex:1 1 200px"' + (f.print === "Yes" ? "" : " hidden") + ">" + Object.keys(D.METHODS).map(function (k) { return "<option" + (f.method === D.METHODS[k].name ? " selected" : "") + ">" + D.METHODS[k].name + "</option>"; }).join("") + "</select></div></fieldset>" +
      '<fieldset class="span2" style="border:0;padding:0;margin:0"><legend class="lab">Delivery to the school?</legend><div class="opts" style="margin-top:.35rem">' +
      ["Yes", "No, we will collect"].map(function (x) { return '<label class="optbtn"><input type="radio" name="deliver" value="' + x + '"' + ((f.deliver || "Yes") === x ? " checked" : "") + ' style="accent-color:var(--blue)"> ' + x + "</label>"; }).join("") + "</div></fieldset>" +
      fld("gstin", "GSTIN", { opt: true, nt: true, max: 15 }) + fld("note", "Note", { opt: true, area: true, span: true }) +
      '<div class="span2" style="display:grid;gap:.5rem"><button class="btn btn--blue btn--block" type="submit">' + I.wa.replace("<svg", '<svg style="color:#fff"') + 'Send quote request on WhatsApp</button><p class="small muted">Opens WhatsApp with your request written out. Nothing is sent from this page.</p></div></form>';
  }
  function quoteValidate(f) {
    var e = {};
    if ((f.school || "").trim().length < 3) e.school = "Enter the name of your school or institution.";
    if ((f.contact || "").trim().length < 2) e.contact = "Enter the name of the person we should talk to.";
    if (!S.validMobile(f.mobile)) e.mobile = "Enter a 10-digit mobile number starting with 6, 7, 8 or 9.";
    if (f.email && !S.validEmail(f.email)) e.email = "Check the email, for example name@gmail.com. Or leave it empty.";
    if ((f.city || "").trim().length < 2) e.city = "Enter your city or town.";
    if (!S.validPin(f.pin)) e.pin = "Enter a 6-digit PIN code, for example 700009.";
    if (!f.needby) e.needby = "Choose the date you need the items by.";
    else if (f.needby < new Date().toISOString().slice(0, 10)) e.needby = "Choose a date from today onwards.";
    if (f.gstin && !validGstin(f.gstin)) e.gstin = "A GSTIN has 15 letters and numbers, like 19AAACK1234A1Z5. Or leave it empty.";
    return e;
  }
  function readQuoteForm(form) {
    var f = {};
    $$("input,select,textarea", form).forEach(function (i) { if (!i.name) return; if (i.type === "radio") { if (i.checked) f[i.name] = i.value; } else f[i.name] = i.value; });
    if (f.gstin) f.gstin = f.gstin.trim().toUpperCase();
    return f;
  }
  function quoteText(qr) {
    var lines = ["Hello Kolom Khata Stationers, please send a bulk quote.", "", "School: " + qr.school, "Contact: " + qr.contact + ", " + fmtMobile(qr.mobile) + (qr.email ? ", " + qr.email : ""), "City: " + qr.city + " " + qr.pin, "", "Items:"];
    qr.items.forEach(function (l, i) { var p = P[l.slug], v = vOf(p, l.vid); lines.push((i + 1) + ". " + p.name + (p.variants.length > 1 ? " (" + v.label + ")" : "") + ": " + qtyText(p, l.qty) + (l.dtext ? ". " + l.dtext : "")); });
    lines.push("", "Custom printing: " + (qr.print === "Yes" ? "Yes, " + qr.method : "No"), "Needed by: " + new Date(qr.needby).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), "Delivery to school: " + qr.deliver);
    if (qr.gstin) lines.push("GSTIN: " + qr.gstin);
    if (qr.note) lines.push("Note: " + qr.note);
    lines.push("", "(Sent from the Kolom Khata Stationers sample website by Nexvora)");
    return lines.join("\n");
  }
  function quoteDoneHTML(qr) {
    return '<div class="done-state" role="status">' + I.check + "<h2>Quote request ready.</h2><p style=\"margin-top:.5rem\">We reply within 2 working hours with special school rates.</p>" +
      '<p class="small muted" style="margin-top:.4rem">Request <b class="notranslate">' + qr.no + "</b> for " + esc(qr.school) + ". A copy is saved under Account, My quotes.</p>" +
      '<div class="btn-row" style="justify-content:center"><a class="btn btn--blue" href="' + S.wa(quoteText(qr)) + '" target="_blank" rel="noopener">Open WhatsApp again</a><a class="btn btn--ghost" href="' + u("/account?tab=quotes") + '">See my quotes</a></div></div>';
  }
  function quoteSheetHTML() {
    return '<div class="sheet__head"><h2 id="quoteTitle">Bulk quote for your school</h2><button class="icon-btn" type="button" data-close-sheet aria-label="Close quote form">' + I.x + "</button></div>" +
      '<div class="sheet__body"><p class="small muted">For schools, shops, offices and events. Tell us what you need and we reply with a special rate.</p><div id="qsItems" style="margin-top:.6rem">' + quoteItemsHTML("s") + "</div>" +
      '<p style="margin-top:.6rem"><a class="btn btn--ghost btn--sm" href="' + u("/shop") + '" data-quote-more>+ Add another product to this quote</a></p>' + quoteFormHTML("s") + "</div>";
  }
  /** Open the quote form with an item (or the whole cart) added to the quote list. */
  function openQuote(item) {
    if (item.fromCart) cart().forEach(function (l) { addToQuote({ slug: l.slug, vid: l.vid, qty: l.qty, dtext: l.d ? customText(l.d) : l.note ? "Text: " + l.note : "", thumb: l.d && l.d.thumb }); });
    else if (item.slug) addToQuote(item);
    if (route().name === "quote") { vQuote(); return; }
    closeAdded(false);
    openSheet($("#quoteSheet"), quoteSheetHTML(), "[data-close-sheet]");
    S.announce("Added to your quote list. " + plural(quoteList().length, "item", "items") + " in the quote.");
  }
  function refreshQuoteItems() { $$("#qsItems,#qpItems").forEach(function (el) { el.innerHTML = quoteItemsHTML(el.id === "qsItems" ? "s" : "p"); }); badges(); }
  document.addEventListener("click", function (e) {
    var rm = e.target.closest("[data-qrm]");
    if (rm) { var list = quoteList(); list.splice(+rm.getAttribute("data-qrm"), 1); store.quote.set(list); refreshQuoteItems(); S.announce("Removed from the quote"); var f = $("[data-qqty]") || $("[data-quoteform] input"); if (f) f.focus(); return; }
    if (e.target.closest("[data-quote-more]")) { closeSheet(false); }
  });
  document.addEventListener("change", function (e) {
    var q = e.target.closest("[data-qqty]");
    if (q) { var list = quoteList(), i = +q.getAttribute("data-qqty"), p = P[list[i].slug], n = parseInt(q.value, 10); list[i].qty = isNaN(n) || n < p.min ? p.min : n; store.quote.set(list); var id = q.id; refreshQuoteItems(); var nq = document.getElementById(id); if (nq) nq.focus(); S.announce("Quantity " + list[i].qty); return; }
    var form = e.target.closest("[data-quoteform]");
    if (form) {
      var f = readQuoteForm(form); store.quoteForm.set(f);
      if (e.target.name === "print") { var sel = $("select[name=method]", form); sel.hidden = f.print !== "Yes"; }
    }
  });
  document.addEventListener("submit", function (e) {
    var form = e.target.closest("[data-quoteform]"); if (!form) return;
    e.preventDefault();
    var px = form.getAttribute("data-quoteform"), f = readQuoteForm(form); store.quoteForm.set(f);
    var items = quoteList();
    if (!items.length) { S.toast("Add at least one product to the quote", { icon: false }); return; }
    var err = quoteValidate(f), keys = Object.keys(err);
    if (keys.length) {
      form.outerHTML = quoteFormHTML(px, err);
      var nf = $('[data-quoteform="' + px + '"]'), first = $("[aria-invalid=true]", nf); if (first) first.focus();
      S.announce("Please fix " + plural(keys.length, "field", "fields")); return;
    }
    var qr = { no: "QR-" + (3200 + myQuotes().length * 3 + Math.floor(Math.random() * 3)), created: Date.now(), status: "New", items: items.map(function (l) { return { slug: l.slug, vid: l.vid, qty: l.qty, dtext: l.dtext || "", thumb: l.thumb || "" }; }) };
    for (var k in f) qr[k] = f[k];
    qr.mobile = digits(qr.mobile);
    var url = S.wa(quoteText(qr));
    try { window.open(url, "_blank", "noopener"); } catch (x) {}
    var qs = myQuotes(); qs.unshift(qr); store.quotes.set(qs.slice(0, 20));
    store.quote.set([]); store.quoteForm.remove(); badges();
    var box = px === "s" ? $("#quoteSheet .sheet__body") : $("#quoteBox");
    if (box) { box.innerHTML = quoteDoneHTML(qr); var h = $("h2", box); h.setAttribute("tabindex", "-1"); h.focus(); }
    S.toast("Quote request ready");
  });

  // ---------- cart rendering (sheet and page) ----------
  function orderEta(ls) { var last = null; ls.forEach(function (l) { if (l.e && (!last || l.e.to > last)) last = l.e.to; }); return last; }
  function progressHTML(t) {
    if (!t.count) return "";
    var oe = orderEta(t.lines);
    var after = t.after, dv = t.dv, html = "";
    if (t.freeShip) html = "<b>Free delivery</b> with your coupon.";
    else if (dv && dv.zone === "india" && after >= STORE.ship.bigAt) html = "<b>Big order:</b> it goes by road transport. Transport charge confirmed on WhatsApp (sample).";
    else if (after >= STORE.ship.freeAt) html = "<b>Free delivery</b> on this order." + (dv && dv.zone !== "india" && after < STORE.ship.bigAt ? "" : "");
    else html = "Add " + M(STORE.ship.freeAt - after) + " more for free delivery.";
    var w = Math.min(100, Math.round(after / STORE.ship.freeAt * 100));
    return '<div class="progress" role="status">' + (oe ? "<b>Whole order arrives by " + fDate(oe) + "</b>" + (t.dv ? "" : " (to Kolkata, add your PIN for your date)") + "<br>" : "") + html + '<div class="bar" aria-hidden="true"><i style="width:' + (t.freeShip ? 100 : w) + '%"></i></div>' + (t.save > 0 ? '<p class="small ok" style="margin-top:.4rem">You saved ' + M(t.save) + " with wholesale prices.</p>" : "") + "</div>";
  }
  function lineHTML(lc, ctx) {
    var p = lc.p, k = esc(lc.key), next = p.wq - lc.qty;
    var thumb = lc.l.d && lc.l.d.thumb ? '<img src="' + esc(lc.l.d.thumb) + '" alt="Your design on ' + esc(p.name) + '" width="76" height="76"><span class="dz">CUSTOM</span>' : img(lc.v.img, p.name, "76px");
    var nudge = lc.tier.k === "retail" && next > 0 ? '<p class="nudge">Add ' + qtyText(p, snap(p, next, p.step)) + " more to get the wholesale price of " + M(lc.v.wp) + " " + perText(p) + ".</p>" :
      lc.tier.k !== "retail" ? '<p class="nudge nudge--ok">' + lc.tier.name + " applied. You save " + M(lc.save) + ".</p>" : "";
    return '<li class="line" data-line="' + k + '"><div class="line__img">' + thumb + '</div><div><div class="line__top"><div><a class="line__name" href="' + u("/products/" + p.slug) + '">' + esc(p.name) + "</a>" +
      (p.variants.length > 1 ? '<div class="line__var">' + esc(lc.v.label) + "</div>" : "") +
      '<div class="line__calc">' + calcText(lc) + ' <span class="tier-pill' + (lc.tier.k === "retail" ? " tier-pill--r" : "") + '">' + lc.tier.name + (lc.tier.k !== "retail" ? ", " + esc(mkName(lc.p)) + " rate" : "") + "</span></div>" +
      (lc.l.d ? '<div class="line__custom">' + esc(customText(lc.l.d)) + '</div><div class="line__eta">Personalised: no return</div>' : "") + (lc.l.note ? '<div class="line__custom">Text to engrave: “' + esc(lc.l.note) + "”</div>" : "") + '<div class="line__eta">' + (lc.e ? "Arrives by " + fDate(lc.e.to) : "Back in stock soon") + "</div>" + (lc.qty > lc.v.stock ? '<div class="err">Only ' + n0(lc.v.stock) + " left in stock. Lower the quantity or ask for a bulk quote.</div>" : "") +
      '</div><b class="notranslate">' + money(lc.total) + "</b></div>" +
      '<div class="line__acts"><div class="qty qty--sm" role="group" aria-label="Quantity for ' + esc(p.name) + '"><button type="button" data-cact="dec" data-key="' + k + '" data-fid="dec-' + ctx + k + '" aria-label="' + (lc.qty <= lc.min ? "Remove" : "Decrease quantity by " + p.step) + '">&minus;</button>' +
      '<label class="sr" for="lq-' + ctx + k + '">Quantity</label><input id="lq-' + ctx + k + '" class="notranslate" inputmode="numeric" data-lq="' + k + '" data-fid="lq-' + ctx + k + '" value="' + lc.qty + '" aria-describedby="lm-' + ctx + k + '">' +
      '<button type="button" data-cact="inc" data-key="' + k + '" data-fid="inc-' + ctx + k + '" aria-label="Increase quantity by ' + p.step + '"' + (lc.qty + p.step > lc.v.stock ? " disabled" : "") + ">+</button></div>" +
      (lc.l.d ? '<a class="textbtn" href="' + u("/design/" + p.slug + "?d=" + encodeURIComponent(lc.l.d.id) + "&line=" + encodeURIComponent(lc.key)) + '">Edit design</a>' : "") +
      '<button type="button" class="textbtn" data-cact="remove" data-key="' + k + '" data-fid="rm-' + ctx + k + '">Remove</button></div>' +
      '<p class="qmsg" id="lm-' + ctx + k + '" role="status">' + (lineMsgs[lc.key] || "") + "</p>" + (confirmKey === lc.key ? '<div class="confirm" role="alert"><span>' + (lc.min > 1 ? "The minimum is " + qtyText(p, lc.min) + ". " : "") + 'Remove this line?</span><button type="button" class="btn btn--red btn--sm" data-cact="remove" data-key="' + k + '" data-fid="cy-' + ctx + k + '">Remove</button><button type="button" class="btn btn--ghost btn--sm" data-cact="keep" data-key="' + k + '">Keep</button></div>' : "") +
      nudge + "</div></li>";
  }
  var lineMsgs = {}, confirmKey = "";
  function summaryHTML(t, opt) {
    opt = opt || {};
    var sh = t.ship, shipTxt = sh.pickup ? '<b class="ok">Free (pick up)</b>' : sh.transport ? "By transport, confirmed on WhatsApp" : sh.fee == null ? '<span class="muted">Add your PIN</span>' : sh.fee ? M(sh.fee) : '<b class="ok">Free</b>';
    return '<div class="sum"><div><span>Items (' + plural(t.n, "line", "lines") + ")</span><span>" + M(t.subtotal) + "</span></div>" +
      (t.setup ? '<div class="small muted"><span>Includes one-time print setup</span><span>' + M(t.setup) + "</span></div>" : "") +
      (t.discount ? '<div class="ok"><span>Coupon (<span class="notranslate">' + esc(t.coupon.code) + "</span>)</span><span>&minus;" + M(t.discount) + "</span></div>" : "") +
      "<div><span>Delivery" + (t.dv && !sh.pickup ? " to " + esc(t.dv.zoneName) : "") + "</span><span>" + shipTxt + "</span></div>" +
      '<div class="tot"><span>Total</span><span>' + M(t.total) + "</span></div>" +
      (t.save > 0 ? '<div class="save"><span>You saved ' + M(t.save) + " with wholesale prices</span></div>" : "") +
      '<div class="gst"><span>Includes GST of ' + M(t.gst) + " (sample, 12%). Inclusive of GST.</span></div></div>";
  }
  function pinMiniHTML(fid) {
    var pin = store.pin.get(""), dv = delivery(pin);
    return '<form class="coupon" data-pinmini novalidate><label class="lab" for="pm-' + fid + '">Deliver to PIN code</label><div class="miniform"><input class="inp notranslate" id="pm-' + fid + '" name="pin" inputmode="numeric" maxlength="6" value="' + esc(pin) + '" placeholder="700009" aria-describedby="pme-' + fid + '"><button class="btn btn--ghost btn--sm" type="submit">Check</button></div>' +
      '<p class="err" id="pme-' + fid + '" role="alert"></p>' + (dv ? '<p class="small muted">' + esc(dv.city || dv.zoneName) + ": " + money(dv.fee) + " delivery, free above " + money(STORE.ship.freeAt) + ". COD " + (dv.remote ? "not available here." : dv.zone === "india" ? "on orders up to " + money(STORE.codMaxOutside) + "." : "available.") + "</p>" : "") + "</form>";
  }
  function couponHTML(t, fid) {
    var code = store.coupon.get("");
    if (code && t.coupon) {
      return '<div class="coupon"><div class="cpn' + (t.coupon.ok ? "" : " cpn--bad") + '"><span><b class="notranslate">' + esc(code) + "</b> " + (t.coupon.ok ? "applied: " : "is not applied. ") + esc(t.coupon.msg) + "</span>" +
        '<button type="button" class="textbtn" data-cact="uncoupon" data-fid="unc-' + fid + '">Remove</button></div></div>';
    }
    var bo = bestCoupon(t.lines);
    return (bo ? '<p class="small" style="margin-bottom:.4rem">Best offer for your cart: <code class="notranslate">' + bo.code + "</code> saves " + money(bo.disc) + ' <button type="button" class="textbtn" data-apply-cpn="' + bo.code + '">Apply</button></p>' : "") + '<form class="coupon" data-coupon novalidate><label class="lab" for="cp-' + fid + '">Have a coupon?</label><div class="miniform"><input class="inp notranslate" id="cp-' + fid + '" name="code" autocomplete="off" placeholder="FIRST50" aria-describedby="cpe-' + fid + '"><button class="btn btn--ghost btn--sm" type="submit">Apply</button></div>' +
      '<p class="err" id="cpe-' + fid + '" role="alert"></p><p class="small muted">Try <span class="notranslate">FIRST50, SCHOOL5 or FREEDEL</span>. <button type="button" class="textbtn" data-all-cpn style="min-height:0">All offers</button></p></form>';
  }
  function emptyCart() {
    return '<div class="empty">' + I.cart + "<h2>Your cart is empty</h2><p>Buy one piece at the shop price, or 50 at the wholesale price. The cart works it out for you.</p>" +
      '<a class="btn btn--blue" href="' + u("/shop") + '">Start shopping</a><div class="chips">' + D.CATS.slice(0, 6).map(function (c) { return '<a class="chip" href="' + u("/shop/" + c.id) + '">' + esc(c.short) + "</a>"; }).join("") + "</div></div>";
  }
  function cartSheetHTML() {
    var t = totals();
    return '<div class="sheet__head"><h2 id="cartTitle">Your cart (' + t.n + ')</h2><button class="icon-btn" type="button" data-close-sheet aria-label="Close cart">' + I.x + "</button></div>" +
      '<div class="sheet__body">' + (t.count ? progressHTML(t) + "<ul>" + t.lines.map(function (l) { return lineHTML(l, "s"); }).join("") + "</ul>" : emptyCart()) + (function () { var r = recentList(cart().map(function (l) { return l.slug; })).slice(0, 4); return r.length ? '<p class="small muted" style="margin-top:1rem">Recently viewed</p><div class="rthumbs">' + r.map(function (x) { var p = P[x.slug]; return '<a href="' + u("/products/" + p.slug) + '" aria-label="' + esc(p.name) + '">' + img(defV(p).img, "", "64px") + "</a>"; }).join("") + "</div>" : ""; })() + "</div>" +
      (t.count ? '<div class="sheet__foot">' + summaryHTML(t) + '<div style="display:grid;gap:.5rem;margin-top:.8rem"><a class="btn btn--blue btn--block" href="' + u("/checkout") + '">Checkout · <span class="notranslate">' + money(t.total) + '</span></a><a class="btn btn--wa btn--block" data-wa-order href="' + esc(S.wa(waCart())) + '" target="_blank" rel="noopener">' + WA_ICON + 'Order the whole cart on WhatsApp</a><a class="btn btn--ghost btn--block" href="' + u("/cart") + '">View full cart</a></div></div>' : "");
  }
  function openCart() { closeAdded(false); openSheet($("#cartSheet"), cartSheetHTML(), "[data-close-sheet]"); }
  function refreshCartUI(focusFid) {
    var fid = focusFid || (document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute("data-fid"));
    if (openSheetEl && openSheetEl.id === "cartSheet") openSheetEl.innerHTML = cartSheetHTML();
    var r = route().name;
    if (r === "cart") renderCartPage();
    if (r === "checkout" && co) drawCheckout(true);
    if (fid) { var el = $('[data-fid="' + fid + '"]'); if (el && !el.disabled) el.focus(); else { var h = openSheetEl ? openSheetEl.querySelector("h2") : $("#view h1"); if (h) { h.setAttribute("tabindex", "-1"); h.focus(); } } }
  }
  function findLine(key) { var c = cart(); for (var i = 0; i < c.length; i++) if (lineKey(c[i]) === key) return { c: c, i: i, l: c[i] }; return null; }
  function setLineQty(key, q, typed) {
    var f = findLine(key); if (!f) return;
    var p = P[f.l.slug], v = vOf(p, f.l.vid), min = lineMin(p, f.l.d), before = tierOf(p, v, f.l.qty).k;
    var n = snap(p, q, min, v.stock), raw = parseInt(q, 10);
    lineMsgs = {};
    if (typed && (isNaN(raw) || raw !== n)) lineMsgs[key] = isNaN(raw) ? "Type a number. Set to " + qtyText(p, n) + "." : raw < min ? "The minimum is " + qtyText(p, min) + ". Set to " + n + "." : raw > v.stock ? "Only " + v.stock + " in stock. Set to " + n + "." : "Sold in steps of " + p.step + ". Changed to " + n + ".";
    f.l.qty = n; setCart(f.c);
    var after = tierOf(p, v, n);
    S.announce("Quantity " + n + ". " + (after.k !== before ? after.name + " applied: " + money(after.price) + " " + perText(p) + "." : ""));
  }
  function cartAct(act, key, btn) {
    var f = findLine(key); lineMsgs = {};
    if (act === "uncoupon") { store.coupon.remove(); S.toast("Coupon removed"); refreshCartUI(); return; }
    if (!f) return;
    var p = P[f.l.slug], min = lineMin(p, f.l.d);
    if (act === "inc") { confirmKey = ""; setLineQty(key, f.l.qty + p.step); }
    if (act === "dec") {
      if (f.l.qty - p.step < min) { confirmKey = key; refreshCartUI("cy-" + (btn.getAttribute("data-fid") || "").slice(4)); return; }
      confirmKey = ""; setLineQty(key, f.l.qty - p.step);
    }
    if (act === "keep") { confirmKey = ""; refreshCartUI("dec-" + (openSheetEl && openSheetEl.id === "cartSheet" ? "s" : "p") + key); return; }
    if (act === "remove") { confirmKey = ""; f.c.splice(f.i, 1); setCart(f.c); S.toast("Removed " + p.name); }
    refreshCartUI();
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cact]"); if (b) { cartAct(b.getAttribute("data-cact"), b.getAttribute("data-key"), b); return; }
    if (e.target.closest("[data-close-sheet]")) closeSheet();
  });
  document.addEventListener("change", function (e) {
    var q = e.target.closest("[data-lq]"); if (!q) return;
    var fid = q.getAttribute("data-fid"); setLineQty(q.getAttribute("data-lq"), q.value, true); refreshCartUI(fid);
  });
  document.addEventListener("keydown", function (e) { var q = e.target.closest && e.target.closest("[data-lq]"); if (q && e.key === "Enter") { e.preventDefault(); q.dispatchEvent(new Event("change", { bubbles: true })); } });
  document.addEventListener("submit", function (e) {
    var f = e.target.closest("[data-coupon]");
    if (f) {
      e.preventDefault();
      var ci = f.querySelector("[name=code]"), code = ci.value.trim().toUpperCase(), err = f.querySelector(".err");
      if (!code) { err.textContent = "Type a coupon code first."; ci.setAttribute("aria-invalid", "true"); ci.focus(); return; }
      var chk = couponCheck(code);
      if (!chk.ok) { err.textContent = chk.msg; ci.setAttribute("aria-invalid", "true"); ci.focus(); return; }
      store.coupon.set(code); S.toast(code + " applied"); refreshCartUI();
      var rm = $('[data-cact="uncoupon"]', openSheetEl || view); if (rm) rm.focus();
      return;
    }
    var pm = e.target.closest("[data-pinmini]");
    if (pm) {
      e.preventDefault();
      var pi = pm.querySelector("[name=pin]"), er = pm.querySelector(".err"), dv = delivery(pi.value);
      if (!dv) { er.textContent = "Enter a 6-digit PIN code, for example 700009."; pi.setAttribute("aria-invalid", "true"); pi.focus(); return; }
      store.pin.set(dv.pin); S.announce("Delivery to " + (dv.city || dv.zoneName) + " " + money(dv.fee) + ", free above " + money(STORE.ship.freeAt)); refreshCartUI(); var np = $("[data-pinmini] [name=pin]"); if (np) np.focus();
    }
  });

  // ---------- router ----------
  var cleanups = [], first = true, co = null;
  function route() {
    var path = location.pathname.replace(/\/+$/, "");
    var rest = path.indexOf(BASE) === 0 ? path.slice(BASE.length) : path;
    var seg = rest.split("/").filter(Boolean).map(decodeURIComponent);
    var q = new URLSearchParams(location.search);
    if (!seg.length) return { name: "home", q: q };
    if (seg[0] === "shop" && seg.length <= 2) return { name: "shop", cat: seg[1] || "", q: q };
    if (seg[0] === "products" && seg.length === 2) return { name: "product", slug: seg[1], q: q };
    if (seg[0] === "design" && seg.length === 2) return { name: "design", slug: seg[1], q: q };
    if (seg.length === 1 && ["cart", "checkout", "track", "account", "admin", "quote", "wishlist", "compare"].indexOf(seg[0]) > -1) return { name: seg[0], q: q };
    if ((seg[0] === "order" || seg[0] === "invoice") && seg.length === 2) return { name: seg[0], no: seg[1], q: q };
    if (seg[0] === "policies" && seg.length === 2) return { name: "policy", key: seg[1], q: q };
    return { name: "404", q: q };
  }
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
  document.addEventListener("submit", function (e) { e.preventDefault(); }, true);
  function onCleanup(fn) { cleanups.push(fn); }
  function setTitle(t) { document.title = (t ? t + " | " : "") + "Kolom Khata Stationers"; }

  function render(fromPop) {
    cleanups.forEach(function (f) { try { f(); } catch (e) {} }); cleanups = [];
    closeSheet(false); closeAdded(false); closeSearch();
    document.body.classList.remove("has-bar");
    lineMsgs = {}; confirmKey = "";
    var r = route(), isFirst = first; first = false;
    document.documentElement.removeAttribute("data-route");
    document.documentElement.classList.toggle("is-studio", r.name === "design");
    document.body.classList.toggle("focus", r.name === "checkout" || r.name === "invoice");
    document.body.classList.toggle("show-cats", r.name === "home" || r.name === "shop");
    megaOpen(false); closeZoom();
    $(".secure").innerHTML = r.name === "invoice" ? I.lock + "Tax invoice" : I.lock + "Secure checkout";
    $(".owner-pill").hidden = ["admin", "checkout", "invoice", "design"].indexOf(r.name) > -1;
    $$("[data-catlink]").forEach(function (a) { var on = r.name === "shop" && (a.getAttribute("data-catlink") === (r.cat || "")) && !(r.cat === "" && location.search); if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    var fn = { home: vHome, shop: vShop, product: vProduct, cart: vCart, checkout: vCheckout, order: vOrder, invoice: vInvoice, track: vTrack, account: vAccount, admin: vAdmin, policy: vPolicy, quote: vQuote, design: vDesign, wishlist: vWishlist, compare: vCompare }[r.name] || v404;
    if (r.name !== "checkout") co = null;
    fn(r, isFirst);
    document.documentElement.classList.add("drawn");
    badges(); drawTray(); chatGreet(r); if (r.name !== "product") setMeta(null);
    if (!isFirst) {
      if (!fromPop || r.name !== "shop") window.scrollTo(0, 0);
      var h = $("#view h1");
      if (h) { h.setAttribute("tabindex", "-1"); try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
      S.announce(document.title.split(" | ")[0] + " page");
    }
    setTimeout(function () { window.dispatchEvent(new Event("resize")); }, 60);
  }

  // ---------- design studio loader ----------
  var studioState = 0, studioWaiters = [];
  function loadStudio(cb) {
    if (window.KKDesign) { cb(); return; }
    studioWaiters.push(cb);
    if (studioState) return;
    studioState = 1;
    var s = document.createElement("script"); s.src = u("/design.js"); s.async = true;
    s.onload = function () { studioState = 2; var w = studioWaiters; studioWaiters = []; w.forEach(function (f) { f(); }); };
    s.onerror = function () { studioState = 0; S.toast("The design studio did not load. Check your connection and try again.", { icon: false }); };
    document.head.appendChild(s);
  }
  /** What design.js needs from the store. */
  window.KKApp = {
    D: D, P: P, IMG: IMG, u: u, esc: esc, money: money, M: M, vOf: vOf, defV: defV, tierOf: tierOf, printOf: printOf, lineMin: lineMin, snap: snap, qtyText: qtyText, perText: perText, unitWord: unitWord,
    customText: customText, navigate: navigate, toast: S.toast, announce: S.announce, trap: S.trap, wa: S.wa, store: store, persisted: persisted, memDesigns: memDesigns,
    designById: designById, cart: cart, lineKey: lineKey,
    saveDesign: function (rec) {
      var list = designs().filter(function (d) { return d.id !== rec.id; }); list.unshift(rec);
      while (list.length > 12) list.pop();
      memDesigns[rec.id] = rec;
      store.designs.set(list);
      if (!persisted("kk:designs")) return false;
      try { var raw = window.localStorage.getItem("nxshop:kk:designs"); return raw && raw.indexOf(rec.id) > -1; } catch (e) { return false; }
    },
    addCustom: function (slug, vid, qty, d, replaceKey) { return addToCart(slug, vid, qty, { d: d, replaceKey: replaceKey }); },
    openQuote: openQuote, fDate: fDate,
    eta: function (slug, vid, qty, method) { var p = P[slug]; return eta({ p: p, v: vOf(p, vid), qty: qty, method: method }); },
    waDesign: function (slug, vid, qty, d, texts, logo) { var p = P[slug]; return S.wa(waProduct(p, vOf(p, vid), qty, { d: d, texts: texts, logo: logo })); }
  };

  function vDesign(r) {
    var p = P[r.slug]; if (!p) return v404();
    if (!p.custom) { setTimeout(function () { navigate(u("/products/" + p.slug), true); S.toast("This item is sold plain. It is not personalised."); }, 0); view.innerHTML = '<div class="studio-load"><h1 style="font-size:1.2rem">This item is sold plain</h1></div>'; return; }
    setTitle("Design your " + p.name);
    view.innerHTML = '<div class="studio-load" role="status"><div><span class="spin" style="width:40px;height:40px;margin:0 auto 1rem;color:var(--blue)"></span><h1 style="font-size:1.4rem">Opening the design studio</h1><p class="muted">' + esc(p.name) + "</p></div></div>";
    var alive = true; onCleanup(function () { alive = false; if (window.KKDesign) window.KKDesign.unmount(); });
    loadStudio(function () {
      if (!alive) return;
      window.KKDesign.mount(view, { slug: p.slug, vid: r.q.get("v") || "", qty: +r.q.get("qty") || 0, designId: r.q.get("d") || "", lineKey: r.q.get("line") || "", from: r.q.get("from") || "" });
      var h = $("#view h1"); if (h) { h.setAttribute("tabindex", "-1"); try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
    });
  }

  // ---------- home ----------
  var MOCKS = [["cotton-cap-printed", "sports", "Caps for sports day"], ["white-ceramic-mug", "company", "Mugs with your logo"], ["sports-medal-50mm", "sports", "Engraved medals"], ["diary-2027-a5", "school", "Diaries with your crest"]];
  function vHome(r, isFirst) {
    document.title = "Kolom Khata Stationers | Retail and Wholesale Stationery, College Street";
    var hero = $("#hero");
    var best = D.PRODUCTS.filter(function (p) { return p.best; }).sort(function (a, b) { return a.rank - b.rank; }).slice(0, 8);
    var prizes = ["sports-medal-50mm", "trophy-cup", "wooden-award-shield", "prize-rosette-ribbon"].map(function (s) { return P[s]; });
    var says = [];
    D.PRODUCTS.forEach(function (p) { (D.REVIEWS[p.slug] || []).forEach(function (rv) { if (rv.stars === 5 && rv.type !== "Parent" && says.length < 30) says.push([p, rv]); }); });
    var pick = [says[0], says[7], says[15]].filter(Boolean);
    var rest =
      '<section class="sec"><div class="wrap"><div class="sec-head"><div><span class="kicker">Shop by category</span><h2>What are you looking for?</h2></div><a class="link" href="' + u("/shop") + '">Shop all</a></div><div class="cattiles">' +
      D.CATS.map(function (c) { return '<a class="cattile" href="' + u("/shop/" + c.id) + '"><div class="cattile__ph">' + img(c.img, "", "(min-width: 1000px) 250px, (min-width: 640px) 30vw, 46vw") + "</div><b>" + esc(c.name) + "</b><span>" + D.PRODUCTS.filter(function (p) { return p.cat === c.id; }).length + " products</span></a>"; }).join("") + "</div></div></section>" +
      '<section class="sec" style="padding-top:0"><div class="wrap"><div class="sec-head"><div><span class="kicker">Shop by budget</span><h2>Small budget? Start here.</h2></div></div><div class="budget">' +
      D.BUDGETS.map(function (b) { var n = D.PRODUCTS.filter(function (p) { return cheapest(p).price <= b; }).length; return '<a href="' + u("/shop?max=" + b) + '"><b class="notranslate">Under ' + money(b) + "</b><span>" + n + " products</span></a>"; }).join("") + "</div></div></section>" +
      '<section class="sec sec--white"><div class="wrap"><div class="sec-head"><div><span class="kicker">Fast movers at College Street</span><h2>Bestsellers</h2></div><a class="link" href="' + u("/shop?sort=top") + '">View all</a></div>' + gridHTML(best) + "</div></section>" +
      '<section class="sec"><div class="wrap"><div class="sec-head"><div><span class="kicker">Wholesale</span><h2>Shop by buyer</h2><p>What schools, play schools, shops, offices and event organisers order from us most.</p></div></div><div class="lanes">' +
      D.BUYERS.map(function (b) {
        var list = D.PRODUCTS.filter(function (p) { return p.buyers[0] === b.id || (p.buyers.indexOf(b.id) > -1 && p.best); }).slice(0, 3);
        return '<article class="lane">' + img(b.img, "", "(min-width: 1100px) 250px, 88px") + '<div><h3><a href="' + u("/shop?buyer=" + b.id) + '">' + esc(b.name) + "</a></h3><p>" + esc(b.line) + "</p><ul>" + list.map(function (p) { return '<li><a href="' + u("/products/" + p.slug) + '">' + esc(p.name.split(",")[0]) + "</a></li>"; }).join("") + "</ul></div></article>";
      }).join("") + "</div></div></section>" +
      (recentList([]).length ? recentStrip([], "Pick up where you left off", "Recently viewed") : "") +
      '<section class="sec"><div class="wrap"><div class="sec-head"><div><span class="kicker">Kolkata specials</span><h2>For Poila Baisakh, Pujo and every festival</h2><p>Haal khata, panjika, kites, diyas, Bengali alphabet charts and club prizes, the things a College Street shop is known for.</p></div><a class="link" href="' + u("/shop?kolkata=1") + '">All Kolkata specials</a></div><ul class="strip">' + D.PRODUCTS.filter(function (p) { return p.kolkata; }).slice(0, 10).map(function (p) { return "<li>" + card(p) + "</li>"; }).join("") + "</ul></div></section>" +
      '<section class="sec sec--white"><div class="wrap"><div class="sec-head"><div><span class="kicker">Shop by market</span><h2>Kolkata wholesale markets</h2><p>Each wholesale price shows the market this kind of item usually comes from. Market names show where this kind of item is usually bought wholesale in Kolkata. Prices are samples.</p></div></div><ul class="markets">' + D.MARKETS.map(function (m) { var n = D.PRODUCTS.filter(function (p) { return p.market === m.id; }).length; return n ? '<li><a href="' + u("/shop?market=" + m.id) + '"><b>' + esc(m.name) + "</b><span>" + esc(m.line) + "</span><small>" + n + " products</small></a></li>" : ""; }).join("") + "</ul></div></section>" +
      '<section class="sec brandsec" id="brand"><div class="wrap"><div class="sec-head"><div><span class="kicker">Design studio</span><h2>Your name on everything</h2><p>Type your school or shop name, add your logo and see it on the product before you order. One piece or a thousand.</p></div><a class="btn btn--line" href="' + u("/shop?print=1") + '">Browse printable products</a></div>' +
      '<div class="mocks">' + MOCKS.map(function (m) { var p = P[m[0]], v = defV(p); return '<a class="mock" href="' + u("/design/" + p.slug) + '"><div class="mock__ph" data-mock="' + p.slug + '" data-kind="' + m[1] + '"><span class="mock__tag" aria-hidden="true">Plain</span>' + img(v.img, "Plain " + p.name, "(min-width: 900px) 300px, 46vw") + '</div><div class="mock__b"><b>' + esc(m[2]) + '</b><span>From <span class="notranslate">' + money(v.price + methodOf(p, p.pr.methods[0].id).rate[0]) + "</span> with print</span></div></a>"; }).join("") + "</div>" +
      '<ol class="steps-line"><li>Open Customise on any product</li><li>Add your name, logo or photos</li><li>Check the preview and price</li><li>Approve the proof and order</li></ol></div></section>' +
      '<section class="sec"><div class="wrap"><div class="prize"><div><span class="kicker">Prizes and awards</span><h2>Sports day, annual day, prize day</h2><p>Medals, cups, shields and rosettes, engraved with your event name. One trophy for a club, or 300 medals for a school.</p><div class="prize__ph">' + img("ln-event", "Gold trophies and medals on a table", "(min-width: 1000px) 300px, 100vw") + '</div><p><a class="link" href="' + u("/shop/prizes") + '">All prizes and trophies</a></p></div>' +
      gridHTML(prizes) + "</div></div></section>" +
      '<section class="sec" style="padding-top:0"><div class="wrap"><div class="bulk"><div><span class="kicker">Back to school</span><h2>Send us your book and stationery list</h2><p>Paste the list as it is. We pack it class by class and reply with the price on WhatsApp.</p>' +
      '<ul class="ticks" style="margin-top:.8rem">' + ["Wholesale price for 24 notebooks or more", "Packed class-wise with name stickers", "Delivered to the school, or ready at College Street"].map(function (x) { return "<li>" + I.check + x + "</li>"; }).join("") + "</ul></div>" +
      '<form id="listForm" novalidate><label class="lab" for="listText">Your list</label><textarea class="inp" id="listText" rows="6" placeholder="Class 3: 10 ruled notebooks, 2 drawing books, 1 geometry box, 12 pencils" aria-describedby="listErr" style="margin-top:.35rem"></textarea><p class="err" id="listErr" role="alert"></p>' +
      '<div class="btn-row" style="margin-top:.6rem"><button class="btn btn--wa" type="submit">' + WA_ICON + 'Send list on WhatsApp</button><a class="btn btn--ghost" href="' + u("/quote") + '">Request a quote</a></div></form></div></div></section>' +
      '<section class="sec sec--white"><div class="wrap"><div class="sec-head"><div><span class="kicker">How it works</span><h2>Shop price and wholesale price in one cart</h2></div></div><ol class="how">' +
      [["Pick any quantity", "Buy one piece at the shop price. There is no minimum order value."], ["Wholesale starts on its own", "When a line reaches the wholesale quantity, the lower price applies. The cart shows how many more you need."], ["Pay and get a GST bill", "UPI, card, netbanking, bank transfer or cash on delivery. Add your GSTIN for an input-credit bill."]].map(function (x) { return "<li><b>" + x[0] + "</b><span>" + x[1] + "</span></li>"; }).join("") + "</ol>" +
      '<p class="rule-note">Example: HB pencils are <span class="notranslate">₹6</span> each. Take 50 and every pencil in that line is <span class="notranslate">₹4</span>. Take 500 and it is <span class="notranslate">₹3</span>.</p></div></section>' +
      '<section class="sec"><div class="wrap"><div class="sec-head"><div><span class="kicker">Reviews</span><h2>What schools and shops say</h2></div></div><div class="rgrid">' +
      pick.map(function (x) { var p = x[0], rv = x[1]; return '<article class="rcard">' + starRow(rv.stars) + "<h3>" + esc(rv.title) + "</h3><p>" + esc(rv.text) + "</p><footer>" + esc(rv.name) + ", " + esc(rv.type) + ", " + esc(rv.town) + ' · on <a href="' + u("/products/" + p.slug + "#reviews") + '">' + esc(p.name) + "</a></footer></article>"; }).join("") + "</div>" +
      '<ul class="facts" style="margin-top:2rem"><li><b>Since 1979</b><span>Three generations at College Street</span></li><li><b>GST invoice</b><span>Your GSTIN on every bill</span></li><li><b>Delivery across India</b><span>Courier, India Post or transport</span></li><li><b>Cash on delivery</b><span>Anywhere in West Bengal</span></li></ul></div></section>' +
      '<section class="sec sec--white"><div class="wrap"><div class="sec-head"><div><span class="kicker">Questions</span><h2>Minimum orders and wholesale</h2></div></div><div class="faq" style="max-width:860px">' +
      D.FAQ.map(function (x) { return "<details><summary>" + esc(x[0]) + I.chev + "</summary><p>" + esc(x[1]).replace(/₹[\d,]+/g, function (m) { return '<span class="notranslate">' + m + "</span>"; }) + "</p></details>"; }).join("") + "</div></div></section>";
    if (hero && isFirst) {
      $$("#view > *").forEach(function (n) { if (n !== hero) n.remove(); });
      hero.classList.remove("static-hero");
      view.insertAdjacentHTML("beforeend", rest);
    } else {
      var h = hero ? hero.outerHTML.replace("static-hero", "") : "";
      if (!h) h = homeHero();
      view.innerHTML = h + rest;
    }
    var sec = $("#brand");
    if (sec && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return; io.disconnect();
        loadStudio(function () { $$("[data-mock]").forEach(function (el) { window.KKDesign.sample(el, el.getAttribute("data-mock"), el.getAttribute("data-kind")); }); });
      }, { rootMargin: "300px" });
      io.observe(sec); onCleanup(function () { io.disconnect(); });
    }
  }
  var heroCache = $("#hero") ? $("#hero").outerHTML.replace("static-hero", "") : "";
  function homeHero() { return heroCache; }
  document.addEventListener("submit", function (e) {
    if (e.target.id !== "listForm") return;
    e.preventDefault();
    var t = $("#listText"), err = $("#listErr");
    if (t.value.trim().length < 10) { err.textContent = "Paste or type your list first, at least one line."; t.setAttribute("aria-invalid", "true"); t.focus(); return; }
    err.textContent = ""; t.removeAttribute("aria-invalid");
    try { window.open(S.wa("Hello Kolom Khata Stationers, here is our stationery list. Please send the price.\n\n" + t.value.trim() + "\n\n(Sent from the Kolom Khata Stationers sample website by Nexvora)"), "_blank", "noopener"); } catch (x) {}
    S.toast("List ready in WhatsApp");
  });

  // ---------- collection ----------
  var PMAX = 1000;
  function readF(r) {
    var q = r.q, f = {
      cat: (q.get("cat") || "").split(",").filter(function (c) { return C[c]; }), buyer: B[q.get("buyer")] ? q.get("buyer") : "",
      max: Math.min(PMAX, +q.get("max") || PMAX), stock: q.get("stock") === "1", rating: q.get("rating") === "4", kolkata: q.get("kolkata") === "1", market: MK[q.get("market")] ? q.get("market") : "", print: q.get("print") === "1", engrave: q.get("engrave") === "1",
      sort: q.get("sort") || "featured", q: (q.get("q") || "").trim()
    };
    if (r.cat && C[r.cat] && f.cat.indexOf(r.cat) < 0) f.cat.push(r.cat);
    return f;
  }
  function fURL(f) {
    var q = new URLSearchParams(), path = "/shop";
    if (f.cat.length === 1) path += "/" + f.cat[0]; else if (f.cat.length) q.set("cat", f.cat.join(","));
    if (f.buyer) q.set("buyer", f.buyer);
    if (f.max < PMAX) q.set("max", f.max);
    if (f.stock) q.set("stock", "1"); if (f.rating) q.set("rating", "4"); if (f.kolkata) q.set("kolkata", "1"); if (f.market) q.set("market", f.market); if (f.print) q.set("print", "1"); if (f.engrave) q.set("engrave", "1");
    if (f.sort !== "featured") q.set("sort", f.sort);
    if (f.q) q.set("q", f.q);
    var s = q.toString();
    return u(path) + (s ? "?" + s : "");
  }
  function applyF(f) {
    var list = D.PRODUCTS.filter(function (p) {
      if (f.cat.length && f.cat.indexOf(p.cat) < 0) return false;
      if (f.buyer && p.buyers.indexOf(f.buyer) < 0) return false;
      if (f.max < PMAX && cheapest(p).price > f.max) return false;
      if (f.stock && !stockOf(p)) return false;
      if (f.rating && ratingOf(p).avg < 4) return false;
      if (f.kolkata && !p.kolkata) return false;
      if (f.market && p.market !== f.market) return false;
      if (f.print && (!p.custom || p.pr.blend !== "print")) return false;
      if (f.engrave && (!p.custom || p.pr.blend !== "engrave")) return false;
      if (f.q && !matches(p, f.q)) return false;
      return true;
    });
    var by = {
      featured: function (a, b) { return a.rank - b.rank; }, "price-asc": function (a, b) { return cheapest(a).price - cheapest(b).price; },
      "price-desc": function (a, b) { return cheapest(b).price - cheapest(a).price; }, newest: function (a, b) { return a.created < b.created ? 1 : -1; },
      top: function (a, b) { return b.reviews - a.reviews; }, save: function (a, b) { return pct(bestOf(b, defV(b)), defV(b).price) - pct(bestOf(a, defV(a)), defV(a).price); }
    }[f.sort] || function (a, b) { return a.rank - b.rank; };
    return list.sort(by);
  }
  function fCount(f) { return f.cat.length + (f.buyer ? 1 : 0) + (f.max < PMAX ? 1 : 0) + (f.stock ? 1 : 0) + (f.rating ? 1 : 0) + (f.kolkata ? 1 : 0) + (f.market ? 1 : 0) + (f.print ? 1 : 0) + (f.engrave ? 1 : 0); }
  function panelHTML(f, px) {
    return '<form data-fpanel="' + px + '" novalidate>' +
      '<fieldset class="fgroup"><legend>Category</legend>' + D.CATS.map(function (c) { var n = D.PRODUCTS.filter(function (p) { return p.cat === c.id; }).length; return '<label class="check"><input type="checkbox" name="cat" value="' + c.id + '"' + (f.cat.indexOf(c.id) > -1 ? " checked" : "") + "><span>" + esc(c.name) + "</span><small>" + n + "</small></label>"; }).join("") + "</fieldset>" +
      '<fieldset class="fgroup"><legend>Customise</legend><label class="check"><input type="checkbox" name="print" value="1"' + (f.print ? " checked" : "") + '><span>Can be printed</span></label><label class="check"><input type="checkbox" name="engrave" value="1"' + (f.engrave ? " checked" : "") + "><span>Can be engraved</span></label></fieldset>" +
      '<fieldset class="fgroup"><legend>Kolkata</legend><label class="check"><input type="checkbox" name="kolkata" value="1"' + (f.kolkata ? " checked" : "") + '><span>Kolkata specials</span></label><label class="sr" for="' + px + 'mk">Market</label><select class="inp" id="' + px + 'mk" name="market" style="margin-top:.3rem"><option value="">Any market</option>' + D.MARKETS.map(function (m) { return '<option value="' + m.id + '"' + (f.market === m.id ? " selected" : "") + ">" + esc(m.name) + "</option>"; }).join("") + "</select></fieldset>" +
      '<fieldset class="fgroup"><legend>Buyer</legend>' + D.BUYERS.map(function (b) { return '<label class="check"><input type="radio" name="buyer" value="' + b.id + '"' + (f.buyer === b.id ? " checked" : "") + "><span>" + esc(b.name) + "</span></label>"; }).join("") + '<label class="check"><input type="radio" name="buyer" value=""' + (!f.buyer ? " checked" : "") + "><span>Anyone</span></label></fieldset>" +
      '<fieldset class="fgroup"><legend>Shop price</legend>' + [50, 199, 499, PMAX].map(function (b) { return '<label class="check"><input type="radio" name="max" value="' + b + '"' + (f.max === b ? " checked" : "") + "><span" + (b < PMAX ? ' class="notranslate"' : "") + ">" + (b < PMAX ? "Under " + money(b) : "Any price") + "</span></label>"; }).join("") + "</fieldset>" +
      '<fieldset class="fgroup"><legend>More</legend><label class="check"><input type="checkbox" name="stock" value="1"' + (f.stock ? " checked" : "") + '><span>In stock only</span></label><label class="check"><input type="checkbox" name="rating" value="4"' + (f.rating ? " checked" : "") + "><span>Rated 4 and above</span></label></fieldset></form>";
  }
  function readPanel(form, f) {
    var nf = { cat: [], buyer: "", max: PMAX, stock: false, rating: false, kolkata: false, market: (form.querySelector("[name=market]") || {}).value || "", print: false, engrave: false, sort: f.sort, q: f.q };
    $$("input:checked", form).forEach(function (i) {
      if (i.name === "cat") nf.cat.push(i.value); if (i.name === "buyer") nf.buyer = i.value; if (i.name === "max") nf.max = +i.value;
      if (i.name === "stock") nf.stock = true; if (i.name === "rating") nf.rating = true; if (i.name === "kolkata") nf.kolkata = true; if (i.name === "print") nf.print = true; if (i.name === "engrave") nf.engrave = true;
    });
    return nf;
  }
  function collTitle(f) {
    if (f.q) return { h: "Results for “" + f.q + "”", d: "Search across every category." };
    if (f.kolkata && !f.cat.length) return { h: "Kolkata specials", d: "Haal khata, panjika, kites, diyas, alphabet charts and club prizes." };
    if (f.market && !f.cat.length) return { h: MK[f.market].name + " rate", d: MK[f.market].line + " Market names show where this kind of item is usually bought wholesale in Kolkata. Prices are samples." };
    if (f.cat.length === 1) return { h: C[f.cat[0]].name, d: C[f.cat[0]].line, cat: C[f.cat[0]] };
    if (f.buyer && !f.cat.length) return { h: "For " + B[f.buyer].name.toLowerCase(), d: B[f.buyer].line };
    if (f.print && !f.cat.length) return { h: "Print your name", d: "Everything here can carry your school, shop or company name. Open Customise to see a live preview." };
    if (f.engrave && !f.cat.length) return { h: "Can be engraved", d: "Medals, cups, shields, pens and bottles, laser engraved." };
    if (f.max < PMAX && !f.cat.length) return { h: "Under " + money(f.max), d: "Shop prices under " + money(f.max) + ". Wholesale prices are lower still." };
    if (f.sort === "top" && !fCount(f)) return { h: "Bestsellers", d: "The products our counter sells most." };
    return { h: "Shop all", d: "Shop price from one piece, wholesale price for bigger quantities." };
  }
  function vShop(r) {
    if (r.cat && !C[r.cat]) return v404();
    var f = readF(r), shown = 12, t = collTitle(f), skel = null;
    setTitle(t.h);
    var crumbs = '<ol class="crumbs"><li><a href="' + u() + '">Home</a></li><li><a href="' + u("/shop") + '">Shop</a></li>' + (t.h !== "Shop all" ? '<li aria-current="page">' + esc(t.h) + "</li>" : "") + "</ol>";
    view.innerHTML = '<div class="wrap">' + crumbs + '<div class="page-h"><div class="catintro">' + "" + '<div><h1>' + esc(t.h) + '</h1><p class="muted" style="margin-top:.3rem" id="collD">' + esc(t.d) + "</p></div></div></div>" +
      '<div class="coll"><aside class="fpanel" aria-label="Filters">' + panelHTML(f, "d") + "</aside><div>" +
      '<div class="toolbar"><p id="count" class="muted" role="status"></p><div style="display:flex;gap:.5rem;align-items:center"><button class="btn btn--ghost btn--sm fbtn" type="button" id="openFilters"></button>' +
      '<label class="sr" for="sort">Sort by</label><select id="sort">' + [["featured", "Featured"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"], ["save", "Biggest wholesale saving"], ["newest", "Newest"], ["top", "Most bought"]].map(function (o) { return '<option value="' + o[0] + '"' + (f.sort === o[0] ? " selected" : "") + ">Sort: " + o[1] + "</option>"; }).join("") + "</select></div></div>" +
      '<div class="applied" id="applied"></div><div id="results" aria-busy="false"></div></div></div></div>';
    var results = $("#results");
    function draw(skeleton) {
      var list = applyF(f), n = fCount(f);
      $("#count").textContent = plural(list.length, "product", "products");
      $("#openFilters").innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>Filters' + (n ? " (" + n + ")" : "");
      var chips = [];
      f.cat.forEach(function (c) { chips.push(["cat", c, C[c].short]); });
      if (f.buyer) chips.push(["buyer", "", "For " + B[f.buyer].name.toLowerCase()]);
      if (f.max < PMAX) chips.push(["max", "", "Under " + money(f.max)]);
      if (f.print) chips.push(["print", "", "Can be printed"]); if (f.engrave) chips.push(["engrave", "", "Can be engraved"]);
      if (f.stock) chips.push(["stock", "", "In stock"]); if (f.rating) chips.push(["rating", "", "Rated 4 and above"]); if (f.kolkata) chips.push(["kolkata", "", "Kolkata specials"]); if (f.market) chips.push(["market", "", MK[f.market].name]); if (f.q) chips.push(["q", "", "Search: " + f.q]);
      $("#applied").innerHTML = chips.length ? chips.map(function (c) { return '<button type="button" class="chip" data-unf="' + c[0] + '" data-val="' + esc(c[1]) + '"><span' + (c[0] === "max" ? ' class="notranslate"' : "") + ">" + esc(c[2]) + "</span>" + I.x + '<span class="sr">Remove filter</span></button>'; }).join("") + '<button type="button" class="textbtn" data-unf="all">Clear all</button>' : "";
      var fs = $("#filterSheet .sheet__foot [data-close-sheet]"); if (fs) fs.textContent = "Show " + plural(list.length, "result", "results");
      if (skeleton) {
        results.setAttribute("aria-busy", "true");
        results.innerHTML = '<div class="grid">' + Array(Math.min(6, Math.max(2, list.length)) + 1).join(".").split("").map(function () { return '<div class="sk-card" aria-hidden="true"><div class="sk"></div><div><div class="sk sk-line" style="width:40%"></div><div class="sk sk-line"></div><div class="sk sk-line" style="width:60%"></div></div></div>'; }).join("") + "</div>";
        clearTimeout(skel); skel = setTimeout(function () { draw(false); }, 220); return;
      }
      results.setAttribute("aria-busy", "false");
      if (!list.length) {
        results.innerHTML = '<div class="empty">' + I.search + "<h2>Nothing matches these filters</h2><p>Try removing a filter, or start from one of these:</p>" +
          '<button type="button" class="btn btn--blue" data-unf="all">Clear all filters</button><div class="chips">' + ["hb-pencils", "ruled-notebook-172", "sports-medal-50mm", "flash-card-set"].map(function (s) { return '<a class="chip" href="' + u("/products/" + s) + '">' + esc(P[s].name) + "</a>"; }).join("") + "</div></div>";
        return;
      }
      results.innerHTML = '<ul class="grid">' + list.slice(0, shown).map(function (p, i) { return "<li>" + card(p, { eager: i < 2 }) + "</li>"; }).join("") + "</ul>" +
        (list.length > shown ? '<div class="more"><p class="small muted">Showing ' + shown + " of " + list.length + '</p><button class="btn btn--ghost" type="button" id="loadMore">Load more</button></div>' : (list.length > 12 ? '<div class="more"><p class="small muted">You have seen all ' + list.length + " products</p></div>" : ""));
    }
    function update(nf, push) {
      f = nf; shown = 12;
      var url = fURL(f);
      if (push) history.pushState(null, "", url); else history.replaceState(null, "", url);
      var nt = collTitle(f); $("#view h1").textContent = nt.h; $("#collD").textContent = nt.d; setTitle(nt.h);
      draw(true);
    }
    function syncPanels(src) { $$("[data-fpanel]").forEach(function (form) { if (form === src) return; form.outerHTML = panelHTML(f, form.getAttribute("data-fpanel")); }); }
    function onPanel(e) {
      var form = e.target.closest("[data-fpanel]"); if (!form) return;
      var nf = readPanel(form, f); update(nf, true); syncPanels(form);
    }
    view.addEventListener("change", onPanel);
    var fsEl = $("#filterSheet");
    fsEl.addEventListener("change", onPanel);
    onCleanup(function () { view.removeEventListener("change", onPanel); fsEl.removeEventListener("change", onPanel); clearTimeout(skel); });
    function onClick(e) {
      var un = e.target.closest("[data-unf]");
      if (un) {
        var k = un.getAttribute("data-unf"), val = un.getAttribute("data-val"), nf = JSON.parse(JSON.stringify(f));
        if (k === "all") nf = { cat: [], buyer: "", max: PMAX, stock: false, rating: false, kolkata: false, market: "", print: false, engrave: false, sort: f.sort, q: "" };
        else if (k === "cat") nf.cat = nf.cat.filter(function (x) { return x !== val; });
        else if (k === "max") nf.max = PMAX; else if (k === "buyer") nf.buyer = ""; else if (k === "market") nf.market = ""; else if (k === "q") nf.q = ""; else nf[k] = false;
        update(nf, true); syncPanels(null); S.announce("Filter removed");
        var nx = $("#applied .chip") || $("#sort"); if (nx) nx.focus();
        return;
      }
      if (e.target.closest("#loadMore")) {
        var before = shown; shown += 12; draw(false);
        var items = $$("#results .pc__name"); if (items[before]) items[before].focus();
        S.announce("Showing " + Math.min(shown, applyF(f).length) + " products"); return;
      }
      if (e.target.closest("#openFilters")) {
        openSheet(fsEl, '<div class="sheet__head"><h2 id="filterTitle">Filters</h2><button class="icon-btn" type="button" data-close-sheet aria-label="Close filters">' + I.x + '</button></div><div class="sheet__body">' + panelHTML(f, "m") +
          '</div><div class="sheet__foot" style="display:grid;grid-template-columns:auto 1fr;gap:.6rem"><button type="button" class="btn btn--ghost" data-unf="all">Clear all</button><button type="button" class="btn btn--blue" data-close-sheet>Show ' + plural(applyF(f).length, "result", "results") + "</button></div>", "[data-close-sheet]");
      }
    }
    view.addEventListener("click", onClick); fsEl.addEventListener("click", onClick);
    onCleanup(function () { view.removeEventListener("click", onClick); fsEl.removeEventListener("click", onClick); });
    $("#sort").addEventListener("change", function (e) { var nf = JSON.parse(JSON.stringify(f)); nf.sort = e.target.value; update(nf, true); S.announce("Sorted: " + e.target.options[e.target.selectedIndex].text.replace("Sort: ", "")); });
    draw(false);
  }

  // ---------- product ----------
  function revPhotoSrc(ph, size) { return ph.indexOf("data:") === 0 ? ph : IMG + ph + "-" + (size || 400) + ".webp"; }
  /** The reviews block on a product page. Returns the HTML and wires its own events. */
  function reviewsBlock(p) {
    var rf = { star: 0, photo: false, type: "", sort: "helpful", shown: 5, writing: location.hash === "#write" }, errs = {}, draft = { star: 0, photo: "" };
    var bought = myOrders().some(function (o) { return o.items.some(function (l) { return l.slug === p.slug; }); });
    function all() { return reviewsOf(p, true); }
    function helpfulOf(r) { var v = helpStore.get({}) || {}; return (r.helpful || 0) + (v[r.id] ? 1 : 0); }
    function list() {
      var out = all().filter(function (r) { return (!rf.star || r.stars === rf.star) && (!rf.photo || r.photo) && (!rf.type || r.type === rf.type); });
      var by = { helpful: function (a, b) { return helpfulOf(b) - helpfulOf(a); }, newest: function (a, b) { return (a.days || 0) - (b.days || 0); }, high: function (a, b) { return b.stars - a.stars; }, low: function (a, b) { return a.stars - b.stars; } }[rf.sort];
      out.sort(by); return out.filter(function (r) { return r.status; }).concat(out.filter(function (r) { return !r.status; }));
    }
    function itemHTML(r) {
      var voted = (helpStore.get({}) || {})[r.id], reply = (replyStore.get({}) || {})[r.id], when = r.created ? fDate(r.created) : fDate(addDays(-r.days));
      return '<article class="rvitem">' + starRow(r.stars) + (r.status === "Pending" ? '<span class="rvtag rvtag--p">Pending</span>' : "") + (r.verified ? '<span class="rvtag rvtag--v">Verified purchase</span>' : "") + '<span class="rvtag">' + esc(r.type) + "</span>" +
        "<h3>" + esc(r.title) + "</h3><p>" + esc(r.text) + "</p>" +
        (r.photo ? '<button type="button" class="rvphoto" data-rvzoom="' + esc(revPhotoSrc(r.photo, 800)) + '" aria-label="Open the photo from ' + esc(r.name) + '"><img src="' + esc(revPhotoSrc(r.photo)) + '" alt="" width="72" height="72" loading="lazy"></button>' : "") +
        '<p class="who">' + esc(r.name) + ", " + esc(r.town) + " · " + when + (r.qty ? " · Bought " + esc(r.qty) : "") + "</p>" +
        (reply ? '<div class="reply"><b>Reply from Kolom Khata Stationers:</b> ' + esc(reply) + "</div>" : "") +
        (r.status === "Pending" ? '<p class="small muted" style="margin-top:.35rem">Only you can see this until the shop checks it.</p>' : '<button type="button" class="textbtn" data-help="' + esc(r.id) + '" aria-pressed="' + !!voted + '"' + (voted ? " disabled" : "") + ">" + (voted ? "Thanks, marked helpful" : "Helpful") + ' <span class="notranslate">(' + helpfulOf(r) + ")</span></button>") + "</article>";
    }
    function listHTML() {
      var l = list();
      if (!l.length) return '<p class="muted" style="padding:1rem 0">No reviews match these filters. <button type="button" class="textbtn" data-rvreset>Show all reviews</button></p>';
      return l.slice(0, rf.shown).map(itemHTML).join("") + (l.length > rf.shown ? '<button type="button" class="btn btn--ghost" style="margin-top:1rem" data-rvmore>Show more reviews (' + (l.length - rf.shown) + ")</button>" : "");
    }
    function formHTML(done) {
      if (done) return '<div class="note" role="status">' + I.check + "<span><b>Thank you.</b> Your review will appear after the shop checks it (sample). Nothing was sent; it is saved in this browser only.</span></div>";
      if (!rf.writing) return "";
      function f(id, label, el) { return '<div class="field">' + '<label for="rv-' + id + '">' + label + "</label>" + el + '<p class="err" id="rv-' + id + 'e">' + (errs[id] || "") + "</p></div>"; }
      return '<form id="rvForm" class="box" novalidate style="margin-top:1rem;display:grid;gap:.8rem"><h3>Write a review</h3>' +
        '<fieldset style="border:0;padding:0;margin:0"><legend class="lab">Your rating</legend><div class="starpick" role="radiogroup" aria-describedby="rv-stare">' + [1, 2, 3, 4, 5].map(function (s) { return '<label><input type="radio" name="rvStar" value="' + s + '"' + (draft.star === s ? " checked" : "") + '><span>' + s + '</span><span class="sr"> star' + (s > 1 ? "s" : "") + "</span></label>"; }).join("") + '</div><p class="err" id="rv-stare">' + (errs.star || "") + "</p></fieldset>" +
        f("title", "Title", '<input class="inp" id="rv-title" maxlength="60" value="' + esc(draft.title || "") + '"' + (errs.title ? ' aria-invalid="true"' : "") + ' aria-describedby="rv-titlee">') +
        f("text", "Your review", '<textarea class="inp" id="rv-text" maxlength="600"' + (errs.text ? ' aria-invalid="true"' : "") + ' aria-describedby="rv-texte" placeholder="How did you use it? Quantity, quality, delivery...">' + esc(draft.text || "") + "</textarea>") +
        '<div class="form-grid form-grid--2">' + f("name", "Your name", '<input class="inp" id="rv-name" autocomplete="given-name" value="' + esc(draft.name || "") + '"' + (errs.name ? ' aria-invalid="true"' : "") + ' aria-describedby="rv-namee">') +
        f("town", "Town", '<input class="inp" id="rv-town" autocomplete="address-level2" value="' + esc(draft.town || "") + '"' + (errs.town ? ' aria-invalid="true"' : "") + ' aria-describedby="rv-towne">') + "</div>" +
        f("type", "You are a", '<select class="inp" id="rv-type">' + ["Parent", "School", "Shop owner", "Office"].map(function (t) { return "<option" + (draft.type === t ? " selected" : "") + ">" + t + "</option>"; }).join("") + "</select>") +
        f("photo", 'Photo <span class="muted">(optional, stays on this device)</span>', '<input class="inp" type="file" id="rv-photo" accept="image/png,image/jpeg,image/webp">' + (draft.photo ? '<img src="' + draft.photo + '" alt="Your photo" width="72" height="72" style="width:72px;height:72px;object-fit:cover;border-radius:8px;margin-top:.4rem">' : "")) +
        (bought ? '<p class="small ok">You bought this here, so your review gets a “Verified purchase” tag.</p>' : "") +
        '<div class="btn-row" style="margin-top:0"><button class="btn btn--blue" type="submit">Submit review</button><button class="btn btn--ghost" type="button" data-rvcancel>Cancel</button></div></form>';
    }
    function summaryHTML() {
      var rs = reviewsOf(p), r = ratingOf(p), counts = [5, 4, 3, 2, 1].map(function (s) { return rs.filter(function (x) { return x.stars === s; }).length; });
      return '<div class="rv__avg"><b class="notranslate">' + r.avg.toFixed(1) + "</b><span>" + starRow(r.avg) + '<br><span class="small muted">' + plural(r.n, "review", "reviews") + "</span></span></div>" +
        '<div class="bars" role="group" aria-label="Filter by stars">' + counts.map(function (c, i) { var s = 5 - i, w = r.n ? Math.round(c / r.n * 100) : 0; return '<button type="button" data-rvstar="' + s + '" aria-pressed="' + (rf.star === s) + '"><span>' + s + ' star</span><span class="bar" aria-hidden="true"><i style="width:' + w + '%"></i></span><span class="notranslate">' + c + '</span><span class="sr"> reviews with ' + s + " stars</span></button>"; }).join("") + "</div>" +
        '<button type="button" class="btn btn--line btn--block" style="margin-top:1rem" id="writeRev" aria-expanded="' + rf.writing + '">Write a review</button>';
    }
    function toolsHTML() {
      return '<div class="rvtools"><button type="button" class="chip" data-rvphoto aria-pressed="' + rf.photo + '">With photos</button>' +
        '<label class="sr" for="rvType">Buyer type</label><select id="rvType"><option value="">All buyers</option>' + ["School", "Shop owner", "Office", "Parent"].map(function (t) { return "<option" + (rf.type === t ? " selected" : "") + ">" + t + "</option>"; }).join("") + "</select>" +
        '<label class="sr" for="rvSort">Sort reviews</label><select id="rvSort">' + [["helpful", "Most helpful"], ["newest", "Newest"], ["high", "Highest rating"], ["low", "Lowest rating"]].map(function (o) { return '<option value="' + o[0] + '"' + (rf.sort === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select>" +
        (rf.star ? '<button type="button" class="chip" data-rvreset>' + rf.star + " star only " + I.x + '<span class="sr">Clear</span></button>' : "") + "</div>";
    }
    function draw(focusSel) {
      var box = $("#rvBox"); if (!box) return;
      box.innerHTML = '<div class="rv"><div>' + summaryHTML() + '</div><div><div id="rvFormBox">' + formHTML() + "</div>" + toolsHTML() + '<div id="rvList" aria-live="polite">' + listHTML() + "</div></div></div>";
      if (focusSel) { var f = $(focusSel); if (f) f.focus(); }
    }
    function readDraft() { var g = function (id) { var e = $("#rv-" + id); return e ? e.value : ""; }; var st = $('input[name="rvStar"]:checked'); draft.star = st ? +st.value : 0; draft.title = g("title"); draft.text = g("text"); draft.name = g("name"); draft.town = g("town"); draft.type = g("type"); }
    function onClick(e) {
      var b = e.target.closest("[data-rvstar]"); if (b) { var s = +b.getAttribute("data-rvstar"); rf.star = rf.star === s ? 0 : s; rf.shown = 5; draw('[data-rvstar="' + s + '"]'); S.announce(rf.star ? "Showing " + s + " star reviews" : "Showing all reviews"); return; }
      if (e.target.closest("[data-rvreset]")) { rf.star = 0; rf.photo = false; rf.type = ""; draw("#rvSort"); return; }
      if (e.target.closest("[data-rvphoto]")) { rf.photo = !rf.photo; draw("[data-rvphoto]"); S.announce(rf.photo ? "Showing reviews with photos" : "Showing all reviews"); return; }
      if (e.target.closest("[data-rvmore]")) { var before = rf.shown; rf.shown += 5; draw(); var items = $$("#rvList .rvitem h3"); if (items[before]) { items[before].setAttribute("tabindex", "-1"); items[before].focus(); } return; }
      var h = e.target.closest("[data-help]"); if (h) { var v = helpStore.get({}) || {}; v[h.getAttribute("data-help")] = 1; helpStore.set(v); $("#rvList").innerHTML = listHTML(); var nb = $('[data-help="' + h.getAttribute("data-help") + '"]'); if (nb) nb.focus(); S.announce("Marked helpful"); return; }
      var z = e.target.closest("[data-rvzoom]"); if (z) { openZoom(z.getAttribute("data-rvzoom"), "Customer photo"); return; }
      if (e.target.closest("#writeRev")) { rf.writing = !rf.writing; errs = {}; draw(rf.writing ? 'input[name="rvStar"]' : "#writeRev"); return; }
      if (e.target.closest("[data-rvcancel]")) { rf.writing = false; draw("#writeRev"); }
    }
    function onChange(e) {
      if (e.target.id === "rvType") { rf.type = e.target.value; rf.shown = 5; $("#rvList").innerHTML = listHTML(); S.announce(plural(list().length, "review", "reviews")); return; }
      if (e.target.id === "rvSort") { rf.sort = e.target.value; $("#rvList").innerHTML = listHTML(); S.announce("Reviews sorted"); return; }
      if (e.target.id === "rv-photo" && e.target.files[0]) {
        var file = e.target.files[0];
        if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) { errs.photo = "Choose a JPG, PNG or WebP photo under 5 MB."; readDraft(); draw("#rv-photo"); return; }
        var fr = new FileReader(); fr.onload = function () { var im = new Image(); im.onload = function () { var k = Math.min(1, 480 / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); readDraft(); draft.photo = c.toDataURL("image/jpeg", .75); errs.photo = ""; draw("#rv-photo"); S.announce("Photo added"); }; im.src = fr.result; }; fr.readAsDataURL(file);
      }
    }
    function onSubmit(e) {
      if (e.target.id !== "rvForm") return;
      e.preventDefault(); readDraft(); errs = {};
      if (!draft.star) errs.star = "Choose a star rating from 1 to 5.";
      if (draft.title.trim().length < 3) errs.title = "Give your review a short title.";
      if (draft.text.trim().length < 20) errs.text = "Write at least 20 letters, so others know how you used it.";
      if (draft.name.trim().length < 2) errs.name = "Add your first name.";
      if (draft.town.trim().length < 2) errs.town = "Add your town, for example Barasat.";
      var k = Object.keys(errs);
      if (k.length) { draw(); var first = errs.star ? $('input[name="rvStar"]') : $("#rvForm [aria-invalid=true]"); if (first) first.focus(); S.announce("Please fix " + plural(k.length, "field", "fields")); return; }
      var parts = draft.name.trim().split(/\s+/), nm = parts[0] + (parts[1] ? " " + parts[1][0].toUpperCase() + "." : "");
      var rec = { id: "my-" + Date.now().toString(36), slug: p.slug, name: nm, town: draft.town.trim(), type: draft.type || "Parent", stars: draft.star, title: draft.title.trim(), text: draft.text.trim(), qty: "", photo: draft.photo, days: 0, created: Date.now(), helpful: 0, verified: bought, status: "Pending" };
      var mine = myReviews(); mine.unshift(rec); myRevStore.set(mine.slice(0, 30));
      rf.writing = false; draft = { star: 0, photo: "" }; draw();
      $("#rvFormBox").innerHTML = formHTML(true); var n = $("#rvFormBox .note"); n.setAttribute("tabindex", "-1"); n.focus();
      S.toast("Review saved as pending (sample)");
    }
    return { html: '<div id="rvBox"></div>', mount: function () { draw(); view.addEventListener("click", onClick); view.addEventListener("change", onChange); view.addEventListener("submit", onSubmit); onCleanup(function () { view.removeEventListener("click", onClick); view.removeEventListener("change", onChange); view.removeEventListener("submit", onSubmit); }); } };
  }

  function vProduct(r) {
    var p = P[r.slug]; if (!p) return v404();
    setTitle(p.name);
    var rec = (store.recent.get([]) || []).filter(function (s) { return s !== p.slug; }); rec.unshift(p.slug); store.recent.set(rec.slice(0, 10));
    var cur = (r.q.get("v") && vOf(p, r.q.get("v"))) || defV(p), qty = snap(p, r.q.get("qty") || p.min, p.min, Math.max(p.min, cur.stock)), note = "", gi = 0, qmsg = "", lastTier = "retail", lastEta = "", stopReel = null;
    trackView(p, cur.id);
    var qa = qaBlock(p), fbt = fbtBlock(p, function () { return { v: cur, qty: qty }; });
    var engr = p.pr.blend === "engrave" && p.pr.kind !== "label";
    var cat = C[p.cat], savedPin = store.pin.get(""), rv = reviewsBlock(p), rating = ratingOf(p);
    var also = D.PRODUCTS.filter(function (x) { return x.cat === p.cat && x.slug !== p.slug; }).slice(0, 8);
    function gallery() { return [cur.img].concat(p.imgs.filter(function (k) { return k !== cur.img; })); }
    function galHTML() {
      var g = gallery(), k = g[gi] || g[0];
      return '<button type="button" class="gal__main" data-zoommain aria-label="Open photo ' + (gi + 1) + ' of ' + g.length + ' full screen"><img src="' + IMG + k + '-800.webp" srcset="' + IMG + k + "-400.webp 400w, " + IMG + k + '-800.webp 800w" sizes="(min-width: 900px) 46vw, 100vw" width="800" height="800" alt="' + esc(p.name) + (gi ? ", view " + (gi + 1) : "") + '" fetchpriority="high" decoding="async"></button>' +
        '<div class="thumbs" role="group" aria-label="Choose photo">' + g.map(function (key, i) { return '<button type="button" data-ti="' + i + '" aria-label="Show photo ' + (i + 1) + '"' + (i === gi ? ' aria-current="true"' : "") + ">" + img(key, "", "72px") + "</button>" + (i === 0 ? '<button type="button" class="thumb--reel" data-reel aria-label="Play the product reel, 10 seconds, no sound">' + img(key, "", "72px") + '<span>Reel 0:10</span></button>' : ""); }).join("") + "</div>";
    }
    function optHTML() {
      if (p.variants.length < 2) return '<p class="small" style="margin-top:.8rem"><button type="button" class="textbtn" data-sizeguide style="min-height:0">Size guide</button></p>';
      return '<div class="opt" role="group" aria-labelledby="optL"><span class="lab" id="optL">' + (p.variants.some(function (v) { return v.colour; }) ? "Colour" : "Option") + ": <b>" + esc(cur.label) + '</b> <button type="button" class="textbtn" data-sizeguide style="min-height:0;font-weight:500">Size guide</button></span><div class="opts">' + p.variants.map(function (v) {
        var out = v.stock <= 0, st = out ? "out of stock" : v.stock <= lowAt(p) ? n0(v.stock) + " left" : n0(v.stock) + " in stock";
        return '<button type="button" class="optbtn" data-var="' + v.id + '" aria-pressed="' + (v === cur) + '" title="' + esc(v.label + ", " + st) + '" aria-label="' + esc(v.label + ", " + st) + '"' + (out ? ' aria-disabled="true"' : "") + ">" + (v.colour ? '<i style="background:' + v.colour + '"></i>' : "") + esc(v.label) + "</button>";
      }).join("") + "</div></div>";
    }
    function priceHTML() {
      var t = tierOf(p, cur, qty), off = pct(t.price, cur.mrp);
      var rows = [["retail", p.min, p.wq - 1, cur.price], ["whole", p.wq, p.bq ? p.bq - 1 : 0, cur.wp]];
      if (p.bq && cur.bp) rows.push(["bulk", p.bq, 0, cur.bp]);
      return '<div class="pricebig' + (t.k !== lastTier ? " flash" : "") + '"><b class="notranslate">' + money(t.price) + '</b><span class="per">' + perText(p) + (t.k !== "retail" ? " · " + t.name.toLowerCase() : "") + '</span><s class="notranslate"><span class="sr">MRP </span>' + money(cur.mrp) + '</s><span class="off">' + off + "% off MRP</span></div>" +
        '<div class="tiers" role="group" aria-label="Price by quantity">' + rows.map(function (x) {
          var save = pct(x[3], cur.price);
          return '<button type="button" class="tier" data-tier="' + x[1] + '" aria-pressed="' + (x[0] === t.k) + '"><small class="notranslate">' + x[1] + (x[2] ? " to " + x[2] : "+") + " " + esc(unitWord(p, 2)) + '</small><b class="notranslate">' + money(x[3]) + " " + (p.unit === "pc" ? "each" : "") + "</b>" + (save ? '<span class="save">Save ' + save + "%</span>" : '<span class="small muted">Shop price</span>') + "</button>";
        }).join("") + '</div><p class="taxnote">Inclusive of GST. GST bill on request.</p>';
    }
    function etaHTML() {
      var e = eta({ p: p, v: cur, qty: qty });
      if (!e) return '<p class="eta"><b>Back in stock soon</b></p>';
      return '<div class="eta"><p><b>Get it by ' + fDate(e.to) + "</b>" + (e.from - e.to ? '<span class="muted"> (' + fDate(e.from) + " to " + fDate(e.to) + ")</span>" : "") + ' to <span class="notranslate">' + e.dv.pin + "</span>" + (e.assumed ? " (Kolkata)" : e.dv.city ? " (" + esc(e.dv.city) + ")" : "") + ' <button type="button" class="textbtn small" data-chpin style="min-height:0;font-size:var(--t13)">Change PIN</button></p>' +
        (e.express ? '<p class="small muted">Express: by ' + fDate(e.express[1]) + "</p>" : "") +
        (e.cutMs ? '<p class="small ok">' + cutText(e.cutMs) + "</p>" : "") + (e.notes.length ? '<p class="small muted">' + esc(e.notes.join(". ")) + ".</p>" : "") + "</div>";
    }
    function stockHTML() {
      var st = stockText(p, cur);
      if (st[1] === "out") return '<p class="stock stock--out"><i></i>' + st[0] + ' · <a class="wa-link" data-wa-order href="' + esc(S.wa("Hello Kolom Khata Stationers, please tell me on WhatsApp when " + p.name + (p.variants.length > 1 ? " (" + cur.label + ")" : "") + " is back in stock.\n\n" + WA_END)) + '" target="_blank" rel="noopener">Notify me on WhatsApp</a></p>';
      return '<p class="stock stock--' + st[1] + '"><i></i><span class="notranslate">' + st[0] + "</span></p>";
    }
    function qtyHTML() {
      var t = tierOf(p, cur, qty), out = cur.stock <= 0, next = p.wq - qty;
      return '<div class="qtybox"><label class="lab" for="pq">Quantity <span class="muted" style="font-weight:400">(' + esc(unitWord(p, 2)) + (p.step > 1 ? ", in steps of " + p.step : "") + (p.min > 1 ? ", minimum " + p.min : "") + ")</span></label>" +
        '<div class="qtyrow"><div class="qty" role="group" aria-label="Quantity"><button type="button" data-pq="-1" aria-label="Decrease quantity by ' + p.step + '"' + (qty <= p.min || out ? " disabled" : "") + '>&minus;</button>' +
        '<input id="pq" class="notranslate" inputmode="numeric" value="' + qty + '" aria-describedby="pqMsg pqCalc"' + (out ? " disabled" : "") + '><button type="button" data-pq="1" aria-label="Increase quantity by ' + p.step + '"' + (qty + p.step > cur.stock || out ? " disabled" : "") + ">+</button></div>" +
        '<span class="linecalc notranslate" id="pqCalc">' + qtyText(p, qty) + " × " + money(t.price) + " = " + money(t.price * qty) + "</span></div>" +
        '<p class="qmsg" id="pqMsg" role="status">' + qmsg + "</p>" +
        (t.k === "retail" && next > 0 && p.wq <= cur.stock ? '<p class="nudge">Add ' + qtyText(p, snap(p, next, p.step)) + " more to get the wholesale price of " + M(cur.wp) + " " + perText(p) + ".</p>" : t.k !== "retail" ? '<p class="nudge nudge--ok">' + t.name + " applied. You save " + M((cur.price - t.price) * qty) + ".</p>" : "") +
        (engr ? '<div class="field" style="margin-top:.8rem"><label for="pnote">Text to engrave <span class="muted" style="font-weight:400">(optional)</span></label><input class="inp" id="pnote" maxlength="60" value="' + esc(note) + '" placeholder="Annual Sports 2027"><span class="hint">One line. For logos and layouts, use Customise.</span></div>' : "") + "</div>";
    }
    function buyHTML() {
      var out = cur.stock <= 0;
      return '<div class="buy"><button class="btn btn--blue" type="button" id="buyMain" data-add' + (out ? " disabled" : "") + ">" + (out ? "Out of stock" : "Add to cart") + "</button>" +
        (p.custom ? '<a class="btn btn--line" id="custBtn" href="' + u("/design/" + p.slug + "?v=" + cur.id + "&qty=" + qty) + '">Customise with your logo</a>' : "") + '</div><p class="small" style="margin-top:.5rem">' + esc(D.returnPolicy(p).short) + ' <a href="#returns">Return details</a></p>' +
        '<div class="buy-links">' + (out ? "" : '<a class="textbtn wa-link" id="waBtn" data-wa-order href="' + esc(S.wa(waProduct(p, cur, qty, { note: engr ? note.trim() : "" }))) + '" target="_blank" rel="noopener">' + WA_ICON + "Order on WhatsApp</a>") +
        '<button class="textbtn" type="button" data-quote="' + p.slug + "|" + cur.id + "|" + Math.max(qty, p.wq) + '">Get a bulk quote for your school</button></div>';
    }
    function pinHTML(res, err) {
      return '<p class="lab">Check delivery to your PIN code</p>' +
        '<form id="pinForm" novalidate><label class="sr" for="pinIn">PIN code</label><input class="inp notranslate" id="pinIn" inputmode="numeric" maxlength="6" autocomplete="postal-code" placeholder="e.g. 700009" value="' + esc(res ? res.pin : savedPin) + '" aria-describedby="pinOut"' + (err ? ' aria-invalid="true"' : "") + '><button class="btn btn--ghost btn--sm" type="submit">Check</button></form>' +
        '<div class="pinres" id="pinOut" role="status">' + (err ? '<p class="err">' + err + "</p>" : res ? "<ul><li>" + I.check.replace("<svg", '<svg style="color:var(--green)"') + "<span>" + esc(res.zoneName.replace(/^./, function (c) { return c.toUpperCase(); })) + (res.city ? " (" + esc(res.city) + ")" : "") + ": " + M(res.fee) + " delivery, free on orders of " + M(STORE.ship.freeAt) + " or more" + (res.zone === "india" ? ". Orders over " + M(STORE.ship.bigAt) + " go by transport, charge confirmed on WhatsApp" : "") + ".</span></li>" +
          "<li>" + (codAllowed(res, 0) ? I.check.replace("<svg", '<svg style="color:var(--green)"') + "<span>Cash on delivery available" + (res.zone === "india" ? " on orders up to " + M(STORE.codMaxOutside) : "") + ".</span>" : I.x.replace("<svg", '<svg style="color:var(--err)"') + "<span>Cash on delivery is not available for this PIN. Pay by UPI, card, netbanking or bank transfer.</span>") + "</li></ul>" :
          '<p class="small muted">Kolkata ' + M(STORE.ship.kolkata) + ", West Bengal " + M(STORE.ship.wb) + ", rest of India " + M(STORE.ship.india) + ". Free above " + M(STORE.ship.freeAt) + ".</p>") + "</div>";
    }
    var methods = p.pr.methods.map(function (m) { return "<li><b>" + D.METHODS[m.id].name + ":</b> " + (m.rate[0] ? '<span class="notranslate">+' + money(m.rate[0]) + "</span> " + perText(p) + ', <span class="notranslate">+' + money(m.rate[1]) + "</span> from " + p.wq : "printing included in the price") + (m.setup ? ', one-time setup <span class="notranslate">' + money(m.setup) + "</span>" : ", no setup fee") + (m.min > 1 ? ", minimum " + m.min : ", from 1 piece") + ". " + D.METHODS[m.id].line + " Adds " + plural(D.DELIVERY.production[m.id] || 1, "working day", "working days") + ".</li>"; }).join("");
    view.innerHTML = '<div class="wrap"><ol class="crumbs"><li><a href="' + u() + '">Home</a></li><li><a href="' + u("/shop/" + p.cat) + '">' + esc(cat.name) + '</a></li><li aria-current="page">' + esc(p.name) + "</li></ol>" +
      '<div class="pdp"><div class="gal" id="gal">' + galHTML() + "</div>" +
      '<div class="pinfo"><span class="kicker">' + esc(cat.name) + (p.kolkata ? ' · Kolkata special' : "") + "</span><h1>" + esc(p.name) + "</h1>" +
      '<div class="ptitle-acts">' + heartBtn(p, "textbtn") + shareBtn(p) + cmpBtn(p) + "</div>" +
      '<p class="meta"><a href="#reviews">' + starRow(rating.avg) + ' <span class="notranslate">' + rating.avg.toFixed(1) + "</span> · " + plural(rating.n, "review", "reviews") + '</a><a href="#qa">' + plural(qa.count, "question", "questions") + " answered</a><span>Sold " + (p.unit === "pc" ? "per piece" : "per " + esc(p.unit)) + "</span><span>Generic, unbranded</span></p>" +
      '<div id="priceBox">' + priceHTML() + '</div><div id="offerBox"></div><div id="etaBox" aria-live="off">' + etaHTML() + '</div><div id="stockBox">' + stockHTML() + "</div>" +
      '<div id="optBox">' + optHTML() + '</div><div id="qtyBox">' + qtyHTML() + '</div><div id="buyBox">' + buyHTML() + '</div><div id="yoBox">' + yourOrdersHTML(p) + "</div>" +
      '<div class="pincheck" id="pinBox">' + pinHTML(null) + "</div>" +
      '<ul class="pfacts"><li>Shop price from ' + qtyText(p, p.min) + ", wholesale from " + qtyText(p, p.wq) + ".</li><li>" + (!p.custom ? "Sold plain, not personalised." : p.pr.blend === "engrave" ? "Can be engraved with your name or logo." : "Can be printed with your name, logo or photos.") + "</li><li>COD across West Bengal. GST bill on request.</li><li>" + esc(D.returnPolicy(p).short) + ".</li></ul>" +
      "</div></div></div>" +
      '<nav class="ptabs" aria-label="On this page"><div class="wrap"><ul><li><a href="#desc">Description</a></li><li><a href="#fbt">Bought together</a></li><li><a href="#specs">Specifications</a></li><li><a href="#sizes">Size</a></li><li><a href="#printing">Printing options</a></li><li><a href="#returns">Returns</a></li><li><a href="#reviews">Reviews (' + rating.n + ')</a></li><li><a href="#qa">Q&amp;A</a></li></ul></div></nav>' +
      '<div class="wrap"><section class="psec" id="desc"><h2>Description</h2><div><p>' + esc(p.desc) + "</p></div></section>" + '<section class="psec" id="fbt"><h2>Frequently bought together</h2>' + fbt.html + "</section>" +
      '<section class="psec" id="specs"><h2>Specifications</h2><div><table class="specs"><tbody>' + p.specs.concat([["Sold", p.unit], ["Brand", "Generic, unbranded"], ["HSN", STORE.hsn[p.cat] || "4820"], ["Sourced from", mkName(p) + ", Kolkata"]]).map(function (s) { return '<tr><th scope="row">' + esc(s[0]) + "</th><td>" + esc(s[1]) + "</td></tr>"; }).join("") + '</tbody></table><p class="small muted" style="margin-top:.5rem">Market names show where this kind of item is usually bought wholesale in Kolkata. Prices are samples.</p></div></section>' +
      '<section class="psec" id="sizes"><h2>Size and dimensions</h2><div>' + sizeGuideHTML(p, cur).split("<h3")[0].split('<label class="check"').join('<label hidden class="check"').split('class="textbtn" data-sgpick').join('hidden data-x') + '<p style="margin-top:.6rem"><button type="button" class="btn btn--ghost btn--sm" data-sizeguide>Open the size guide</button></p></div></section>' +
      '<section class="psec" id="printing"><h2>Printing options</h2><div>' + (p.custom ? '<ul class="mlist">' + methods + '</ul><p style="margin-top:1rem"><a class="btn btn--line" href="' + u("/design/" + p.slug + "?v=" + cur.id) + '">Open the design studio</a></p>' : "<p>This item is sold plain. It is not personalised.</p>") + '</div></section>' +
      '<section class="psec" id="returns"><h2>Returns and exchange</h2><div><p><b>' + esc(D.returnPolicy(p).short) + ".</b> " + esc(D.returnPolicy(p).text) + '</p><p class="small muted" style="margin-top:.4rem">Personalised versions of this item cannot be returned unless the print is faulty. <a href="' + u("/policies/returns") + '">Full returns policy</a></p></div></section>' +
      '<section class="psec" id="reviews"><h2>Reviews</h2>' + rv.html + "</section>" +
      '<section class="psec" id="qa"><h2>Questions and answers</h2>' + qa.html + "</section></div>" +
      stripHTML(also, "More in " + cat.short.toLowerCase(), "") + recentStrip([p.slug], "Recently viewed") +
      '<div class="sticky-buy" id="stickyBuy" aria-hidden="true"><div style="min-width:0"><b id="sbPrice" class="notranslate"></b><span class="small muted" id="sbEta"></span></div><a class="btn btn--wa btn--icon" id="sbWa" data-wa-order href="#" target="_blank" rel="noopener" tabindex="-1" aria-label="Order ' + esc(p.name) + ' on WhatsApp">' + WA_ICON + '</a><button class="btn btn--blue" type="button" data-add tabindex="-1">Add to cart</button></div>';
    function waHref() { var h = S.wa(waProduct(p, cur, qty, { note: engr ? note.trim() : "" })), a = $("#waBtn"), s = $("#sbWa"); if (a) a.href = h; if (s) { s.href = h; s.hidden = cur.stock <= 0; } }
    function paintEta() { var e = eta({ p: p, v: cur, qty: qty }), key = e ? fDate(e.to) : "out"; $("#etaBox").innerHTML = etaHTML(); $("#sbEta").textContent = e ? " · By " + fDate(e.to) : " · Back in stock soon"; if (lastEta && key !== lastEta) S.announce(e ? "Delivery by " + fDate(e.to) : "Back in stock soon"); lastEta = key; }
    function paint(what) {
      var t = tierOf(p, cur, qty);
      if (what !== "qty") { $("#optBox").innerHTML = optHTML(); $("#stockBox").innerHTML = stockHTML(); $("#gal").innerHTML = galHTML(); }
      $("#priceBox").innerHTML = priceHTML(); lastTier = t.k; $("#offerBox").innerHTML = offersHTML(p, cur, qty); shareState[p.slug] = { v: cur, qty: qty }; setMeta(p, cur); fbt.refresh();
      $("#qtyBox").innerHTML = qtyHTML(); $("#buyBox").innerHTML = buyHTML();
      $("#sbPrice").textContent = qtyText(p, qty) + " · " + money(t.price * qty);
      var sb = $("#stickyBuy [data-add]"); sb.disabled = cur.stock <= 0; sb.textContent = cur.stock <= 0 ? "Out of stock" : "Add to cart";
      paintEta(); waHref(); observeBuy();
    }
    function setQty(n, typed, focusSel) {
      var before = tierOf(p, cur, qty).k, raw = parseInt(n, 10), nq = snap(p, n, p.min, cur.stock);
      qmsg = "";
      if (typed && (isNaN(raw) || raw !== nq)) qmsg = isNaN(raw) ? "Type a number. Set to " + nq + "." : raw < p.min ? "The minimum is " + qtyText(p, p.min) + ". Set to " + nq + "." : raw > cur.stock ? "Only " + n0(cur.stock) + " in stock, so the quantity is set to " + nq + '. For ' + raw + ', <button type="button" class="textbtn" style="min-height:0" data-quote="' + p.slug + "|" + cur.id + "|" + raw + '">get a bulk quote</button>.' : "Sold in steps of " + p.step + ". Changed to " + nq + ".";
      qty = nq; paint("qty");
      var t = tierOf(p, cur, qty);
      if (t.k !== before) S.announce(t.k === "retail" ? "Shop price: " + money(t.price) + " " + perText(p) : t.name + " applied: " + money(t.price) + " " + perText(p));
      else S.announce("Quantity " + qty + (qmsg ? ". " + qmsg.replace(/<[^>]+>/g, "") : ""));
      var f = focusSel && $(focusSel); if (f && !f.disabled) f.focus(); else if (focusSel) $("#pq").focus();
    }
    var io = null;
    function observeBuy() {
      if (!("IntersectionObserver" in window)) return;
      if (io) io.disconnect();
      var bar = $("#stickyBuy"), target = $("#buyMain");
      io = new IntersectionObserver(function (en) {
        var e = en[0], on = !e.isIntersecting && e.boundingClientRect.top < 0 && window.innerWidth < 900;
        bar.classList.toggle("is-on", on); bar.setAttribute("aria-hidden", on ? "false" : "true");
        $("#stickyBuy [data-add]").tabIndex = on ? 0 : -1; $("#sbWa").tabIndex = on ? 0 : -1; document.body.classList.toggle("has-bar", on);
      });
      io.observe(target);
    }
    var tick = setInterval(paintEta, 60000);
    onCleanup(function () { if (io) io.disconnect(); clearInterval(tick); if (stopReel) stopReel(); });
    paint("all");
    function onClick(e) {
      var t = e.target, b;
      if ((b = t.closest("[data-var]"))) {
        var nv = vOf(p, b.getAttribute("data-var"));
        if (b.getAttribute("aria-disabled") === "true") { S.announce(nv.label + " is out of stock. Try another option."); S.toast(nv.label + " is out of stock", { icon: false }); return; }
        cur = nv; gi = 0; qty = snap(p, qty, p.min, Math.max(p.min, cur.stock)); qmsg = ""; paint("all"); var fb = $('[data-var="' + cur.id + '"]'); if (fb) fb.focus();
        S.announce(cur.label + ". " + money(cur.price) + " " + perText(p) + ". " + stockText(p, cur)[0] + ".");
        return;
      }
      if ((b = t.closest("[data-tier]"))) { setQty(+b.getAttribute("data-tier"), false, '[data-tier="' + b.getAttribute("data-tier") + '"]'); return; }
      if ((b = t.closest("[data-ti]"))) { if (stopReel) { stopReel(); stopReel = null; } gi = +b.getAttribute("data-ti"); $("#gal").innerHTML = galHTML(); var tb = $('[data-ti="' + gi + '"]'); if (tb) tb.focus(); return; }
      if (t.closest("[data-zoommain]")) { var g = gallery(); openZoom(IMG + g[gi] + "-800.webp", p.name); return; }
      if (t.closest("[data-reel]")) { var mb = $(".gal__main"); if (!mb) return; var box = document.createElement("div"); box.className = "gal__main reel"; mb.replaceWith(box); if (stopReel) stopReel(); stopReel = reelPlay(box, p, cur); var cap = document.createElement("p"); cap.className = "small muted"; cap.textContent = "Product reel made from the photos, with prices. No sound."; $("#gal").appendChild(cap); return; }
      if (t.closest("[data-sizeguide]")) { openSizeGuide(p, cur, function (v) { cur = v; qty = snap(p, qty, p.min, Math.max(p.min, cur.stock)); paint("all"); var fb = $('[data-var="' + cur.id + '"]'); if (fb) fb.focus(); }); return; }
      if (t.closest("[data-chpin]")) { var pi = $("#pinIn"); pi.scrollIntoView({ block: "center", behavior: S.reducedMotion() ? "auto" : "smooth" }); pi.focus({ preventScroll: true }); pi.select(); return; }
      if ((b = t.closest("[data-pq]"))) { var dir = b.getAttribute("data-pq"); setQty(qty + (+dir) * p.step, false, '[data-pq="' + dir + '"]'); return; }
      if (t.closest("[data-add]")) { addToCart(p.slug, cur.id, qty, { note: engr ? note.trim() : "" }); return; }
    }
    view.addEventListener("click", onClick);
    function onChange(e) { if (e.target.id === "pq") setQty(e.target.value, true, "#pq"); }
    function onInput(e) { if (e.target.id === "pnote") { note = e.target.value; waHref(); } }
    function onKey(e) { if (e.target.id === "pq" && e.key === "Enter") { e.preventDefault(); setQty(e.target.value, true, "#pq"); } }
    view.addEventListener("change", onChange); view.addEventListener("input", onInput); view.addEventListener("keydown", onKey);
    function onSubmit(e) {
      if (e.target.id === "pinForm") {
        e.preventDefault(); var v = $("#pinIn").value.trim(), res = delivery(v);
        if (!res) { $("#pinBox").innerHTML = pinHTML(null, "Enter a 6-digit PIN code, for example 700009."); $("#pinIn").focus(); return; }
        store.pin.set(v); savedPin = v; $("#pinBox").innerHTML = pinHTML(res); paintEta(); waHref(); $("#pinIn").focus();
        S.announce("Delivery to " + v + " by " + (eta({ p: p, v: cur, qty: qty }) ? fDate(eta({ p: p, v: cur, qty: qty }).to) : "a later date"));
      }
    }
    view.addEventListener("submit", onSubmit);
    onCleanup(function () { view.removeEventListener("click", onClick); view.removeEventListener("submit", onSubmit); view.removeEventListener("change", onChange); view.removeEventListener("input", onInput); view.removeEventListener("keydown", onKey); document.body.classList.remove("has-bar"); });
    if (savedPin && delivery(savedPin)) $("#pinBox").innerHTML = pinHTML(delivery(savedPin));
    rv.mount(); qa.mount(); fbt.mount();
    if (location.hash === "#write" || location.hash === "#reviews") setTimeout(function () { var s = $("#reviews"); if (s) s.scrollIntoView({ behavior: "auto" }); var f = $('input[name="rvStar"]'); if (f && location.hash === "#write") f.focus({ preventScroll: true }); }, 50);
  }

  // ---------- cart page ----------
  function renderCartPage() {
    var t = totals();
    var html = '<div class="wrap"><ol class="crumbs"><li><a href="' + u() + '">Home</a></li><li aria-current="page">Cart</li></ol><div class="page-h"><h1>Your cart</h1></div>';
    if (!t.count) html += emptyCart() + "</div>";
    else html += '<div class="cartpage"><div>' + progressHTML(t) + "<ul>" + t.lines.map(function (l) { return lineHTML(l, "p"); }).join("") + "</ul>" +
      '<div class="note" style="margin-top:1rem">' + I.quote + '<span>Buying for a school or an event? <button type="button" class="textbtn" data-quote-cart style="min-height:0">Get a bulk quote for this whole cart</button> and we reply with a special rate.</span></div></div>' +
      '<aside><div class="box"><h2>Order summary</h2><div style="display:grid;gap:.9rem">' + pinMiniHTML("p") + couponHTML(t, "p") + summaryHTML(t) +
      '<a class="btn btn--blue btn--block" href="' + u("/checkout") + '">Checkout securely</a><p class="small muted" style="text-align:center">UPI, cards, netbanking, bank transfer or cash on delivery</p>' +
      '<a class="btn btn--wa btn--block" data-wa-order href="' + esc(S.wa(waCart())) + '" target="_blank" rel="noopener">' + WA_ICON + 'Order the whole cart on WhatsApp instead</a><p class="small muted" style="text-align:center">Opens WhatsApp with every line, quantity and price written out. We confirm stock and delivery there.</p></div></div></aside></div></div>' +
      '<div class="sticky-buy is-on" style="display:flex"><div><span class="small muted">Total</span><b class="notranslate">' + money(t.total) + '</b></div><a class="btn btn--blue" href="' + u("/checkout") + '">Checkout</a></div>';
    var inCart = cart().map(function (l) { return l.slug; });
    var often = []; cart().forEach(function (l) { fbtFor(P[l.slug]).forEach(function (x) { if (inCart.indexOf(x.slug) < 0 && often.indexOf(x) < 0) often.push(x); }); });
    html += (often.length ? stripHTML(often.slice(0, 8), "Often bought with items in your cart", "") : "") + recentStrip(inCart, "Recently viewed");
    view.innerHTML = html;
    var bar = $(".sticky-buy", view); if (bar) { var mob = window.innerWidth < 960; bar.style.display = mob ? "flex" : "none"; document.body.classList.toggle("has-bar", mob); }
  }
  function vCart() { setTitle("Cart"); renderCartPage(); onCleanup(function () { document.body.classList.remove("has-bar"); }); }

  // ---------- checkout ----------
  function vCheckout() {
    setTitle("Checkout");
    if (!cart().length) { view.innerHTML = '<div class="wrap" style="padding-block:2rem"><h1 class="sr">Checkout</h1>' + emptyCart() + "</div>"; return; }
    var sd = store.details.get(null);
    co = { step: 1, save: !!sd, d: sd ? JSON.parse(JSON.stringify(sd)) : { mobile: "", email: "", name: "", house: "", street: "", landmark: "", city: "", state: "", pin: store.pin.get("") || "", biz: "", gstin: "" }, delivery: "ship", pay: "upi", errs: {}, auto: false };
    if (co.d.biz == null) co.d.biz = ""; if (co.d.gstin == null) co.d.gstin = "";
    if (co.d.pin && !co.d.city) { var dd = delivery(co.d.pin); if (dd && dd.city) { co.d.city = dd.city; co.d.state = dd.state; co.auto = true; } }
    drawCheckout();
  }
  function coTotals() { return totals({ pin: co.d.pin, pickup: co.delivery === "pickup" }); }
  function field(id, label, opt) {
    opt = opt || {}; var v = co.d[id] || "", e = co.errs[id];
    var input = opt.select ? '<select class="inp" id="f-' + id + '" name="' + id + '" autocomplete="' + (opt.ac || "off") + '"' + (e ? ' aria-invalid="true"' : "") + ' aria-describedby="e-' + id + '"><option value="">Choose your state</option>' + D.STATES.map(function (s) { return "<option" + (s === v ? " selected" : "") + ">" + s + "</option>"; }).join("") + "</select>" :
      '<input class="inp' + (opt.nt ? " notranslate" : "") + '" id="f-' + id + '" name="' + id + '" value="' + esc(v) + '" autocomplete="' + (opt.ac || "off") + '"' + (opt.type ? ' type="' + opt.type + '"' : "") + (opt.im ? ' inputmode="' + opt.im + '"' : "") + (opt.max ? ' maxlength="' + opt.max + '"' : "") + (opt.req === false ? "" : ' aria-required="true"') + ' aria-describedby="' + (opt.hint ? "h-" + id + " " : "") + "e-" + id + '"' + (e ? ' aria-invalid="true"' : "") + (opt.up ? ' style="text-transform:uppercase"' : "") + ">";
    return '<div class="field' + (opt.span ? " span2" : "") + '"><label for="f-' + id + '">' + label + (opt.req === false ? ' <span class="muted">(optional)</span>' : "") + "</label>" + input + (opt.hint ? '<span class="hint" id="h-' + id + '">' + opt.hint + "</span>" : "") + '<p class="err" id="e-' + id + '">' + (e || "") + "</p></div>";
  }
  function validate() {
    var d = co.d, e = {};
    if (!S.validMobile(d.mobile)) e.mobile = "Enter a 10-digit mobile number starting with 6, 7, 8 or 9.";
    if (d.email && !S.validEmail(d.email)) e.email = "Check the email address, for example name@gmail.com. Or leave it empty.";
    if (d.name.trim().length < 2) e.name = "Enter the name of the person receiving the parcel.";
    if (!d.house.trim()) e.house = "Enter your house, flat or shop number and building.";
    if (!d.street.trim()) e.street = "Enter the street, road or area.";
    if (!d.city.trim()) e.city = "Enter your town or city.";
    if (!d.state) e.state = "Choose your state from the list.";
    if (!S.validPin(d.pin)) e.pin = "Enter a 6-digit PIN code, for example 700009.";
    if (d.gstin && !validGstin(d.gstin)) e.gstin = "A GSTIN has 15 letters and numbers, like 19AAACK1234A1Z5. Check it, or leave it empty.";
    co.errs = e; return Object.keys(e);
  }
  /** Order dates from the same eta() the product pages use: the latest line decides. */
  function etaRange(dv, pickup) {
    var from = null, to = null, disp = null;
    cart().forEach(function (l) { var p = P[l.slug], e = eta({ p: p, v: vOf(p, l.vid), qty: l.qty, method: l.d ? l.d.method : l.note ? "laser" : "", pin: dv ? dv.pin : "" }); if (!e) return; if (!from || e.from > from) from = e.from; if (!to || e.to > to) to = e.to; if (!disp || e.dispatch > disp) disp = e.dispatch; });
    if (!to) { from = addDays(3); to = addDays(6); disp = addDays(1); }
    return pickup ? [disp, disp] : [from, to];
  }
  function payName(k) { return { upi: "UPI", card: "Card", netbanking: "Netbanking", bank: "Bank transfer (NEFT/RTGS)", cod: "Cash on delivery" }[k] || k; }
  function bankHTML() { var b = STORE.bank; return '<div class="bankbox"><span class="sample-tag">Sample</span> <b>Bank details (SAMPLE, do not pay)</b><dl><dt>Account name</dt><dd class="notranslate">' + b.name + "</dd><dt>Bank</dt><dd>" + b.bank + '</dd><dt>Account no.</dt><dd class="notranslate">' + b.ac + '</dd><dt>IFSC</dt><dd class="notranslate">' + b.ifsc + "</dd></dl><p class=\"small muted\" style=\"margin-top:.4rem\">We pack your order when the money reaches us. Send the UTR number on WhatsApp.</p></div>"; }
  function drawCheckout(keep) {
    if (!co) return;
    if (!cart().length) { vCheckout(); return; }
    var t = coTotals(), d = co.d, dv = delivery(d.pin), codOk = co.delivery === "pickup" || codAllowed(dv, t.total);
    if (!codOk && co.pay === "cod") co.pay = "upi";
    var stepsNames = ["Address", "Delivery", "Payment"];
    var steps = '<ol class="steps" aria-label="Checkout progress">' + stepsNames.map(function (n, i) { var s = i + 1 < co.step ? "done" : i + 1 === co.step ? "now" : "todo"; return '<li data-s="' + s + '"' + (s === "now" ? ' aria-current="step"' : "") + ">" + (i + 1) + ". " + n + (s === "done" ? '<span class="sr"> (done)</span>' : "") + "</li>"; }).join("") + "</ol>";
    var sumItems = t.lines.map(function (l) { return '<div class="mini">' + (l.l.d && l.l.d.thumb ? thumbImg(l.l.d.thumb, "Your design", 48) : img(l.v.img, "", "48px")) + "<span>" + esc(l.p.name) + (l.p.variants.length > 1 ? '<br><span class="muted">' + esc(l.v.label) + "</span>" : "") + "<br>" + calcText(l) + (l.l.d ? '<br><span style="color:var(--blue-deep);font-weight:700">' + esc(customText(l.l.d)) + "</span>" : "") + "</span><b class=\"notranslate\">" + money(l.total) + "</b></div>"; }).join("");
    var sumBody = sumItems + '<div style="margin:.7rem 0">' + couponHTML(t, "c") + "</div>" + summaryHTML(t);
    var main = "";
    var done1 = '<div class="co-done"><span><b>Deliver to</b><br>' + esc(d.name) + (d.biz ? ", " + esc(d.biz) : "") + ", " + esc(d.house) + ", " + esc(d.street) + (d.landmark ? ", near " + esc(d.landmark) : "") + ", " + esc(d.city) + ", " + esc(d.state) + ' <span class="notranslate">' + esc(d.pin) + '</span><br><span class="notranslate">' + fmtMobile(d.mobile) + "</span>" + (d.gstin ? '<br>GSTIN <span class="notranslate">' + esc(d.gstin) + "</span>" : "") + "</span>" + '<button type="button" class="textbtn" data-co-go="1">Change<span class="sr"> address</span></button></div>';
    var er = etaRange(dv, co.delivery === "pickup");
    var done2 = '<div class="co-done"><span><b>' + (co.delivery === "pickup" ? "Pick up from College Street" : "Delivery") + "</b><br>" + (co.delivery === "pickup" ? "Ready from " + fDate(er[0]) : "Arrives " + fDate(er[0]) + " to " + fDate(er[1])) + '</span><button type="button" class="textbtn" data-co-go="2">Change<span class="sr"> delivery</span></button></div>';
    if (co.step === 1) {
      main = '<form class="co-step" id="coForm" novalidate><h2>Contact and address</h2><p class="small muted">Guest checkout. No account needed.</p>' +
        (Object.keys(co.errs).length ? '<div class="note note--warn" role="alert">' + I.info + "<span>Please fix " + plural(Object.keys(co.errs).length, "field", "fields") + " below.</span></div>" : "") +
        '<div class="form-grid form-grid--2">' +
        field("mobile", "Mobile number", { type: "tel", im: "numeric", ac: "tel-national", max: 14, nt: true, hint: "10 digits. Order updates come on WhatsApp." }) +
        field("email", "Email", { type: "email", ac: "email", req: false, nt: true }) +
        field("name", "Full name", { ac: "name", span: true }) +
        field("house", "House, flat or shop number, building", { ac: "address-line1", span: true }) +
        field("street", "Street, road or area", { ac: "address-line2", span: true }) +
        field("landmark", "Landmark", { req: false, span: true, hint: "Near a school, temple or bus stop" }) +
        field("city", "Town or city", { ac: "address-level2" }) +
        field("state", "State", { select: true, ac: "address-level1" }) +
        field("pin", "PIN code", { im: "numeric", ac: "postal-code", max: 6, nt: true, hint: "City and state fill in from the PIN." }) +
        '</div><fieldset class="bizbox" style="margin:0"><legend class="lab" style="padding:0 .3rem">Business details <span class="muted">(optional, for a GST bill)</span></legend><div class="form-grid form-grid--2">' +
        field("biz", "Business, school or office name", { req: false, ac: "organization" }) + field("gstin", "GSTIN", { req: false, nt: true, max: 15, up: true, hint: "15 characters, for example 19AAACK1234A1Z5" }) + "</div></fieldset>" +
        '<label class="check"><input type="checkbox" id="saveMe"' + (co.save ? " checked" : "") + '><span>Save my details on this device for next time</span></label>' +
        '<div class="co-nav"><a class="textbtn" href="' + u("/cart") + '">Back to cart</a><button class="btn btn--blue" type="submit">Continue to delivery</button></div></form>';
    } else if (co.step === 2) {
      var sh = shipFor(dv, t.after, t.freeShip), es = etaRange(dv, false), ep = etaRange(dv, true);
      main = done1 + '<form class="co-step" id="coForm" novalidate><h2>Delivery</h2><fieldset style="border:0;padding:0;margin:0;display:grid;gap:.7rem"><legend class="sr">How you get the order</legend>' +
        '<label class="radio-card"><input type="radio" name="dl" value="ship"' + (co.delivery === "ship" ? " checked" : "") + "><span><b>Deliver to " + esc(d.city) + '</b><span class="small muted">' + (sh.transport ? "By road transport. Transport charge confirmed on WhatsApp (sample)." : (dv && dv.zone === "india" ? "Courier or India Post. " : "Courier. ") + fDate(es[0]) + " to " + fDate(es[1])) + '</span></span><span class="r">' + (sh.transport ? "Quoted" : sh.fee ? M(sh.fee) : '<span class="ok">Free</span>') + "</span></label>" +
        '<label class="radio-card"><input type="radio" name="dl" value="pickup"' + (co.delivery === "pickup" ? " checked" : "") + '><span><b>Pick up from our shop</b><span class="small muted">18 College Row, College Street. Ready from ' + fDate(ep[0]) + '.</span></span><span class="r ok">Free</span></label></fieldset>' +
        (cart().some(function (l) { return l.d || l.note; }) ? '<p class="small muted">Printed and engraved items need 2 to 4 extra working days. The dates above include that.</p>' : "") +
        '<div class="co-nav"><button type="button" class="textbtn" data-co-go="1">Back</button><button class="btn btn--blue" type="submit">Continue to payment</button></div></form>';
    } else {
      var outsideNote = dv && dv.remote ? "Not available for PIN " + d.pin : "Only on orders up to " + money(STORE.codMaxOutside) + " outside West Bengal";
      var pays = [["upi", "UPI", "Google Pay, PhonePe, Paytm or any UPI app"], ["card", "Credit or debit card", "Visa, Mastercard, RuPay"], ["netbanking", "Netbanking", "All major Indian banks"], ["bank", "Bank transfer (NEFT/RTGS)", "For schools and offices. Account details shown next."], ["cod", "Cash on delivery", codOk ? (co.delivery === "pickup" ? "Pay at the counter when you collect." : "Pay when it arrives. No extra fee.") : outsideNote]];
      main = done1 + done2 + '<form class="co-step" id="coForm" novalidate><h2>Payment</h2><fieldset style="border:0;padding:0;margin:0;display:grid;gap:.7rem"><legend class="sr">Payment method</legend>' +
        pays.map(function (x) { var dis = x[0] === "cod" && !codOk; return '<label class="radio-card' + (dis ? " is-off" : "") + '"><input type="radio" name="pay" value="' + x[0] + '"' + (co.pay === x[0] ? " checked" : "") + (dis ? " disabled" : "") + "><span><b>" + x[1] + '</b><span class="small muted">' + esc(x[2]) + "</span>" + (x[0] === "bank" && co.pay === "bank" ? bankHTML() : "") + "</span></label>"; }).join("") +
        '</fieldset><div class="note">' + I.lock + "<span>In the real store, you pay on Razorpay's secure page. This sample takes no money and asks for no card or bank details.</span></div>" +
        '<div class="co-nav"><button type="button" class="textbtn" data-co-go="2">Back</button><button class="btn btn--blue" type="submit" id="payBtn">' + (co.pay === "cod" || co.pay === "bank" ? "Place order · " : "Pay ") + '<span class="notranslate">' + money(t.total) + "</span></button></div></form>";
    }
    view.innerHTML = '<div class="wrap"><div class="page-h" style="padding-top:1.25rem"><h1>Checkout</h1></div>' + steps +
      '<div class="co"><div><details class="box co-sum-mob"><summary>Order summary (' + t.n + ') <span class="notranslate">' + money(t.total) + "</span></summary>" + sumBody.replace(/id="cp-c"/, 'id="cp-cm"').replace(/for="cp-c"/, 'for="cp-cm"').replace(/cpe-c/g, "cpe-cm").replace(/unc-c/, "unc-cm") + "</details>" +
      '<div style="margin-top:1rem">' + main + '</div></div><aside class="co-sum-desk"><div class="box"><h2>Order summary</h2>' + sumBody + "</div></aside></div></div>";
    if (!keep) { var fe = co.step === 1 ? $("#coForm [aria-invalid=true]") : null; if (fe) fe.focus(); }
  }
  document.addEventListener("input", function (e) {
    if (!co || route().name !== "checkout" || !e.target.closest("#coForm")) return;
    var n = e.target.name; if (!n || !(n in co.d)) return;
    co.d[n] = n === "gstin" ? e.target.value.toUpperCase() : e.target.value;
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
    if (e.target.name === "dl") { co.delivery = e.target.value; drawCheckout(true); var r = $('input[name="dl"][value="' + co.delivery + '"]'); if (r) r.focus(); S.announce(co.delivery === "pickup" ? "Pick up chosen. Delivery is free." : "Delivery chosen"); }
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
      co.d.mobile = digits(co.d.mobile); co.d.gstin = (co.d.gstin || "").trim().toUpperCase();
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
    ov.innerHTML = '<div><span class="spin"></span><p><b>' + (co.pay === "cod" || co.pay === "bank" ? "Placing your order" : "Processing your sample payment") + '</b></p><p class="small muted">Sample only: no money is taken.</p></div>';
    document.body.appendChild(ov);
    setTimeout(function () {
      var t = coTotals(), dv = delivery(co.d.pin), er = etaRange(dv, co.delivery === "pickup"), n = 200400 + myOrders().length * 7 + Math.floor(Math.random() * 90);
      var o = { no: "KKS-" + n, created: Date.now(), mobile: digits(co.d.mobile), email: co.d.email, name: co.d.name, biz: co.d.biz || "", gstin: co.d.gstin || "",
        addr: { house: co.d.house, street: co.d.street, landmark: co.d.landmark, city: co.d.city, state: co.d.state, pin: co.d.pin },
        items: t.lines.map(function (l) {
          return { slug: l.p.slug, vid: l.v.id, name: l.p.name, var: l.v.label, unit: l.tier.price, tier: l.tier.k, retail: l.v.price, qty: l.qty, img: l.v.img, cat: l.p.cat, total: l.total, uw: unitWord(l.p, l.qty), note: l.l.note || "",
            print: l.print ? { method: l.l.d.method, name: l.print.name, rate: l.print.rate, setup: l.print.setup, sides: l.l.d.sides || [], thumb: l.l.d.thumb || "", designId: l.l.d.id, names: l.l.d.names || 0, text: customText(l.l.d) } : null };
        }),
        delivery: co.delivery, pay: co.pay, eta: [er[0].getTime(), er[1].getTime()],
        totals: { subtotal: t.subtotal, save: t.save, setup: t.setup, discount: t.discount, ship: t.ship.fee || 0, transport: !!t.ship.transport, pickup: co.delivery === "pickup", total: t.total, gst: t.gst },
        coupon: t.coupon && t.coupon.ok ? t.coupon.code : "" };
      var os = myOrders(); os.unshift(o); store.orders.set(os);
      recordSold(o.items);
      store.cart.set([]); store.coupon.remove();
      ov.remove(); co = null; navigate(u("/order/" + o.no), true); S.toast("Order placed");
    }, 1400);
  }

  // ---------- order confirmation ----------
  function addrHTML(o) { var a = o.addr; return esc(o.name) + (o.biz ? "<br>" + esc(o.biz) : "") + "<br>" + esc(a.house) + ", " + esc(a.street) + (a.landmark ? "<br>Near " + esc(a.landmark) : "") + "<br>" + esc(a.city) + ", " + esc(a.state) + ' <span class="notranslate">' + esc(a.pin) + '</span><br><span class="notranslate">' + fmtMobile(o.mobile) + "</span>" + (o.gstin ? '<br>GSTIN: <span class="notranslate">' + esc(o.gstin) + "</span>" : ""); }
  function itemCalc(l) { return '<span class="notranslate">' + l.qty + " " + (l.uw || "") + " × " + (l.print ? "(" + money(l.unit) + " + " + money(l.print.rate) + " print)" + (l.print.setup ? " + setup " + money(l.print.setup) : "") : money(l.unit)) + " = " + money(l.total) + "</span>"; }
  function itemsHTML(o) {
    return o.items.map(function (l) {
      return '<div class="mini">' + (l.print && l.print.thumb ? thumbImg(l.print.thumb, "Your design", 48) : img(l.img, "", "48px")) + "<span>" + esc(l.name) + (l.var && P[l.slug] && P[l.slug].variants.length > 1 ? '<br><span class="muted">' + esc(l.var) + "</span>" : "") + "<br>" + itemCalc(l) +
        (l.tier && l.tier !== "retail" ? ' <span class="tier-pill">' + (l.tier === "bulk" ? "Bulk" : "Wholesale") + "</span>" : "") +
        (l.print ? '<br><span style="color:var(--blue-deep);font-weight:700">' + esc(l.print.text) + "</span>" : "") + (l.note ? '<br><span style="color:var(--blue-deep);font-weight:700">Engrave: “' + esc(l.note) + "”</span>" : "") + '</span><b class="notranslate">' + money(l.total) + "</b></div>";
    }).join("");
  }
  function totalsHTML(o) {
    var t = o.totals;
    return summaryHTML({ n: o.items.length, subtotal: t.subtotal, save: t.save || 0, setup: t.setup || 0, discount: t.discount, coupon: { code: o.coupon }, after: t.subtotal - t.discount, dv: delivery(o.addr.pin), ship: t.pickup ? { fee: 0, pickup: true } : t.transport ? { fee: 0, transport: true } : { fee: t.ship }, total: t.total, gst: t.gst });
  }
  function waSummary(o) {
    return "Hello, this is my sample order from the Kolom Khata Stationers demo store.\nOrder: " + o.no + "\n" + o.items.map(function (l) { return "- " + l.name + (l.var ? " (" + l.var + ")" : "") + ": " + l.qty + " " + (l.uw || "") + ", " + money(l.total) + (l.print ? ". " + l.print.text : "") + (l.note ? ". Engrave: " + l.note : ""); }).join("\n") +
      "\nTotal: " + money(o.totals.total) + " (" + payName(o.pay) + ")\n" + (o.delivery === "pickup" ? "Pick up at College Street" : "Deliver to: " + o.addr.city + " " + o.addr.pin) + "\nExpected: " + fDate(o.eta[0]) + " to " + fDate(o.eta[1]);
  }
  function vOrder(r) {
    var o = findOrder(r.no);
    if (!o) { setTitle("Order not found"); view.innerHTML = '<div class="wrap" style="padding-block:2rem"><h1 class="sr">Order not found</h1><div class="empty">' + I.box + "<h2>We could not find that order</h2><p>Sample orders are saved only in the browser where they were placed.</p><a class=\"btn btn--blue\" href=\"" + u("/track") + '">Track an order</a></div></div>'; return; }
    setTitle("Order " + o.no);
    view.innerHTML = '<div class="wrap" style="max-width:980px;padding-bottom:3rem"><div class="thanks">' + I.check.replace("<svg", '<svg style="width:60px;height:60px;color:var(--green);margin:0 auto .8rem;display:block"') + "<h1>Thank you, " + esc(o.name.split(" ")[0]) + '. Your order is placed.</h1><p style="margin-top:.5rem">Order number <b class="ono notranslate">' + o.no + "</b> · " + fDT(o.created) + "</p>" +
      '<p class="muted" style="margin-top:.35rem">You will get updates on WhatsApp. (Sample: nothing is actually sent.)</p>' +
      (o.pay === "bank" ? '<div style="max-width:440px;margin:1rem auto 0;text-align:left">' + bankHTML() + "</div>" : "") +
      '<div class="btn-row" style="justify-content:center"><a class="btn btn--blue" href="' + u("/track?order=" + o.no + "&mobile=" + o.mobile) + '">Track your order</a><a class="btn btn--ghost" href="' + u("/invoice/" + o.no) + '">GST invoice</a><a class="btn btn--ghost" href="' + u("/shop") + '">Continue shopping</a></div>' +
      '<p style="margin-top:1rem"><a class="link" href="' + S.wa(waSummary(o)) + '" target="_blank" rel="noopener">' + I.wa.replace("<svg", '<svg style="width:18px;height:18px;display:inline;vertical-align:-3px;color:#1E8E4E"') + " Send me the summary on WhatsApp</a></p></div>" +
      '<div class="og"><div class="box"><h2>Items</h2>' + itemsHTML(o) + '<div style="margin-top:.7rem">' + totalsHTML(o) + "</div></div>" +
      '<div><div class="box"><h2>' + (o.delivery === "pickup" ? "Pick up" : "Delivery") + "</h2><p>" + addrHTML(o) + '</p><p style="margin-top:.7rem"><b>' + (o.delivery === "pickup" ? "Ready at College Street from" : "Expected") + ":</b> " + fDate(o.eta[0]) + (o.delivery === "pickup" ? "" : " to " + fDate(o.eta[1])) + "</p>" + (o.totals.transport ? '<p class="small muted" style="margin-top:.4rem">Goes by road transport. Transport charge confirmed on WhatsApp (sample).</p>' : "") + "</div>" +
      '<div class="box"><h2>Payment</h2><p>' + payName(o.pay) + (o.pay === "cod" ? ": pay " + M(o.totals.total) + (o.delivery === "pickup" ? " at the counter." : " when it arrives.") : o.pay === "bank" ? ": waiting for your transfer (sample)." : ": paid (sample).") + "</p>" +
      (o.items.some(function (l) { return l.print; }) ? '<p class="small muted" style="margin-top:.5rem">Your approved proofs went to our print room. Printing starts as soon as payment is confirmed.</p>' : "") + "</div></div></div></div>";
  }

  // ---------- invoice ----------
  function vInvoice(r) {
    var o = findOrder(r.no);
    if (!o) { setTitle("Invoice not found"); view.innerHTML = '<div class="wrap" style="padding-block:2rem"><div class="empty"><h1 style="font-size:1.6rem">Invoice not found</h1><p>Sample invoices exist only in the browser where the order was placed.</p><a class="btn btn--blue" href="' + u() + '">Go to the store</a></div></div>'; return; }
    setTitle("Invoice " + o.no);
    var wb = o.addr.state === "West Bengal", t = o.totals;
    var rows = [];
    o.items.forEach(function (l) {
      var unit = l.unit + (l.print ? l.print.rate : 0), amt = unit * l.qty;
      rows.push([l.name + (l.var ? " (" + l.var + ")" : "") + (l.tier && l.tier !== "retail" ? ", " + (l.tier === "bulk" ? "bulk" : "wholesale") + " rate, " + (P[l.slug] ? mkName(P[l.slug]) : "") : "") + (l.print ? ". " + l.print.text : "") + (l.note ? ". Engrave: “" + l.note + "”" : ""), STORE.hsn[l.cat] || "4820", l.qty, unit, amt / 1.12, amt, l.print && l.print.thumb]);
      if (l.print && l.print.setup) rows.push(["Print setup, " + l.name, "998912", 1, l.print.setup, l.print.setup / 1.12, l.print.setup]);
    });
    if (t.ship) rows.push(["Delivery charge", "996812", 1, t.ship, t.ship / 1.12, t.ship]);
    if (t.discount) rows.push(["Less: discount (" + (o.coupon || "coupon") + ")", "", 1, -t.discount, -t.discount / 1.12, -t.discount]);
    var taxable = rows.reduce(function (a, x) { return a + x[4]; }, 0), gst = t.total - taxable;
    function m2(n) { return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    view.innerHTML = '<div class="wrap"><div class="inv-acts" style="margin-top:1rem"><button class="btn btn--blue" type="button" onclick="window.print()">Print / Save as PDF</button><a class="btn btn--ghost" href="' + u("/order/" + o.no) + '">Back to order</a></div>' +
      '<article class="inv"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem"><div><h1>Tax invoice <span class="sample-tag">Sample</span></h1><p class="small muted">Not a valid tax document. Made by a demo store.</p></div>' +
      '<div style="text-align:right"><b class="notranslate">Kolom Khata Stationers</b><br>18 College Row, College Street<br>Kolkata 700009, West Bengal (state code 19)<br>GSTIN: <span class="notranslate">' + STORE.gstin + '</span> <span class="sample-tag">Sample</span></div></div>' +
      '<div class="meta"><div><b>Billed to</b><br>' + addrHTML(o) + (o.gstin ? "" : '<br><span class="muted">Buyer GSTIN: not given (B2C)</span>') + "</div><div><b>Invoice no:</b> <span class=\"notranslate\">INV-" + o.no.replace("KKS-", "") + "</span><br><b>Order no:</b> <span class=\"notranslate\">" + o.no + "</span><br><b>Date:</b> " + new Date(o.created).toLocaleDateString("en-IN") + "<br><b>Place of supply:</b> " + esc(o.addr.state) + "<br><b>Payment:</b> " + payName(o.pay) + "<br><b>Supply:</b> " + (o.gstin ? "B2B (buyer GSTIN above)" : "B2C") + "</div></div>" +
      '<div class="inv-wrap"><table><thead><tr><th>#</th><th>Item</th><th>HSN/SAC</th><th class="n">Qty</th><th class="n">Rate (incl. GST)</th><th class="n">Taxable value</th><th class="n">Amount</th></tr></thead><tbody>' +
      rows.map(function (x, i) { return "<tr><td>" + (i + 1) + "</td><td>" + (x[6] ? '<img src="' + esc(x[6]) + '" alt="Approved design" width="44" height="44">' : "") + esc(x[0]) + '</td><td class="notranslate">' + x[1] + '</td><td class="n">' + x[2] + '</td><td class="n notranslate">' + m2(x[3]) + '</td><td class="n notranslate">' + m2(x[4]) + '</td><td class="n notranslate">' + m2(x[5]) + "</td></tr>"; }).join("") +
      '</tbody><tfoot><tr><th colspan="5" class="n">Total taxable value</th><td class="n notranslate" colspan="2">' + m2(taxable) + "</td></tr>" +
      (wb ? '<tr><th colspan="5" class="n">CGST @ 6%</th><td class="n notranslate" colspan="2">' + m2(gst / 2) + '</td></tr><tr><th colspan="5" class="n">SGST @ 6%</th><td class="n notranslate" colspan="2">' + m2(gst / 2) + "</td></tr>" :
        '<tr><th colspan="5" class="n">IGST @ 12%</th><td class="n notranslate" colspan="2">' + m2(gst) + "</td></tr>") +
      '<tr><th colspan="5" class="n">Invoice total</th><td class="n notranslate" colspan="2"><b>' + m2(t.total) + "</b></td></tr></tfoot></table></div>" +
      (t.save ? '<p style="margin-top:.8rem"><b>You saved <span class="notranslate">' + money(t.save) + "</span> with wholesale prices.</b></p>" : "") +
      (t.transport ? '<p class="small">Transport charge to be billed separately after confirmation on WhatsApp.</p>' : "") +
      '<p class="small muted" style="margin-top:.8rem">' + (wb ? "Supply within West Bengal: CGST and SGST apply." : "Supply outside West Bengal: IGST applies.") + " GST rate shown as a flat 12% for this sample. This invoice was made in your browser and is not a real tax document.</p></article></div>";
  }

  // ---------- track ----------
  function vTrack(r) {
    setTitle("Track your order");
    var qo = (r.q.get("order") || "").toUpperCase(), qm = r.q.get("mobile") || "", timer = null;
    view.innerHTML = '<div class="wrap" style="max-width:760px;padding-bottom:3rem"><ol class="crumbs"><li><a href="' + u() + '">Home</a></li><li aria-current="page">Track order</li></ol><div class="page-h"><h1>Track your order</h1><p class="muted" style="margin-top:.35rem">Enter the order number and the mobile number you used.</p></div>' +
      '<form class="box" id="trackForm" novalidate><div class="form-grid form-grid--2"><div class="field"><label for="tOrder">Order number</label><input class="inp notranslate" id="tOrder" value="' + esc(qo) + '" placeholder="KKS-200311" autocomplete="off" aria-describedby="tOrderErr"><p class="err" id="tOrderErr"></p></div>' +
      '<div class="field"><label for="tMob">Mobile number</label><input class="inp notranslate" id="tMob" type="tel" inputmode="numeric" value="' + esc(qm) + '" placeholder="98300 12345" autocomplete="tel-national" aria-describedby="tMobErr"><p class="err" id="tMobErr"></p></div></div>' +
      '<button class="btn btn--blue" type="submit" style="margin-top:.5rem">Track</button>' +
      '<p class="note" style="margin-top:1rem">' + I.info + '<span>Sample orders to try: <button type="button" class="textbtn notranslate" data-try="KKS-200311|9830012345">KKS-200311</button> (delivered), <button type="button" class="textbtn notranslate" data-try="KKS-200298|9876543210">KKS-200298</button> (shipped), <button type="button" class="textbtn notranslate" data-try="KKS-200305|9123456780">KKS-200305</button> (packed). Orders you place here move one step every 25 seconds.</span></p></form><div id="trackOut" style="margin-top:1.25rem"></div></div>';
    function show(no, mob) {
      clearInterval(timer);
      var out = $("#trackOut"), o = findOrder(no);
      if (!o || digits(o.mobile) !== digits(mob)) { out.innerHTML = '<div class="empty" role="status">' + I.box + "<h2>No order found</h2><p>Check the order number (it starts with KKS-) and use the same mobile number you gave at checkout. Sample orders are only saved in the browser where they were placed.</p></div>"; return; }
      function paintT() {
        var st = stageOf(o), times = stepTimes(o), trk = "SX" + o.no.replace(/\D/g, "") + "IN", custom = o.items.some(function (l) { return l.print || l.note; });
        var steps = [["Order placed", "We have your order."], [custom ? "Printed and packed" : "Packed", custom ? "Printed to your approved proof, checked and packed at College Street." : "Counted, checked and packed at College Street."], ["Shipped", "With Sample Express, tracking number " + trk + "."], ["Out for delivery", "The courier will call before arriving."], ["Delivered", "Thank you for buying from us."]];
        out.innerHTML = '<div class="box"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:.5rem"><h2 style="margin:0">Order <span class="notranslate">' + o.no + '</span></h2><span class="st st--' + STATUS[st] + '">' + (st === 3 ? "Out for delivery" : STATUS[st]) + "</span></div>" +
          '<p class="small muted">Courier: Sample Express · Tracking no. <span class="notranslate">' + trk + "</span> · Expected " + fDate(o.eta[0]) + " to " + fDate(o.eta[1]) + "</p>" +
          '<ol class="tl" aria-label="Order progress">' + steps.map(function (s, i) { var state = i <= st ? "done" : i === st + 1 ? "now" : "todo";
            return '<li data-s="' + state + '"><i>' + (state === "done" ? I.check : "") + "</i><b>" + s[0] + '<span class="sr"> ' + (state === "done" ? "done" : state === "now" ? "next" : "not yet") + "</span></b><small>" + (i <= st ? fDT(times[i]) + " · " + s[1] : i === 4 ? "Expected by " + fDate(o.eta[1]) : "Not yet") + "</small></li>"; }).join("") + "</ol>" +
          '<div class="btn-row" style="margin-top:0"><a class="btn btn--ghost btn--sm" href="' + u("/order/" + o.no) + '">View order</a>' + (o.seed ? "" : '<a class="btn btn--ghost btn--sm" href="' + u("/invoice/" + o.no) + '">Invoice</a>') + "</div></div>";
        if (st >= 4) clearInterval(timer);
      }
      paintT();
      if (!o.seed && stageOf(o) < 4) timer = setInterval(function () { var before = out.querySelector(".st").textContent; paintT(); var after = out.querySelector(".st").textContent; if (before !== after) S.announce("Order status: " + after); }, 5000);
    }
    onCleanup(function () { clearInterval(timer); });
    function submit() {
      var no = $("#tOrder").value.trim().toUpperCase(), mob = $("#tMob").value, ok = true, re = /^KKS-\d{6}$/;
      $("#tOrderErr").textContent = re.test(no) ? "" : "Order numbers look like KKS-200311.";
      $("#tMobErr").textContent = S.validMobile(mob) ? "" : "Enter the 10-digit mobile number used for the order.";
      if (!re.test(no)) { ok = false; $("#tOrder").setAttribute("aria-invalid", "true"); } else $("#tOrder").removeAttribute("aria-invalid");
      if (!S.validMobile(mob)) { ok = false; $("#tMob").setAttribute("aria-invalid", "true"); } else $("#tMob").removeAttribute("aria-invalid");
      if (!ok) { $("#trackForm [aria-invalid=true]").focus(); return; }
      history.replaceState(null, "", u("/track?order=" + no + "&mobile=" + digits(mob)));
      show(no, mob); var h = $("#trackOut h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
    }
    $("#trackForm").addEventListener("submit", function (e) { e.preventDefault(); submit(); });
    $("#trackForm").addEventListener("click", function (e) { var b = e.target.closest("[data-try]"); if (!b) return; var x = b.getAttribute("data-try").split("|"); $("#tOrder").value = x[0]; $("#tMob").value = x[1]; submit(); });
    if (qo && qm) show(qo, qm);
  }

  // ---------- quote page ----------
  function vQuote() {
    setTitle("Bulk quote");
    view.innerHTML = '<div class="wrap" style="max-width:860px;padding-bottom:3rem"><ol class="crumbs"><li><a href="' + u() + '">Home</a></li><li aria-current="page">Bulk quote</li></ol><div class="page-h"><h1>Bulk quote for your school</h1><p class="muted" style="margin-top:.35rem">Schools, shops, offices and event organisers: build one list, send it on WhatsApp, and we reply with a special rate within 2 working hours.</p></div>' +
      '<div class="box" id="quoteBox"><h2>Your quote list</h2><div id="qpItems">' + quoteItemsHTML("p") + '</div><p style="margin-top:.6rem"><a class="btn btn--ghost btn--sm" href="' + u("/shop") + '">+ Add another product</a></p>' + quoteFormHTML("p") + "</div></div>";
  }

  // ---------- account ----------
  function reorder(o) {
    var addedN = 0, skipped = 0;
    o.items.forEach(function (l) {
      var p = P[l.slug], v = p && vOf(p, l.vid); if (!v || v.stock <= 0) { skipped++; return; }
      var d = l.print ? designById(l.print.designId) : null;
      var dsum = l.print && d ? { id: d.id, method: l.print.method, sides: l.print.sides, thumb: l.print.thumb, names: l.print.names } : null;
      if (l.print && !d) { skipped++; return; }
      if (addToCart(l.slug, l.vid, l.qty, { quiet: true, d: dsum, note: l.note })) addedN++;
    });
    S.toast(addedN ? "Added " + plural(addedN, "line", "lines") + " to your cart" + (skipped ? ", " + skipped + " not available" : "") : "Nothing could be added", { icon: !!addedN });
    if (addedN) openCart();
  }
  function vAccount(r) {
    setTitle("My account");
    var TABS = [["orders", "My orders"], ["quotes", "My quotes"], ["designs", "My designs"], ["reviews", "My reviews"], ["wishlist", "Wishlist"], ["recent", "Recently viewed"], ["addresses", "Addresses"]];
    var tab = TABS.map(function (x) { return x[0]; }).indexOf(r.q.get("tab")) > -1 ? r.q.get("tab") : "orders", otpFor = "", useFor = "";
    function loginHTML(step, err) {
      if (step === 2) return '<form class="box" id="otpForm" novalidate style="max-width:440px"><h2>Enter the code</h2><p class="small muted">We sent a 6-digit code to <span class="notranslate">' + fmtMobile(otpFor) + '</span>. <span class="sample-tag">Sample</span> Any 6 digits work, nothing was sent.</p>' +
        '<div class="field" style="margin-top:1rem"><label for="otp">6-digit code</label><input class="inp otp notranslate" id="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" aria-describedby="otpErr"' + (err ? ' aria-invalid="true"' : "") + '><p class="err" id="otpErr">' + (err || "") + '</p></div><div class="btn-row" style="margin-top:.5rem"><button class="btn btn--blue" type="submit">Verify and log in</button><button class="textbtn" type="button" data-relogin>Change number</button></div></form>';
      return '<form class="box" id="loginForm" novalidate style="max-width:440px"><h2>Log in with mobile OTP</h2><p class="small muted">See your sample orders and saved addresses. <span class="sample-tag">Sample</span></p>' +
        '<div class="field" style="margin-top:1rem"><label for="lMob">Mobile number</label><input class="inp notranslate" id="lMob" type="tel" inputmode="numeric" autocomplete="tel-national" aria-describedby="lMobErr"' + (err ? ' aria-invalid="true"' : "") + ' value="' + esc((store.details.get({}) || {}).mobile || "") + '"><p class="err" id="lMobErr">' + (err || "") + '</p></div><button class="btn btn--blue" type="submit" style="margin-top:.5rem">Send OTP</button></form>';
    }
    function tabBody() {
      var user = store.user.get(null);
      if (tab === "quotes") {
        var qs = myQuotes();
        return qs.length ? '<div class="olist">' + qs.map(function (q) { return '<div class="orow"><div><b class="notranslate">' + q.no + '</b> <span class="st st--' + q.status + '">' + q.status + '</span><br><span class="small muted">' + fDT(q.created) + " · " + esc(q.school) + " · " + plural(q.items.length, "product", "products") + '</span><ul class="small" style="margin-top:.3rem">' + q.items.map(function (l) { var p = P[l.slug]; return p ? "<li>" + esc(p.name) + ": " + qtyText(p, l.qty) + (l.dtext ? ". " + esc(l.dtext) : "") + "</li>" : ""; }).join("") + '</ul></div><div class="btn-row" style="margin:0"><a class="btn btn--ghost btn--sm" href="' + S.wa(quoteText(q)) + '" target="_blank" rel="noopener">Send again on WhatsApp</a></div></div>'; }).join("") + "</div>" :
          '<div class="empty">' + I.quote + '<h2>No quotes yet</h2><p>Ask for a school or bulk rate from any product page with “Get a bulk quote”.</p><a class="btn btn--blue" href="' + u("/quote") + '">Start a quote</a></div>';
      }
      if (tab === "wishlist") return wishHTML();
      if (tab === "recent") { var rl = recentList([]); return '<p class="small muted" style="margin-bottom:.8rem">Kept only on this device. <button type="button" class="textbtn" data-clear-recent2>Clear history</button></p>' + (rl.length ? gridHTML(rl.map(function (x) { return P[x.slug]; })) : '<div class="empty"><h2>Nothing viewed yet</h2><p>Products you open appear here.</p></div>'); }
      if (tab === "reviews") {
        var mr = myReviews();
        return mr.length ? '<div class="olist">' + mr.map(function (r) { var p = P[r.slug]; if (!p) return ""; return '<div class="orow"><div><b>' + esc(r.title) + '</b> <span class="st st--' + r.status + '">' + r.status + '</span><br><span class="small muted">' + starRow(r.stars) + " on " + esc(p.name) + " · " + fDT(r.created) + '</span></div><a class="btn btn--ghost btn--sm" href="' + u("/products/" + p.slug + "#reviews") + '">View</a></div>'; }).join("") + "</div>" :
          '<div class="empty">' + I.box + '<h2>No reviews yet</h2><p>After a delivery, use “Rate this item” in My orders, or write a review on any product page.</p></div>';
      }
      if (tab === "designs") {
        var ds = designs();
        var note = ds.length && !persisted("kk:designs") ? '<p class="note note--warn" style="margin-bottom:1rem">' + I.info + "<span>This browser is not letting us save, so your designs are kept only until you close this tab.</span></p>" : "";
        return ds.length ? note + '<ul class="grid">' + ds.map(function (d) { var p = P[d.slug]; if (!p) return ""; return '<li><article class="pc" style="grid-template-columns:108px 1fr"><div class="pc__ph"><img src="' + esc(d.thumb) + '" alt="Your design on ' + esc(p.name) + '" width="200" height="200"></div><div class="pc__b"><b>' + esc(d.title || p.name) + '</b><span class="small muted">' + esc(p.name) + " · " + fDT(d.updated) + '</span><div class="pc__act"><a class="btn btn--line" href="' + u("/design/" + p.slug + "?d=" + d.id) + '">Open</a><button type="button" class="btn btn--ghost" data-use="' + d.id + '">Use on another product</button></div>' + (useFor === d.id ? '<label class="lab" for="use-' + d.id + '" style="margin-top:.5rem">Choose a product</label><select class="inp" id="use-' + d.id + '" data-usesel="' + d.id + '"><option value="">Pick one...</option>' + D.PRODUCTS.filter(function (x) { return x.pr.kind !== "label" && x.slug !== d.slug; }).map(function (x) { return '<option value="' + x.slug + '">' + esc(x.name) + "</option>"; }).join("") + "</select>" : "") + "</div></article></li>"; }).join("") + "</ul>" :
          '<div class="empty">' + I.brushPen.replace("<svg", '<svg style="width:46px;height:46px;color:var(--blue);margin:0 auto .9rem;display:block"') + '<h2>No saved designs</h2><p>Designs you make in the studio are saved here, so you can reuse your logo on another product.</p><a class="btn btn--blue" href="' + u("/shop?print=1") + '">Find something to print</a></div>';
      }
      if (!user) return '<div id="loginBox">' + loginHTML(1) + "</div>";
      if (tab === "orders") {
        var os = myOrders();
        return os.length ? '<div class="olist">' + os.map(function (o) { var st = stageOf(o); return '<div class="orow"><div><b class="notranslate">' + o.no + '</b> <span class="st st--' + STATUS[st] + '">' + (st === 3 ? "Out for delivery" : STATUS[st]) + '</span><br><span class="small muted">' + fDT(o.created) + " · " + plural(o.items.length, "line", "lines") + " · " + M(o.totals.total) + "</span>" + (o.items.some(function (l) { return l.print; }) ? '<br><span class="small" style="font-weight:600">Includes custom printing</span>' : "") + (st >= 4 ? '<br><span class="small">' + o.items.map(function (l) { return '<a href="' + u("/products/" + l.slug + "#write") + '">Rate this item: ' + esc(l.name) + "</a>"; }).join(" · ") + "</span>" : "") + '</div><div class="btn-row" style="margin:0"><a class="btn btn--ghost btn--sm" href="' + u("/order/" + o.no) + '">View</a><a class="btn btn--ghost btn--sm" href="' + u("/track?order=" + o.no + "&mobile=" + o.mobile) + '">Track</a><button type="button" class="btn btn--blue btn--sm" data-reorder="' + o.no + '">Reorder</button></div></div>'; }).join("") + "</div>" :
          '<div class="empty">' + I.box + "<h2>No orders yet</h2><p>Orders you place on this sample store appear here, with live tracking and one-tap reorder.</p><a class=\"btn btn--blue\" href=\"" + u("/shop") + '">Start shopping</a></div>';
      }
      var seen = {}, list = [];
      var sd = store.details.get(null); if (sd && sd.house) list.push(sd);
      myOrders().forEach(function (o) { list.push({ name: o.name, mobile: o.mobile, biz: o.biz, gstin: o.gstin, house: o.addr.house, street: o.addr.street, landmark: o.addr.landmark, city: o.addr.city, state: o.addr.state, pin: o.addr.pin }); });
      list = list.filter(function (a) { var k = a.house + a.pin; if (seen[k]) return false; seen[k] = 1; return true; });
      return list.length ? '<div class="og">' + list.map(function (a, i) { return '<div class="box">' + (i === 0 ? '<span class="sample-tag">Default</span>' : "") + '<p style="margin-top:.4rem">' + addrHTML({ name: a.name, mobile: a.mobile, biz: a.biz, gstin: a.gstin, addr: a }) + "</p></div>"; }).join("") + "</div>" :
        '<div class="empty">' + I.box + "<h2>No saved addresses</h2><p>Tick “Save my details” at checkout and your address will be ready next time.</p></div>";
    }
    function draw(focusTab) {
      var user = store.user.get(null);
      view.innerHTML = '<div class="wrap" style="padding-bottom:3rem"><ol class="crumbs"><li><a href="' + u() + '">Home</a></li><li aria-current="page">Account</li></ol><div class="page-h" style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:1rem"><div><h1>My account</h1>' +
        (user ? '<p class="muted">Logged in as <span class="notranslate">' + fmtMobile(user.mobile) + "</span> (sample)</p>" : '<p class="muted">Log in to see orders and addresses. Quotes and designs work without logging in.</p>') + "</div>" + (user ? '<button class="btn btn--ghost btn--sm" type="button" id="logout">Log out</button>' : "") + "</div>" +
        '<div class="tabs" role="tablist" aria-label="Account sections">' + TABS.map(function (x) { return '<button type="button" role="tab" id="tab-' + x[0] + '" aria-controls="tp" aria-selected="' + (tab === x[0]) + '" tabindex="' + (tab === x[0] ? 0 : -1) + '" data-tab="' + x[0] + '">' + x[1] + "</button>"; }).join("") + "</div>" +
        '<div id="tp" role="tabpanel" aria-labelledby="tab-' + tab + '">' + tabBody() + "</div></div>";
      if (focusTab) $("#tab-" + tab).focus();
    }
    draw();
    function onClick(e) {
      var t = e.target.closest("[data-tab]");
      if (t) { tab = t.getAttribute("data-tab"); history.replaceState(null, "", u("/account" + (tab === "orders" ? "" : "?tab=" + tab))); draw(true); return; }
      if (e.target.closest("[data-clear-recent2]")) { store.recent.set([]); draw(); S.toast("History cleared"); return; }
      if (e.target.closest("#logout")) { store.user.remove(); S.toast("Logged out"); draw(); $("#view h1").focus(); return; }
      if (e.target.closest("[data-relogin]")) { $("#loginBox").innerHTML = loginHTML(1); $("#lMob").focus(); return; }
      var ro = e.target.closest("[data-reorder]"); if (ro) { var o = findOrder(ro.getAttribute("data-reorder")); if (o) reorder(o); return; }
      var us = e.target.closest("[data-use]"); if (us) { useFor = useFor === us.getAttribute("data-use") ? "" : us.getAttribute("data-use"); draw(); var sel = $("[data-usesel]"); if (sel) sel.focus(); }
    }
    function onChange(e) { var s = e.target.closest("[data-usesel]"); if (s && s.value) navigate(u("/design/" + s.value + "?from=" + s.getAttribute("data-usesel"))); }
    function onKey(e) {
      var t = e.target.closest("[role=tab]"); if (!t || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
      var tabs = $$("[role=tab]"), i = tabs.indexOf(t) + (e.key === "ArrowRight" ? 1 : -1);
      tab = tabs[(i + tabs.length) % tabs.length].getAttribute("data-tab"); draw(true);
    }
    function onSubmit(e) {
      if (e.target.id === "loginForm") { e.preventDefault(); var m = $("#lMob").value; if (!S.validMobile(m)) { $("#loginBox").innerHTML = loginHTML(1, "Enter a 10-digit mobile number starting with 6, 7, 8 or 9."); $("#lMob").focus(); return; } otpFor = digits(m); $("#loginBox").innerHTML = loginHTML(2); $("#otp").focus(); S.announce("Code sent (sample). Enter any 6 digits."); }
      if (e.target.id === "otpForm") { e.preventDefault(); var c = $("#otp").value.trim(); if (!/^\d{6}$/.test(c)) { $("#loginBox").innerHTML = loginHTML(2, "Enter all 6 digits of the code. In this sample any 6 digits work."); $("#otp").focus(); return; } store.user.set({ mobile: otpFor }); S.toast("Logged in (sample)"); draw(); $("#view h1").focus(); }
    }
    view.addEventListener("click", onClick); view.addEventListener("keydown", onKey); view.addEventListener("submit", onSubmit); view.addEventListener("change", onChange);
    onCleanup(function () { view.removeEventListener("click", onClick); view.removeEventListener("keydown", onKey); view.removeEventListener("submit", onSubmit); view.removeEventListener("change", onChange); });
  }

  // ---------- owner's dashboard ----------
  function downloadData(dataUrl, name) {
    var a = document.createElement("a"); a.href = dataUrl; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }
  var ansFor = "";
  function adminExtrasHTML() {
    var w = {}; (S.store("kk:wish").get([]) || []).forEach(function (x) { w[x.slug] = (w[x.slug] || 0) + 1; });
    var seedW = [["sports-medal-50mm", 42], ["white-school-shirt-half", 37], ["haal-khata-lal-khata", 31], ["cotton-cap-printed", 24], ["kites-bundle", 19]];
    var wl = seedW.map(function (x) { return [x[0], x[1] + (w[x[0]] || 0)]; }); Object.keys(w).forEach(function (k) { if (!seedW.some(function (x) { return x[0] === k; })) wl.push([k, w[k]]); }); wl.sort(function (a, b) { return b[1] - a[1]; });
    var vw = S.store("kk:views").get({}) || {}, seedV = { "hb-pencils": 310, "white-school-shirt-half": 255, "sports-medal-50mm": 230, "ruled-notebook-172": 198, "haal-khata-lal-khata": 160 };
    Object.keys(vw).forEach(function (k) { seedV[k] = (seedV[k] || 0) + vw[k]; }); var vl = Object.keys(seedV).map(function (k) { return [k, seedV[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
    var ans = qaAns.get({}) || {}, qs = (qaAsk.get([]) || []).map(function (q) { return { id: q.id, slug: q.slug, q: q.q, name: q.name, mobile: q.mobile, mine: true }; }).concat(D.SEED_QUESTIONS);
    var off = cpnOff.get([]) || [];
    function li(x, unit) { var p = P[x[0]]; return p ? '<li><a href="' + u("/products/" + p.slug) + '">' + esc(p.name) + '</a><b>' + x[1] + " " + unit + "</b></li>" : ""; }
    return '<div class="agrid"><div class="box"><h2>Questions to answer</h2><ul class="alist">' + qs.map(function (q) { var p = P[q.slug]; return '<li style="display:block"><b>' + esc(q.q) + '</b><br><span class="small muted">' + esc(q.name) + " · " + esc(p ? p.name : "") + "</span>" + (ans[q.id] ? '<div class="reply"><b>Answered:</b> ' + esc(ans[q.id]) + "</div>" : '<div class="job__acts"><button type="button" class="btn btn--ghost btn--sm" data-ans="' + q.id + '">Answer</button>' + (q.mobile && /^d{10}$/.test(q.mobile) ? '<a class="btn btn--ghost btn--sm" href="' + esc(S.wa("Hello " + q.name + ", about your question on " + (p ? p.name : "") + ": ")) + '" target="_blank" rel="noopener">Reply on WhatsApp</a>' : "") + "</div>") + (ansFor === q.id ? '<form id="ansForm" novalidate style="display:grid;gap:.4rem;margin-top:.5rem"><label class="lab" for="ansText">Your answer</label><textarea class="inp" id="ansText"></textarea><p class="err" id="ansErr"></p><div><button class="btn btn--blue btn--sm" type="submit">Publish answer</button></div></form>' : "") + "</li>"; }).join("") + "</ul></div>" +
      '<div class="box"><h2>Coupons</h2><ul class="alist">' + D.COUPONS.map(function (c, i) { var on = off.indexOf(c.code) < 0, uses = [14, 9, 22, 5, 7, 11, 18, 3][i] + myOrders().filter(function (o) { return o.coupon === c.code; }).length; return '<li><span><code class="notranslate">' + c.code + "</code> " + esc(c.label) + '<br><span class="small muted">' + uses + ' uses this week (sample)</span></span><label class="check" style="min-height:44px"><input type="checkbox" data-cpnoff="' + c.code + '"' + (on ? " checked" : "") + "><span>On</span></label></li>"; }).join("") + "</ul></div></div>" +
      '<div class="agrid"><div class="box"><h2>Most wishlisted this week</h2><ul class="alist">' + wl.slice(0, 5).map(function (x) { return li(x, "saves"); }).join("") + '</ul><h2 style="margin-top:1.2rem">Most viewed today</h2><ul class="alist">' + vl.map(function (x) { return li(x, "views"); }).join("") + "</ul></div>" +
      '<div class="box"><h2>Chats</h2><ul class="alist"><li><span><b>Rupa, school in Behala</b><br><span class="small">Asked about 300 medals by Friday. Bot gave the delivery date.</span></span><a class="btn btn--ghost btn--sm" href="' + esc(S.wa("Hello Rupa, about your 300 medals: ")) + '" target="_blank" rel="noopener">Reply on WhatsApp</a></li><li><span><b>Visitor on Haal Khata</b><br><span class="small">Asked the wholesale price. Bot answered from the price list.</span></span></li>' + (function () { var out = ""; try { for (var k in localStorage) if (k.indexOf("nxshop:kk:chat:") === 0) { var h = JSON.parse(localStorage.getItem(k)) || []; var mine = h.filter(function (m) { return m.w === "me"; }); if (mine.length) out += '<li><span><b>Your chat: ' + esc(k.replace("nxshop:kk:chat:", "")) + '</b> <span class="sample-tag">Yours</span><br><span class="small">' + esc(mine.map(function (m) { return m.t; }).join(" / ").slice(0, 140)) + "</span></span></li>"; } } catch (e) {} return out; })() + '</ul><p class="small muted" style="margin-top:.6rem">Shares this week (sample): <b>' + (36 + (S.store("kk:shares").get(0) || 0)) + "</b></p></div></div>";
  }
  document.addEventListener("click", function (e) { var a = e.target.closest("[data-ans]"); if (a && route().name === "admin") { ansFor = ansFor === a.getAttribute("data-ans") ? "" : a.getAttribute("data-ans"); render(); var t = $("#ansText"); if (t) t.focus(); } });
  document.addEventListener("change", function (e) { var c = e.target.closest("[data-cpnoff]"); if (!c) return; var off = cpnOff.get([]) || [], k = c.getAttribute("data-cpnoff"); off = off.filter(function (x) { return x !== k; }); if (!c.checked) off.push(k); cpnOff.set(off); S.toast(k + (c.checked ? " switched on" : " switched off")); });
  document.addEventListener("submit", function (e) { if (e.target.id !== "ansForm") return; e.preventDefault(); var t = $("#ansText"); if (t.value.trim().length < 5) { $("#ansErr").textContent = "Write a short answer first."; t.focus(); return; } var a = qaAns.get({}) || {}; a[ansFor] = t.value.trim(); qaAns.set(a); ansFor = ""; S.toast("Answer published (sample)"); render(); });
  var revFilter = "all", replyFor = "";
  /** Owner's reviews card: newest first, the visitor's pending ones on top. */
  function adminRevHTML() {
    var all = [];
    myReviews().forEach(function (r) { all.push({ r: r, p: P[r.slug], age: (Date.now() - r.created) / DAY, mine: true }); });
    D.PRODUCTS.forEach(function (p) { (D.REVIEWS[p.slug] || []).forEach(function (r) { all.push({ r: r, p: p, age: r.days }); }); });
    var month = all.filter(function (x) { return x.age <= 30 && x.r.status !== "Hidden"; }), avg = month.length ? (month.reduce(function (a, x) { return a + x.r.stars; }, 0) / month.length).toFixed(1) : "0";
    var list = all.filter(function (x) { return revFilter === "low" ? x.r.stars <= 3 : revFilter === "pending" ? x.r.status === "Pending" : true; }).sort(function (a, b) { return a.age - b.age; }).slice(0, 8);
    var reps = replyStore.get({}) || {};
    return '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:.7rem;align-items:center"><div><h2 style="margin:0">Reviews</h2><p class="small muted">Average this month: <b class="notranslate">' + avg + "</b> from " + month.length + ' reviews</p></div><div class="chips" role="group" aria-label="Filter reviews">' +
      [["all", "Newest"], ["low", "Needs reply (3 stars or lower)"], ["pending", "Pending (" + myReviews().filter(function (r) { return r.status === "Pending"; }).length + ")"]].map(function (f) { return '<button type="button" class="chip" data-rva="f|' + f[0] + '" aria-pressed="' + (revFilter === f[0]) + '">' + f[1] + "</button>"; }).join("") + "</div></div>" +
      (list.length ? '<ul class="alist" style="margin-top:.5rem">' + list.map(function (x) {
        var r = x.r;
        return '<li style="display:block"><div style="display:flex;flex-wrap:wrap;gap:.5rem;align-items:center">' + starRow(r.stars) + "<b>" + esc(r.title) + "</b>" + (r.status ? ' <span class="st st--' + r.status + '">' + r.status + "</span>" : "") + '</div><p class="small" style="margin-top:.2rem">' + esc(r.text) + '</p><p class="small muted">' + esc(r.name) + ", " + esc(r.type) + " · " + esc(x.p.name) + "</p>" +
          (reps[r.id] ? '<div class="reply"><b>Reply from Kolom Khata Stationers:</b> ' + esc(reps[r.id]) + "</div>" : "") +
          '<div class="job__acts">' + (r.status === "Pending" ? '<button type="button" class="btn btn--blue btn--sm" data-rva="approve|' + r.id + '">Approve</button><button type="button" class="btn btn--ghost btn--sm" data-rva="hide|' + r.id + '">Hide</button>' : "") + (reps[r.id] ? "" : '<button type="button" class="btn btn--ghost btn--sm" data-rva="reply|' + r.id + '" aria-expanded="' + (replyFor === r.id) + '">Reply</button>') + "</div>" +
          (replyFor === r.id ? '<form id="replyForm" novalidate style="margin-top:.5rem;display:grid;gap:.4rem"><label class="lab" for="replyText">Your reply</label><textarea class="inp" id="replyText" maxlength="300" aria-describedby="replyErr">Thank you for ordering from us. </textarea><p class="err" id="replyErr"></p><div><button class="btn btn--blue btn--sm" type="submit">Post reply</button></div></form>' : "") + "</li>";
      }).join("") + "</ul>" : '<p class="muted" style="margin-top:.6rem">Nothing here right now.</p>');
  }
  function vAdmin() {
    setTitle("Owner's dashboard (sample)");
    var now = Date.now();
    var orders = myOrders().map(function (o) { return { no: o.no, name: o.biz || o.name, city: o.addr.city, created: o.created, status: STATUS[stageOf(o)], pay: o.pay, total: o.totals.total, items: o.items, addr: o.addr, mobile: o.mobile, gstin: o.gstin, buyer: o.gstin || o.biz ? "Business" : "Retail", mine: true }; })
      .concat(SEEDS.map(function (o) { return { no: o.no, name: o.biz || o.name, city: o.addr.city, created: o.created, status: STATUS[o.stage], pay: o.pay, total: o.totals.total, items: o.items, addr: o.addr, mobile: o.mobile, buyer: o.biz ? "Play school" : "Retail" }; }))
      .concat(D.ADMIN_ORDERS.map(function (a) { var items = snapItems(a[6]); return { no: a[0], name: a[1], city: a[2], created: now - a[3] * 36e5, status: a[4], pay: a[5], total: quickTotals(items, a[2] === "Kolkata" ? "700009" : "713101").total, items: items, addr: { city: a[2], state: "", pin: "", house: "", street: "" }, mobile: "", buyer: a[7] }; }))
      .sort(function (a, b) { return b.created - a.created; });
    var today = orders.filter(function (o) { return o.created >= now - DAY && o.status !== "Returned"; });
    var sales = today.reduce(function (a, o) { return a + o.total; }, 0), wholesaleN = today.filter(function (o) { return o.items.some(function (l) { return l.tier && l.tier !== "retail"; }); }).length;
    var prepaid = today.filter(function (o) { return o.pay !== "cod"; }).length, prePct = today.length ? Math.round(prepaid / today.length * 100) : 0;
    var days = D.SALES_7.concat([sales]), maxV = Math.max.apply(null, days), labels = days.map(function (_, i) { var d = addDays(i - 6); return i === 6 ? "Today" : d.toLocaleDateString("en-IN", { weekday: "short" }); });
    var W = 640, H = 240, pad = 24, bw = (W - pad * 2) / 7;
    var chart = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-labelledby="chT chD"><title id="chT">Sales in the last 7 days</title><desc id="chD">' + days.map(function (v, i) { return labels[i] + ": " + money(v); }).join(", ") + "</desc>" +
      '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + (H - 30) + '" y2="' + (H - 30) + '" stroke="#CFC8B8"/>' +
      days.map(function (v, i) { var h = Math.max(2, (v / maxV) * (H - 70)), x = pad + i * bw + bw * .18, y = H - 30 - h; return '<rect x="' + x + '" y="' + y + '" width="' + bw * .64 + '" height="' + h + '" rx="5" fill="' + (i === 6 ? "#C62A1F" : "#1D3F8F") + '"/>' +
        '<text x="' + (x + bw * .32) + '" y="' + (y - 7) + '" text-anchor="middle" font-size="12" font-weight="700" fill="#14213D" class="notranslate">' + (v >= 1000 ? "₹" + (v / 1000).toFixed(1) + "k" : money(v)) + "</text>" +
        '<text x="' + (x + bw * .32) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="12" fill="#4E5566">' + labels[i] + "</text>"; }).join("") + "</svg>";
    var low = []; D.PRODUCTS.forEach(function (p) { p.variants.forEach(function (v) { if (v.stock > 0 && v.stock <= 40) low.push([p, v]); }); });
    var outN = 0; D.PRODUCTS.forEach(function (p) { p.variants.forEach(function (v) { if (!v.stock) outN++; }); });
    // Print jobs: the visitor's custom lines first, then seeded jobs.
    var jobs = [];
    myOrders().forEach(function (o) { var st = stageOf(o); o.items.forEach(function (l, i) { if (l.print || l.note) jobs.push({ no: "PJ-" + o.no.slice(-4) + (i + 1), order: o.no, name: l.name, slug: l.slug, qty: l.qty, method: l.print ? l.print.name : "Laser engraving", sides: l.print ? (l.print.sides.join(" + ") || "Front") : "Text: " + l.note, status: st === 0 ? "Proof approved" : st < 3 ? "In print" : "Ready", thumb: l.print && l.print.thumb, designId: l.print && l.print.designId, cust: o.biz || o.name, mine: true }); }); });
    D.PRINT_JOBS.forEach(function (j) { var p = P[j[1]]; jobs.push({ no: j[0], name: p.name, slug: p.slug, qty: j[2], method: D.METHODS[j[3]].name, sides: j[4], status: j[5], thumb: "", img: defV(p).img, cust: j[6] }); });
    var quotes = myQuotes().map(function (q) { return { no: q.no, school: q.school, contact: q.contact, city: q.city, status: q.status, created: q.created, items: q.items, q: q, mine: true }; })
      .concat(D.SEED_QUOTES.map(function (s) { return { no: s.no, school: s.school, contact: s.contact, city: s.city, status: s.status, created: now - s.hoursAgo * 36e5, items: s.items.map(function (x) { return { slug: x[0], vid: x[1], qty: x[2], dtext: x[3] }; }) }; }));
    var filt = "All", STS = ["All", "New", "Packed", "Shipped", "Delivered", "Returned"];
    function payTag(p) { return p === "cod" ? "COD" : p === "bank" ? "Bank transfer" : "Prepaid"; }
    function ordersHTML() {
      var list = orders.filter(function (o) { return filt === "All" || o.status === filt; });
      if (!list.length) return '<p class="muted">No ' + filt.toLowerCase() + " orders right now.</p>";
      return '<table class="otable"><caption class="sr">Orders, newest first</caption><thead><tr><th scope="col">Order</th><th scope="col">Buyer</th><th scope="col">Lines</th><th scope="col">Total</th><th scope="col">Payment</th><th scope="col">Status</th></tr></thead><tbody>' +
        list.map(function (o) { return '<tr class="click" data-ord="' + o.no + '"><td><button type="button" data-ord="' + o.no + '" class="lnk notranslate">' + o.no + "</button>" + (o.mine ? ' <span class="sample-tag">Yours</span>' : "") + '<br><span class="small muted">' + fDT(o.created) + "</span></td><td>" + esc(o.name) + '<br><span class="small muted">' + esc(o.buyer) + " · " + esc(o.city) + "</span></td><td>" + o.items.length + "</td><td>" + M(o.total) + "</td><td>" + payTag(o.pay) + '</td><td><span class="st st--' + o.status + '">' + o.status + "</span></td></tr>"; }).join("") + "</tbody></table>" +
        '<div class="ocards">' + list.map(function (o) { return '<button type="button" class="ocard" data-ord="' + o.no + '"><b class="notranslate">' + o.no + (o.mine ? " (yours)" : "") + '</b><span class="st st--' + o.status + '">' + o.status + '</span><span class="small muted">' + esc(o.name) + ", " + esc(o.city) + " · " + payTag(o.pay) + "</span><b class=\"notranslate\">" + money(o.total) + "</b></button>"; }).join("") + "</div>";
    }
    var stClass = function (s) { return s.replace(/\s+/g, "-"); };
    view.innerHTML = '<div class="admin-head"><div class="wrap"><span class="sample-tag">Owner\'s view (sample)</span><h1 style="margin-top:.4rem">Kolom Khata: your shop today</h1><p style="margin-top:.35rem">Orders, payments, stock and reminders run on their own. You just pack and ship.</p></div></div>' +
      '<div class="wrap" style="padding-bottom:3rem"><div class="kpis">' +
      '<div class="kpi"><span>Today\'s sales</span><b class="notranslate">' + money(sales) + "</b>" + (sales > D.SALES_7[5] ? "<small>Up from yesterday (" + money(D.SALES_7[5]) + ")</small>" : '<small style="color:var(--muted)">Yesterday: ' + money(D.SALES_7[5]) + "</small>") + "</div>" +
      '<div class="kpi"><span>Orders today</span><b>' + today.length + "</b><small>" + today.filter(function (o) { return o.status === "New"; }).length + " waiting to be packed</small></div>" +
      '<div class="kpi"><span>Wholesale orders</span><b>' + wholesaleN + " of " + today.length + '</b><small style="color:var(--muted)">At wholesale or bulk price</small></div>' +
      '<div class="kpi"><span>Prepaid vs COD</span><b>' + prePct + "% / " + (100 - prePct) + '%</b><small style="color:var(--muted)">' + prepaid + " prepaid, " + (today.length - prepaid) + " COD</small></div></div>" +
      '<div class="box" style="margin-top:1rem;display:flex;flex-wrap:wrap;gap:.6rem 1.25rem;align-items:center"><span style="display:inline-flex;width:40px;height:40px;border-radius:50%;background:#1E8E4E;color:#fff;align-items:center;justify-content:center">' + WA_ICON.replace("<svg", '<svg style="width:22px;height:22px"') + '</span><div style="flex:1;min-width:200px"><b>Orders from WhatsApp (sample): <span class="notranslate">' + (9 + (waCount.get(0) || 0)) + '</span> today</b><br><span class="small muted">' + today.length + " came through the website cart. " + ((waCount.get(0) || 0) ? (waCount.get(0)) + " WhatsApp order taps came from this device." : "WhatsApp order taps on this device are counted here too.") + "</span></div></div>" +
      '<div class="agrid"><div class="box chart"><h2>Sales, last 7 days</h2>' + chart + "</div>" +
      '<div class="box"><h2>Top buyers this month</h2><ul class="alist">' + D.TOP_BUYERS.map(function (b) { return "<li><span><b>" + esc(b[0]) + '</b><br><span class="small muted">' + esc(b[1]) + " · " + esc(b[2]) + " · " + plural(b[3], "order", "orders") + '</span></span><b class="notranslate">' + money(b[4]) + "</b></li>"; }).join("") + "</ul></div></div>" +
      '<div class="box" style="margin-top:1rem"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:.7rem;align-items:center;margin-bottom:.7rem"><h2 style="margin:0">Orders</h2><div class="chips" role="group" aria-label="Filter orders by status">' +
      STS.map(function (s) { var n = s === "All" ? orders.length : orders.filter(function (o) { return o.status === s; }).length; return '<button type="button" class="chip" data-sf="' + s + '" aria-pressed="' + (s === filt) + '">' + s + " (" + n + ")</button>"; }).join("") + '</div></div><div id="olist">' + ordersHTML() + "</div></div>" +
      '<div class="agrid"><div class="box"><h2>Print jobs</h2><p class="small muted">Approved proofs go straight to the print room queue.</p>' + jobs.map(function (j, i) {
        return '<div class="job">' + (j.thumb ? '<img src="' + esc(j.thumb) + '" alt="Proof for ' + esc(j.name) + '" width="56" height="56">' : img(j.img || defV(P[j.slug]).img, "", "56px")) + '<div><b>' + esc(j.name) + '</b> <span class="st st--' + stClass(j.status) + '">' + j.status + "</span>" + (j.mine ? ' <span class="sample-tag">Yours</span>' : "") +
          '<br><span class="small muted"><span class="notranslate">' + j.no + "</span> · " + esc(j.cust) + " · " + j.qty + " pcs · " + esc(j.method) + " · " + esc(j.sides) + '</span><div class="job__acts"><button type="button" class="btn btn--ghost btn--sm" data-proof="' + i + '">Download proof</button>' +
          ["Proof approved", "In print", "Ready"].map(function (s) { return '<button type="button" class="chip" data-jobst="' + i + "|" + s + '" aria-pressed="' + (j.status === s) + '">' + s + "</button>"; }).join("") + "</div></div></div>";
      }).join("") + "</div>" +
      '<div class="box"><h2>Quote requests</h2><ul class="alist">' + quotes.map(function (q, i) { return '<li><span><b>' + esc(q.school) + '</b> <span class="st st--' + q.status + '">' + q.status + "</span>" + (q.mine ? ' <span class="sample-tag">Yours</span>' : "") + '<br><span class="small muted"><span class="notranslate">' + q.no + "</span> · " + esc(q.contact) + " · " + fDT(q.created) + '</span><br><span class="small">' + q.items.map(function (l) { var p = P[l.slug]; return p ? esc(p.name) + " × " + l.qty : ""; }).join(", ") + '</span></span><a class="btn btn--ghost btn--sm" href="' + S.wa("Hello " + q.contact + ", thank you for your quote request " + q.no + " from Kolom Khata Stationers. Here is our school rate: (sample reply)") + '" target="_blank" rel="noopener">' + I.wa.replace("<svg", '<svg style="color:#1E8E4E"') + "Reply on WhatsApp</a></li>"; }).join("") + "</ul></div></div>" +
      '<div class="box" style="margin-top:1rem" id="revAdmin">' + adminRevHTML() + "</div>" + adminExtrasHTML() + '<div class="agrid"><div class="box"><h2>Abandoned carts</h2><p class="small muted">People who added items but did not pay. One tap sends a friendly reminder.</p><ul class="alist">' +
      D.ABANDONED.map(function (a, i) { return "<li><span><b>" + esc(a.name) + '</b> <span class="small muted notranslate">' + a.mobile + '</span><br><span class="small">' + esc(a.items) + " · " + M(a.value) + " · " + a.ago + '</span></span><button type="button" class="btn btn--ghost btn--sm" data-remind="' + i + '">' + I.wa.replace("<svg", '<svg style="color:#1E8E4E"') + "Send WhatsApp reminder</button></li>"; }).join("") + "</ul></div>" +
      '<div class="box"><h2>Low stock</h2><ul class="alist">' + low.map(function (x) { return '<li><a href="' + u("/products/" + x[0].slug) + '">' + esc(x[0].name) + (x[0].variants.length > 1 ? " (" + esc(x[1].label) + ")" : "") + '</a><span class="st st--Packed">' + x[1].stock + " left</span></li>"; }).join("") + '</ul><p class="small muted" style="margin-top:.5rem">' + outN + " options are out of stock and marked automatically.</p>" +
      '<h2 style="margin-top:1.25rem">Top products this month</h2><ul class="alist">' + D.TOP_MONTH.map(function (x) { var p = P[x[0]]; return '<li><span style="display:flex;gap:.6rem;align-items:center">' + img(defV(p).img, "", "44px") + '<span><a href="' + u("/products/" + p.slug) + '">' + esc(p.name) + '</a><br><span class="small muted">' + esc(mkName(p)) + " rate</span></span></span><b>" + x[1].toLocaleString("en-IN") + " " + unitWord(p, 2) + "</b></li>"; }).join("") + "</ul></div></div></div>";
    function onClick(e) {
      var ra = e.target.closest("[data-rva]");
      if (ra) {
        var x = ra.getAttribute("data-rva").split("|"), mine = myReviews();
        if (x[0] === "f") { revFilter = x[1]; }
        if (x[0] === "approve" || x[0] === "hide") { mine.forEach(function (r) { if (r.id === x[1]) r.status = x[0] === "approve" ? "Approved" : "Hidden"; }); myRevStore.set(mine); S.toast(x[0] === "approve" ? "Review approved. It now shows on the product page." : "Review hidden"); }
        if (x[0] === "reply") { replyFor = replyFor === x[1] ? "" : x[1]; }
        $("#revAdmin").innerHTML = adminRevHTML(); var nf = replyFor && $("#replyText"); if (nf) nf.focus(); else { var nb = $('[data-rva="' + ra.getAttribute("data-rva") + '"]'); if (nb) nb.focus(); }
        return;
      }
      var b = e.target.closest("[data-sf]");
      if (b) { filt = b.getAttribute("data-sf"); $$("[data-sf]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); $("#olist").innerHTML = ordersHTML(); S.announce("Showing " + filt.toLowerCase() + " orders"); return; }
      var rm = e.target.closest("[data-remind]");
      if (rm) { rm.disabled = true; rm.innerHTML = I.check + "Reminder sent (sample)"; S.toast("Reminder sent (sample)"); return; }
      var pf = e.target.closest("[data-proof]");
      if (pf) { var j = jobs[+pf.getAttribute("data-proof")], d = j.designId && designById(j.designId), src = (d && (d.proof || d.thumb)) || j.thumb; if (src) { downloadData(src, j.no + "-proof." + (/^data:image\/png/.test(src) ? "png" : "jpg")); S.toast("Proof downloaded"); } else S.toast("Sample job: the proof file is with the print room (sample)"); return; }
      var js = e.target.closest("[data-jobst]");
      if (js) { var x = js.getAttribute("data-jobst").split("|"); jobs[+x[0]].status = x[1]; $$('[data-jobst^="' + x[0] + '|"]').forEach(function (c) { c.setAttribute("aria-pressed", c === js); }); var chip = js.closest(".job").querySelector(".st"); chip.className = "st st--" + stClass(x[1]); chip.textContent = x[1]; S.announce("Job marked " + x[1]); return; }
      var o = e.target.closest("[data-ord]");
      if (o) {
        var ord = orders.filter(function (y) { return y.no === o.getAttribute("data-ord"); })[0]; if (!ord) return;
        openSheet($("#detailSheet"), '<div class="sheet__head"><h2 id="detailTitle">Order <span class="notranslate">' + ord.no + '</span></h2><button class="icon-btn" type="button" data-close-sheet aria-label="Close order details">' + I.x + '</button></div><div class="sheet__body">' +
          '<p><span class="st st--' + ord.status + '">' + ord.status + "</span> · " + fDT(ord.created) + "</p><h3 style=\"margin-top:1rem\">Buyer</h3><p>" + esc(ord.name) + " (" + esc(ord.buyer) + ")<br>" + esc(ord.city) + (ord.addr.pin ? ' <span class="notranslate">' + esc(ord.addr.pin) + "</span>" : "") + (ord.mobile ? '<br><span class="notranslate">' + fmtMobile(ord.mobile) + "</span>" : "") + (ord.gstin ? '<br>GSTIN <span class="notranslate">' + esc(ord.gstin) + "</span>" : "") + "</p>" +
          '<h3 style="margin-top:1rem">Items</h3>' + itemsHTML(ord) + '<div class="sum" style="margin-top:.7rem"><div class="tot"><span>Total</span><span>' + M(ord.total) + "</span></div><div><span>Payment</span><span>" + payName(ord.pay) + "</span></div></div>" +
          '<div style="display:grid;gap:.5rem;margin-top:1.1rem"><button type="button" class="btn btn--blue" data-fake="Packing slip printed (sample)">Print packing slip</button><button type="button" class="btn btn--ghost" data-fake="WhatsApp update sent (sample)">Send WhatsApp update</button></div><p class="small muted" style="margin-top:.7rem">In the real dashboard, courier booking and customer messages happen on their own when you mark an order as packed.</p></div>', "[data-close-sheet]");
      }
    }
    function onRevSubmit(e) {
      if (e.target.id !== "replyForm") return;
      e.preventDefault(); var t = $("#replyText"), v = t.value.trim();
      if (v.length < 5) { $("#replyErr").textContent = "Write a short reply first."; t.setAttribute("aria-invalid", "true"); t.focus(); return; }
      var rp = replyStore.get({}) || {}; rp[replyFor] = v; replyStore.set(rp); replyFor = ""; $("#revAdmin").innerHTML = adminRevHTML(); S.toast("Reply posted (sample)");
    }
    view.addEventListener("submit", onRevSubmit); onCleanup(function () { view.removeEventListener("submit", onRevSubmit); });
    function sheetClick(e) { var f = e.target.closest("[data-fake]"); if (f) { S.toast(f.getAttribute("data-fake")); f.disabled = true; } }
    view.addEventListener("click", onClick); $("#detailSheet").addEventListener("click", sheetClick);
    onCleanup(function () { view.removeEventListener("click", onClick); $("#detailSheet").removeEventListener("click", sheetClick); });
  }

  // ---------- policies and 404 ----------
  function vPolicy(r) {
    var pol = D.POLICIES[r.key]; if (!pol) return v404();
    setTitle(pol.title);
    view.innerHTML = '<div class="wrap"><ol class="crumbs"><li><a href="' + u() + '">Home</a></li><li aria-current="page">' + esc(pol.title) + '</li></ol><div class="prose"><div class="page-h"><span class="sample-tag">Sample policy</span><h1 style="margin-top:.6rem">' + esc(pol.title) + '</h1><p class="muted" style="margin-top:.35rem">A short example of what a real store would say. Kolom Khata Stationers is a sample business.</p></div>' +
      pol.body.map(function (b) { return "<h2>" + esc(b[0]) + "</h2><p>" + esc(b[1]).replace(/₹[\d,]+/g, function (m) { return '<span class="notranslate">' + m + "</span>"; }) + "</p>"; }).join("") +
      '<p style="margin-top:2rem" class="chips">' + Object.keys(D.POLICIES).filter(function (k) { return k !== r.key; }).map(function (k) { return '<a class="chip" href="' + u("/policies/" + k) + '">' + esc(D.POLICIES[k].title) + "</a>"; }).join("") + "</p></div></div>";
  }
  function v404() {
    setTitle("Page not found");
    view.innerHTML = '<div class="wrap" style="padding-block:2rem 3rem"><div class="empty">' + I.box + '<h1 style="font-size:1.7rem">This page is not on our shelves</h1><p>The link may be old, or the product has moved. Try one of these instead.</p><a class="btn btn--blue" href="' + u("/shop") + '">Shop all products</a><div class="chips">' +
      D.CATS.map(function (c) { return '<a class="chip" href="' + u("/shop/" + c.id) + '">' + esc(c.short) + "</a>"; }).join("") + '<a class="chip" href="' + u("/track") + '">Track an order</a></div></div></div>' + recentStrip([], "Recently viewed");
  }

  // ================= shared extras: markets, wishlist, recent, compare, quick view, size guide, Q&A, FBT, reels =================
  var MK = {}; D.MARKETS.forEach(function (m) { MK[m.id] = m; });
  function mkName(p) { return (MK[p.market] || MK.burrabazar).name; }
  var HEART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z"/></svg>';
  var EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';

  // ---------- wishlist ----------
  var wishStore = S.store("kk:wish");
  function wish() { return (wishStore.get([]) || []).filter(function (w) { return P[w.slug]; }); }
  function inWish(slug) { return wish().some(function (w) { return w.slug === slug; }); }
  function heartBtn(p, cls) { var on = inWish(p.slug); return '<button type="button" class="' + (cls || "heart") + '" data-wish="' + p.slug + '" aria-pressed="' + on + '" aria-label="' + (on ? "Remove " : "Save ") + esc(p.name) + (on ? " from" : " to") + ' wishlist">' + HEART + "</button>"; }
  function toggleWish(slug, vid) {
    var w = wishStore.get([]) || [], i = w.map(function (x) { return x.slug; }).indexOf(slug), p = P[slug], v = vOf(p, vid) || defV(p);
    if (i > -1) w.splice(i, 1); else w.unshift({ slug: slug, vid: v.id, price: v.price, stock: v.stock, at: Date.now() });
    wishStore.set(w); badges();
    var on = i < 0;
    $$('[data-wish="' + slug + '"]').forEach(function (b) { b.setAttribute("aria-pressed", on); b.setAttribute("aria-label", (on ? "Remove " : "Save ") + p.name + (on ? " from" : " to") + " wishlist"); });
    S.toast(on ? "Saved to wishlist" : "Removed from wishlist");
    if (route().name === "wishlist") vWishlist();
  }

  // ---------- recently viewed ----------
  function recentList(exclude) { return (store.recent.get([]) || []).map(function (x) { return typeof x === "string" ? { slug: x } : x; }).filter(function (x) { return P[x.slug] && (!exclude || exclude.indexOf(x.slug) < 0); }); }
  function trackView(p, vid) { var r = recentList([p.slug]); r.unshift({ slug: p.slug, vid: vid }); store.recent.set(r.slice(0, 12)); var vc = S.store("kk:views"), n = vc.get({}) || {}; n[p.slug] = (n[p.slug] || 0) + 1; vc.set(n); }
  function recentStrip(exclude, title, kicker) {
    var r = recentList(exclude || []); if (!r.length) return "";
    return '<section class="sec" id="recentSec"><div class="wrap"><div class="sec-head"><div>' + (kicker ? '<span class="kicker">' + kicker + "</span>" : "") + "<h2>" + (title || "Recently viewed") + '</h2><p class="small">Kept only on this device.</p></div><button type="button" class="textbtn" data-clear-recent>Clear history</button></div><ul class="strip">' + r.slice(0, 12).map(function (x) { return "<li>" + card(P[x.slug]) + "</li>"; }).join("") + "</ul></div></section>";
  }

  // ---------- compare ----------
  var cmpStore = S.store("kk:compare");
  function cmpList() { return (cmpStore.get([]) || []).filter(function (s) { return P[s]; }); }
  function cmpBtn(p, cls) { var on = cmpList().indexOf(p.slug) > -1; return '<button type="button" class="' + (cls || "textbtn") + '" data-cmp="' + p.slug + '" aria-pressed="' + on + '">' + (on ? "In compare" : "Compare") + '<span class="sr"> ' + esc(p.name) + "</span></button>"; }
  function toggleCmp(slug) {
    var l = cmpList(), i = l.indexOf(slug);
    if (i > -1) l.splice(i, 1); else { if (l.length >= 4) { S.toast("You can compare up to 4. Remove one first.", { icon: false }); return; } l.push(slug); }
    cmpStore.set(l);
    $$('[data-cmp="' + slug + '"]').forEach(function (b) { b.setAttribute("aria-pressed", i < 0); b.firstChild.textContent = i < 0 ? "In compare" : "Compare"; });
    S.announce(i < 0 ? P[slug].name + " added to compare. " + l.length + " of 4." : "Removed from compare");
    drawTray(); if (route().name === "compare") vCompare();
  }
  var tray = document.createElement("div"); tray.className = "cmptray"; tray.setAttribute("aria-live", "polite"); document.body.appendChild(tray);
  function drawTray() {
    var l = cmpList(), r = route().name, hide = !l.length || ["checkout", "invoice", "admin", "design", "compare"].indexOf(r) > -1;
    tray.hidden = hide; document.body.classList.toggle("has-tray", !hide);
    if (hide) { tray.innerHTML = ""; return; }
    tray.innerHTML = '<div class="wrap cmptray__in"><div class="cmptray__th">' + l.map(function (s) { return img(defV(P[s]).img, P[s].name, "40px"); }).join("") + '</div><span class="small"><b>' + l.length + "</b> of 4" + (new Set(l.map(function (s) { return P[s].cat; })).size > 1 ? " · different kinds" : "") + '</span><a class="btn btn--blue btn--sm" href="' + u("/compare") + '">Compare (' + l.length + ')</a><button type="button" class="textbtn" data-cmp-clear>Clear</button></div>';
  }

  // ---------- size guide ----------
  var cmUnit = "cm";
  function sizeGuideHTML(p, cur) {
    var t = p.sz, G = D.SIZE[t], h = "", conv = function (n) { return typeof n === "number" ? (cmUnit === "in" ? (n / 2.54).toFixed(1) : n) : n; };
    var unitSw = '<label class="check" style="min-height:0"><input type="checkbox" data-sgunit' + (cmUnit === "in" ? " checked" : "") + ' role="switch"><span>Show inches</span></label>';
    if (t === "clothing") {
      var have = p.variants.map(function (v) { var m = v.label.match(/^Size (\S+)/); return m ? m[1] : ""; });
      h = unitSw + '<div class="sgwrap"><table class="sgt"><caption>Body measurements in ' + (cmUnit === "in" ? "inches" : "cm") + ". Fit: " + (/loose/i.test(JSON.stringify(p.specs)) ? "slightly loose" : "regular") + '.</caption><thead><tr>' + G.cols.map(function (c, i) { return "<th scope=\"col\">" + c + (i > 1 ? "" : "") + "</th>"; }).join("") + '<th scope="col"><span class="sr">Choose</span></th></tr></thead><tbody>' +
        G.rows.map(function (r) { var ok = have.indexOf(r[0]) > -1; return "<tr" + (cur && cur.label.indexOf("Size " + r[0]) === 0 ? ' class="is-on"' : "") + '><th scope="row">' + r[0] + "</th><td>" + r[1] + "</td>" + r.slice(2).map(function (n) { return '<td class="notranslate">' + conv(n) + "</td>"; }).join("") + "<td>" + (ok ? '<button type="button" class="textbtn" data-sgpick="' + r[0] + '">Choose this size</button>' : '<span class="small muted">Not made</span>') + "</td></tr>"; }).join("") + "</tbody></table></div>" +
        '<h3 style="margin-top:1rem">How to measure</h3><div class="sghow"><svg viewBox="0 0 120 160" width="96" aria-hidden="true"><circle cx="60" cy="20" r="12" fill="none" stroke="currentColor" stroke-width="2"/><path d="M38 40h44l8 50H30zM40 90l-4 60M80 90l4 60" fill="none" stroke="currentColor" stroke-width="2"/><path d="M30 55h60" stroke="#1D3F8F" stroke-width="2" stroke-dasharray="4 3"/><path d="M34 82h52" stroke="#B42318" stroke-width="2" stroke-dasharray="4 3"/></svg><p class="small">Chest (blue): around the fullest part, under the arms. Waist (red): around the natural waist. Height: standing straight, without shoes. Between sizes, choose the larger for growing children.</p></div>' +
        '<h3 style="margin-top:1rem">Find my size</h3><form class="sgfind" data-sgfind novalidate><div class="form-grid form-grid--2"><div class="field"><label for="sgAge">Age</label><input class="inp" id="sgAge" inputmode="numeric" maxlength="2"></div><div class="field"><label for="sgH">Height (cm)</label><input class="inp" id="sgH" inputmode="numeric" maxlength="3"></div></div><button class="btn btn--ghost btn--sm" type="submit" style="margin-top:.5rem">Suggest a size</button><p class="small" id="sgOut" aria-live="polite" style="margin-top:.4rem"></p></form>' +
        '<h3 style="margin-top:1rem">Class size planner</h3><form data-sgclass novalidate class="sgfind"><div class="form-grid form-grid--2"><div class="field"><label for="sgCls">Class</label><select class="inp" id="sgCls">' + ["Nursery", "KG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map(function (c) { return "<option>" + c + "</option>"; }).join("") + '</select></div><div class="field"><label for="sgN">Students</label><input class="inp" id="sgN" inputmode="numeric" value="40"></div></div><button class="btn btn--ghost btn--sm" type="submit" style="margin-top:.5rem">Plan the sizes</button><div id="sgPlan" aria-live="polite"></div></form>';
    } else if (G && G.rows) {
      h = (t === "paper" || t === "shoes" ? "" : "") + '<div class="sgwrap"><table class="sgt"><caption>' + (t === "shoes" ? "Foot length in cm" : t === "capbelt" ? "Head and waist in cm, adjustable" : t === "bag" ? "Capacity and size in cm" : "Paper sizes") + '</caption><thead><tr>' + G.cols.map(function (c) { return '<th scope="col">' + c + "</th>"; }).join("") + (t === "shoes" ? '<th scope="col"><span class="sr">Choose</span></th>' : "") + "</tr></thead><tbody>" +
        G.rows.map(function (r) { return '<tr><th scope="row">' + r[0] + "</th>" + r.slice(1).map(function (n) { return '<td class="notranslate">' + n + "</td>"; }).join("") + (t === "shoes" ? "<td>" + (p.variants.some(function (v) { return v.label.indexOf("Size " + r[0] + " ") === 0; }) ? '<button type="button" class="textbtn" data-sgpick="' + r[0] + '">Choose this size</button>' : "") + "</td>" : "") + "</tr>"; }).join("") + "</tbody></table></div>";
      if (t === "shoes") h += '<p class="small" style="margin-top:.6rem">How to measure your foot: stand on a paper, mark the heel and the longest toe, and measure the gap. Add 0.5 cm for comfort.</p>';
      if (t === "paper") h += '<svg viewBox="0 0 240 180" width="240" style="max-width:100%;margin-top:.8rem" role="img" aria-label="A3, A4 and A5 drawn to scale"><rect x="2" y="2" width="118" height="168" fill="none" stroke="#8B8576"/><rect x="2" y="2" width="84" height="118" fill="none" stroke="#1D3F8F" stroke-width="2"/><rect x="2" y="2" width="59" height="84" fill="none" stroke="#B42318"/><text x="124" y="20" font-size="11">A3 grey</text><text x="124" y="36" font-size="11" fill="#1D3F8F">A4 blue</text><text x="124" y="52" font-size="11" fill="#B42318">A5 red</text></svg>';
      if (t === "bag") h += '<svg viewBox="0 0 200 160" width="200" style="margin-top:.8rem" role="img" aria-label="Bag height against a 130 cm child"><rect x="120" y="70" width="40" height="58" rx="8" fill="#EEF2FA" stroke="#1D3F8F" stroke-width="2"/><circle cx="60" cy="22" r="10" fill="none" stroke="#545B69" stroke-width="2"/><path d="M60 32v60M60 92l-12 50M60 92l12 50M42 50h36" stroke="#545B69" stroke-width="2"/><text x="112" y="150" font-size="11">43 cm bag</text><text x="30" y="155" font-size="11">130 cm child</text></svg>';
    } else {
      h = '<table class="specs"><caption class="sr">Size and dimensions</caption><tbody>' + p.specs.filter(function (s) { return /size|height|length|diameter|width|pieces|pack|weight|age|capacity|sheets|pages/i.test(s[0]); }).concat([["Sold as", p.unit]]).map(function (s) { return '<tr><th scope="row">' + esc(s[0]) + "</th><td>" + esc(s[1]) + "</td></tr>"; }).join("") + "</tbody></table>" +
        (t === "award" ? '<p class="small" style="margin-top:.6rem">' + D.SIZE.award.note + '</p><svg viewBox="0 0 220 160" width="220" style="margin-top:.6rem;max-width:100%" role="img" aria-label="Item size against an A4 sheet"><rect x="2" y="2" width="105" height="148" fill="none" stroke="#8B8576"/><text x="8" y="16" font-size="10">A4 sheet</text><circle cx="160" cy="120" r="12.5" fill="#F2E3B0" stroke="#7A5A1A"/><text x="138" y="148" font-size="10">50 mm medal</text></svg>' : "");
    }
    return h;
  }
  var sgRelease = null, sgEl = document.createElement("aside");
  sgEl.className = "sheet sheet--up"; sgEl.id = "sgSheet"; sgEl.setAttribute("role", "dialog"); sgEl.setAttribute("aria-modal", "true"); sgEl.setAttribute("aria-labelledby", "sgTitle"); sgEl.setAttribute("aria-hidden", "true"); document.body.appendChild(sgEl);
  var sgCtx = null;
  function openSizeGuide(p, cur, onPick) {
    sgCtx = { p: p, cur: cur, onPick: onPick };
    openSheet(sgEl, '<div class="sheet__head"><h2 id="sgTitle">Size guide: ' + esc(p.name) + '</h2><button class="icon-btn" type="button" data-close-sheet aria-label="Close size guide">' + I.x + '</button></div><div class="sheet__body" id="sgBody">' + sizeGuideHTML(p, cur) + "</div>", "[data-close-sheet]");
  }
  sgEl.addEventListener("change", function (e) { if (e.target.hasAttribute("data-sgunit")) { cmUnit = e.target.checked ? "in" : "cm"; $("#sgBody").innerHTML = sizeGuideHTML(sgCtx.p, sgCtx.cur); $("[data-sgunit]").focus(); } });
  sgEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-sgpick]"); if (!b || !sgCtx) return;
    var s = b.getAttribute("data-sgpick"), v = sgCtx.p.variants.filter(function (x) { return x.label.indexOf("Size " + s + " ") === 0 || x.label === "Size " + s; })[0];
    if (v && sgCtx.onPick) { closeSheet(false); sgCtx.onPick(v); S.announce("Size " + s + " chosen"); }
  });
  function sizeFor(age, ht) { var R = D.SIZE.clothing.rows; for (var i = 0; i < R.length; i++) { var a = String(R[i][1]).split("-"); if ((ht && ht <= R[i][2]) || (!ht && age && +a[a.length - 1] >= age)) return R[i]; } return R[R.length - 1]; }
  sgEl.addEventListener("submit", function (e) {
    e.preventDefault();
    if (e.target.hasAttribute("data-sgfind")) {
      var age = parseInt($("#sgAge").value, 10), ht = parseInt($("#sgH").value, 10);
      if (!age && !ht) { $("#sgOut").innerHTML = '<span class="err">Enter the age or the height.</span>'; return; }
      var r = sizeFor(age, ht), have = sgCtx.p.variants.some(function (v) { return v.label.indexOf("Size " + r[0]) === 0; });
      $("#sgOut").innerHTML = "Suggested size <b>" + r[0] + "</b> (" + r[1] + "). Between sizes, choose the larger for growing children. " + (have ? '<button type="button" class="textbtn" data-sgpick="' + r[0] + '">Choose this size</button>' : "");
    }
    if (e.target.hasAttribute("data-sgclass")) {
      var cls = $("#sgCls").value, n = Math.max(1, Math.min(200, parseInt($("#sgN").value, 10) || 40));
      var ageOf = { Nursery: 3, KG: 5 }[cls] || (+cls + 5), base = sizeFor(ageOf, 0), R = D.SIZE.clothing.rows, i = R.indexOf(base);
      var split = [[R[Math.max(0, i - 1)][0], Math.round(n * .2)], [base[0], Math.round(n * .55)], [R[Math.min(R.length - 1, i + 1)][0], 0]]; split[2][1] = n - split[0][1] - split[1][1];
      $("#sgPlan").innerHTML = '<table class="sgt" style="margin-top:.6rem"><caption>Suggested split for class ' + esc(cls) + ", " + n + ' students</caption><thead><tr><th scope="col">Size</th><th scope="col">Pieces</th></tr></thead><tbody>' + split.map(function (x) { return '<tr><th scope="row">' + x[0] + "</th><td>" + x[1] + "</td></tr>"; }).join("") + '</tbody></table><button type="button" class="btn btn--blue btn--sm" style="margin-top:.6rem" data-sgquote="' + split.map(function (x) { return x[0] + ":" + x[1]; }).join(",") + '">Add this split to the quote list</button>';
    }
  });
  sgEl.addEventListener("click", function (e) {
    var q = e.target.closest("[data-sgquote]"); if (!q) return;
    var p = sgCtx.p, parts = q.getAttribute("data-sgquote").split(",");
    parts.forEach(function (x) { var s = x.split(":"), v = p.variants.filter(function (vv) { return vv.label.indexOf("Size " + s[0]) === 0; })[0] || defV(p); if (+s[1] > 0) addToQuote({ slug: p.slug, vid: v.id, qty: +s[1], dtext: "Size " + s[0] + " for the class" }); });
    closeSheet(false); openQuote({});
  });

  // ---------- product reel (made in the browser from the product's own photos) ----------
  function reelPlay(box, p, v) {
    var c = document.createElement("canvas"), W = 800; c.width = c.height = W; c.className = "reel__cv"; c.setAttribute("role", "img"); c.setAttribute("aria-label", "Product reel of " + p.name + ": photos with price captions. No sound.");
    box.innerHTML = ""; box.appendChild(c);
    var bar = document.createElement("div"); bar.className = "reel__bar"; bar.innerHTML = '<button type="button" class="btn btn--ghost btn--sm" data-reel-pause>Pause</button><button type="button" class="btn btn--ghost btn--sm" data-reel-next>Next</button><span class="small muted">Product reel · No sound</span>'; box.parentNode.insertBefore(bar, box.nextSibling);
    var x = c.getContext("2d"), keys = [v.img].concat(p.imgs.filter(function (k) { return k !== v.img; })).slice(0, 3), ims = keys.map(function (k) { var im = new Image(); im.src = IMG + k + "-800.webp"; return im; });
    var caps = [p.name, money(v.price) + " " + perText(p) + " · " + money(bestOf(p, v)) + " from " + p.wq + " (" + mkName(p) + " rate)", p.pr.kind === "label" ? "Your name on the label" : "Customise with your logo"];
    var t0 = performance.now(), dur = 10000, paused = false, pausedAt = 0, still = S.reducedMotion(), slide = 0, raf = 0;
    function frame(now) {
      var t = still ? slide * (dur / 3) + 100 : ((paused ? pausedAt : now) - t0) % dur, seg = dur / 3, i = Math.floor(t / seg), k = (t % seg) / seg;
      var im = ims[i % ims.length]; x.fillStyle = "#F3F0EA"; x.fillRect(0, 0, W, W);
      if (im.complete) { var z = still ? 1 : 1 + .08 * k; x.save(); x.translate(W / 2, W / 2); x.scale(z, z); x.drawImage(im, -W / 2, -W / 2, W, W); x.restore(); }
      if (!still && k > .88) { x.fillStyle = "rgba(255,255,255," + ((k - .88) / .12).toFixed(2) + ")"; x.fillRect(0, 0, W, W); }
      x.fillStyle = "rgba(27,35,51,.82)"; x.fillRect(0, W - 110, W, 110); x.fillStyle = "#fff"; x.font = "600 34px Hanken Grotesk, Arial, sans-serif"; x.fillText(caps[i % 3].slice(0, 44), 32, W - 48);
      if (!still) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    var io = "IntersectionObserver" in window ? new IntersectionObserver(function (en) { if (!en[0].isIntersecting && !paused) { paused = true; pausedAt = performance.now(); var pb = bar.querySelector("[data-reel-pause]"); if (pb) pb.textContent = "Play"; } }) : null; if (io) io.observe(c);
    bar.addEventListener("click", function (e) {
      if (e.target.closest("[data-reel-pause]")) { paused = !paused; if (paused) pausedAt = performance.now(); else t0 += performance.now() - pausedAt; e.target.textContent = paused ? "Play" : "Pause"; if (still) frame(); }
      if (e.target.closest("[data-reel-next]")) { slide = (slide + 1) % 3; if (still) frame(); else { t0 -= dur / 3; } }
    });
    return function stop() { cancelAnimationFrame(raf); if (io) io.disconnect(); };
  }

  // ---------- Q&A ----------
  var qaAsk = S.store("kk:questions"), qaAns = S.store("kk:answers"), qaHelp = S.store("kk:qahelp");
  function qaOf(p) { var ans = qaAns.get({}) || {}; var mine = (qaAsk.get([]) || []).filter(function (q) { return q.slug === p.slug; }).map(function (q) { return { id: q.id, q: q.q, a: ans[q.id] || "", name: q.name, town: q.town || "", type: q.type, days: (Date.now() - q.created) / DAY, helpful: 0, by: ans[q.id] ? "Kolom Khata Stationers" : "", mine: true }; }); return mine.concat(D.QAS[p.slug] || []); }
  function qaBlock(p) {
    var st = { q: "", shown: 4, sort: "helpful", asking: false, err: {} };
    function list() { var w = st.q.toLowerCase(); return qaOf(p).filter(function (x) { return !w || (x.q + " " + x.a).toLowerCase().indexOf(w) > -1; }).sort(st.sort === "newest" ? function (a, b) { return a.days - b.days; } : function (a, b) { return b.helpful - a.helpful; }); }
    function item(x) { var voted = (qaHelp.get({}) || {})[x.id]; return '<div class="qaitem"><p><b>Q: ' + esc(x.q) + "</b></p>" + (x.a ? "<p>A: " + esc(x.a) + '</p><p class="small muted">Answered by ' + esc(x.by || "Kolom Khata Stationers") + "</p>" : '<p class="small"><span class="rvtag rvtag--p">Awaiting answer</span> Only you can see this question until the shop answers.</p>') + '<p class="small muted">' + esc(x.name) + (x.town ? ", " + esc(x.town) : "") + " · " + esc(x.type) + " · " + fDate(addDays(-Math.round(x.days))) + "</p>" + (x.mine ? "" : '<button type="button" class="textbtn" data-qahelp="' + x.id + '"' + (voted ? " disabled" : "") + ">Helpful (" + (x.helpful + (voted ? 1 : 0)) + ")</button>") + "</div>"; }
    function listHTML() { var l = list(); return '<p class="small muted" role="status">' + plural(l.length, "question", "questions") + "</p>" + (l.length ? l.slice(0, st.shown).map(item).join("") + (l.length > st.shown ? '<button type="button" class="btn btn--ghost btn--sm" data-qamore>Show more questions</button>' : "") : '<p>No matching question. Ask it below.</p>'); }
    function formHTML() {
      if (!st.asking) return '<div class="btn-row"><button type="button" class="btn btn--line" data-qaask>Ask a question</button><a class="textbtn wa-link" data-wa-order href="' + esc(S.wa("Hello Kolom Khata Stationers, I have a question about " + p.name + ":\n\n" + WA_END)) + '" target="_blank" rel="noopener">' + WA_ICON + "Ask on WhatsApp instead</a></div>";
      var e = st.err;
      return '<form id="qaForm" class="box" novalidate style="display:grid;gap:.7rem;margin-top:1rem"><div class="field"><label for="qa-q">Your question</label><textarea class="inp" id="qa-q" maxlength="300"' + (e.q ? ' aria-invalid="true"' : "") + ' aria-describedby="qa-qe"></textarea><p class="err" id="qa-qe">' + (e.q || "") + '</p></div><div class="form-grid form-grid--2"><div class="field"><label for="qa-n">Your name</label><input class="inp" id="qa-n"' + (e.n ? ' aria-invalid="true"' : "") + ' aria-describedby="qa-ne"><p class="err" id="qa-ne">' + (e.n || "") + '</p></div><div class="field"><label for="qa-m">Mobile <span class="muted">(optional, for a WhatsApp reply)</span></label><input class="inp notranslate" id="qa-m" inputmode="numeric" maxlength="14"' + (e.m ? ' aria-invalid="true"' : "") + ' aria-describedby="qa-me"><p class="err" id="qa-me">' + (e.m || "") + '</p></div></div><div class="field"><label for="qa-t">You are a</label><select class="inp" id="qa-t"><option>Parent</option><option>School</option><option>Shop owner</option><option>Office</option></select></div><div class="btn-row" style="margin-top:0"><button class="btn btn--blue" type="submit">Send question</button><button type="button" class="btn btn--ghost" data-qacancel>Cancel</button></div></form>';
    }
    function draw(f) { var b = $("#qaBox"); b.innerHTML = '<div class="rvtools"><label class="sr" for="qaSearch">Search questions</label><input class="inp" id="qaSearch" type="search" placeholder="Search questions" value="' + esc(st.q) + '" style="max-width:320px"><label class="sr" for="qaSort">Sort questions</label><select id="qaSort"><option value="helpful"' + (st.sort === "helpful" ? " selected" : "") + '>Most helpful</option><option value="newest"' + (st.sort === "newest" ? " selected" : "") + '>Newest</option></select></div><div id="qaList">' + listHTML() + '</div><div id="qaFormBox" style="margin-top:1rem">' + formHTML() + "</div>"; if (f) { var el = $(f); if (el) el.focus(); } }
    function onInput(e) { if (e.target.id === "qaSearch") { st.q = e.target.value; st.shown = 4; $("#qaList").innerHTML = listHTML(); } }
    function onChange(e) { if (e.target.id === "qaSort") { st.sort = e.target.value; $("#qaList").innerHTML = listHTML(); } }
    function onClick(e) {
      if (e.target.closest("[data-qamore]")) { st.shown += 4; $("#qaList").innerHTML = listHTML(); return; }
      var h = e.target.closest("[data-qahelp]"); if (h) { var v = qaHelp.get({}) || {}; v[h.getAttribute("data-qahelp")] = 1; qaHelp.set(v); $("#qaList").innerHTML = listHTML(); S.announce("Marked helpful"); return; }
      if (e.target.closest("[data-qaask]")) { st.asking = true; st.err = {}; $("#qaFormBox").innerHTML = formHTML(); $("#qa-q").focus(); return; }
      if (e.target.closest("[data-qacancel]")) { st.asking = false; $("#qaFormBox").innerHTML = formHTML(); $("[data-qaask]").focus(); }
    }
    function onSubmit(e) {
      if (e.target.id !== "qaForm") return; e.preventDefault();
      var q = $("#qa-q").value.trim(), n = $("#qa-n").value.trim(), m = $("#qa-m").value.trim(), t = $("#qa-t").value; st.err = {};
      if (q.length < 10) st.err.q = "Write your question in at least 10 letters.";
      if (n.length < 2) st.err.n = "Add your first name.";
      if (m && !S.validMobile(m)) st.err.m = "Enter a 10-digit mobile number starting with 6 to 9, or leave it empty.";
      if (Object.keys(st.err).length) { var keep = { q: q, n: n, m: m }; $("#qaFormBox").innerHTML = formHTML(); $("#qa-q").value = keep.q; $("#qa-n").value = keep.n; $("#qa-m").value = keep.m; $("#qaForm [aria-invalid=true]").focus(); return; }
      var all = qaAsk.get([]) || []; all.unshift({ id: "myq-" + Date.now().toString(36), slug: p.slug, q: q, name: n, mobile: digits(m), type: t, created: Date.now() }); qaAsk.set(all.slice(0, 30));
      st.asking = false; draw(); $("#qaFormBox").innerHTML = '<div class="note" role="status" tabindex="-1">' + I.check + "<span>Thanks. The shop usually answers within a few hours (sample). Nothing was sent.</span></div>"; $("#qaFormBox .note").focus();
    }
    return { html: '<div id="qaBox"></div>', count: qaOf(p).filter(function (x) { return x.a; }).length, mount: function () { draw(); view.addEventListener("input", onInput); view.addEventListener("change", onChange); view.addEventListener("click", onClick); view.addEventListener("submit", onSubmit); onCleanup(function () { view.removeEventListener("input", onInput); view.removeEventListener("change", onChange); view.removeEventListener("click", onClick); view.removeEventListener("submit", onSubmit); }); } };
  }

  // ---------- frequently bought together ----------
  function fbtFor(p) {
    var list = (D.FBT[p.slug] || []).map(function (s) { return P[s]; }).filter(function (x) { return x && stockOf(x) > 0; });
    if (list.length < 2) D.PRODUCTS.filter(function (x) { return x.slug !== p.slug && stockOf(x) > 0 && (x.cat === p.cat || x.buyers[0] === p.buyers[0]) && list.indexOf(x) < 0; }).sort(function (a, b) { return a.rank - b.rank; }).forEach(function (x) { if (list.length < 3) list.push(x); });
    return list.slice(0, 3);
  }
  function fbtBlock(p, getMain) {
    var items = fbtFor(p), sel = {}, qtys = {};
    function rows() {
      var m = getMain(), all = [{ p: p, v: m.v, main: true }].concat(items.map(function (x) { return { p: x, v: defV(x) }; }));
      all.forEach(function (r) { if (r.main) qtys[r.p.slug] = m.qty; else if (!qtys[r.p.slug]) qtys[r.p.slug] = m.qty >= p.wq ? snap(r.p, Math.min(m.qty, r.v.stock), r.p.min, r.v.stock) : r.p.min; if (sel[r.p.slug] == null) sel[r.p.slug] = true; });
      return all;
    }
    function html() {
      var all = rows(), tot = 0, save = 0, n = 0;
      var lis = all.map(function (r, i) {
        var q = qtys[r.p.slug], t = tierOf(r.p, r.v, q), on = sel[r.p.slug];
        if (on) { tot += t.price * q; save += (r.v.price - t.price) * q; n++; }
        return '<li class="fbt__row"><label class="check" style="min-height:44px"><input type="checkbox" data-fbt="' + r.p.slug + '"' + (on ? " checked" : "") + (r.main ? " disabled" : "") + '><span class="sr">Include ' + esc(r.p.name) + "</span></label>" + img(r.v.img, "", "56px") + '<div class="fbt__b"><a href="' + u("/products/" + r.p.slug) + '">' + esc(r.p.name) + "</a>" + (r.main ? ' <span class="small muted">(this item)</span>' : "") + '<span class="small notranslate">' + money(t.price) + " " + perText(r.p) + (t.k !== "retail" ? " · " + t.name.toLowerCase() + ", " + mkName(r.p) + " rate" : "") + "</span></div>" +
          (r.main ? '<span class="small">' + qtyText(r.p, q) + "</span>" : '<label class="sr" for="fbq-' + i + '">Quantity of ' + esc(r.p.name) + '</label><input class="inp notranslate fbt__q" id="fbq-' + i + '" inputmode="numeric" data-fbq="' + r.p.slug + '" value="' + q + '">') + "</li>";
      }).join("");
      return '<fieldset class="fbt"><legend class="sr">Frequently bought together</legend><ul>' + lis + '</ul><div class="fbt__foot" aria-live="polite"><p><b>Bundle total: <span class="notranslate">' + money(tot) + "</span></b>" + (save > 0 ? ' · <span class="ok">You save <span class="notranslate">' + money(save) + "</span></span>" : "") + '</p><button type="button" class="btn btn--blue" data-fbtadd>Add ' + n + ' to cart</button><a class="textbtn wa-link" data-wa-order id="fbtWa" href="' + esc(S.wa("Hello Kolom Khata Stationers, I want this bundle:\n\n" + all.filter(function (r) { return sel[r.p.slug]; }).map(function (r, i) { return (i + 1) + ". " + waLine(r.p, r.v, qtys[r.p.slug]).text; }).join("\n\n") + "\n\nBundle total: " + money(tot) + "\n\n" + WA_END)) + '" target="_blank" rel="noopener">' + WA_ICON + 'Order this bundle on WhatsApp</a><button type="button" class="textbtn" data-fbtquote>Add bundle to quote list</button></div></fieldset>';
    }
    function draw(f) { $("#fbtBox").innerHTML = html(); if (f) { var el = $(f); if (el) el.focus(); } }
    function onChange(e) {
      var c = e.target.closest("[data-fbt]"); if (c) { sel[c.getAttribute("data-fbt")] = c.checked; draw('[data-fbt="' + c.getAttribute("data-fbt") + '"]'); return; }
      var q = e.target.closest("[data-fbq]"); if (q) { var s = q.getAttribute("data-fbq"), x = P[s], v = defV(x), n = snap(x, q.value, x.min, v.stock); qtys[s] = n; draw('[data-fbq="' + s + '"]'); if (+q.value !== n) S.announce("Changed to " + n + ". Minimum " + x.min + ", steps of " + x.step); }
    }
    function onClick(e) {
      if (e.target.closest("[data-fbtadd]")) { var c = 0, last = null; rows().forEach(function (r) { if (sel[r.p.slug]) { var lc = addToCart(r.p.slug, r.v.id, qtys[r.p.slug], { quiet: true }); if (lc) { c++; last = lc; } } }); if (last) { S.toast("Added " + plural(c, "item", "items") + " to cart"); openAdded(last); } return; }
      if (e.target.closest("[data-fbtquote]")) { rows().forEach(function (r) { if (sel[r.p.slug]) addToQuote({ slug: r.p.slug, vid: r.v.id, qty: qtys[r.p.slug] }); }); openQuote({}); }
    }
    return { html: '<div id="fbtBox"></div>', refresh: function () { if ($("#fbtBox")) draw(); }, mount: function () { draw(); view.addEventListener("change", onChange); view.addEventListener("click", onClick); onCleanup(function () { view.removeEventListener("change", onChange); view.removeEventListener("click", onClick); }); } };
  }

  // ---------- quick view ----------
  var qvEl = document.createElement("aside"); qvEl.className = "sheet sheet--up qv"; qvEl.id = "qvSheet"; qvEl.setAttribute("role", "dialog"); qvEl.setAttribute("aria-modal", "true"); qvEl.setAttribute("aria-labelledby", "qvTitle"); qvEl.setAttribute("aria-hidden", "true"); document.body.appendChild(qvEl);
  var qv = null;
  function qvHTML() {
    var p = qv.p, v = qv.v, t = tierOf(p, v, qv.qty), e = eta({ p: p, v: v, qty: qv.qty }), st = stockText(p, v), r = ratingOf(p), next = p.wq - qv.qty;
    return '<div class="sheet__head"><h2 id="qvTitle">' + esc(p.name) + '</h2><button class="icon-btn" type="button" data-close-sheet aria-label="Close quick view">' + I.x + '</button></div><div class="sheet__body"><div class="qv__grid"><div>' + img(v.img, p.name, "(min-width: 700px) 300px, 90vw", ' class="qv__img"') + '<div class="thumbs" style="margin-top:.5rem">' + p.imgs.slice(0, 3).map(function (k) { return '<button type="button" data-qvimg="' + k + '" aria-label="Show another photo">' + img(k, "", "64px") + "</button>"; }).join("") + "</div></div><div>" +
      '<p class="small"><a href="' + u("/products/" + p.slug + "#reviews") + '">' + starRow(r.avg) + " " + r.avg.toFixed(1) + " (" + r.n + ' reviews)</a> · <a href="' + u("/products/" + p.slug + "#qa") + '">Questions (' + qaOf(p).length + ")</a></p>" +
      '<div class="pricebig"><b class="notranslate">' + money(t.price) + '</b><span class="per">' + perText(p) + '</span><s class="notranslate">' + money(v.mrp) + '</s><span class="off">' + pct(t.price, v.mrp) + "% off MRP</span></div>" +
      '<p class="whl" style="margin-top:.3rem"><span class="notranslate">' + money(v.wp) + "</span> " + perText(p) + " from " + p.wq + " · " + mkName(p) + " rate</p>" +
      '<p class="stock stock--' + st[1] + '"><i></i>' + st[0] + "</p><p class=\"small\">" + (e ? "Get it by <b>" + fDate(e.to) + "</b>" : "Back in stock soon") + "</p>" +
      (p.variants.length > 1 ? '<div class="opts" style="margin-top:.6rem">' + p.variants.map(function (x) { return '<button type="button" class="optbtn" data-qvvar="' + x.id + '" aria-pressed="' + (x === v) + '"' + (x.stock <= 0 ? ' aria-disabled="true"' : "") + ' aria-label="' + esc(x.label + ", " + (x.stock <= 0 ? "out of stock" : n0(x.stock) + " in stock")) + '">' + (x.colour ? '<i style="background:' + x.colour + '"></i>' : "") + esc(x.label) + "</button>"; }).join("") + "</div>" : "") +
      '<div class="qtyrow" style="margin-top:.75rem"><div class="qty" role="group" aria-label="Quantity"><button type="button" data-qvq="-1" aria-label="Decrease quantity"' + (qv.qty <= p.min ? " disabled" : "") + '>&minus;</button><input id="qvQty" class="notranslate" inputmode="numeric" value="' + qv.qty + '"><button type="button" data-qvq="1" aria-label="Increase quantity">+</button></div><span class="linecalc notranslate">' + qtyText(p, qv.qty) + " = " + money(t.price * qv.qty) + "</span></div>" +
      (t.k === "retail" && next > 0 ? '<p class="nudge">Add ' + qtyText(p, snap(p, next, p.step)) + " more for " + M(v.wp) + " " + perText(p) + ".</p>" : "") + '<p class="qmsg" role="status">' + (qv.msg || "") + "</p>" +
      '<div class="buy"><button type="button" class="btn btn--blue" data-qvadd' + (v.stock <= 0 ? " disabled" : "") + '>Add to cart</button>' + (p.custom ? '<a class="btn btn--line" href="' + u("/design/" + p.slug + "?v=" + v.id + "&qty=" + qv.qty) + '">Customise with your logo</a>' : "") + '</div><p class="small" style="margin-top:.4rem">' + esc(D.returnPolicy(p).short) + "</p>" +
      '<div class="buy-links">' + heartBtn(p, "textbtn") + cmpBtn(p) + '<a class="textbtn wa-link" data-wa-order href="' + esc(S.wa(waProduct(p, v, qv.qty))) + '" target="_blank" rel="noopener">' + WA_ICON + 'Order on WhatsApp</a><button type="button" class="textbtn" data-quote="' + p.slug + "|" + v.id + "|" + Math.max(qv.qty, p.wq) + '">Get a bulk quote for your school</button><a class="textbtn" href="' + u("/products/" + p.slug + "?v=" + v.id) + '">View full details</a></div></div></div></div>';
  }
  function openQV(slug) { var p = P[slug]; qv = { p: p, v: defV(p), qty: p.min }; openSheet(qvEl, qvHTML(), "[data-close-sheet]"); }
  function qvRedraw(f) { qvEl.innerHTML = qvHTML(); var el = f && $(f, qvEl); if (el) el.focus(); }
  qvEl.addEventListener("click", function (e) {
    if (!qv) return; var b;
    if ((b = e.target.closest("[data-qvvar]"))) { if (b.getAttribute("aria-disabled") === "true") { S.toast("That option is out of stock", { icon: false }); return; } qv.v = vOf(qv.p, b.getAttribute("data-qvvar")); qv.qty = snap(qv.p, qv.qty, qv.p.min, Math.max(qv.p.min, qv.v.stock)); qvRedraw('[data-qvvar="' + qv.v.id + '"]'); return; }
    if ((b = e.target.closest("[data-qvq]"))) { qv.qty = snap(qv.p, qv.qty + (+b.getAttribute("data-qvq")) * qv.p.step, qv.p.min, qv.v.stock); qv.msg = ""; qvRedraw('[data-qvq="' + b.getAttribute("data-qvq") + '"]'); return; }
    if ((b = e.target.closest("[data-qvimg]"))) { var im = $(".qv__img", qvEl); im.src = IMG + b.getAttribute("data-qvimg") + "-400.webp"; im.srcset = IMG + b.getAttribute("data-qvimg") + "-400.webp 400w, " + IMG + b.getAttribute("data-qvimg") + "-800.webp 800w"; return; }
    if (e.target.closest("[data-qvadd]")) { var lc = addToCart(qv.p.slug, qv.v.id, qv.qty, { quiet: true }); if (lc) { closeSheet(); openAdded(lc); } }
  });
  qvEl.addEventListener("change", function (e) { if (e.target.id === "qvQty" && qv) { var raw = parseInt(e.target.value, 10); qv.qty = snap(qv.p, e.target.value, qv.p.min, qv.v.stock); qv.msg = raw !== qv.qty ? "Changed to " + qv.qty + " (minimum " + qv.p.min + ", steps of " + qv.p.step + ")." : ""; qvRedraw("#qvQty"); } });

  // ---------- global wiring for the extras ----------
  document.addEventListener("click", function (e) {
    var b;
    if ((b = e.target.closest("[data-wish]"))) { e.preventDefault(); toggleWish(b.getAttribute("data-wish")); return; }
    if ((b = e.target.closest("[data-cmp]"))) { e.preventDefault(); toggleCmp(b.getAttribute("data-cmp")); return; }
    if (e.target.closest("[data-cmp-clear]")) { cmpStore.set([]); drawTray(); S.announce("Compare cleared"); if (route().name === "compare") vCompare(); return; }
    if ((b = e.target.closest("[data-qv]"))) { e.preventDefault(); openQV(b.getAttribute("data-qv")); return; }
    if (e.target.closest("[data-clear-recent]")) { store.recent.set([]); var s = $("#recentSec"); if (s) s.remove(); S.toast("History cleared"); return; }
  });

  // ---------- wishlist page ----------
  function wishHTML() {
    var w = wish();
    if (!w.length) return '<div class="empty">' + HEART.replace("<svg", '<svg style="width:40px;height:40px"') + '<h2>Your wishlist is empty</h2><p>Tap the heart on any product to save it here.</p><a class="btn btn--blue" href="' + u("/shop?sort=top") + '">See bestsellers</a></div>';
    return '<div class="btn-row" style="margin-top:0;margin-bottom:1rem"><button type="button" class="btn btn--ghost btn--sm" data-wish-quote>Add all to quote list</button><a class="btn btn--wa btn--sm" data-wa-order href="' + esc(S.wa("My wishlist from Kolom Khata Stationers:\n\n" + w.map(function (x, i) { var p = P[x.slug], v = vOf(p, x.vid) || defV(p); return (i + 1) + ". " + p.name + (p.variants.length > 1 ? " (" + v.label + ")" : "") + ": " + money(v.price) + " " + perText(p) + ", " + money(v.wp) + " from " + p.wq; }).join("\n") + "\n\n" + WA_END)) + '" target="_blank" rel="noopener">' + WA_ICON + 'Share wishlist on WhatsApp</a></div><ul class="olist">' +
      w.map(function (x) {
        var p = P[x.slug], v = vOf(p, x.vid) || defV(p), e = eta({ p: p, v: v, qty: p.min }), st = stockText(p, v);
        var tags = (v.price < x.price ? '<span class="rvtag rvtag--v">Price dropped</span>' : "") + (x.stock <= 0 && v.stock > 0 ? '<span class="rvtag rvtag--v">Back in stock</span>' : "");
        return '<li class="orow"><div style="display:flex;gap:.75rem;min-width:0;flex:1 1 260px">' + img(v.img, "", "64px", ' style="width:64px;height:64px;border-radius:8px;object-fit:cover"') + '<div style="min-width:0"><a href="' + u("/products/" + p.slug) + '"><b>' + esc(p.name) + "</b></a>" + tags + '<br><span class="small muted">' + esc(v.label) + ' · <span class="notranslate">' + money(v.price) + "</span> " + perText(p) + ", " + money(v.wp) + " from " + p.wq + " (" + mkName(p) + ' rate)</span><br><span class="small">' + st[0] + (e ? " · Delivery by " + fDate(e.to) : "") + '</span></div></div><div class="btn-row" style="margin:0"><button type="button" class="btn btn--blue btn--sm" data-wish-move="' + p.slug + "|" + v.id + '"' + (v.stock <= 0 ? " disabled" : "") + '>Move to cart</button><button type="button" class="btn btn--ghost btn--sm" data-wish="' + p.slug + '" aria-pressed="true">Remove</button></div></li>';
      }).join("") + "</ul>";
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-wish-move]");
    if (b) { var x = b.getAttribute("data-wish-move").split("|"), p = P[x[0]]; if (addToCart(x[0], x[1], p.min)) { wishStore.set((wishStore.get([]) || []).filter(function (w) { return w.slug !== x[0]; })); badges(); if (route().name === "wishlist") vWishlist(); else if (route().name === "account") render(); } return; }
    if (e.target.closest("[data-wish-quote]")) { wish().forEach(function (w) { addToQuote({ slug: w.slug, vid: w.vid, qty: P[w.slug].wq }); }); openQuote({}); }
  });
  function vWishlist() {
    setTitle("Wishlist");
    view.innerHTML = '<div class="wrap" style="padding-bottom:3rem"><ol class="crumbs"><li><a href="' + u() + '">Home</a></li><li aria-current="page">Wishlist</li></ol><div class="page-h"><h1>Wishlist</h1><p class="muted">Saved on this device. We mark items whose price dropped or that came back in stock.</p></div>' + wishHTML() + "</div>" + recentStrip([], "Recently viewed");
  }

  // ---------- compare page ----------
  var cmpDiff = false;
  function vCompare() {
    setTitle("Compare");
    var l = cmpList().map(function (s) { return P[s]; });
    if (!l.length) { view.innerHTML = '<div class="wrap" style="padding-block:1rem 3rem"><div class="page-h"><h1>Compare</h1></div><div class="empty"><h2>Nothing to compare yet</h2><p>Tap “Compare” on up to 4 products, ideally of the same kind.</p><a class="btn btn--blue" href="' + u("/shop/school") + '">Browse school stationery</a></div></div>'; drawTray(); return; }
    var rows = [
      ["Rating", function (p) { var r = ratingOf(p); return r.avg.toFixed(1) + " (" + r.n + ")"; }, function (p) { return -ratingOf(p).avg; }],
      ["Shop price", function (p) { var v = defV(p); return money(v.price) + " " + perText(p); }, function (p) { return defV(p).price; }],
      ["Wholesale price", function (p) { var v = defV(p); return money(v.wp) + " from " + p.wq + " · " + mkName(p) + " rate"; }, function (p) { return defV(p).wp; }],
      ["MRP", function (p) { var v = defV(p); return money(v.mrp) + " (" + pct(v.price, v.mrp) + "% below)"; }],
      ["Sold as", function (p) { return p.unit + ", minimum " + p.min + (p.step > 1 ? ", steps of " + p.step : ""); }],
      ["Stock", function (p) { return stockText(p, defV(p))[0]; }],
      ["Delivery", function (p) { var e = eta({ p: p, v: defV(p), qty: p.min }); return e ? "By " + fDate(e.to) : "Back in stock soon"; }, function (p) { var e = eta({ p: p, v: defV(p), qty: p.min }); return e ? e.to.getTime() : 9e15; }],
      ["Options", function (p) { return p.variants.map(function (v) { return v.label; }).join(", "); }],
      ["Size", function (p) { return (p.specs.filter(function (s) { return /size|height|length|pages|capacity/i.test(s[0]); })[0] || ["", "See size guide"])[1]; }],
      ["Material", function (p) { return (p.specs.filter(function (s) { return /fabric|paper|material|body|cover|upper|wood|finish/i.test(s[0]); })[0] || ["", "Generic"])[1]; }],
      ["Customise", function (p) { return !p.custom ? "Not offered" : p.pr.methods.map(function (m) { return D.METHODS[m.id].short + (m.rate[1] ? " +" + money(m.rate[1]) : ""); }).join(", "); }],
      ["Kolkata special", function (p) { return p.kolkata ? "Yes" : "No"; }],
      ["Questions answered", function (p) { return String(qaOf(p).filter(function (x) { return x.a; }).length); }]
    ];
    var diffKinds = new Set(l.map(function (p) { return p.cat; })).size > 1;
    var body = rows.map(function (r) {
      var vals = l.map(function (p) { return r[1](p); }), same = vals.every(function (x) { return x === vals[0]; });
      if (cmpDiff && same && l.length > 1) return "";
      var best = r[2] && l.length > 1 ? l.map(r[2]).indexOf(Math.min.apply(null, l.map(r[2]))) : -1;
      return '<tr><th scope="row">' + r[0] + "</th>" + vals.map(function (x, i) { return "<td" + (i === best ? ' class="best"' : "") + ">" + esc(x) + (i === best ? '<span class="sr"> (best)</span>' : "") + "</td>"; }).join("") + "</tr>";
    }).join("");
    view.innerHTML = '<div class="wrap" style="padding-bottom:3rem"><ol class="crumbs"><li><a href="' + u() + '">Home</a></li><li aria-current="page">Compare</li></ol><div class="page-h"><h1>Compare</h1>' + (diffKinds ? '<p class="note note--warn" style="margin-top:.5rem">' + I.info + "<span>Comparing different kinds of items.</span></p>" : "") + "</div>" +
      '<div class="btn-row" style="margin-top:0;margin-bottom:1rem"><label class="check" style="min-height:44px"><input type="checkbox" id="cmpDiff"' + (cmpDiff ? " checked" : "") + '><span>Show only differences</span></label><a class="btn btn--wa btn--sm" data-wa-order href="' + esc(S.wa("Comparing at Kolom Khata Stationers:\n\n" + l.map(function (p, i) { var v = defV(p); return (i + 1) + ". " + p.name + ": " + money(v.price) + " " + perText(p) + ", " + money(v.wp) + " from " + p.wq + " (" + mkName(p) + " rate)"; }).join("\n") + "\n\n" + WA_END)) + '" target="_blank" rel="noopener">' + WA_ICON + 'Share comparison on WhatsApp</a><button type="button" class="textbtn" data-cmp-clear>Clear all</button></div>' +
      '<div class="cmpwrap"><table class="cmp"><caption class="sr">Product comparison, products in columns</caption><thead><tr><th scope="col"><span class="sr">Attribute</span></th>' + l.map(function (p) { var v = defV(p); return '<th scope="col">' + img(v.img, "", "120px") + '<a href="' + u("/products/" + p.slug) + '">' + esc(p.name) + '</a><div class="cmp__acts"><button type="button" class="btn btn--blue btn--sm" data-quick="' + p.slug + '" data-q="' + p.min + '"' + (v.stock <= 0 ? " disabled" : "") + ">Add " + p.min + '</button><a class="btn btn--wa btn--icon btn--sm" data-wa-order href="' + esc(S.wa(waProduct(p, v, p.min))) + '" target="_blank" rel="noopener" aria-label="Order ' + esc(p.name) + ' on WhatsApp">' + WA_ICON + "</a>" + heartBtn(p, "icon-btn") + '</div><div class="cmp__links"><button type="button" class="textbtn" data-quote="' + p.slug + "|" + v.id + "|" + p.wq * 2 + '">Bulk quote</button><button type="button" class="textbtn" data-cmp="' + p.slug + '" aria-pressed="true">Remove<span class="sr"> ' + esc(p.name) + "</span></button></div></th>"; }).join("") + "</tr></thead><tbody>" + body + "</tbody></table></div></div>";
    function onCh(e) { if (e.target.id === "cmpDiff") { cmpDiff = e.target.checked; vCompare(); $("#cmpDiff").focus(); } }
    view.addEventListener("change", onCh); onCleanup(function () { view.removeEventListener("change", onCh); });
    drawTray();
  }

  // ================= offers, share, tracking on product pages, chat =================
  function copyText(t, okMsg) {
    function done() { S.toast(okMsg || "Copied"); }
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).then(done, fallback); return; } } catch (e) {}
    fallback();
    function fallback() { var i = document.createElement("input"); i.value = t; document.body.appendChild(i); i.select(); try { document.execCommand("copy"); } catch (e) {} i.remove(); done(); }
  }
  /** Offers for a product at a quantity: evaluated with the real cart plus this line. */
  function offersFor(p, v, qty) {
    var hyp = lineCalc({ slug: p.slug, vid: v.id, qty: qty }), ls = lines().filter(function (l) { return !(l.p.slug === p.slug && !l.l.d); }).concat([hyp]);
    var rel = D.COUPONS.filter(function (c) { return c.scope === "all" || inScope(c, hyp) || (c.scope === "custom" && p.custom); });
    return rel.map(function (c) { var r = couponEval(c, ls), inl = inScope(c, hyp) && c.scope !== "custom"; return { c: c, r: r, eff: r.ok && r.disc && inl && c.type === "percent" ? hyp.unit * (1 - c.value / 100) : 0 }; })
      .sort(function (a, b) { return (b.r.ok - a.r.ok) || ((b.c.scope !== "all") - (a.c.scope !== "all")); }).slice(0, 3);
  }
  function offersHTML(p, v, qty) {
    var of = offersFor(p, v, qty), applied = store.coupon.get("");
    return '<div class="offers"><p class="lab">Offers</p><ul>' + of.map(function (o) {
      var c = o.c, cond = c.min ? "on orders above " + money(c.min) + (c.where ? " in " + c.where : "") : c.where ? "on " + c.where : "on any order";
      return '<li><code class="notranslate">' + c.code + '</code><span><b>' + esc(c.label) + '</b><br><span class="small muted">' + cond + (c.firstOnly ? ", first order only" : "") + '</span><br><span class="small ' + (o.r.ok ? "ok" : "") + '">' + (o.r.ok ? "Applies: " + (o.r.disc ? "you save " + money(o.r.disc) : "free delivery") : esc(o.r.msg)) + "</span>" + (o.eff ? '<br><span class="small">Effective price with ' + c.code + ": <b class=\"notranslate\">" + money(o.eff) + "</b> " + perText(p) + "</span>" : "") + '</span><span class="offers__b"><button type="button" class="textbtn" data-copy-cpn="' + c.code + '">Copy<span class="sr"> ' + c.code + '</span></button><button type="button" class="textbtn" data-apply-cpn="' + c.code + '"' + (applied === c.code ? ' aria-pressed="true"' : "") + ">" + (applied === c.code ? "Applied" : "Apply") + '<span class="sr"> ' + c.code + "</span></button></span></li>";
    }).join("") + '</ul><p class="small"><button type="button" class="textbtn" data-all-cpn>View all offers</button> · <button type="button" class="textbtn" data-cpn-manual aria-expanded="false">Have a coupon code?</button></p><form class="miniform" data-cpn-form hidden novalidate><label class="sr" for="cpnIn">Coupon code</label><input class="inp notranslate" id="cpnIn" placeholder="FIRST50" style="text-transform:uppercase;max-width:180px" aria-describedby="cpnOut"><button class="btn btn--ghost btn--sm" type="submit">Check</button></form><p class="small" id="cpnOut" role="status"></p></div>';
  }
  document.addEventListener("click", function (e) {
    var b;
    if ((b = e.target.closest("[data-copy-cpn]"))) { copyText(b.getAttribute("data-copy-cpn"), "Code copied"); return; }
    if ((b = e.target.closest("[data-apply-cpn]"))) {
      var code = b.getAttribute("data-apply-cpn"), prev = store.coupon.get("");
      store.coupon.set(code); var r = couponCheck(code);
      S.toast((prev && prev !== code ? prev + " replaced. " : "") + (r && r.ok ? code + " applied" : code + " saved. It applies once your cart meets the condition."));
      $$("[data-apply-cpn]").forEach(function (x) { var on = x.getAttribute("data-apply-cpn") === code; x.firstChild.textContent = on ? "Applied" : "Apply"; if (on) x.setAttribute("aria-pressed", "true"); else x.removeAttribute("aria-pressed"); });
      refreshCartUI(); return;
    }
    if ((b = e.target.closest("[data-cpn-manual]"))) { var f = $("[data-cpn-form]"); f.hidden = !f.hidden; b.setAttribute("aria-expanded", !f.hidden); if (!f.hidden) $("#cpnIn").focus(); return; }
    if (e.target.closest("[data-all-cpn]")) {
      openSheet($("#detailSheet"), '<div class="sheet__head"><h2 id="detailTitle">All offers</h2><button class="icon-btn" type="button" data-close-sheet aria-label="Close offers">' + I.x + '</button></div><div class="sheet__body"><ul class="mlist">' + D.COUPONS.map(function (c) { return '<li><code class="notranslate">' + c.code + "</code> <b>" + esc(c.label) + '</b><br><span class="small muted">' + (c.min ? "Minimum " + money(c.min) + (c.where ? " of " + c.where : "") + ". " : "") + (c.cap ? "Up to " + money(c.cap) + ". " : "") + (c.firstOnly ? "First order only. " : "") + "One coupon per order. Valid till " + fDate(c.till) + ' (sample).</span><br><button type="button" class="textbtn" data-copy-cpn="' + c.code + '">Copy</button> <button type="button" class="textbtn" data-apply-cpn="' + c.code + '">Apply</button></li>'; }).join("") + "</ul></div>", "[data-close-sheet]");
    }
  });
  document.addEventListener("submit", function (e) {
    if (!e.target.hasAttribute("data-cpn-form")) return;
    e.preventDefault(); var code = $("#cpnIn").value.trim().toUpperCase(), out = $("#cpnOut");
    if (!code) { out.innerHTML = '<span class="err">Type a coupon code first.</span>'; return; }
    var r = couponCheck(code, lines());
    out.innerHTML = !r.c ? '<span class="err">' + esc(r.msg) + "</span>" : r.ok ? '<span class="ok">' + esc(r.msg) + '</span> <button type="button" class="textbtn" data-apply-cpn="' + code + '">Apply</button>' : esc(r.msg) + ' <button type="button" class="textbtn" data-apply-cpn="' + code + '">Save for later</button>';
  });

  // ---------- share ----------
  var shareN = S.store("kk:shares");
  function productURL(p, v, qty) { return location.origin + u("/products/" + p.slug + "?v=" + v.id + "&qty=" + qty); }
  function shareText(p, v, qty, school) {
    return p.name + (p.variants.length > 1 ? " (" + v.label + ")" : "") + "\nShop price " + money(v.price) + " " + perText(p) + ", wholesale " + money(v.wp) + " from " + p.wq + " (" + mkName(p) + " rate)" + (school ? "\nFor our school: ask for a bulk quote on the page." : "") + "\nSee it here: " + productURL(p, v, qty);
  }
  function shareBtn(p, getState, cls) { return '<button type="button" class="' + (cls || "textbtn") + '" data-share="' + p.slug + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true" style="width:18px;height:18px"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/></svg><span>Share</span><span class="sr"> ' + esc(p.name) + "</span></button>"; }
  var shareState = {};
  function openShare(p, v, qty) {
    shareN.set((shareN.get(0) || 0) + 1);
    var url = productURL(p, v, qty), text = shareText(p, v, qty);
    if (navigator.share) { try { navigator.share({ title: p.name, text: text, url: url }).catch(function () {}); return; } catch (e) {} }
    var enc = encodeURIComponent;
    openSheet($("#detailSheet"), '<div class="sheet__head"><h2 id="detailTitle">Share ' + esc(p.name) + '</h2><button class="icon-btn" type="button" data-close-sheet aria-label="Close share menu">' + I.x + '</button></div><div class="sheet__body"><ul class="sharelist">' +
      [["WhatsApp", S.wa(text)], ["WhatsApp, for my school", S.wa(shareText(p, v, qty, true))], ["Facebook", "https://www.facebook.com/sharer/sharer.php?u=" + enc(url)], ["X (Twitter)", "https://twitter.com/intent/tweet?text=" + enc(p.name) + "&url=" + enc(url)], ["Telegram", "https://t.me/share/url?url=" + enc(url) + "&text=" + enc(p.name)], ["Email", "mailto:?subject=" + enc(p.name) + "&body=" + enc(text)], ["SMS", "sms:?body=" + enc(text)]].map(function (x) { return '<li><a class="btn btn--ghost btn--block" href="' + esc(x[1]) + '" target="_blank" rel="noopener">' + x[0] + "</a></li>"; }).join("") +
      '<li><button type="button" class="btn btn--blue btn--block" data-copy-link="' + esc(url) + '">Copy link</button></li></ul><p class="small muted" style="margin-top:.6rem">Nothing is sent by this page. The link opens your own app.</p></div>', "[data-close-sheet]");
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-share]"); if (b) { var p = P[b.getAttribute("data-share")], st = shareState[p.slug] || { v: defV(p), qty: p.min }; openShare(p, st.v, st.qty); return; }
    var c = e.target.closest("[data-copy-link]"); if (c) { copyText(c.getAttribute("data-copy-link"), "Link copied"); }
  });
  function setMeta(p, v) {
    function m(attr, k, val) { var el = document.head.querySelector("meta[" + attr + '="' + k + '"]'); if (!el) { el = document.createElement("meta"); el.setAttribute(attr, k); document.head.appendChild(el); } el.setAttribute("content", val); }
    var d = p ? p.name + ": " + money(v.price) + " " + perText(p) + ", wholesale " + money(v.wp) + " from " + p.wq + ". Kolom Khata Stationers, College Street (sample)." : "A sample online stationery store with shop and wholesale prices.";
    m("name", "description", d); m("property", "og:title", p ? p.name + " | Kolom Khata Stationers" : "Kolom Khata Stationers"); m("property", "og:description", d);
    m("property", "og:image", location.origin + IMG + (p ? v.img + "-800.webp" : "hero.jpg")); m("name", "twitter:card", "summary_large_image");
  }

  // ---------- your orders of this item, and tracking from any product ----------
  var STAGES = ["Order placed", "Packed", "Shipped", "Out for delivery", "Delivered"];
  function timelineHTML(o) {
    var st = stageOf(o), times = stepTimes(o), custom = o.items.some(function (l) { return l.print || l.note; }), th = custom && (o.items.filter(function (l) { return l.print && l.print.thumb; })[0] || {}).print;
    var steps = custom ? ["Order placed", "Proof approved, printing", "Quality check and packed", "Shipped", "Delivered"] : ["Order placed", "Packed", "Shipped", "Out for delivery", "Delivered"];
    return '<ol class="tl">' + steps.map(function (s, i) { var state = i <= st ? "done" : i === st + 1 ? "now" : "todo"; return '<li data-s="' + state + '"' + (i === st ? ' aria-current="step"' : "") + "><i>" + (state === "done" ? I.check : "") + "</i><b>" + s + "</b><small>" + (i <= st ? fDT(times[i]) : i === 4 ? "Expected by " + fDate(o.eta[1]) : "Not yet") + "</small>" + (i === 1 && th ? '<img src="' + esc(th.thumb) + '" alt="Your approved design" width="48" height="48" style="width:48px;height:48px;border-radius:6px;margin-top:.3rem">' : "") + "</li>"; }).join("") + "</ol>" +
      '<p class="small muted">Courier: Sample Express · Tracking no. <span class="notranslate">SX' + o.no.replace(/\D/g, "") + "IN</span></p>";
  }
  function myOrdersOf(p) { return myOrders().filter(function (o) { return o.items.some(function (l) { return l.slug === p.slug; }); }); }
  function yourOrdersHTML(p) {
    var os = myOrdersOf(p);
    if (!os.length) return '<p class="small muted helpline">Questions? <button type="button" class="textbtn" data-chat="' + p.slug + '">Chat about this product</button> · <button type="button" class="textbtn" data-trackform>Track an order</button></p>';
    return '<div class="yourorders"><p class="lab">Your orders of this item</p>' + os.slice(0, 3).map(function (o) {
      var st = stageOf(o), l = o.items.filter(function (x) { return x.slug === p.slug; })[0], w = Math.round(st / 4 * 100);
      return '<div class="yo"><p><b class="notranslate">' + o.no + '</b> <span class="st st--' + STATUS[st] + '">' + (st === 3 ? "Out for delivery" : STATUS[st]) + '</span><br><span class="small muted">' + fDT(o.created) + " · " + esc(l.var) + " · " + qtyText(P[l.slug], l.qty) + " · Expected " + fDate(o.eta[1]) + '</span></p><div class="bar" aria-hidden="true"><i style="width:' + w + '%"></i></div>' +
        '<div class="buy-links"><button type="button" class="textbtn" data-trackno="' + o.no + '">Track order</button><button type="button" class="textbtn" data-reorder="' + o.no + '">Reorder</button><button type="button" class="textbtn" data-chat="' + p.slug + '" data-chat-order="' + o.no + '">Order help</button><a class="textbtn wa-link" href="' + esc(S.wa(waSummary(o))) + '" target="_blank" rel="noopener">Get updates on WhatsApp</a>' + (st >= 4 ? '<a class="textbtn" href="#write">Rate this item</a>' : "") + "</div></div>";
    }).join("") + "</div>";
  }
  function openTrack(no) {
    var o = no ? findOrder(no) : null;
    var form = '<form id="ptForm" class="form-grid" novalidate><div class="field"><label for="ptNo">Order number</label><input class="inp notranslate" id="ptNo" placeholder="KKS-200311" aria-describedby="ptErr"></div><div class="field"><label for="ptMob">Mobile number</label><input class="inp notranslate" id="ptMob" inputmode="numeric" placeholder="98300 12345"></div><p class="err" id="ptErr" role="alert"></p><button class="btn btn--blue" type="submit">Track</button><p class="small muted">Sample orders: KKS-200311 with 9830012345, KKS-200298 with 9876543210.</p></form>';
    openSheet($("#detailSheet"), '<div class="sheet__head"><h2 id="detailTitle">Track ' + (o ? 'order <span class="notranslate">' + o.no + "</span>" : "an order") + '</h2><button class="icon-btn" type="button" data-close-sheet aria-label="Close tracking">' + I.x + '</button></div><div class="sheet__body" id="ptBody">' + (o ? timelineHTML(o) : form) + "</div>", o ? "[data-close-sheet]" : "#ptNo");
  }
  document.addEventListener("click", function (e) {
    var b;
    if ((b = e.target.closest("[data-trackno]"))) { openTrack(b.getAttribute("data-trackno")); return; }
    if (e.target.closest("[data-trackform]")) { openTrack(""); return; }
    if ((b = e.target.closest("[data-reorder]")) && route().name !== "account") { var o = findOrder(b.getAttribute("data-reorder")); if (o) reorder(o); }
  });
  document.addEventListener("submit", function (e) {
    if (e.target.id !== "ptForm") return; e.preventDefault();
    var no = $("#ptNo").value.trim().toUpperCase(), mob = $("#ptMob").value, err = $("#ptErr");
    if (!/^KKS-\d{6}$/.test(no)) { err.textContent = "Order numbers look like KKS-200311."; $("#ptNo").focus(); return; }
    if (!S.validMobile(mob)) { err.textContent = "Enter the 10-digit mobile number used for the order."; $("#ptMob").focus(); return; }
    var o = findOrder(no);
    if (!o || digits(o.mobile) !== digits(mob)) { err.textContent = "No order found with this number and mobile. Sample orders are saved only in the browser where they were placed."; return; }
    $("#ptBody").innerHTML = timelineHTML(o); $("#detailTitle").innerHTML = 'Track order <span class="notranslate">' + o.no + "</span>";
  });

  // ---------- chat (its code loads on first open) ----------
  var chatState = 0, chatWait = [];
  function loadChat(cb) { if (window.KKChat) return cb(); chatWait.push(cb); if (chatState) return; chatState = 1; var s = document.createElement("script"); s.src = u("/chat.js"); s.onload = function () { chatWait.forEach(function (f) { f(); }); chatWait = []; }; s.onerror = function () { chatState = 0; S.toast("Chat did not load. Try WhatsApp.", { icon: false }); }; document.head.appendChild(s); }
  var chatBtn = document.createElement("button"); chatBtn.type = "button"; chatBtn.className = "chatbtn"; chatBtn.setAttribute("data-chat", ""); chatBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg><span>Chat</span><span class="chatbtn__dot" hidden></span>'; chatBtn.setAttribute("aria-label", "Chat with the shop"); document.body.appendChild(chatBtn);
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-chat]"); if (!b) return;
    var slug = b.getAttribute("data-chat") || (route().name === "product" ? route().slug : ""), ctx = slug && shareState[slug] ? shareState[slug] : null, order = b.getAttribute("data-chat-order") || "";
    chatBtn.querySelector(".chatbtn__dot").hidden = true;
    closeSheet(false);
    loadChat(function () { window.KKChat.open({ slug: slug, vid: ctx ? ctx.v.id : "", qty: ctx ? ctx.qty : 0, order: order, opener: b }); });
  });
  var greetT = null;
  function chatGreet(r) {
    clearTimeout(greetT); chatBtn.hidden = r.name === "design" || r.name === "invoice";
    if (r.name !== "product") return;
    greetT = setTimeout(function () { try { if (sessionStorage.getItem("kk:greeted")) return; sessionStorage.setItem("kk:greeted", "1"); } catch (e) {} chatBtn.querySelector(".chatbtn__dot").hidden = false; chatBtn.setAttribute("aria-label", "Chat with the shop, 1 new message"); }, 20000);
  }
  // What chat.js and admin need.
  window.KKApp.chatAPI = { P: P, vOf: vOf, defV: defV, tierOf: tierOf, eta: eta, delivery: delivery, stockText: stockText, perText: perText, qtyText: qtyText, mkName: mkName, money: money, fDate: fDate, offersFor: offersFor, qaOf: qaOf, addToCart: addToCart, openQuote: openQuote, openSizeGuide: function (slug) { var p = P[slug]; openSizeGuide(p, defV(p), null); }, navigate: navigate, u: u, IMG: IMG, img: img, esc: esc, wa: S.wa, trap: S.trap, announce: S.announce, store: S.store, findOrder: findOrder, stageOf: stageOf, STATUS: STATUS, myOrders: myOrders, STORE: STORE, WA_END: WA_END, validPin: S.validPin };

  // ---------- start ----------
  function nearTop() { document.body.classList.toggle("near-top", window.scrollY < 480); }
  window.addEventListener("scroll", nearTop, { passive: true });
  nearTop();
  window.addEventListener("resize", function () {
    var bar = $(".cartpage") && $(".sticky-buy", view); if (bar) { var mob = window.innerWidth < 960; bar.style.display = mob ? "flex" : "none"; document.body.classList.toggle("has-bar", mob); }
  });
  window.addEventListener("storage", function (e) { if (e.key && e.key.indexOf("nxshop:kk:") === 0) badges(); });
  render();
})();
