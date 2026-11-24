/* Nolen Mishti Ghar (sample online sweet shop): the menu, cart, checkout,
 * order tracking and the owner's view.
 *
 * Everything happens in this browser. The cart, the chosen area and slot and
 * the visitor's sample orders are kept with NxShop.store (localStorage with a
 * memory fallback). Nothing is posted anywhere; the only thing that leaves
 * the page is a WhatsApp link the visitor taps.
 */
(function () {
  "use strict";
  var S = window.NxShop;
  var D = window.MISHTI;
  if (!S || !D) return;

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var esc = S.esc;
  var M = S.moneyHTML;
  var money = S.money;
  var IMG = "/demo/mishti-store/images/p/";
  var SAMPLE_TAIL = "\n\n(Sent from the Nolen Mishti Ghar sample website by Nexvora)";

  var byId = {};
  D.PRODUCTS.forEach(function (p) { byId[p.id] = p; });

  // ---- stored state -------------------------------------------------------
  var stCart = S.store("mishti:cart");
  var stArea = S.store("mishti:area");
  var stSlot = S.store("mishti:slot");
  var stCoupon = S.store("mishti:coupon");
  var stNote = S.store("mishti:note");
  var stOrders = S.store("mishti:orders");
  var stOwner = S.store("mishti:owner");
  var stCustomer = S.store("mishti:customer");

  /** @type {{id:string,p:number,q:number,gift?:string}[]} */
  var cart = (stCart.get([]) || []).filter(function (l) {
    return byId[l.id] && byId[l.id].packs[l.p] && l.q > 0 && !byId[l.id].soldOut;
  });
  var areaName = stArea.get("Nagerbazar");
  if (!areaOf(areaName)) areaName = "Nagerbazar";
  var coupon = stCoupon.get("") || "";
  var couponMsg = null;
  var note = stNote.get("") || "";
  var orders = stOrders.get([]) || [];
  var owner = stOwner.get({}) || {};
  var customer = stCustomer.get({}) || {};
  var picked = {}; // product id -> chosen pack index on its card

  function areaOf(name) {
    for (var i = 0; i < D.AREAS.length; i++) if (D.AREAS[i].name === name) return D.AREAS[i];
    return null;
  }
  function saveCart() { stCart.set(cart); }
  function img(name, size) { return IMG + name + "-" + (size || 320) + ".webp"; }
  function lineIndex(id, p) {
    for (var i = 0; i < cart.length; i++) if (cart[i].id === id && cart[i].p === p) return i;
    return -1;
  }
  function qtyOf(id, p) {
    var i = lineIndex(id, p);
    return i < 0 ? 0 : cart[i].q;
  }
  function count() { return cart.reduce(function (n, l) { return n + l.q; }, 0); }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }

  // ---- money rules -------------------------------------------------------
  function findCoupon(code) {
    code = String(code || "").trim().toUpperCase();
    for (var i = 0; i < D.COUPONS.length; i++) if (D.COUPONS[i].code === code) return D.COUPONS[i];
    return null;
  }
  function totals() {
    var sub = cart.reduce(function (s, l) { return s + byId[l.id].packs[l.p].price * l.q; }, 0);
    var area = areaOf(areaName);
    var c = findCoupon(coupon);
    var discount = 0, couponOk = false, couponNote = "";
    if (c && c.kind === "percent") {
      if (sub >= c.min) { discount = Math.round(sub * c.value / 100); couponOk = true; }
      else couponNote = c.code + " works on orders above " + money(c.min) + ". Add " + money(c.min - sub) + " more to use it.";
    }
    var freeByCoupon = !!(c && c.kind === "freedel");
    if (freeByCoupon) couponOk = true;
    var freeByAmount = sub >= D.SHOP.freeDeliveryAt;
    var delivery = sub === 0 || freeByAmount || freeByCoupon ? 0 : area.fee;
    return {
      sub: sub, discount: discount, delivery: delivery, fee: area.fee,
      total: Math.max(0, sub - discount + delivery),
      freeByAmount: freeByAmount, freeByCoupon: freeByCoupon,
      toFree: Math.max(0, D.SHOP.freeDeliveryAt - sub),
      minOk: sub >= D.SHOP.minOrder, toMin: Math.max(0, D.SHOP.minOrder - sub),
      coupon: c, couponOk: couponOk, couponNote: couponNote,
    };
  }

  // ---- delivery slots ----------------------------------------------------
  function hourNow() { var d = new Date(); return d.getHours() + d.getMinutes() / 60; }
  function slotOpen(s) { return s.day === 1 || hourNow() < s.start; }
  function currentSlot() {
    var id = stSlot.get("");
    var s = D.SLOTS.filter(function (x) { return x.id === id; })[0];
    if (s && slotOpen(s)) return s;
    return D.SLOTS.filter(slotOpen)[0];
  }

  // ---- header: cart count, area chip, cart bar ---------------------------
  var cartBtn = $("#cartBtn"), cartCount = $("#cartCount"), cartbar = $("#cartbar");
  var mqMobile = window.matchMedia("(max-width:1023px)");
  function updateBadges(bump) {
    var n = count(), t = totals();
    cartCount.textContent = n;
    cartCount.classList.toggle("on", n > 0);
    if (bump && !S.reducedMotion()) {
      cartCount.classList.remove("bump");
      void cartCount.offsetWidth;
      cartCount.classList.add("bump");
    }
    cartBtn.setAttribute("aria-label", n ? "Cart, " + plural(n, "item", "items") + ", " + money(t.total) : "Cart, empty");
    $("#cartbarText").textContent = plural(n, "item", "items") + " · " + money(t.sub);
    var show = n > 0 && !ovl.classList.contains("is-open");
    cartbar.classList.toggle("on", show);
    document.documentElement.classList.toggle("has-bar", show);
    document.documentElement.style.setProperty("--bar-h", show && mqMobile.matches ? "78px" : "0px");
  }
  function updateArea() { $("#areaName").textContent = areaName; }

  function setHeadH() {
    var h = $("#header").offsetHeight;
    document.documentElement.style.setProperty("--head-h", h + "px");
  }
  function nearTop() { document.documentElement.classList.toggle("near-top", window.scrollY < 480); }
  nearTop();
  window.addEventListener("scroll", nearTop, { passive: true });
  setHeadH();
  $("#header").addEventListener("transitionend", setHeadH);
  window.addEventListener("resize", setHeadH);
  window.addEventListener("scroll", function () { requestAnimationFrame(setHeadH); }, { passive: true });

  // ---- order cut-off line in the hero ------------------------------------
  function updateCutoff() {
    var el = $("#cutoffText"), now = new Date();
    var cut = new Date(now); cut.setHours(D.SHOP.cutoffHour, 0, 0, 0);
    var dot = $(".cutoff__dot");
    if (now < cut && now.getHours() >= 7) {
      var mins = Math.ceil((cut - now) / 60000);
      var h = Math.floor(mins / 60), m = mins % 60;
      el.innerHTML = "Order by <b>6 pm</b> for delivery today &middot; " + (h ? h + " h " : "") + m + " min left";
      dot.style.background = "#7DDB86";
    } else {
      el.innerHTML = "Order now for <b>tomorrow morning</b> delivery";
      dot.style.background = "#F6C77E";
    }
  }
  updateCutoff();
  setInterval(updateCutoff, 30000);

  // ---- menu --------------------------------------------------------------
  var STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9Z"/></svg>';
  var VEG = '<span class="veg" role="img" aria-label="Vegetarian"></span>';

  function packOptions(p, sel) {
    return p.packs.map(function (k, i) {
      return '<option value="' + i + '"' + (i === sel ? " selected" : "") + ">" + esc(k.label) + " · " + money(k.price) + "</option>";
    }).join("");
  }
  function buyHTML(p) {
    var i = picked[p.id] || 0, q = qtyOf(p.id, i), price = p.packs[i].price;
    var left = '<span class="price rs notranslate">' + money(price) + "</span>";
    if (p.soldOut) {
      return left + '<a class="notify" href="' + S.wa("Hello Nolen Mishti Ghar, please tell me on WhatsApp when " + p.name + " is back." + SAMPLE_TAIL) + '" target="_blank" rel="noopener">Notify me on WhatsApp</a>';
    }
    if (!q) return left + '<button class="add" type="button" data-add="' + p.id + '" aria-label="Add ' + esc(p.name) + ", " + esc(p.packs[i].label) + ', to cart">Add</button>';
    return left +
      '<span class="step" role="group" aria-label="' + esc(p.name) + " quantity\">" +
      '<button type="button" data-dec="' + p.id + '" aria-label="Remove one ' + esc(p.name) + '">−</button>' +
      '<output class="notranslate" aria-live="polite">' + q + "</output>" +
      '<button type="button" data-inc="' + p.id + '" aria-label="Add one more ' + esc(p.name) + '">+</button></span>';
  }
  function cardHTML(p) {
    var i = picked[p.id] || 0;
    var badges = p.badges.map(function (b) { return '<span class="badge badge--' + b + '">' + b + "</span>"; }).join("");
    return (
      '<article class="card' + (p.soldOut ? " is-out" : "") + '" id="c-' + p.id + '">' +
      '<button class="card__media" type="button" data-open="' + p.id + '" aria-label="See details of ' + esc(p.name) + '">' +
      '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="' + img(p.img[0]) + '" data-srcset="' + img(p.img[0]) + " 320w, " + img(p.img[0], 640) + ' 640w" sizes="(min-width:1280px) 300px, (min-width:1024px) 24vw, (min-width:640px) 32vw, 48vw" width="320" height="320" alt="' + esc(p.name) + '" loading="lazy" decoding="async">' +
      (badges ? '<span class="badges">' + badges + "</span>" : "") +
      (p.soldOut ? '<span class="out-tag">Sold out for today</span>' : "") +
      "</button>" +
      '<div class="card__body">' +
      '<h4 class="card__name">' + VEG + '<span>' + esc(p.name) + "</span></h4>" +
      '<p class="card__line">' + esc(p.line) + "</p>" +
      '<div class="card__foot">' +
      '<div class="pack"><label class="sr" for="pk-' + p.id + '">Pack size for ' + esc(p.name) + '</label><select class="notranslate" id="pk-' + p.id + '" data-pack="' + p.id + '"' + (p.soldOut ? " disabled" : "") + ">" + packOptions(p, i) + "</select></div>" +
      '<div class="buy" id="buy-' + p.id + '">' + buyHTML(p) + "</div>" +
      "</div></div></article>"
    );
  }
  function renderMenu() {
    var html = D.CATEGORIES.map(function (c) {
      var items = D.PRODUCTS.filter(function (p) { return p.cat === c.id; });
      return (
        '<section class="menu-cat" id="cat-' + c.id + '" aria-labelledby="h-' + c.id + '">' +
        '<div class="menu-cat__head"><h3 id="h-' + c.id + '">' + esc(c.name) + "</h3>" +
        (c.tag ? '<span class="tag">' + esc(c.tag) + "</span>" : "") +
        '<span class="count">' + plural(items.length, "item", "items") + "</span></div>" +
        '<div class="grid">' + items.map(cardHTML).join("") + "</div></section>"
      );
    }).join("");
    $("#menuBody").innerHTML = html;
    $("#chips").innerHTML = D.CATEGORIES.map(function (c, i) {
      return '<a class="chip" href="#cat-' + c.id + '" data-chip="' + c.id + '"' + (i === 0 ? ' aria-current="true"' : "") + ">" + esc(c.name) + (c.tag ? " <small>" + esc(c.tag) + "</small>" : "") + "</a>";
    }).join("");
  }
  function refreshBuy(id) {
    var el = document.getElementById("buy-" + id);
    if (!el) return;
    var focusedKind = document.activeElement && el.contains(document.activeElement) ? (document.activeElement.getAttribute("data-inc") ? "inc" : document.activeElement.getAttribute("data-dec") ? "dec" : "add") : null;
    el.innerHTML = buyHTML(byId[id]);
    if (focusedKind) {
      var f = el.querySelector("[data-" + focusedKind + "]") || el.querySelector("[data-add]") || el.querySelector("[data-inc]");
      if (f) f.focus();
    }
  }

  // Menu photos load only when their card is about to scroll into view.
  // Native lazy loading starts far too early on slow phones and competes
  // with the hero photo.
  function lazyPhotos(root) {
    var imgs = $$("img[data-src]", root);
    function show(im) { im.srcset = im.getAttribute("data-srcset"); im.src = im.getAttribute("data-src"); im.removeAttribute("data-src"); im.removeAttribute("data-srcset"); }
    if (!("IntersectionObserver" in window)) { imgs.forEach(show); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: "400px 0px" });
    imgs.forEach(function (im) { io.observe(im); });
  }

  // Active chip follows the category on screen.
  function watchChips() {
    if (!("IntersectionObserver" in window)) return;
    var chips = $("#chips");
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id.replace("cat-", "");
        $$(".chip", chips).forEach(function (c) {
          var on = c.getAttribute("data-chip") === id;
          if (on) {
            c.setAttribute("aria-current", "true");
            var left = c.offsetLeft - chips.clientWidth / 2 + c.clientWidth / 2;
            chips.scrollTo({ left: left, behavior: S.reducedMotion() ? "auto" : "smooth" });
          } else c.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$(".menu-cat").forEach(function (s) { io.observe(s); });
  }

  // ---- cart changes ------------------------------------------------------
  function addToCart(id, p, q, gift) {
    var prod = byId[id];
    if (!prod || prod.soldOut) return;
    var i = lineIndex(id, p);
    if (i < 0) cart.push({ id: id, p: p, q: q, gift: gift || "" });
    else { cart[i].q += q; if (gift) cart[i].gift = gift; }
    saveCart();
    refreshBuy(id);
    updateBadges(true);
    S.toast("Added to cart: " + prod.name + ", " + prod.packs[p].label);
  }
  function changeQty(id, p, delta) {
    var i = lineIndex(id, p);
    if (i < 0) { if (delta > 0) addToCart(id, p, delta); return; }
    cart[i].q += delta;
    var prod = byId[id];
    if (cart[i].q <= 0) {
      cart.splice(i, 1);
      S.announce(prod.name + " removed from cart. " + plural(count(), "item", "items") + " in cart.");
    } else {
      S.announce(prod.name + ", " + prod.packs[p].label + ": " + cart[i].q + ". " + plural(count(), "item", "items") + " in cart.");
    }
    saveCart();
    refreshBuy(id);
    updateBadges(delta > 0);
  }

  // ---- overlay (sheet on phones, modal or drawer on desktop) -------------
  var ovl = $("#ovl"), ovlBox = $(".ovl__box", ovl), ovlBody = $("#ovlBody"), ovlFoot = $("#ovlFoot"), ovlTitle = $("#ovlTitle");
  var release = null, opener = null, view = null, tick = null;
  function open(name, render, opts) {
    opts = opts || {};
    var already = ovl.classList.contains("is-open");
    if (!already) opener = document.activeElement;
    clearInterval(tick);
    view = name;
    ovl.classList.toggle("ovl--side", !!opts.side);
    ovlBox.style.setProperty("--box-w", (opts.width || 560) + "px");
    render();
    ovlBody.scrollTop = 0;
    document.documentElement.classList.add("ovl-open");
    if (!already) {
      ovl.classList.add("is-open");
      S.lockScroll(true);
    }
    if (release) release(false);
    release = S.trap(ovlBox, close, opts.focus);
    updateBadges();
  }
  function close() {
    if (!ovl.classList.contains("is-open")) return;
    clearInterval(tick);
    ovl.classList.remove("is-open");
    document.documentElement.classList.remove("ovl-open");
    S.lockScroll(false);
    if (release) release(false);
    release = null;
    view = null;
    if (opener && document.contains(opener)) { try { opener.focus({ preventScroll: true }); } catch (e) {} }
    updateBadges();
  }
  function frame(title, body, foot) {
    ovlTitle.textContent = title;
    ovlBody.innerHTML = body;
    if (foot) { ovlFoot.innerHTML = foot; ovlFoot.hidden = false; }
    else { ovlFoot.innerHTML = ""; ovlFoot.hidden = true; }
  }
  ovl.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) close();
  });

  // ---- product sheet -----------------------------------------------------
  var sheet = { id: null, p: 0, q: 1 };
  function openProduct(id) {
    var p = byId[id];
    sheet = { id: id, p: picked[id] || 0, q: 1 };
    open("product", function () { renderProduct(p); }, { width: 880 });
  }
  function renderProduct(p) {
    var k = p.packs[sheet.p];
    var gal = p.img.map(function (n, i) {
      return '<img src="' + img(n, 640) + '" width="640" height="640" alt="' + esc(p.name) + (p.img.length > 1 ? ", photo " + (i + 1) + " of " + p.img.length : "") + '"' + (i ? ' loading="lazy"' : "") + ">";
    }).join("");
    var dots = p.img.length > 1 ? '<div class="gal-dots">' + p.img.map(function (n, i) {
      return '<button type="button" data-gal="' + i + '" aria-label="Show photo ' + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : "") + "></button>";
    }).join("") + "</div>" : "";
    var badges = p.badges.map(function (b) { return '<span class="badge badge--' + b + '">' + b + "</span>"; }).join(" ");
    var body =
      '<div class="ps__grid"><div><div class="gal" id="gal">' + gal + "</div>" + dots + "</div><div>" +
      (badges ? '<div style="display:flex;gap:.35rem;margin-bottom:.5rem">' + badges + "</div>" : "") +
      '<h3 class="ps__name">' + VEG + "<span>" + esc(p.name) + "</span></h3>" +
      '<p class="ps__price notranslate" id="psPrice">' + money(k.price * sheet.q) + "</p>" +
      '<p class="ps__tax">Inclusive of all taxes' + (sheet.q > 1 ? " · " + sheet.q + " × " + money(k.price) : "") + "</p>" +
      (p.soldOut ? '<p class="min-warn" style="margin-top:.75rem">Sold out for today. We make it fresh again tomorrow morning.</p>' :
        '<div class="block"><span class="label" id="pkLbl">Pack size</span><div class="packs notranslate" role="group" aria-labelledby="pkLbl">' +
        p.packs.map(function (x, i) {
          return '<button type="button" data-spack="' + i + '" aria-pressed="' + (i === sheet.p) + '">' + esc(x.label) + " · " + money(x.price) + "</button>";
        }).join("") + "</div></div>" +
        '<div class="block"><span class="label" id="qLbl">Quantity</span><span class="qty" role="group" aria-labelledby="qLbl"><button type="button" data-sq="-1" aria-label="One less">−</button><output class="notranslate" aria-live="polite">' + sheet.q + '</output><button type="button" data-sq="1" aria-label="One more">+</button></span></div>') +
      '<p class="ps__desc">' + esc(p.desc) + "</p>" +
      (p.contents ? '<div class="ps__facts"><div><b>What is inside</b>' + p.contents.map(esc).join(", ") + "</div></div>" : "") +
      '<div class="ps__facts"><div><b>Ingredients</b>' + esc(p.ingredients) + "</div><div><b>Shelf life</b>" + esc(p.shelf) + "</div></div>" +
      "</div></div>";
    var foot = p.soldOut
      ? '<a class="btn btn--wa btn--block" href="' + S.wa("Hello Nolen Mishti Ghar, please tell me on WhatsApp when " + p.name + " is back." + SAMPLE_TAIL) + '" target="_blank" rel="noopener">Notify me on WhatsApp</a>'
      : '<button class="btn btn--primary btn--block" type="button" data-sadd>Add to cart · <span class="notranslate">' + money(k.price * sheet.q) + "</span></button>";
    frame(p.name, body, foot);
    var g = $("#gal");
    if (g && p.img.length > 1) {
      g.addEventListener("scroll", function () {
        var i = Math.round(g.scrollLeft / g.clientWidth);
        $$(".gal-dots button", ovlBody).forEach(function (b, j) { b.setAttribute("aria-current", j === i ? "true" : "false"); });
      }, { passive: true });
    }
  }

  // ---- cart drawer -------------------------------------------------------
  function openCart() {
    open("cart", renderCart, { side: true });
  }
  function slotsHTML() {
    var cur = currentSlot();
    return D.SLOTS.map(function (s) {
      var ok = slotOpen(s);
      return '<label class="slot"><input type="radio" name="slot" value="' + s.id + '"' + (cur && cur.id === s.id ? " checked" : "") + (ok ? "" : " disabled") + ' data-fk="slot-' + s.id + '"><span>' + esc(s.label.split(", ")[0]) + "<small>" + esc(s.label.split(", ")[1]) + (ok ? "" : " · closed") + "</small></span></label>";
    }).join("");
  }
  function renderCart() {
    var fk = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute("data-fk");
    if (!cart.length) {
      frame("Your cart",
        '<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 7h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 7Z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg><h3>Your cart is empty</h3><p>Rosogolla and malai sandesh are what most people start with.</p><button class="btn btn--primary" type="button" data-go-menu>Browse the menu</button></div>');
      return;
    }
    var t = totals(), slot = currentSlot();
    var lines = cart.map(function (l) {
      var p = byId[l.id], k = p.packs[l.p], key = l.id + "-" + l.p;
      return '<div class="line"><img src="' + img(p.img[0]) + '" alt="" width="64" height="64" loading="lazy">' +
        '<div><p class="line__name">' + esc(p.name) + '</p><p class="line__meta"><span class="notranslate">' + esc(k.label) + " · " + money(k.price) + "</span>" + (l.gift ? "<br>Gift message: “" + esc(l.gift) + "”" : "") + "</p>" +
        '<button class="remove" type="button" data-rm="' + key + '" data-fk="rm-' + key + '">Remove</button></div>' +
        '<div class="line__right"><span class="price notranslate">' + money(k.price * l.q) + '</span><span class="qty" role="group" aria-label="' + esc(p.name) + ' quantity"><button type="button" data-cq="' + key + '" data-d="-1" data-fk="dec-' + key + '" aria-label="One less ' + esc(p.name) + '">−</button><output class="notranslate">' + l.q + '</output><button type="button" data-cq="' + key + '" data-d="1" data-fk="inc-' + key + '" aria-label="One more ' + esc(p.name) + '">+</button></span></div></div>';
    }).join("");
    var pct = Math.min(100, Math.round(t.sub / D.SHOP.freeDeliveryAt * 100));
    var progress = t.freeByAmount || t.freeByCoupon
      ? '<div class="progress is-free"><p>You get free delivery' + (t.freeByCoupon && !t.freeByAmount ? " with FREEDEL" : "") + '.</p><div class="progress__bar"><i style="width:100%"></i></div></div>'
      : '<div class="progress"><p>Add <span class="notranslate">' + money(t.toFree) + '</span> more for free delivery</p><div class="progress__bar" role="progressbar" aria-label="Progress to free delivery" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="width:' + pct + '%"></i></div></div>';
    var cpn = t.coupon
      ? '<div class="applied"><span><span class="notranslate">' + esc(t.coupon.code) + "</span> applied" + (t.couponOk ? ": " + esc(t.coupon.text) : "") + '</span><button type="button" data-uncoupon data-fk="uncoupon">Remove</button></div>' +
        (t.couponNote ? '<p class="msg msg--warn" role="status">' + esc(t.couponNote) + "</p>" : "")
      : '<form class="coupon" data-coupon novalidate><label class="sr" for="cpn">Coupon code</label><input class="field-in" id="cpn" name="code" autocomplete="off" autocapitalize="characters" placeholder="Coupon code" data-fk="cpn" style="min-height:48px;padding:.6rem .85rem;border:1.5px solid rgba(42,26,20,.22);border-radius:10px;background:#fff"><button class="btn btn--ghost" type="submit" data-fk="cpn-go">Apply</button></form>' +
        (couponMsg ? '<p class="msg msg--' + couponMsg.kind + '" role="status">' + esc(couponMsg.text) + "</p>" : '<p class="msg" style="color:var(--muted);font-weight:500">Try <span class="notranslate">PUJO10</span> or <span class="notranslate">FREEDEL</span></p>');
    var body =
      lines + progress +
      (t.minOk ? "" : '<p class="min-warn" role="status">The smallest order we deliver is <span class="notranslate">' + money(D.SHOP.minOrder) + '</span>. Add <span class="notranslate">' + money(t.toMin) + "</span> more.</p>") +
      '<div class="block"><span class="label">Delivering to</span><button class="area-chip" type="button" data-area-from-cart data-fk="area"><b>' + esc(areaName) + '</b> · <span class="notranslate">' + money(t.fee) + '</span> delivery<span aria-hidden="true"> ▾</span></button></div>' +
      '<fieldset class="block" style="border:0;padding:0;margin-inline:0"><legend class="label" style="padding:0;font-weight:700;margin-bottom:.45rem">Delivery slot</legend><div class="slots">' + slotsHTML() + "</div>" + (slot ? "" : '<p class="msg msg--warn">No slots left. Please call the shop.</p>') + "</fieldset>" +
      '<div class="block"><span class="label">Coupon</span>' + cpn + "</div>" +
      '<div class="block field"><label for="note">Note to the shop</label><textarea id="note" maxlength="160" placeholder="For example: less sugar, ring the bell twice, or a gift message" data-fk="note">' + esc(note) + "</textarea></div>" +
      '<div class="sum"><div><span>Sweets</span><span class="notranslate">' + money(t.sub) + "</span></div>" +
      (t.discount ? '<div class="disc"><span>Discount (<span class="notranslate">' + esc(t.coupon.code) + '</span>)</span><span class="notranslate">−' + money(t.discount) + "</span></div>" : "") +
      "<div><span>Delivery to " + esc(areaName) + '</span><span class="notranslate">' + (t.delivery ? money(t.delivery) : "Free") + "</span></div>" +
      '<div class="tot"><span>Total</span><span class="notranslate">' + money(t.total) + "</span></div><small>Inclusive of all taxes</small></div>";
    var canCheckout = t.minOk && !!slot;
    var foot =
      '<button class="btn btn--primary btn--block" type="button" data-checkout data-fk="checkout"' + (canCheckout ? "" : " disabled") + '>Checkout · <span class="notranslate">' + money(t.total) + "</span></button>" +
      '<a class="btn btn--wa btn--block" href="' + S.wa(cartMessage()) + '" target="_blank" rel="noopener" data-fk="wa"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.2 1.3-1.9 1.4-.5.1-1.1.2-3.2-.7-2.7-1.1-4.4-3.9-4.5-4-.1-.2-1.1-1.4-1.1-2.7s.7-1.9 1-2.2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5s.8 2 .9 2.1c.1.2.1.3 0 .5s-.2.4-.3.5l-.4.5c-.1.1-.3.3-.1.6s.6 1.1 1.4 1.8c1 .9 1.8 1.1 2.1 1.3.3.1.4.1.6-.1s.7-.8.9-1.1c.2-.3.4-.2.6-.1s1.6.8 1.8.9c.3.1.4.2.5.3.1.2.1.7-.1 1.3Z"/></svg>Order on WhatsApp instead</a>' +
      '<p class="foot-note">WhatsApp sends your cart, area and slot as one tidy message.</p>';
    frame("Your cart · " + plural(count(), "item", "items"), body, foot);
    if (fk) {
      var f = ovlBox.querySelector('[data-fk="' + fk + '"]');
      if (f) f.focus(); else { var c = ovlBox.querySelector("[data-checkout]"); if (c && !c.disabled) c.focus(); }
    }
  }

  function cartMessage() {
    var t = totals(), slot = currentSlot();
    var lines = cart.map(function (l) {
      var p = byId[l.id], k = p.packs[l.p];
      return "• " + p.name + ", " + k.label + " x " + l.q + " = " + money(k.price * l.q) + (l.gift ? "\n   Gift message: " + l.gift : "");
    });
    var out = "Hello Nolen Mishti Ghar, I would like to order:\n\n" + lines.join("\n") +
      "\n\nSweets: " + money(t.sub) +
      (t.discount ? "\nDiscount (" + t.coupon.code + "): -" + money(t.discount) : "") +
      "\nDelivery to " + areaName + ": " + (t.delivery ? money(t.delivery) : "Free") +
      (t.freeByCoupon ? " (FREEDEL)" : "") +
      "\nTotal: " + money(t.total) +
      "\n\nDelivery slot: " + (slot ? slot.label : "please call me") +
      (note ? "\nNote: " + note : "") +
      "\n\nPlease confirm. I will pay by UPI or cash on delivery.";
    return out + SAMPLE_TAIL;
  }

  // ---- area picker -------------------------------------------------------
  function openArea(back) {
    open("area", function () {
      frame("Where should we deliver?",
        '<p style="color:var(--muted);margin-bottom:.9rem">We deliver to these areas from our shop on Dum Dum Road. Free delivery above <span class="notranslate">' + money(D.SHOP.freeDeliveryAt) + "</span>.</p>" +
        '<div class="area-list">' + D.AREAS.map(function (a) {
          return '<button type="button" data-pick-area="' + esc(a.name) + '" data-back="' + (back || "") + '" aria-pressed="' + (a.name === areaName) + '"><span>' + esc(a.name) + '</span><small class="notranslate">' + money(a.fee) + " delivery</small></button>";
        }).join("") + "</div>" +
        '<p style="margin-top:1rem;font-size:.9rem;color:var(--muted)">Somewhere else? <a class="link" href="' + S.wa("Hello Nolen Mishti Ghar, do you deliver to my area?" + SAMPLE_TAIL) + '" target="_blank" rel="noopener">Ask us on WhatsApp</a>.</p>');
    }, { width: 460, focus: '[aria-pressed="true"]' });
  }

  // ---- checkout ----------------------------------------------------------
  var co = null; // form values while checking out
  var touched = {};
  function openCheckout() {
    co = co || {
      name: customer.name || "", mobile: customer.mobile || "", house: customer.house || "", street: customer.street || "",
      landmark: customer.landmark || "", city: "Kolkata", state: "West Bengal", pin: customer.pin || "", pay: "cod",
    };
    co.area = areaName;
    touched = {};
    open("checkout", renderCheckout, { width: 640, focus: "#coName" });
  }
  function coErrors() {
    var e = {};
    if (!co.name.trim()) e.name = "Please write your name.";
    if (!S.validMobile(co.mobile)) e.mobile = "Enter a 10-digit mobile number starting with 6, 7, 8 or 9.";
    if (!co.house.trim()) e.house = "Please add your house or flat number.";
    if (!co.street.trim()) e.street = "Please add the street or para.";
    if (!co.city.trim()) e.city = "Please add the city.";
    if (!S.validPin(co.pin)) e.pin = "PIN code should be 6 digits.";
    return e;
  }
  var LABELS = { name: "your name", mobile: "mobile number", house: "house or flat", street: "street or area", city: "city", pin: "PIN code" };
  function fieldHTML(id, key, label, attrs, hint) {
    var err = touched[key] && coErrors()[key];
    return '<div class="field' + (err ? " has-err" : "") + '"><label for="' + id + '">' + label + "</label>" +
      '<input id="' + id + '" data-co="' + key + '" value="' + esc(co[key]) + '" ' + attrs + (err ? ' aria-invalid="true" aria-describedby="' + id + '-e"' : "") + ">" +
      (hint ? '<p class="hint">' + hint + "</p>" : "") +
      (err ? '<p class="err" id="' + id + '-e">' + esc(err) + "</p>" : "") + "</div>";
  }
  var QR = (function () {
    // A made-up pattern drawn to look like a QR code. It encodes nothing.
    var s = '<svg viewBox="0 0 29 29" role="img" aria-label="Sample UPI QR code, not a real one" shape-rendering="crispEdges"><rect width="29" height="29" fill="#fff"/>';
    var seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var y = 0; y < 29; y++) for (var x = 0; x < 29; x++) {
      var finder = (x < 8 && y < 8) || (x > 20 && y < 8) || (x < 8 && y > 20);
      if (!finder && rnd() > 0.52) s += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="#2A1A14"/>';
    }
    [[0, 0], [21, 0], [0, 21]].forEach(function (f) {
      s += '<rect x="' + (f[0] + .5) + '" y="' + (f[1] + .5) + '" width="7" height="7" fill="none" stroke="#2A1A14"/><rect x="' + (f[0] + 2) + '" y="' + (f[1] + 2) + '" width="4" height="4" fill="#2A1A14"/>';
    });
    return s + "</svg>";
  })();
  function renderCheckout() {
    var t = totals(), slot = currentSlot();
    var errs = coErrors(), ok = !Object.keys(errs).length;
    var areaOpts = D.AREAS.map(function (a) { return "<option" + (a.name === co.area ? " selected" : "") + ">" + esc(a.name) + "</option>"; }).join("");
    var body =
      '<form class="co" id="coForm" novalidate>' +
      '<p style="font-size:.92rem;color:var(--muted)">Arriving <b style="color:var(--ink)">' + esc(slot ? slot.label : "") + '</b> · <button type="button" class="link" data-back-cart style="min-height:32px">Change</button></p>' +
      "<fieldset><legend>Your details</legend><div style=\"display:grid;gap:.8rem\">" +
      fieldHTML("coName", "name", "Name", 'autocomplete="name" required') +
      fieldHTML("coMobile", "mobile", "Mobile number", 'type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="10" required class="notranslate"', "We call this number if we cannot find the house.") +
      "</div></fieldset>" +
      "<fieldset><legend>Delivery address</legend><div style=\"display:grid;gap:.8rem\">" +
      fieldHTML("coHouse", "house", "House or flat number", 'autocomplete="address-line1" placeholder="For example: Flat 3B, Shanti Apartment" required') +
      fieldHTML("coStreet", "street", "Street or area", 'autocomplete="address-line2" placeholder="For example: 12 Jessore Road" required') +
      fieldHTML("coLandmark", "landmark", "Landmark (optional)", 'placeholder="For example: near the Kali temple"') +
      '<div class="field"><label for="coArea">Area</label><select id="coArea" data-co="area">' + areaOpts + "</select></div>" +
      '<div class="row2">' + fieldHTML("coCity", "city", "City", 'autocomplete="address-level2" required') + fieldHTML("coState", "state", "State", 'autocomplete="address-level1"') + "</div>" +
      fieldHTML("coPin", "pin", "PIN code", 'inputmode="numeric" autocomplete="postal-code" maxlength="6" required class="notranslate"') +
      "</div></fieldset>" +
      '<fieldset><legend>Payment</legend><div class="pay">' +
      '<label><input type="radio" name="pay" value="upi"' + (co.pay === "upi" ? " checked" : "") + "><span>UPI<small>Google Pay, PhonePe, Paytm or any UPI app</small></span></label>" +
      '<label><input type="radio" name="pay" value="cod"' + (co.pay === "cod" ? " checked" : "") + "><span>Cash on delivery<small>Pay cash or scan our QR at the door</small></span></label>" +
      "</div>" +
      (co.pay === "upi" ? '<div class="upi" style="margin-top:.75rem">' + QR + '<div><span class="sample-tag">Sample</span><p style="margin-top:.4rem">Scan with any UPI app, or pay to</p><p class="notranslate" style="font-weight:700;font-size:1.05rem">' + esc(D.SHOP.upi) + '</p><p style="margin-top:.25rem"><b class="notranslate">' + money(t.total) + "</b></p></div></div>" : "") +
      '<p class="razor" style="margin-top:.75rem"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><span>In the real store, payment happens on Razorpay&rsquo;s secure page. This sample only pretends to take your payment.</span></p>' +
      "</fieldset>" +
      '<label class="gift-toggle"><input type="checkbox" id="coSave"' + (customer.saved ? " checked" : "") + "> Remember my address on this phone</label>" +
      '<div class="sum"><div><span>Sweets</span><span class="notranslate">' + money(t.sub) + "</span></div>" +
      (t.discount ? '<div class="disc"><span>Discount</span><span class="notranslate">−' + money(t.discount) + "</span></div>" : "") +
      "<div><span>Delivery</span><span class=\"notranslate\">" + (t.delivery ? money(t.delivery) : "Free") + "</span></div>" +
      '<div class="tot"><span>To pay</span><span class="notranslate">' + money(t.total) + "</span></div></div>" +
      "</form>";
    var missing = Object.keys(errs).map(function (k) { return LABELS[k]; });
    var foot =
      '<button class="btn btn--primary btn--block" type="submit" form="coForm" data-place' + (ok ? "" : " disabled") + ">" +
      (co.pay === "upi" ? "I have paid · Place order" : "Place order · <span class=\"notranslate\">" + money(t.total) + "</span>") + "</button>" +
      '<p class="foot-note" id="coMissing" aria-live="polite">' + (ok ? "Nothing is sent anywhere. This is a sample shop." : "Still needed: " + missing.join(", ") + ".") + "</p>";
    frame("Checkout", body, foot);
  }
  // Update error text and the button without redrawing the whole form, so
  // the visitor's cursor stays where it is while typing.
  function refreshCheckoutState(key) {
    var errs = coErrors(), ok = !Object.keys(errs).length;
    var btn = ovlFoot.querySelector("[data-place]");
    if (btn) btn.disabled = !ok;
    var m = $("#coMissing");
    if (m) m.textContent = ok ? "Nothing is sent anywhere. This is a sample shop." : "Still needed: " + Object.keys(errs).map(function (k) { return LABELS[k]; }).join(", ") + ".";
    if (!key) return;
    var input = ovlBody.querySelector('[data-co="' + key + '"]');
    if (!input) return;
    var field = input.closest(".field"), err = touched[key] && errs[key];
    field.classList.toggle("has-err", !!err);
    var p = field.querySelector(".err");
    if (err) {
      if (!p) { p = document.createElement("p"); p.className = "err"; p.id = input.id + "-e"; field.appendChild(p); }
      p.textContent = err;
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", p.id);
    } else {
      if (p) p.remove();
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
    }
  }
  function placeOrder() {
    var errs = coErrors();
    if (Object.keys(errs).length) {
      Object.keys(LABELS).forEach(function (k) { touched[k] = true; });
      renderCheckout();
      var first = ovlBody.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return;
    }
    var t = totals(), slot = currentSlot();
    if (!t.minOk || !slot) { openCart(); return; }
    areaName = co.area;
    stArea.set(areaName);
    updateArea();
    var order = {
      no: S.orderNo("NMG-", 5),
      at: Date.now(),
      items: cart.map(function (l) { var p = byId[l.id]; return { name: p.name, pack: p.packs[l.p].label, q: l.q, price: p.packs[l.p].price, gift: l.gift || "" }; }),
      sub: t.sub, discount: t.discount, delivery: t.delivery, total: t.total, coupon: t.coupon ? t.coupon.code : "",
      slot: slot.label, pay: co.pay === "upi" ? "UPI (paid)" : "Cash on delivery", payShort: co.pay === "upi" ? "UPI" : "COD",
      name: co.name.trim(), mobile: S.digits(co.mobile).slice(-10),
      address: [co.house, co.street, co.landmark, co.area, co.city, co.state, co.pin].map(function (x) { return String(x || "").trim(); }).filter(Boolean).join(", "),
      area: co.area, note: note,
    };
    var save = $("#coSave") && $("#coSave").checked;
    customer = save ? { saved: true, name: co.name, mobile: co.mobile, house: co.house, street: co.street, landmark: co.landmark, pin: co.pin } : {};
    stCustomer.set(customer);
    orders.unshift(order);
    orders = orders.slice(0, 10);
    stOrders.set(orders);
    cart = []; saveCart();
    coupon = ""; stCoupon.set(""); couponMsg = null;
    note = ""; stNote.set("");
    co = null;
    D.PRODUCTS.forEach(function (p) { refreshBuy(p.id); });
    updateBadges();
    openDone(order);
  }

  // ---- order placed ------------------------------------------------------
  function orderMessage(o) {
    return "Hello Nolen Mishti Ghar, please send me updates on WhatsApp for order " + o.no + ".\n\n" +
      o.items.map(function (i) { return "• " + i.name + ", " + i.pack + " x " + i.q + " = " + money(i.price * i.q); }).join("\n") +
      "\n\nTotal: " + money(o.total) + " (" + o.pay + ")" +
      "\nDelivery slot: " + o.slot +
      "\nDeliver to: " + o.name + ", " + o.address +
      "\nMobile: " + o.mobile + SAMPLE_TAIL;
  }
  function openDone(o) {
    open("done", function () {
      var colors = ["#7A1F2B", "#C8842E", "#2E7D32", "#F6C77E"], conf = "";
      if (!S.reducedMotion()) for (var i = 0; i < 26; i++) conf += '<i style="left:' + Math.round(Math.random() * 100) + "%;background:" + colors[i % 4] + ";animation-delay:" + (Math.random() * .5).toFixed(2) + 's"></i>';
      frame("Order placed",
        '<div class="done" style="position:relative"><div class="confetti" aria-hidden="true">' + conf + "</div>" +
        '<div class="done__tick" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>' +
        "<h3>Thank you, " + esc(o.name.split(" ")[0]) + "!</h3>" +
        '<p style="color:var(--muted);margin-top:.35rem">Your sweets are being packed fresh.</p>' +
        '<p class="done__no notranslate">' + esc(o.no) + "</p>" +
        '<dl class="recap">' +
        "<div><dt>Items</dt><dd>" + o.items.map(function (i) { return esc(i.name) + ' <span class="notranslate">(' + esc(i.pack) + " x " + i.q + ")</span>"; }).join("<br>") + "</dd></div>" +
        '<div><dt>Total</dt><dd><span class="notranslate">' + money(o.total) + "</span>, " + esc(o.pay) + "</dd></div>" +
        "<div><dt>Delivery slot</dt><dd>" + esc(o.slot) + "</dd></div>" +
        "<div><dt>Address</dt><dd>" + esc(o.address) + "</dd></div></dl>" +
        '<p style="margin-top:1rem;font-size:.88rem;color:var(--muted)">This is a sample order. Open <b>Owner&rsquo;s view</b> at the bottom left to see it the way the shop sees it.</p></div>',
        '<a class="btn btn--wa btn--block" href="' + S.wa(orderMessage(o)) + '" target="_blank" rel="noopener">Get updates on WhatsApp</a>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem"><button class="btn btn--primary" type="button" data-track="' + esc(o.no) + '">Track order</button><button class="btn btn--ghost" type="button" data-close>Keep shopping</button></div>');
    }, { width: 560, focus: "[data-track]" });
    S.announce("Order placed. Order number " + o.no + ".");
  }

  // ---- tracking ----------------------------------------------------------
  var STEPS = ["Order received", "Being packed", "Out for delivery", "Delivered"];
  var STATUS = ["New", "Packing", "Out for delivery", "Delivered"];
  var STEP_MS = 9000;
  function stepOf(o) {
    if (owner[o.no] != null) return owner[o.no];
    return Math.min(3, Math.floor((Date.now() - o.at) / STEP_MS));
  }
  function clock(ms) {
    return new Date(ms).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  }
  function openTrack(no) {
    open("track", function () { renderTrack(no); }, { width: 520 });
    tick = setInterval(function () { if (view === "track") renderTrack(no, true); }, 1500);
  }
  function renderTrack(no, quiet) {
    if (!orders.length) {
      frame("Track my order",
        '<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/></svg><h3>No orders yet</h3><p>Place a sample order and you can follow it here, step by step.</p><button class="btn btn--primary" type="button" data-go-menu>Order something</button></div>');
      return;
    }
    var o = orders.filter(function (x) { return x.no === no; })[0] || orders[0];
    var s = stepOf(o);
    var html =
      (orders.length > 1 ? '<div class="field" style="margin-bottom:.75rem"><label for="trSel">Order</label><select id="trSel" class="notranslate">' + orders.map(function (x) { return "<option" + (x.no === o.no ? " selected" : "") + ">" + esc(x.no) + "</option>"; }).join("") + "</select></div>" : "") +
      '<p><span class="done__no notranslate" style="margin:0">' + esc(o.no) + '</span> <span style="color:var(--muted);font-size:.9rem">· ' + esc(o.slot) + "</span></p>" +
      '<ol class="tl" aria-label="Order progress">' + STEPS.map(function (label, i) {
        var cls = i < s || (i === 3 && s === 3) ? "done-step" : i === s ? "now" : "";
        var when = i <= s ? clock(o.at + i * STEP_MS) : i === 3 ? "Expected " + o.slot.toLowerCase() : "";
        return '<li class="' + cls + '"' + (i === s ? ' aria-current="step"' : "") + '><span class="dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><b>' + label + "</b><small>" + esc(when) + (i === 2 && s >= 2 ? " · Rider: Bapi, on a red scooter" : "") + "</small></li>";
      }).join("") + "</ol>" +
      '<p role="status" class="sr">' + STEPS[s] + "</p>" +
      '<div class="sum"><div><span>Total</span><span class="notranslate">' + money(o.total) + "</span></div><div><span>Payment</span><span>" + esc(o.pay) + "</span></div><div><span>Deliver to</span><span style=\"text-align:right\">" + esc(o.area) + "</span></div></div>" +
      '<p style="margin-top:.75rem;font-size:.85rem;color:var(--muted)">In this sample the order moves one step every few seconds. In the real shop it moves when the shop taps the status on their phone.</p>';
    if (quiet) {
      var sel = $("#trSel");
      var keepFocus = sel && document.activeElement === sel;
      if (keepFocus) return; // do not redraw under an open dropdown
    }
    frame("Track my order", html,
      '<a class="btn btn--wa btn--block" href="' + S.wa("Hello Nolen Mishti Ghar, where is my order " + o.no + "?" + SAMPLE_TAIL) + '" target="_blank" rel="noopener">Ask about this order on WhatsApp</a>');
  }

  // ---- owner's view ------------------------------------------------------
  var SEED = [
    { no: "NMG-24811", name: "Sudeshna B.", area: "Nagerbazar", total: 860, payShort: "UPI", slot: "Today, 4 to 6 pm", step: 3, what: "Bijoya Box, Mishti Doi" },
    { no: "NMG-24813", name: "Rahul D.", area: "Dum Dum", total: 420, payShort: "COD", slot: "Today, 4 to 6 pm", step: 2, what: "Singara x 12, Rosogolla" },
    { no: "NMG-24815", name: "Mousumi G.", area: "Kestopur", total: 315, payShort: "UPI", slot: "Today, 6 to 8 pm", step: 1, what: "Sugar-free Sandesh" },
    { no: "NMG-24817", name: "Arindam S.", area: "Lake Town", total: 640, payShort: "COD", slot: "Today, 6 to 8 pm", step: 0, what: "Nolen Gur Rosogolla, Rajbhog" },
  ];
  function ownerRows() {
    var mine = orders.filter(function (o) { return new Date(o.at).toDateString() === new Date().toDateString(); }).map(function (o) {
      return { no: o.no, name: o.name, area: o.area, total: o.total, payShort: o.payShort, slot: o.slot, step: stepOf(o), what: o.items.map(function (i) { return i.name; }).join(", "), mine: true };
    });
    var seed = SEED.map(function (s) { var c = {}; for (var k in s) c[k] = s[k]; if (owner[s.no] != null) c.step = owner[s.no]; return c; });
    return mine.concat(seed.reverse());
  }
  function openOwner() {
    open("owner", renderOwner, { width: 460 });
  }
  function renderOwner() {
    var rows = ownerRows(), top = rows[0];
    var total = rows.reduce(function (s, r) { return s + r.total; }, 0);
    var time = new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
    var body =
      '<div class="phone"><div class="phone__screen"><div class="phone__bar"><span class="notranslate">' + esc(time) + '</span><span aria-hidden="true">▂▄▆ 4G 82%</span></div><div class="phone__app">' +
      '<div class="notif" role="status"><span class="notif__ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg></span><div><b>New order <span class="notranslate">' + esc(top.no) + '</span></b><span><span class="notranslate">' + money(top.total) + " · " + esc(top.payShort) + "</span> · " + esc(top.slot.replace(", ", " ")) + "</span></div></div>" +
      '<div class="kpis"><div class="kpi"><small>Today&rsquo;s total</small><b class="notranslate">' + money(total) + '</b></div><div class="kpi"><small>Orders today</small><b class="notranslate">' + rows.length + "</b></div></div>" +
      '<div class="phone__title"><span>Today&rsquo;s orders</span><small style="font-weight:500;color:#666">Tap a status</small></div>' +
      '<div class="olist">' + rows.map(function (r) {
        var label = STATUS[r.step], cls = label === "Out for delivery" ? "Out" : label;
        return '<div class="orow' + (r.mine ? " mine" : "") + '"><b><span class="notranslate">' + esc(r.no) + "</span>" + (r.mine ? ' <span class="sample-tag">Your order</span>' : "") + '</b><button type="button" class="st st--' + cls + '" data-status="' + esc(r.no) + '" data-step="' + r.step + '" aria-label="' + esc(r.no) + " status " + label + ', tap to change">' + label + '</button><span class="meta">' + esc(r.name) + " · " + esc(r.area) + ' · <span class="notranslate">' + money(r.total) + " " + esc(r.payShort) + "</span></span></div>";
      }).join("") + "</div></div></div></div>" +
      '<p class="owner-cap">This is what you see on your phone when a customer orders. No typing, no missed orders.</p>' +
      '<p class="owner-tip">Sample screen. Place an order and it appears here at the top.</p>';
    frame("Owner's view", body,
      '<a class="btn btn--wa btn--block" href="' + S.wa("Hello, I saw the Nolen Mishti Ghar sample website and want one like it for my business.") + '" target="_blank" rel="noopener">I want this for my shop</a>');
  }

  // ---- search ------------------------------------------------------------
  function openSearch() {
    open("search", function () {
      frame("Search sweets",
        '<div class="s-input"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><label class="sr" for="sq">Search sweets and snacks</label><input id="sq" type="search" placeholder="Rosogolla, doi, singara..." autocomplete="off"></div><div class="s-res" id="sres" aria-live="polite"></div>');
      renderResults("");
    }, { width: 560, focus: "#sq" });
  }
  function renderResults(q) {
    q = q.trim().toLowerCase();
    var res = D.PRODUCTS.filter(function (p) {
      if (!q) return p.badges.indexOf("Bestseller") > -1;
      return (p.name + " " + p.line + " " + p.cat).toLowerCase().indexOf(q) > -1;
    });
    var box = $("#sres");
    if (!box) return;
    if (!res.length) {
      box.innerHTML = '<div class="empty" style="padding:1.5rem 0"><h3>No sweets match “' + esc(q) + '”</h3><p>Try rosogolla, sandesh, doi or singara. Or ask us, we may make it on order.</p><a class="btn btn--wa" href="' + S.wa("Hello Nolen Mishti Ghar, do you make " + q + "?" + SAMPLE_TAIL) + '" target="_blank" rel="noopener">Ask on WhatsApp</a></div>';
      return;
    }
    box.innerHTML = (q ? "" : '<p style="font-size:.85rem;color:var(--muted);margin-bottom:.25rem">Most ordered</p>') + res.map(function (p) {
      return '<div class="s-row"><img src="' + img(p.img[0]) + '" alt="" width="56" height="56" loading="lazy"><button type="button" class="s-open" data-open="' + p.id + '">' + esc(p.name) + '<small class="notranslate">from ' + money(p.packs[0].price) + "</small></button>" +
        (p.soldOut ? '<small style="color:var(--muted)">Sold out</small>' : '<button class="add" type="button" data-qadd="' + p.id + '" aria-label="Add ' + esc(p.name) + ", " + esc(p.packs[0].label) + '">Add</button>') + "</div>";
    }).join("");
  }

  // ---- festival boxes, reviews, bulk form --------------------------------
  function renderBoxes() {
    $("#boxGrid").innerHTML = D.PRODUCTS.filter(function (p) { return p.cat === "boxes"; }).map(function (p) {
      return '<article class="box"><div class="box__img"><img src="' + img(p.img[0], 640) + '" alt="' + esc(p.name) + '" width="640" height="480" loading="lazy" decoding="async"></div><div class="box__body">' +
        '<div class="box__top"><h3>' + esc(p.name) + '</h3><span class="box__price notranslate">' + money(p.packs[0].price) + "</span></div>" +
        '<p class="box__inside" style="font-weight:600;color:var(--ink)">What is inside</p><ul class="box__inside">' + p.contents.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul>" +
        '<label class="gift-toggle"><input type="checkbox" data-gift-toggle="' + p.id + '"> Add a gift message</label>' +
        '<div class="field" id="gm-' + p.id + '" hidden><label for="gmt-' + p.id + '">Gift message</label><textarea id="gmt-' + p.id + '" maxlength="120" placeholder="Shubho Bijoya to all of you, with love from Rina"></textarea><p class="hint">Written by hand on the card inside. Up to 120 letters.</p></div>' +
        '<button class="btn btn--primary btn--block" type="button" data-box="' + p.id + '">Add box · <span class="notranslate">' + money(p.packs[0].price) + "</span></button></div></article>";
    }).join("");
  }
  function renderReviews() {
    $("#revs").innerHTML = D.REVIEWS.map(function (r) {
      var stars = "";
      for (var i = 0; i < 5; i++) stars += '<span class="' + (i < r.stars ? "" : "off") + '">' + STAR + "</span>";
      return '<article class="rev"><div class="stars" role="img" aria-label="' + r.stars + ' out of 5 stars">' + stars + "</div><p>" + esc(r.text) + "</p><footer><b>" + esc(r.name) + "</b> · " + esc(r.area) + "</footer></article>";
    }).join("");
  }
  function bulkForm() {
    var f = $("#bulkForm"), msg = $("#bulkMsg");
    var today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    $("#bDate").min = today.toISOString().slice(0, 10);
    function err(el, text) {
      var field = el.closest(".field"), p = field.querySelector(".err");
      field.classList.toggle("has-err", !!text);
      if (text) {
        if (!p) { p = document.createElement("p"); p.className = "err"; p.id = el.id + "-e"; field.appendChild(p); }
        p.textContent = text; el.setAttribute("aria-invalid", "true"); el.setAttribute("aria-describedby", p.id);
      } else if (p) { p.remove(); el.removeAttribute("aria-invalid"); el.removeAttribute("aria-describedby"); }
      return !text;
    }
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var ev = $("#bEvent"), dt = $("#bDate"), pc = $("#bPieces"), nm = $("#bName"), ph = $("#bPhone");
      var ok = [
        err(ev, ev.value ? "" : "Please choose the event."),
        err(dt, dt.value && dt.value >= dt.min ? "" : "Please pick a date from today onwards."),
        err(pc, Number(pc.value) >= 50 ? "" : "Bulk orders start from 50 pieces."),
        err(nm, nm.value.trim() ? "" : "Please write your name."),
        err(ph, S.validMobile(ph.value) ? "" : "Enter a 10-digit mobile number starting with 6, 7, 8 or 9."),
      ];
      if (ok.indexOf(false) > -1) {
        var first = f.querySelector('[aria-invalid="true"]');
        if (first) first.focus();
        msg.className = "msg msg--err";
        msg.textContent = "Please fix the fields marked in red.";
        return;
      }
      var d = new Date(dt.value + "T00:00:00");
      var text = "Hello Nolen Mishti Ghar, I want a bulk order.\n\n" +
        "Event: " + ev.value +
        "\nDate: " + d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) +
        "\nAbout " + Number(pc.value) + " pieces" +
        "\nName: " + nm.value.trim() +
        "\nMobile: " + S.digits(ph.value).slice(-10) +
        "\n\nPlease send me the options and prices." + SAMPLE_TAIL;
      window.open(S.wa(text), "_blank", "noopener");
      msg.className = "msg msg--ok";
      msg.textContent = "WhatsApp is opening with your request. We reply within the hour.";
    });
  }

  // ---- one click handler for the whole page ------------------------------
  document.addEventListener("click", function (e) {
    var t = e.target.closest("button, a, input");
    if (!t) return;
    var a;
    if ((a = t.getAttribute("data-add"))) { addToCart(a, picked[a] || 0, 1); return; }
    if ((a = t.getAttribute("data-inc"))) { changeQty(a, picked[a] || 0, 1); return; }
    if ((a = t.getAttribute("data-dec"))) { changeQty(a, picked[a] || 0, -1); return; }
    if ((a = t.getAttribute("data-open"))) { openProduct(a); return; }
    if ((a = t.getAttribute("data-qadd"))) { addToCart(a, 0, 1); return; }
    if (t.hasAttribute("data-open-search")) { e.preventDefault(); openSearch(); return; }
    if (t.hasAttribute("data-open-track")) { e.preventDefault(); openTrack(); return; }
    if ((a = t.getAttribute("data-track"))) { openTrack(a); return; }
    if (t.hasAttribute("data-go-menu")) { close(); var m = $("#menu"); if (m) m.scrollIntoView({ behavior: S.reducedMotion() ? "auto" : "smooth" }); return; }
    if (t.hasAttribute("data-checkout")) { openCheckout(); return; }
    if (t.hasAttribute("data-back-cart")) { openCart(); return; }
    if (t.hasAttribute("data-area-from-cart")) { openArea("cart"); return; }
    if (t.hasAttribute("data-uncoupon")) { coupon = ""; stCoupon.set(""); couponMsg = { kind: "ok", text: "Coupon removed." }; renderCart(); var ci = $("#cpn"); if (ci) ci.focus(); updateBadges(); return; }
    if ((a = t.getAttribute("data-pick-area"))) {
      areaName = a; stArea.set(a); updateArea(); updateBadges();
      S.toast("Delivering to " + a);
      if (t.getAttribute("data-back") === "cart") openCart(); else close();
      return;
    }
    if ((a = t.getAttribute("data-rm"))) {
      var parts = a.split("-"), pi = Number(parts.pop()), id = parts.join("-");
      var i = lineIndex(id, pi);
      if (i > -1) { var name = byId[id].name; cart.splice(i, 1); saveCart(); refreshBuy(id); updateBadges(); S.announce(name + " removed from cart."); renderCart(); }
      return;
    }
    if ((a = t.getAttribute("data-cq"))) {
      var ps = a.split("-"), pk = Number(ps.pop()), pid = ps.join("-");
      changeQty(pid, pk, Number(t.getAttribute("data-d")));
      renderCart();
      return;
    }
    if ((a = t.getAttribute("data-spack"))) {
      sheet.p = Number(a);
      var keep = Number(a);
      renderProduct(byId[sheet.id]);
      var b = ovlBody.querySelector('[data-spack="' + keep + '"]'); if (b) b.focus();
      return;
    }
    if ((a = t.getAttribute("data-sq"))) {
      sheet.q = Math.max(1, Math.min(50, sheet.q + Number(a)));
      renderProduct(byId[sheet.id]);
      var q = ovlBody.querySelector('[data-sq="' + a + '"]'); if (q) q.focus();
      return;
    }
    if (t.hasAttribute("data-sadd")) {
      picked[sheet.id] = sheet.p;
      var sel = document.getElementById("pk-" + sheet.id); if (sel) sel.value = sheet.p;
      close();
      addToCart(sheet.id, sheet.p, sheet.q);
      return;
    }
    if ((a = t.getAttribute("data-gal"))) {
      var g = $("#gal"); if (g) g.scrollTo({ left: g.clientWidth * Number(a), behavior: S.reducedMotion() ? "auto" : "smooth" });
      return;
    }
    if ((a = t.getAttribute("data-gift-toggle"))) {
      var box = document.getElementById("gm-" + a);
      box.hidden = !t.checked;
      if (t.checked) document.getElementById("gmt-" + a).focus();
      return;
    }
    if ((a = t.getAttribute("data-box"))) {
      var toggle = document.querySelector('[data-gift-toggle="' + a + '"]');
      var msgEl = document.getElementById("gmt-" + a);
      var gift = toggle && toggle.checked ? msgEl.value.trim() : "";
      addToCart(a, 0, 1, gift);
      return;
    }
    if ((a = t.getAttribute("data-status"))) {
      var next = (Number(t.getAttribute("data-step")) + 1) % 4;
      owner[a] = next; stOwner.set(owner);
      renderOwner();
      var again = ovlBody.querySelector('[data-status="' + a + '"]'); if (again) again.focus();
      S.announce(a + " is now " + STATUS[next]);
      return;
    }
  });
  document.addEventListener("change", function (e) {
    var t = e.target, a;
    if ((a = t.getAttribute("data-pack"))) { picked[a] = Number(t.value); refreshBuy(a); return; }
    if (t.name === "slot") {
      stSlot.set(t.value);
      renderCart();
      return;
    }
    if (t.name === "pay") { co.pay = t.value; renderCheckout(); var r = ovlBody.querySelector('input[name="pay"][value="' + t.value + '"]'); if (r) r.focus(); return; }
    if (t.id === "coArea") { co.area = t.value; return; }
    if (t.id === "trSel") { openTrack(t.value); return; }
  });
  document.addEventListener("input", function (e) {
    var t = e.target, a;
    if ((a = t.getAttribute("data-co"))) {
      var v = t.value;
      if (a === "mobile" || a === "pin") { v = S.digits(v); if (v !== t.value) t.value = v; }
      co[a] = v;
      refreshCheckoutState(a);
      return;
    }
    if (t.id === "note") { note = t.value; stNote.set(note); return; }
    if (t.id === "sq") { renderResults(t.value); return; }
    if (t.id === "bPhone") { var d = S.digits(t.value); if (d !== t.value) t.value = d; }
  });
  document.addEventListener("focusout", function (e) {
    var a = e.target.getAttribute && e.target.getAttribute("data-co");
    if (a && view === "checkout") { touched[a] = true; refreshCheckoutState(a); }
  });
  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (f.hasAttribute("data-coupon")) {
      e.preventDefault();
      var code = (f.code.value || "").trim().toUpperCase();
      var c = findCoupon(code), sub = totals().sub;
      if (!code) couponMsg = { kind: "err", text: "Type a coupon code first." };
      else if (!c) couponMsg = { kind: "err", text: "“" + code + "” is not a valid code. Check the spelling, or try PUJO10." };
      else if (c.kind === "percent" && sub < c.min) couponMsg = { kind: "warn", text: c.code + " works on orders above " + money(c.min) + ". Add " + money(c.min - sub) + " more and try again." };
      else { coupon = c.code; stCoupon.set(coupon); couponMsg = null; S.toast(c.code + " applied: " + c.text); }
      renderCart();
      var focusEl = ovlBox.querySelector(coupon ? "[data-uncoupon]" : "#cpn"); if (focusEl) focusEl.focus();
      updateBadges();
      return;
    }
    if (f.id === "coForm") { e.preventDefault(); placeOrder(); }
  });

  cartBtn.addEventListener("click", openCart);
  $("#cartbarBtn").addEventListener("click", openCart);
  $("#areaChip").addEventListener("click", function () { openArea(""); });
  $("#ownerPill").addEventListener("click", openOwner);
  $("#ownerPill2").addEventListener("click", openOwner);
  mqMobile.addEventListener && mqMobile.addEventListener("change", function () { updateBadges(); });

  // ---- start -------------------------------------------------------------
  renderMenu();
  lazyPhotos($("#menuBody"));
  renderBoxes();
  renderReviews();
  bulkForm();
  watchChips();
  updateArea();
  updateBadges();
  if (location.hash === "#track") openTrack();
})();
