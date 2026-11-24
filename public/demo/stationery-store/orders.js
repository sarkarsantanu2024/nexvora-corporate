/* Kolom Khata Stationers, sample store: after the order.
 * Cancelling items, return and exchange requests, the GST invoice and credit notes,
 * and the owner's card for all of them. Loaded only on the order, invoice, credit
 * note, track, account and dashboard pages.
 *
 * Nothing is sent anywhere. Requests are saved in this browser (kk:after) and move
 * forward on their own, one step a minute, so the whole flow can be tried here.
 */
(function () {
  "use strict";
  var A = window.KKApp_ord && window.KKApp_ord();
  if (!A) return;
  var D = A.D, P = A.P, S = A.S, I = A.I, esc = A.esc, money = A.money, M = A.M, u = A.u;
  var DAY = A.DAY, STEP = A.STEP_MS;
  var SHOP_STATE = "West Bengal";

  // ---------- small helpers ----------
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function m2(n) { return "₹" + (Math.round(n * 100) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function r2(n) { return Math.round(n * 100) / 100; }
  function vOf(p, id) { return p ? A.vOf(p, id) : null; }
  function fy(t) { var d = new Date(t), y = d.getFullYear() - (d.getMonth() < 3 ? 1 : 0); return String(y).slice(2) + "-" + String(y + 1).slice(2); }
  function paid(o) { return ["upi", "card", "netbanking"].indexOf(o.pay) > -1; }
  function custom(l) { return !!(l.print || l.note); }
  function lname(l) { return l.name + (l.var && P[l.slug] && P[l.slug].variants.length > 1 ? " (" + l.var + ")" : ""); }
  function uw(l, n) { var p = P[l.slug]; return p ? A.unitWord(p, n) : n === 1 ? "pc" : "pcs"; }
  function qt(l, n) { return n + " " + uw(l, n); }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a)); }

  // ---------- money in words (Indian numbering) ----------
  var ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  var TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function two(n) { return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : ""); }
  function three(n) { var h = Math.floor(n / 100), r = n % 100; return (h ? ONES[h] + " Hundred" + (r ? " " : "") : "") + (r ? two(r) : ""); }
  function words(n) {
    if (n === 0) return "Zero";
    var out = [], cr = Math.floor(n / 1e7), lk = Math.floor(n / 1e5) % 100, th = Math.floor(n / 1e3) % 100, rest = n % 1000;
    if (cr) out.push(words(cr) + " Crore");
    if (lk) out.push(two(lk) + " Lakh");
    if (th) out.push(two(th) + " Thousand");
    if (rest) out.push(three(rest));
    return out.join(" ");
  }
  function inWords(amt) {
    var r = Math.floor(amt + 1e-9), p = Math.round((amt - r) * 100);
    return "Rupees " + words(r) + (p ? " and " + two(p) + " Paise" : "") + " Only";
  }

  // ---------- requests saved in this browser ----------
  function all() { return A.afterStore.get({}) || {}; }
  function rec(no) { var a = all(); return a[no] || { cancelled: false, cx: [], rx: [] }; }
  function save(no, r) { var a = all(); a[no] = r; A.afterStore.set(a); }
  /** A sample return already on the delivered sample order, so the owner's card and tracking have something to show. */
  var SEED_RX = [{ no: "RX-50211", order: "KKS-200311", seed: true, at: Date.now() - 10 * 36e5, fixedStep: 2, kind: "replace", reason: "damaged", ourFault: true, how: "pickup",
    lines: [{ i: 0, qty: 2 }], note: "Two sets came with bent corners and a torn box.", photo: "pl-cards-d", amounts: { items: 0, restock: 0, pickup: 0, net: 0, diff: 0 } }];
  function docsFor(o) {
    var r = rec(o.no), seeds = SEED_RX.filter(function (x) { return x.order === o.no; });
    return { cancelled: r.cancelled, cx: r.cx || [], rx: seeds.concat(r.rx || []), disc: r.disc };
  }
  function allDocs() {
    var out = [], a = all();
    SEED_RX.forEach(function (x) { out.push(x); });
    Object.keys(a).forEach(function (no) { (a[no].cx || []).forEach(function (x) { out.push(x); }); (a[no].rx || []).forEach(function (x) { out.push(x); }); });
    return out.sort(function (x, y) { return y.at - x.at; });
  }
  function findDoc(no) { no = String(no || "").toUpperCase(); return allDocs().filter(function (d) { return d.no === no; })[0] || null; }
  function newNo(prefix, base) { var n; do { n = prefix + "-" + rnd(base, base + 9000); } while (findDoc(n)); return n; }

  /** Pieces still with the buyer on line i: ordered, less cancelled, less returned for a refund. */
  function curQty(o, i) {
    var d = docsFor(o), q = o.items[i].qty;
    d.cx.forEach(function (c) { c.lines.forEach(function (x) { if (x.i === i) q -= x.cut; }); });
    d.rx.forEach(function (r) { if (r.kind === "refund" && !r.rejected) r.lines.forEach(function (x) { if (x.i === i) q -= x.qty; }); });
    return Math.max(0, q);
  }
  /** Pieces on line i that already have an open or finished return of any kind. */
  function inReturn(o, i) {
    var n = 0; docsFor(o).rx.forEach(function (r) { if (!r.rejected && r.kind !== "refund") r.lines.forEach(function (x) { if (x.i === i) n += x.qty; }); });
    return n;
  }
  /** What a line is worth at quantity q: the quantity price for q, print rate for q, and the setup fee while any are kept. */
  function lineValue(l, q) {
    if (q <= 0) return 0;
    if (q === l.qty) return l.total;
    var p = P[l.slug], v = vOf(p, l.vid);
    if (!p || !v) return Math.round(l.total / l.qty * q);
    var unit = A.tierOf(p, v, q).price, pr = l.print ? A.printOf(p, { method: l.print.method, sides: l.print.sides }, q) : null;
    return q * (unit + (pr ? pr.rate : 0)) + (l.print ? l.print.setup || 0 : 0);
  }
  function unitPaid(l) { return (l.total - (l.print ? l.print.setup || 0 : 0)) / l.qty; }

  // ---------- step of a request ----------
  function stepOf(d) {
    if (d.rejected) return -1;
    if (d.fixedStep != null) return Math.max(d.fixedStep, d.adminStep || 0);
    return Math.min(4, Math.max(d.adminStep || 0, Math.floor((Date.now() - d.at) / STEP)));
  }
  function rxSteps(d) {
    var back = d.how === "drop" ? "You dropped it at College Street" : "Picked up from your address";
    if (d.kind === "refund") return ["Request received", "Approved", back, "Checked at our shop", "Refund sent"];
    if (d.kind === "exchange") return ["Request received", "Approved", back, "Checked at our shop", "New size or colour shipped"];
    return ["Request received", "Approved", d.how === "none" ? "No need to send it back" : back, "Replacement packed", "Replacement shipped"];
  }
  function cxSteps(d) { return d.refund > 0 ? ["Cancelled", "Refund started", "Refund reached you"] : ["Cancelled"]; }
  function docStatus(d) {
    if (d.no.indexOf("CX") === 0) { var s = stepOf(d); return d.refund > 0 ? (s >= 2 ? "Refunded" : s >= 1 ? "Refund started" : "Cancelled") : "Cancelled"; }
    var st = stepOf(d); if (st < 0) return "Rejected";
    return ["Requested", "Approved", d.how === "drop" ? "Received" : d.how === "none" ? "Approved" : "Picked up", d.kind === "replace" ? "Packed" : "Checked", d.kind === "refund" ? "Refunded" : "Shipped"][st];
  }
  var KIND = { refund: "Return for refund", exchange: "Exchange", replace: "Replacement" };
  function docTitle(d) { return d.no.indexOf("CX") === 0 ? (d.full ? "Order cancelled" : "Items cancelled") : KIND[d.kind]; }
  function docLines(o, d) {
    return d.lines.map(function (x) { var l = o.items[x.i]; if (!l) return ""; var q = x.cut != null ? x.cut : x.qty, to = x.toVid && vOf(P[l.slug], x.toVid); return lname(l) + ": " + qt(l, q) + (to ? ", changed to " + to.label : ""); }).filter(Boolean).join("; ");
  }
  function timelineHTML(steps, st, d) {
    return '<ol class="tl" style="margin-top:.6rem">' + steps.map(function (s, i) {
      var state = i <= st ? "done" : i === st + 1 ? "now" : "todo";
      return '<li data-s="' + state + '"' + (i === st ? ' aria-current="step"' : "") + "><i>" + (state === "done" ? I.check : "") + "</i><b>" + s + '<span class="sr"> ' + (state === "done" ? "done" : state === "now" ? "next" : "not yet") + "</span></b><small>" + (i <= st ? A.fDT(d.fixedStep != null ? d.at + i * 3 * 36e5 : d.at + i * STEP) : "Not yet") + "</small></li>";
    }).join("") + "</ol>";
  }
  function docCardHTML(o, d, opt) {
    opt = opt || {};
    var cx = d.no.indexOf("CX") === 0, st = stepOf(d), stt = docStatus(d), money_ = cx ? d.refund : d.amounts.net;
    var body = '<div class="doc"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:.4rem"><b>' + docTitle(d) + ' <span class="notranslate">' + d.no + '</span></b><span class="st st--' + A.stClass(stt) + '">' + stt + "</span></div>" +
      '<p class="small muted">' + A.fDT(d.at) + " · " + esc(docLines(o, d)) + "</p>" +
      (cx ? '<p class="small">' + (d.refund > 0 ? "Refund " + M(d.refund) + " to " + esc(d.method) + "." : esc(d.method)) + (d.discLost ? " The coupon no longer applied, so " + M(d.discLost) + " was taken off the refund." : "") + "</p>" :
        '<p class="small">' + esc(reasonText(d.reason)) + (d.kind === "refund" ? ". Refund " + M(money_) + " to " + esc(refundToText(o, d)) : d.kind === "exchange" ? (d.amounts.diff > 0 ? ". Pay " + M(d.amounts.diff) + " more when the new one arrives" : d.amounts.diff < 0 ? ". We refund the difference of " + M(-d.amounts.diff) : ". Same price, nothing to pay") : ". Free replacement") + ".</p>") +
      (d.rejected ? '<p class="small" style="color:var(--err)">Not approved: ' + esc(d.rejected.reason) + "</p>" : opt.timeline ? timelineHTML(cx ? cxSteps(d) : rxSteps(d), cx ? Math.min(st, cxSteps(d).length - 1) : st, d) : "") +
      '<p class="small" style="margin-top:.35rem">' + ((cx && d.refund > 0) || (!cx && d.kind === "refund" && !d.rejected && st >= 3) ? '<a href="' + u("/credit/" + d.no) + '">Credit note</a> · ' : "") +
      '<a href="' + u("/track?order=" + d.no + "&mobile=" + o.mobile) + '">Track this ' + (cx ? "cancellation" : "request") + "</a></p></div>";
    return body;
  }

  // ---------- reasons ----------
  var REASONS = [
    ["mind", "I do not need it any more", false],
    ["size", "Wrong size or colour (I ordered it)", false],
    ["damaged", "It arrived damaged", true],
    ["wrong", "A different item came", true],
    ["short", "Fewer pieces than I paid for", true],
    ["print", "The print or engraving is wrong", true],
    ["quality", "Quality is not as described", true]
  ];
  function reasonText(k) { var r = REASONS.filter(function (x) { return x[0] === k; })[0]; return r ? r[1] : k; }
  function ourFault(k) { var r = REASONS.filter(function (x) { return x[0] === k; })[0]; return !!(r && r[2]); }
  var CX_REASONS = ["Ordered by mistake", "Need a different quantity", "Found a better price", "Need it sooner than the delivery date", "Ordering again with other items", "Other reason"];
  function refundToText(o, d) {
    if (d.refundTo && d.refundTo.type === "upi") return "UPI " + d.refundTo.upi;
    if (d.refundTo && d.refundTo.type === "bank") return "bank account ending " + d.refundTo.ac.slice(-4);
    return paid(o) ? "your " + A.payName(o.pay) + " (same way you paid)" : o.pay === "bank" ? "the bank account you paid from" : "your UPI";
  }

  // ---------- cancel rules ----------
  /** Can line i be cancelled now? Returns "" when it can, or the reason it cannot. */
  function cancelBlock(o, i) {
    var st = A.stageOf(o), l = o.items[i];
    if (curQty(o, i) <= 0) return "Already cancelled.";
    if (st >= 2) return "It has left College Street.";
    if (st === 1 && custom(l)) return "Printing has started on this line, so it cannot be cancelled. If the print is wrong when it arrives, we reprint it free.";
    return "";
  }
  function cancelState(o) {
    if (A.statusOf(o) === "Cancelled") return { ok: false, why: "This order is cancelled." };
    var st = A.stageOf(o);
    if (st >= 2) return { ok: false, why: st >= 4 ? "" : "Your order has left College Street, so it cannot be cancelled now. " + (o.pay === "cod" ? "You can refuse it at the door and pay nothing, " : "You can refuse it at the door for a full refund, ") + "or return it after it arrives." };
    var any = o.items.some(function (l, i) { return !cancelBlock(o, i); });
    return { ok: any, why: any ? "" : "Nothing on this order can be cancelled now." };
  }

  /** Refund for keeping keep[i] pieces of each line. */
  function cancelCalc(o, keep) {
    var d = docsFor(o), cut = [], oldSub = 0, newSub = 0, tiers = [];
    o.items.forEach(function (l, i) {
      var c = curQty(o, i), k = keep[i] == null ? c : keep[i];
      oldSub += lineValue(l, c); newSub += lineValue(l, k);
      if (k < c) {
        cut.push({ i: i, from: c, to: k, cut: c - k, refund: lineValue(l, c) - lineValue(l, k) });
        var p = P[l.slug], v = vOf(p, l.vid);
        if (p && v && k > 0) { var a = A.tierOf(p, v, c), b = A.tierOf(p, v, k); if (a.k !== b.k) tiers.push("The " + qt(l, k) + " of " + l.name + " you keep go back to the " + b.name.toLowerCase() + " of " + money(b.price) + " each, because the " + a.name.toLowerCase() + " starts at " + (a.k === "bulk" ? p.bq : p.wq) + "."); }
      }
    });
    var full = o.items.every(function (l, i) { return (keep[i] == null ? curQty(o, i) : keep[i]) === 0; });
    var discNow = d.disc != null ? d.disc : o.totals.discount || 0, cp = o.coupon && D.COUPONS.filter(function (c) { return c.code === o.coupon; })[0];
    var newDisc = full ? 0 : discNow && oldSub ? (cp && newSub < cp.min ? 0 : Math.round(discNow * newSub / oldSub)) : discNow;
    var discLost = full ? 0 : cp && newSub < cp.min ? discNow : 0;
    var refund = (oldSub - newSub) - (discNow - newDisc) + (full ? (o.totals.ship || 0) : 0);
    return { cut: cut, full: full, refund: Math.max(0, refund), newDisc: newDisc, discLost: discLost, tiers: tiers, cp: cp, oldSub: oldSub, newSub: newSub };
  }

  // ---------- the "Cancel, return or exchange" section on the order page ----------
  function manage(o, box) {
    var mode = "", keep = {}, cxReason = "", errs = {}, rx = null;
    function draw(focusSel) {
      var d = docsFor(o), st = A.stageOf(o), cs = cancelState(o), rs = returnState(o);
      var hist = d.cx.concat(d.rx).sort(function (a, b) { return b.at - a.at; });
      var h = '<h2 id="manageH">Cancel, return or exchange</h2>';
      if (hist.length) h += '<div class="docs">' + hist.map(function (x) { return docCardHTML(o, x, { timeline: true }); }).join("") + "</div>";
      if (mode === "cancel") h += cancelFormHTML();
      else if (mode === "return") h += returnFormHTML();
      else {
        var acts = "";
        if (cs.ok) acts += '<button type="button" class="btn btn--line" data-mg="cancel">Cancel items or the whole order</button>';
        if (rs.ok) acts += '<button type="button" class="btn btn--line" data-mg="return">Return or exchange items</button>';
        h += '<p style="margin-top:.6rem">' + (cs.ok ? (st === 0 ? "Nothing has been packed yet, so you can cancel any item, or keep fewer pieces." : "Your order is packed. Stock items can still be cancelled; printed items cannot.") :
          rs.ok ? "Your order was delivered on " + A.fDate(A.stepTimes(o)[4]) + ". You can ask for a return or exchange on the items below." : (cs.why || rs.why)) + "</p>";
        if (acts) h += '<div class="btn-row" style="margin-top:.8rem">' + acts + "</div>";
        h += '<p class="small muted" style="margin-top:.8rem">Questions? <a class="wa-link" href="' + esc(S.wa("Hello Kolom Khata Stationers, I need help with my order " + o.no + ".")) + '" target="_blank" rel="noopener">Ask us on WhatsApp</a> · <a href="' + u("/policies/returns") + '">Returns policy</a></p>';
      }
      box.innerHTML = h;
      if (focusSel) { var f = $(focusSel, box); if (f) f.focus(); }
    }

    // ----- cancel form -----
    function cancelFormHTML() {
      var c = cancelCalc(o, keep);
      return '<form id="cxForm" class="mform" novalidate><h3>Cancel items</h3><p class="small muted">Set how many you want to keep. Keep 0 to cancel the line. A line you keep must stay at or above its minimum.</p>' +
        '<ul class="mlines">' + o.items.map(function (l, i) {
          var cq = curQty(o, i), blk = cancelBlock(o, i), p = P[l.slug], min = p ? A.lineMin(p, l.print ? { method: l.print.method } : null) : 1, step = p ? p.step : 1, k = keep[i] == null ? cq : keep[i];
          if (cq <= 0) return "";
          return '<li><div class="mline__t">' + A.img(l.img, "", "48px") + "<span><b>" + esc(lname(l)) + '</b><br><span class="small muted">' + qt(l, cq) + " on the order" + (l.print ? " · printed" : l.note ? " · engraved" : "") + "</span>" + (blk ? '<br><span class="small">' + esc(blk) + "</span>" : "") + "</span></div>" +
            (blk ? "" : '<div class="field mline__q"><label for="keep' + i + '">Keep</label><input class="inp notranslate" id="keep' + i + '" data-keep="' + i + '" inputmode="numeric" value="' + k + '" aria-describedby="keepE' + i + ' keepH' + i + '"' + (errs["k" + i] ? ' aria-invalid="true"' : "") + '><span class="hint" id="keepH' + i + '">0, or ' + min + " to " + cq + (step > 1 ? " in steps of " + step : "") + '</span><p class="err" id="keepE' + i + '">' + (errs["k" + i] || "") + "</p></div>") + "</li>";
        }).join("") + "</ul>" +
        '<div class="field" style="margin-top:.6rem"><label for="cxReason">Why are you cancelling?</label><select class="inp" id="cxReason" aria-describedby="cxReasonE"' + (errs.reason ? ' aria-invalid="true"' : "") + '><option value="">Choose a reason</option>' + CX_REASONS.map(function (r) { return "<option" + (cxReason === r ? " selected" : "") + ">" + r + "</option>"; }).join("") + '</select><p class="err" id="cxReasonE">' + (errs.reason || "") + "</p></div>" +
        '<div class="msum" id="cxSum" aria-live="polite">' + cancelSumHTML(c) + "</div>" +
        '<div class="btn-row"><button class="btn btn--blue" type="submit"' + (c.cut.length ? "" : " disabled") + ">" + (c.full ? "Cancel the whole order" : "Cancel " + (c.cut.length ? "these items" : "items")) + '</button><button class="btn btn--ghost" type="button" data-mg="all">Cancel everything I can</button><button class="btn btn--ghost" type="button" data-mg="close">Keep my order as it is</button></div></form>';
    }
    function cancelSumHTML(c) {
      if (!c.cut.length) return '<p class="small muted">Change a quantity above to see your refund.</p>';
      var lines = c.cut.map(function (x) { var l = o.items[x.i]; return "<li>" + esc(l.name) + ": " + qt(l, x.cut) + " cancelled, " + M(x.refund) + "</li>"; }).join("");
      return '<ul class="small">' + lines + (c.full && o.totals.ship ? "<li>Delivery charge refunded: " + M(o.totals.ship) + "</li>" : "") + (c.discLost ? "<li>Coupon " + esc(o.coupon) + " needs " + M(c.cp.min) + " or more, so its " + M(c.discLost) + " comes off the refund</li>" : "") + "</ul>" +
        (c.tiers.length ? '<p class="small" style="margin-top:.3rem">' + c.tiers.map(esc).join(" ") + "</p>" : "") +
        '<p style="margin-top:.4rem"><b>' + (paid(o) ? "Refund: " + M(c.refund) + " to your " + esc(A.payName(o.pay)) : o.pay === "cod" ? "Nothing to refund: you have not paid yet. Your new total on delivery is " + M(o.totals.total - c.refund - spentBefore()) : "Nothing to refund if you have not sent the money. If you have, " + M(c.refund) + " goes back to the same bank account") + "</b></p>";
    }
    function spentBefore() { return docsFor(o).cx.reduce(function (a, x) { return a + x.refund; }, 0); }
    function readKeep() {
      errs = {};
      o.items.forEach(function (l, i) {
        var el = $("#keep" + i, box); if (!el) return;
        var cq = curQty(o, i), p = P[l.slug], min = p ? A.lineMin(p, l.print ? { method: l.print.method } : null) : 1, step = p ? p.step : 1, raw = el.value.trim(), n = parseInt(raw, 10);
        if (!/^\d+$/.test(raw)) { errs["k" + i] = "Type a number from 0 to " + cq + "."; keep[i] = cq; return; }
        if (n > cq) { errs["k" + i] = "You have " + qt(l, cq) + " on this order. Keep " + cq + " or fewer."; keep[i] = cq; return; }
        if (n > 0 && n < min) { errs["k" + i] = "The minimum for this item is " + qt(l, min) + ". Keep " + min + " or more, or 0 to cancel the line."; keep[i] = cq; return; }
        if (n > 0 && (n - min) % step && n !== cq) { errs["k" + i] = "This item is sold in steps of " + step + ". Try " + (min + Math.floor((n - min) / step) * step) + " or " + (min + Math.ceil((n - min) / step) * step) + "."; keep[i] = cq; return; }
        keep[i] = n;
      });
    }
    function placeCancel() {
      readKeep(); cxReason = ($("#cxReason", box) || {}).value || "";
      if (!cxReason) errs.reason = "Choose a reason. It helps us stock better.";
      var ks = Object.keys(errs);
      if (ks.length) { draw(); var f = $("[aria-invalid=true]", box); if (f) f.focus(); S.announce("Please fix " + A.plural(ks.length, "field", "fields")); return; }
      var c = cancelCalc(o, keep); if (!c.cut.length) return;
      var r = rec(o.no), d = { no: newNo("CX", 40100), order: o.no, at: Date.now(), full: c.full, lines: c.cut.map(function (x) { return { i: x.i, from: x.from, to: x.to, cut: x.cut, refund: x.refund }; }), reason: cxReason,
        refund: paid(o) ? c.refund : 0, credit: c.refund, ship: c.full ? o.totals.ship || 0 : 0, discLost: c.discLost, discBefore: r.disc != null ? r.disc : o.totals.discount || 0, discAfter: c.newDisc,
        method: paid(o) ? A.payName(o.pay) + ", 5 to 7 working days" : o.pay === "cod" ? "Cash on delivery: nothing was paid, so nothing to refund" : "Bank transfer: refunded to the same account if you already paid" };
      r.cx = (r.cx || []).concat([d]); r.disc = c.newDisc; if (c.full) r.cancelled = true;
      save(o.no, r);
      if (!o.seed) A.recordSold(c.cut.map(function (x) { var l = o.items[x.i]; return { slug: l.slug, vid: l.vid, qty: -x.cut }; }));
      mode = ""; keep = {}; cxReason = "";
      S.toast(c.full ? "Order cancelled (sample)" : "Items cancelled (sample)");
      if (c.full) { A.render(); return; }
      draw(); var first = $(".doc", box); if (first) { first.setAttribute("tabindex", "-1"); first.focus(); }
    }

    // ----- return form -----
    function returnFormHTML() {
      var lines = retLines(o), any = lines.some(function (x) { return x.max > 0; });
      var reasonOk = rx.reason, fault = ourFault(rx.reason), kinds = kindsFor(rx.reason);
      if (kinds.indexOf(rx.kind) < 0) rx.kind = kinds[0] || "";
      var h = '<form id="rxForm" class="mform" novalidate><h3>Return or exchange</h3>' +
        '<div class="field"><label for="rxReason">What went wrong?</label><select class="inp" id="rxReason" aria-describedby="rxReasonE"' + (errs.reason ? ' aria-invalid="true"' : "") + '><option value="">Choose a reason</option>' + REASONS.map(function (r) { return '<option value="' + r[0] + '"' + (rx.reason === r[0] ? " selected" : "") + ">" + r[1] + "</option>"; }).join("") + '</select><p class="err" id="rxReasonE">' + (errs.reason || "") + "</p></div>";
      if (!reasonOk) return h + '<div class="btn-row"><button class="btn btn--ghost" type="button" data-mg="close">Close</button></div></form>';
      h += '<fieldset class="mset"><legend>Which items, and how many?</legend><ul class="mlines">' + lines.map(function (x) {
        var l = o.items[x.i], why = x.blockFor(rx.reason);
        return '<li><div class="mline__t">' + A.img(l.img, "", "48px") + "<span><b>" + esc(lname(l)) + '</b><br><span class="small muted">' + qt(l, x.have) + " delivered · " + esc(x.pol.short) + "</span>" + (why ? '<br><span class="small">' + esc(why) + "</span>" : "") + "</span></div>" +
          (why ? "" : '<div class="field mline__q"><label for="rq' + x.i + '">Quantity</label><input class="inp notranslate" id="rq' + x.i + '" data-rq="' + x.i + '" inputmode="numeric" value="' + (rx.sel[x.i] || 0) + '" aria-describedby="rqE' + x.i + '"' + (errs["q" + x.i] ? ' aria-invalid="true"' : "") + '><span class="hint">0 to ' + x.max + '</span><p class="err" id="rqE' + x.i + '">' + (errs["q" + x.i] || "") + "</p></div>") +
          (!why && rx.kind === "exchange" && (rx.sel[x.i] || 0) > 0 ? exchangePickHTML(l, x) : "") + "</li>";
      }).join("") + '</ul><p class="err" id="rqAllE">' + (errs.none || "") + "</p></fieldset>";
      h += '<fieldset class="mset"><legend>What would you like?</legend><div class="chips">' + kinds.map(function (k) { return '<label class="check"><input type="radio" name="rxKind" value="' + k + '"' + (rx.kind === k ? " checked" : "") + "><span>" + { refund: "Refund", exchange: "Exchange for another size or colour", replace: "Send the same item again" }[k] + "</span></label>"; }).join("") + "</div></fieldset>";
      h += '<div class="field"><label for="rxNote">Tell us more <span class="muted" style="font-weight:400">(optional)</span></label><textarea class="inp" id="rxNote" maxlength="300">' + esc(rx.note || "") + "</textarea></div>";
      h += '<div class="field"><label for="rxPhoto">Photo of the item' + (fault ? "" : ' <span class="muted" style="font-weight:400">(optional)</span>') + '</label><input class="inp" type="file" id="rxPhoto" accept="image/png,image/jpeg,image/webp" aria-describedby="rxPhotoE rxPhotoH"' + (errs.photo ? ' aria-invalid="true"' : "") + '><span class="hint" id="rxPhotoH">' + (fault ? "Needed so we can fix it fast. " : "") + "The photo stays on this device in this sample.</span>" + (rx.photo ? '<img src="' + rx.photo + '" alt="Your photo" width="72" height="72" class="mthumb">' : "") + '<p class="err" id="rxPhotoE">' + (errs.photo || "") + "</p></div>";
      var small = fault && rx.kind === "replace" && selValue() > 0 && selValue() <= 300;
      h += '<fieldset class="mset"><legend>How does it come back to us?</legend><div class="chips">' +
        (small ? '<label class="check"><input type="radio" name="rxHow" value="none"' + (rx.how === "none" ? " checked" : "") + "><span>Keep it, no need to send it back</span></label>" : "") +
        '<label class="check"><input type="radio" name="rxHow" value="pickup"' + (rx.how === "pickup" ? " checked" : "") + "><span>Pick up from my address " + (fault ? "(free)" : "(" + money(40) + " taken from the refund)") + '</span></label><label class="check"><input type="radio" name="rxHow" value="drop"' + (rx.how === "drop" ? " checked" : "") + "><span>I will drop it at College Street (free)</span></label></div></fieldset>";
      if (rx.kind === "refund" && !paid(o)) {
        h += '<fieldset class="mset"><legend>Where should the refund go?</legend><div class="chips"><label class="check"><input type="radio" name="rxTo" value="upi"' + (rx.to === "upi" ? " checked" : "") + '><span>UPI</span></label><label class="check"><input type="radio" name="rxTo" value="bank"' + (rx.to === "bank" ? " checked" : "") + "><span>Bank account</span></label></div>" +
          (rx.to === "bank" ? '<div class="form-grid form-grid--2" style="margin-top:.5rem"><div class="field"><label for="rxAcName">Account holder name</label><input class="inp" id="rxAcName" autocomplete="name" value="' + esc(rx.acName || "") + '" aria-describedby="rxAcNameE"' + (errs.acName ? ' aria-invalid="true"' : "") + '><p class="err" id="rxAcNameE">' + (errs.acName || "") + '</p></div><div class="field"><label for="rxAc">Account number</label><input class="inp notranslate" id="rxAc" inputmode="numeric" value="' + esc(rx.ac || "") + '" aria-describedby="rxAcE"' + (errs.ac ? ' aria-invalid="true"' : "") + '><p class="err" id="rxAcE">' + (errs.ac || "") + '</p></div><div class="field"><label for="rxIfsc">IFSC</label><input class="inp notranslate" id="rxIfsc" value="' + esc(rx.ifsc || "") + '" placeholder="SBIN0001234" aria-describedby="rxIfscE"' + (errs.ifsc ? ' aria-invalid="true"' : "") + '><p class="err" id="rxIfscE">' + (errs.ifsc || "") + "</p></div></div>" :
            '<div class="field" style="margin-top:.5rem"><label for="rxUpi">UPI ID</label><input class="inp notranslate" id="rxUpi" value="' + esc(rx.upi || "") + '" placeholder="name@okbank" autocomplete="off" aria-describedby="rxUpiE"' + (errs.upi ? ' aria-invalid="true"' : "") + '><p class="err" id="rxUpiE">' + (errs.upi || "") + "</p></div>") + "</fieldset>";
      }
      h += '<div class="msum" id="rxSum" aria-live="polite">' + returnSumHTML() + "</div>";
      return h + '<div class="btn-row"><button class="btn btn--blue" type="submit"' + (any ? "" : " disabled") + '>Send the request</button><button class="btn btn--ghost" type="button" data-mg="close">Close</button></div></form>';
    }
    function exchangePickHTML(l, x) {
      var p = P[l.slug]; if (!p) return "";
      var q = rx.sel[x.i] || 0, opts = p.variants.filter(function (v) { return v.id !== l.vid; });
      return '<div class="field" style="flex-basis:100%"><label for="rv' + x.i + '">Change to</label><select class="inp" id="rv' + x.i + '" data-rv="' + x.i + '" aria-describedby="rvE' + x.i + '"' + (errs["v" + x.i] ? ' aria-invalid="true"' : "") + '><option value="">Choose a size or colour</option>' +
        opts.map(function (v) { var ok = v.stock >= q; return '<option value="' + v.id + '"' + (rx.to2[x.i] === v.id ? " selected" : "") + (ok ? "" : " disabled") + ">" + esc(v.label) + (ok ? "" : " (out of stock)") + "</option>"; }).join("") + '</select><p class="err" id="rvE' + x.i + '">' + (errs["v" + x.i] || "") + "</p></div>";
    }
    function selValue() { var t = 0; Object.keys(rx.sel).forEach(function (i) { var l = o.items[i]; if (l && rx.sel[i] > 0) t += Math.round(unitPaid(l) * rx.sel[i]); }); return t; }
    function rxAmounts() {
      var items = 0, restock = 0, diff = 0, fault = ourFault(rx.reason);
      Object.keys(rx.sel).forEach(function (k) {
        var i = +k, q = rx.sel[i], l = o.items[i]; if (!l || !(q > 0)) return;
        var v = Math.round(unitPaid(l) * q); items += v;
        if (!fault && rx.kind === "refund" && l.tier && l.tier !== "retail") restock += Math.round(v * 0.1);
        if (rx.kind === "exchange" && rx.to2[i]) { var p = P[l.slug], nv = vOf(p, rx.to2[i]); if (nv) diff += (A.tierOf(p, nv, l.qty).price - l.unit) * q; }
      });
      var pickup = rx.kind === "refund" && !fault && rx.how === "pickup" ? 40 : 0;
      return { items: items, restock: restock, pickup: pickup, diff: diff, net: rx.kind === "refund" ? Math.max(0, items - restock - pickup) : 0 };
    }
    function returnSumHTML() {
      var a = rxAmounts(); if (!a.items) return '<p class="small muted">Choose the items and quantities above.</p>';
      if (rx.kind === "refund") return '<ul class="small"><li>Items: ' + M(a.items) + " at the price you paid</li>" + (a.restock ? "<li>Restocking fee on wholesale lines, 10%: &minus;" + M(a.restock) + "</li>" : "") + (a.pickup ? "<li>Pickup: &minus;" + M(a.pickup) + " (drop it at College Street to save this)</li>" : "") + '</ul><p style="margin-top:.4rem"><b>Refund: ' + M(a.net) + "</b>" + (paid(o) ? " to your " + esc(A.payName(o.pay)) : "") + ", within 5 to 7 working days after we check the items.</p>";
      if (rx.kind === "exchange") return "<p><b>" + (a.diff > 0 ? "Pay " + M(a.diff) + " more when the new one arrives." : a.diff < 0 ? "We refund the difference of " + M(-a.diff) + "." : "Same price, nothing to pay.") + "</b> The new size or colour ships once we have the old one back" + (ourFault(rx.reason) ? ", and pickup is free." : ".") + "</p>";
      return "<p><b>Free replacement.</b> We send the same item again" + (rx.how === "none" ? " and you keep the one you have." : " once we have the old one back.") + "</p>";
    }
    function readReturn() {
      var r = $("#rxReason", box); if (r) rx.reason = r.value;
      $$("[data-rq]", box).forEach(function (el) { rx.sel[+el.getAttribute("data-rq")] = el.value.trim(); });
      $$("[data-rv]", box).forEach(function (el) { rx.to2[+el.getAttribute("data-rv")] = el.value; });
      var k = $('input[name="rxKind"]:checked', box); if (k) rx.kind = k.value;
      var hw = $('input[name="rxHow"]:checked', box); if (hw) rx.how = hw.value;
      var t = $('input[name="rxTo"]:checked', box); if (t) rx.to = t.value;
      var n = $("#rxNote", box); if (n) rx.note = n.value;
      ["Upi", "Ac", "Ifsc", "AcName"].forEach(function (f) { var el = $("#rx" + f, box); if (el) rx[f.charAt(0).toLowerCase() + f.slice(1)] = el.value.trim(); });
      Object.keys(rx.sel).forEach(function (i) { var n2 = parseInt(rx.sel[i], 10); rx.sel[i] = isNaN(n2) ? 0 : n2; });
    }
    function validateReturn() {
      errs = {};
      if (!rx.reason) { errs.reason = "Choose what went wrong."; return; }
      var lines = retLines(o), chosen = 0, fault = ourFault(rx.reason);
      lines.forEach(function (x) {
        if (x.blockFor(rx.reason)) { rx.sel[x.i] = 0; return; }
        var raw = rx.sel[x.i] || 0, p = P[o.items[x.i].slug], step = p ? p.step : 1;
        if (raw < 0 || raw > x.max) errs["q" + x.i] = "Choose from 0 to " + x.max + ".";
        else if (raw && step > 1 && raw % step && raw !== x.max && !fault) errs["q" + x.i] = "Return in steps of " + step + ", as packed.";
        else if (raw > 0) { chosen++; if (rx.kind === "exchange" && !rx.to2[x.i]) errs["v" + x.i] = "Choose the size or colour you want instead."; }
      });
      if (!chosen && !Object.keys(errs).length) errs.none = "Set a quantity for at least one item.";
      if (fault && !rx.photo) errs.photo = "Add a photo so we can see the problem.";
      if (rx.kind === "refund" && !paid(o)) {
        if (rx.to === "bank") {
          if ((rx.acName || "").length < 3) errs.acName = "Type the name on the bank account.";
          if (!/^\d{9,18}$/.test(rx.ac || "")) errs.ac = "Account numbers have 9 to 18 digits.";
          if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test((rx.ifsc || "").toUpperCase())) errs.ifsc = "IFSC has 11 characters, like SBIN0001234.";
        } else if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(rx.upi || "")) errs.upi = "UPI IDs look like name@okbank.";
      }
    }
    function placeReturn() {
      readReturn(); validateReturn();
      var ks = Object.keys(errs);
      if (ks.length) { draw(); var f = $("[aria-invalid=true]", box) || $("#rqAllE", box); if (f) { if (!f.matches("input,select,textarea")) f.setAttribute("tabindex", "-1"); f.focus(); } S.announce("Please fix " + A.plural(ks.length, "thing", "things")); return; }
      var a = rxAmounts(), r = rec(o.no);
      var d = { no: newNo("RX", 50300), order: o.no, at: Date.now(), kind: rx.kind, reason: rx.reason, ourFault: ourFault(rx.reason), how: rx.how, note: (rx.note || "").trim(), photo: rx.photo || "",
        lines: Object.keys(rx.sel).filter(function (i) { return rx.sel[i] > 0; }).map(function (i) { return { i: +i, qty: rx.sel[i], toVid: rx.kind === "exchange" ? rx.to2[i] : "" }; }),
        refundTo: rx.kind === "refund" && !paid(o) ? (rx.to === "bank" ? { type: "bank", ac: rx.ac, ifsc: rx.ifsc.toUpperCase(), name: rx.acName } : { type: "upi", upi: rx.upi }) : null, amounts: a };
      r.rx = (r.rx || []).concat([d]); save(o.no, r);
      mode = ""; rx = null; S.toast("Request " + d.no + " sent (sample)");
      draw(); var first = $(".doc", box); if (first) { first.setAttribute("tabindex", "-1"); first.focus(); }
    }

    function onClick(e) {
      var b = e.target.closest("[data-mg]"); if (!b || !box.contains(b)) return;
      var m = b.getAttribute("data-mg");
      if (m === "cancel") { mode = "cancel"; keep = {}; errs = {}; draw("#cxForm input, #cxForm select"); return; }
      if (m === "return") { mode = "return"; errs = {}; rx = { reason: "", kind: "", sel: {}, to2: {}, how: "pickup", to: "upi" }; draw("#rxReason"); return; }
      if (m === "close") { mode = ""; errs = {}; draw('[data-mg="' + (cancelState(o).ok ? "cancel" : "return") + '"]'); return; }
      if (m === "all") { o.items.forEach(function (l, i) { if (!cancelBlock(o, i)) keep[i] = 0; }); errs = {}; cxReason = ($("#cxReason", box) || {}).value || cxReason; draw("#cxForm button[type=submit]"); S.announce("Set every line you can cancel to 0"); }
    }
    function onInput(e) {
      if (e.target.matches("[data-keep]")) { readKeep(); var sum = $("#cxSum", box); if (sum) sum.innerHTML = cancelSumHTML(cancelCalc(o, keep)); var c = cancelCalc(o, keep), sb = $("#cxForm button[type=submit]", box); if (sb) { sb.disabled = !c.cut.length; sb.textContent = c.full ? "Cancel the whole order" : "Cancel these items"; } return; }
      if (mode === "return" && e.target.closest("#rxForm") && e.target.type !== "file") {
        var redraw = e.target.id === "rxReason" || e.target.name === "rxKind" || e.target.name === "rxTo" || e.target.matches("[data-rq]") && rx.kind === "exchange";
        readReturn();
        if (redraw && e.type === "change") { var id = e.target.id ? "#" + e.target.id : 'input[name="' + e.target.name + '"]:checked'; draw(id); return; }
        var s2 = $("#rxSum", box); if (s2) s2.innerHTML = returnSumHTML();
      }
    }
    function onChange(e) {
      if (e.target.id === "cxReason") { cxReason = e.target.value; return; }
      if (e.target.matches("[data-keep]")) { readKeep(); var i = e.target.getAttribute("data-keep"), m = errs["k" + i] || ""; $("#keepE" + i, box).textContent = m; if (m) e.target.setAttribute("aria-invalid", "true"); else e.target.removeAttribute("aria-invalid"); return; }
      if (e.target.id === "rxPhoto" && e.target.files[0]) {
        var file = e.target.files[0];
        if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 6 * 1024 * 1024) { readReturn(); errs.photo = "Choose a JPG, PNG or WebP photo under 6 MB."; draw("#rxPhoto"); return; }
        var fr = new FileReader();
        fr.onload = function () { var im = new Image(); im.onload = function () { var k = Math.min(1, 640 / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); readReturn(); rx.photo = c.toDataURL("image/jpeg", .75); delete errs.photo; draw("#rxPhoto"); S.announce("Photo added"); }; im.src = fr.result; };
        fr.readAsDataURL(file); return;
      }
      onInput(e);
    }
    function onSubmit(e) { if (e.target.id === "cxForm") { e.preventDefault(); placeCancel(); } else if (e.target.id === "rxForm") { e.preventDefault(); placeReturn(); } }
    box.addEventListener("click", onClick); box.addEventListener("input", onInput); box.addEventListener("change", onChange); box.addEventListener("submit", onSubmit);
    var tick = setInterval(function () { if (!mode && document.body.contains(box)) { var f = document.activeElement && box.contains(document.activeElement) ? null : 1; if (f) draw(); } }, 15000);
    A.onCleanup(function () { clearInterval(tick); box.removeEventListener("click", onClick); box.removeEventListener("input", onInput); box.removeEventListener("change", onChange); box.removeEventListener("submit", onSubmit); });
    draw();
  }

  // ---------- return rules ----------
  function returnState(o) {
    if (A.statusOf(o) === "Cancelled") return { ok: false, why: "This order is cancelled." };
    if (A.stageOf(o) < 4) return { ok: false, why: "" };
    var ok = retLines(o).some(function (x) { return x.max > 0 && REASONS.some(function (r) { return !x.blockFor(r[0]); }); });
    return { ok: ok, why: ok ? "" : "The return window for this order has closed. If something is wrong, write to us on WhatsApp and we will help." };
  }
  function retLines(o) {
    var dt = A.stepTimes(o)[4], days = (Date.now() - dt) / DAY;
    return o.items.map(function (l, i) {
      var p = P[l.slug], pol = p ? D.returnPolicy(p, custom(l)) : { returnable: false, exchange: false, days: 0, short: "" }, have = curQty(o, i), max = Math.max(0, have - inReturn(o, i));
      return { i: i, have: have, max: max, pol: pol, blockFor: function (k) {
        if (max <= 0) return "Already in a return request.";
        if (k === "damaged" || k === "wrong" || k === "short") return days <= 2 ? "" : "Damage, a wrong item or a short count has to be reported within 48 hours of delivery.";
        if (k === "print") return custom(l) ? (days <= 7 ? "" : "Print problems have to be reported within 7 days.") : "This item was not printed.";
        if (k === "quality") return days <= 7 ? "" : "The 7-day window has closed.";
        if (k === "size") { if (!pol.exchange) return custom(l) ? "Personalised items cannot be exchanged." : "This item cannot be exchanged: " + pol.short.toLowerCase() + "."; if (!p || p.variants.length < 2) return "This item comes in one size and colour only."; return days <= pol.days ? "" : "The " + pol.days + "-day exchange window has closed."; }
        if (!pol.returnable) return custom(l) ? "Personalised items cannot be returned unless the print is faulty." : pol.short + ".";
        return days <= pol.days ? "" : "The " + pol.days + "-day return window has closed.";
      } };
    });
  }
  function kindsFor(reason) {
    if (!reason) return [];
    if (reason === "mind") return ["refund"];
    if (reason === "size") return ["exchange", "refund"];
    if (reason === "short") return ["replace", "refund"];
    if (reason === "print") return ["replace", "refund"];
    return ["replace", "refund"];
  }

  // ---------- GST documents ----------
  function sellerHTML() {
    return '<b class="notranslate">Kolom Khata Stationers</b><br>18 College Row, College Street<br>Kolkata 700009, West Bengal<br>State code 19 · GSTIN <span class="notranslate">' + A.STORE.gstin + '</span> <span class="sample-tag">Sample</span><br>' + A.STORE.phoneDisplay + " · " + A.STORE.email;
  }
  function supplyOf(o) { var st = o.delivery === "pickup" ? SHOP_STATE : o.addr.state || SHOP_STATE; return { state: st, code: D.TAX.states[st] || "", intra: st === SHOP_STATE }; }
  function inScopeL(c, l) {
    var s = c && c.scope; if (!s || s === "all") return true;
    if (s === "custom") return !!l.print; if (s === "kolkata") return !!(P[l.slug] && P[l.slug].kolkata);
    if (s.cats) return s.cats.indexOf(l.cat) > -1; if (s.slugs) return s.slugs.indexOf(l.slug) > -1; return false;
  }
  /** Rows of a tax document: each with an amount including GST, an HSN and a rate. Discount spread over the lines it applies to. */
  function invoiceRows(o) {
    var rows = [], cp = o.coupon && D.COUPONS.filter(function (c) { return c.code === o.coupon; })[0], disc = o.totals.discount || 0;
    var elig = o.items.filter(function (l) { return inScopeL(cp, l); }); if (!elig.length) elig = o.items;
    var base = elig.reduce(function (a, l) { return a + l.total; }, 0), top = 0, given = 0;
    o.items.forEach(function (l, i) {
      var p = P[l.slug], tx = p ? D.taxOf(p) : ["4820", 18], setup = l.print ? l.print.setup || 0 : 0, share = disc && elig.indexOf(l) > -1 ? r2(disc * l.total / base) : 0;
      top = Math.max(top, tx[1]); given += share;
      var unit = unitPaid(l);
      rows.push({ desc: lname(l) + (l.tier && l.tier !== "retail" ? ", " + (l.tier === "bulk" ? "bulk" : "wholesale") + " rate" : "") + (l.print ? ". " + l.print.text : "") + (l.note ? ". Engrave: " + l.note : ""), hsn: tx[0], rate: tx[1], qty: l.qty, uw: uw(l, l.qty), unit: unit,
        gross: l.total - setup, disc: setup ? r2(share * (l.total - setup) / l.total) : share, thumb: l.print && l.print.thumb, i: i });
      if (setup) rows.push({ desc: "Print setup, " + l.name, hsn: tx[0], rate: tx[1], qty: 1, uw: "job", unit: setup, gross: setup, disc: r2(share - share * (l.total - setup) / l.total), i: i });
    });
    if (disc && Math.abs(given - disc) > 0.001 && rows.length) rows[0].disc = r2(rows[0].disc + disc - given);
    var ship = o.totals.ship || 0;
    if (ship) rows.push({ desc: "Delivery charge (taxed at the rate of the goods)", hsn: "9968", rate: top, qty: 1, uw: "", unit: ship, gross: ship, disc: 0 });
    return rows;
  }
  function taxRows(rows, intra) {
    return rows.map(function (r) {
      var amt = r2(r.gross - r.disc), taxable = r2(amt / (1 + r.rate / 100)), tax = r2(amt - taxable), c = intra ? r2(tax / 2) : 0;
      return Object.assign({}, r, { amt: amt, taxable: taxable, tax: tax, cgst: c, sgst: intra ? r2(tax - c) : 0, igst: intra ? 0 : tax });
    });
  }
  function hsnSummary(rows) {
    var by = {}, keys = [];
    rows.forEach(function (r) { var k = r.hsn + "|" + r.rate; if (!by[k]) { by[k] = { hsn: r.hsn, rate: r.rate, taxable: 0, cgst: 0, sgst: 0, igst: 0 }; keys.push(k); } var b = by[k]; b.taxable = r2(b.taxable + r.taxable); b.cgst = r2(b.cgst + r.cgst); b.sgst = r2(b.sgst + r.sgst); b.igst = r2(b.igst + r.igst); });
    return keys.map(function (k) { return by[k]; });
  }
  function docTableHTML(rows, intra, sign) {
    sign = sign || 1;
    var head = '<thead><tr><th scope="col">#</th><th scope="col">Item</th><th scope="col">HSN/SAC</th><th scope="col" class="n">Qty</th><th scope="col" class="n">Rate incl. GST</th><th scope="col" class="n">Discount</th><th scope="col" class="n">Taxable value</th><th scope="col" class="n">GST</th>' +
      (intra ? '<th scope="col" class="n">CGST</th><th scope="col" class="n">SGST</th>' : '<th scope="col" class="n">IGST</th>') + '<th scope="col" class="n">Amount</th></tr></thead>';
    var body = rows.map(function (r, i) {
      return "<tr><td>" + (i + 1) + "</td><td>" + (r.thumb ? '<img src="' + esc(r.thumb) + '" alt="Approved design" width="44" height="44">' : "") + esc(r.desc) + '</td><td class="notranslate">' + r.hsn + '</td><td class="n notranslate">' + r.qty + (r.uw ? " " + esc(r.uw) : "") + '</td><td class="n notranslate">' + m2(r.unit) + '</td><td class="n notranslate">' + (r.disc ? m2(-r.disc) : "") + '</td><td class="n notranslate">' + m2(sign * r.taxable) + '</td><td class="n notranslate">' + r.rate + "%</td>" +
        (intra ? '<td class="n notranslate">' + m2(sign * r.cgst) + '</td><td class="n notranslate">' + m2(sign * r.sgst) + "</td>" : '<td class="n notranslate">' + m2(sign * r.igst) + "</td>") + '<td class="n notranslate">' + m2(sign * r.amt) + "</td></tr>";
    }).join("");
    return '<div class="inv-wrap"><table><caption class="sr">Items</caption>' + head + "<tbody>" + body + "</tbody></table></div>";
  }
  function summaryTableHTML(rows, intra, sign, label) {
    sign = sign || 1;
    var sum = hsnSummary(rows), t = rows.reduce(function (a, r) { a.taxable += r.taxable; a.cgst += r.cgst; a.sgst += r.sgst; a.igst += r.igst; a.amt += r.amt; return a; }, { taxable: 0, cgst: 0, sgst: 0, igst: 0, amt: 0 });
    var total = Math.round(t.amt), ro = r2(total - t.amt);
    var hs = '<div class="inv-wrap"><table class="inv-hsn"><caption>Tax by HSN</caption><thead><tr><th scope="col">HSN/SAC</th><th scope="col" class="n">Taxable value</th><th scope="col" class="n">Rate</th>' + (intra ? '<th scope="col" class="n">CGST</th><th scope="col" class="n">SGST</th>' : '<th scope="col" class="n">IGST</th>') + '<th scope="col" class="n">Total tax</th></tr></thead><tbody>' +
      sum.map(function (b) { return '<tr><td class="notranslate">' + b.hsn + '</td><td class="n notranslate">' + m2(sign * b.taxable) + '</td><td class="n notranslate">' + b.rate + "%</td>" + (intra ? '<td class="n notranslate">' + m2(sign * b.cgst) + " (" + b.rate / 2 + '%)</td><td class="n notranslate">' + m2(sign * b.sgst) + " (" + b.rate / 2 + "%)</td>" : '<td class="n notranslate">' + m2(sign * b.igst) + "</td>") + '<td class="n notranslate">' + m2(sign * (b.cgst + b.sgst + b.igst)) + "</td></tr>"; }).join("") + "</tbody></table></div>";
    var tot = '<table class="inv-tot"><tbody><tr><th scope="row">Total taxable value</th><td class="n notranslate">' + m2(sign * t.taxable) + "</td></tr>" +
      (intra ? '<tr><th scope="row">CGST</th><td class="n notranslate">' + m2(sign * t.cgst) + '</td></tr><tr><th scope="row">SGST</th><td class="n notranslate">' + m2(sign * t.sgst) + "</td></tr>" : '<tr><th scope="row">IGST</th><td class="n notranslate">' + m2(sign * t.igst) + "</td></tr>") +
      (ro ? '<tr><th scope="row">Round off</th><td class="n notranslate">' + m2(sign * ro) + "</td></tr>" : "") + '<tr class="grand"><th scope="row">' + (label || "Invoice total") + '</th><td class="n notranslate"><b>' + m2(total) + "</b></td></tr></tbody></table>";
    return { html: hs + tot + '<p class="inv-words"><b>Amount in words:</b> ' + inWords(total) + "</p>", total: total };
  }
  function invNo(o) { return "KK/" + fy(o.created) + "/" + o.no.replace(/\D/g, ""); }
  function cnNo(d, o) { return "CN/" + fy(d.at) + "/" + d.no.replace(/\D/g, ""); }
  function partyHTML(o) {
    return '<div><b>Billed to</b><br>' + A.addrHTML(o) + (o.gstin ? "" : '<br><span class="muted">GSTIN: not given (sale to a consumer)</span>') + "</div>";
  }
  function docShell(title, numberRows, o, inner, back) {
    return '<div class="wrap"><div class="inv-acts" style="margin-top:1rem"><button class="btn btn--blue" type="button" data-print>Print or save as PDF</button><a class="btn btn--ghost" href="' + back + '">Back to order</a></div>' +
      '<article class="inv"><header class="inv-head"><div><h1>' + title + ' <span class="sample-tag">Sample</span></h1><p class="small muted">Made by a demo store. Not a valid tax document.</p></div><div class="inv-seller">' + sellerHTML() + "</div></header>" +
      '<div class="meta">' + partyHTML(o) + '<div><dl class="inv-dl">' + numberRows.map(function (x) { return "<dt>" + x[0] + "</dt><dd" + (x[2] ? ' class="notranslate"' : "") + ">" + x[1] + "</dd>"; }).join("") + "</dl></div></div>" + inner +
      '<footer class="inv-foot"><p class="small">We declare that this ' + (title === "Tax invoice" ? "invoice" : "credit note") + ' shows the actual price of the goods described and that all particulars are true and correct.</p><p class="inv-sign">For Kolom Khata Stationers<br><br><span class="muted">Authorised signatory</span></p>' +
      '<p class="small muted">Sample from a demo store, made in your browser. HSN codes and GST rates are samples as we understand them after the September 2025 changes; a real shop confirms them with its CA.</p></footer></article></div>';
  }
  function wirePrint(view) {
    function onClick(e) { if (e.target.closest("[data-print]")) window.print(); }
    view.addEventListener("click", onClick); A.onCleanup(function () { view.removeEventListener("click", onClick); });
  }
  function invoice(o, view) {
    A.setTitle("Invoice " + invNo(o));
    var sp = supplyOf(o), rows = taxRows(invoiceRows(o), sp.intra), sm = summaryTableHTML(rows, sp.intra), d = docsFor(o);
    var credits = d.cx.filter(function (x) { return x.credit > 0 || x.refund > 0; }).concat(d.rx.filter(function (x) { return x.kind === "refund" && !x.rejected && stepOf(x) >= 3; }));
    var inner = docTableHTML(rows, sp.intra) + '<div class="inv-sums">' + sm.html + "</div>" +
      (o.totals.save ? '<p class="small" style="margin-top:.6rem">You saved <span class="notranslate">' + money(o.totals.save) + "</span> with wholesale prices.</p>" : "") +
      (o.totals.transport ? '<p class="small">Transport charge is billed separately after it is confirmed on WhatsApp.</p>' : "") +
      (credits.length ? '<div class="inv-cn"><b>Credit notes against this invoice</b><ul>' + credits.map(function (x) { return '<li><a href="' + u("/credit/" + x.no) + '" class="notranslate">' + cnNo(x, o) + "</a> · " + A.fDT(x.at) + " · " + docTitle(x) + "</li>"; }).join("") + "</ul></div>" : "") +
      '<p class="small" style="margin-top:.6rem">' + (sp.intra ? "Supply within West Bengal, so CGST and SGST apply." : "Supply from West Bengal to " + esc(sp.state) + ", so IGST applies.") + " Prices on the store include GST; this bill shows the GST inside them.</p>";
    view.innerHTML = docShell("Tax invoice", [["Invoice no.", invNo(o), 1], ["Invoice date", new Date(o.created).toLocaleDateString("en-IN")], ["Order no.", o.no, 1], ["Place of supply", esc(sp.state) + (sp.code ? " (" + sp.code + ")" : "")], ["Reverse charge", "No"], ["Payment", esc(A.payName(o.pay))], ["Type", o.gstin ? "B2B, buyer GSTIN above" : "B2C"]], o, inner, u("/order/" + o.no));
    wirePrint(view);
  }
  /** Credit note rows: what the cancellation or return took off the invoice, at the same HSN and rate. */
  function creditRows(o, d) {
    var rows = [];
    if (d.no.indexOf("CX") === 0) {
      var top = 0;
      d.lines.forEach(function (x) {
        var l = o.items[x.i], p = P[l.slug], tx = p ? D.taxOf(p) : ["4820", 18]; top = Math.max(top, tx[1]);
        rows.push({ desc: lname(l) + ": " + qt(l, x.cut) + " cancelled" + (x.to ? ", " + x.to + " kept" : ""), hsn: tx[0], rate: tx[1], qty: x.cut, uw: uw(l, x.cut), unit: x.refund / x.cut, gross: x.refund, disc: 0 });
      });
      if (d.discBefore - d.discAfter) {
        var big = rows.slice().sort(function (a, b) { return b.gross - a.gross; })[0];
        rows.push({ desc: "Less: coupon " + (o.coupon || "") + " given back" + (d.discLost ? " (order now below its minimum)" : ""), hsn: big ? big.hsn : "", rate: big ? big.rate : 18, qty: 1, uw: "", unit: -(d.discBefore - d.discAfter), gross: -(d.discBefore - d.discAfter), disc: 0 });
      }
      if (d.ship) rows.push({ desc: "Delivery charge refunded", hsn: "9968", rate: top, qty: 1, uw: "", unit: d.ship, gross: d.ship, disc: 0 });
      return rows;
    }
    var a = d.amounts;
    d.lines.forEach(function (x) {
      var l = o.items[x.i], p = P[l.slug], tx = p ? D.taxOf(p) : ["4820", 18], unit = unitPaid(l), gross = Math.round(unit * x.qty);
      rows.push({ desc: lname(l) + ": " + qt(l, x.qty) + " returned", hsn: tx[0], rate: tx[1], qty: x.qty, uw: uw(l, x.qty), unit: unit, gross: gross, disc: 0 });
    });
    var first = rows[0];
    if (a.restock) rows.push({ desc: "Less: restocking fee kept (10% on wholesale lines)", hsn: first.hsn, rate: first.rate, qty: 1, uw: "", unit: -a.restock, gross: -a.restock, disc: 0 });
    if (a.pickup) rows.push({ desc: "Less: pickup charge kept", hsn: "9968", rate: first.rate, qty: 1, uw: "", unit: -a.pickup, gross: -a.pickup, disc: 0 });
    return rows;
  }
  function credit(no, view) {
    var d = findDoc(no), o = d && A.findOrder(d.order);
    if (!d || !o) { A.setTitle("Credit note not found"); view.innerHTML = '<div class="wrap" style="padding-block:2rem"><div class="empty"><h1 style="font-size:1.6rem">Credit note not found</h1><p>Sample credit notes exist only in the browser where the cancellation or return was made.</p><a class="btn btn--blue" href="' + u("/track") + '">Track an order</a></div></div>'; return; }
    var isCx = d.no.indexOf("CX") === 0;
    if (!isCx && (d.kind !== "refund" || d.rejected || stepOf(d) < 3)) { A.setTitle("Credit note not ready"); view.innerHTML = '<div class="wrap" style="padding-block:2rem"><div class="empty"><h1 style="font-size:1.6rem">No credit note yet</h1><p>' + (d.kind !== "refund" ? "Exchanges and replacements do not change the bill, so there is no credit note." : "The credit note is made once we have checked the returned items.") + '</p><a class="btn btn--blue" href="' + u("/order/" + o.no + "#manage") + '">Back to the order</a></div></div>'; return; }
    A.setTitle("Credit note " + cnNo(d, o));
    var sp = supplyOf(o), rows = taxRows(creditRows(o, d), sp.intra), sm = summaryTableHTML(rows, sp.intra, 1, "Total credit");
    var inner = '<p style="margin-top:.8rem"><b>Reason:</b> ' + esc(isCx ? "Cancelled by the buyer: " + (d.reason || "") : reasonText(d.reason) + (d.note ? ". " + d.note : "")) + "</p>" + docTableHTML(rows, sp.intra) + '<div class="inv-sums">' + sm.html + "</div>" +
      '<p class="small" style="margin-top:.6rem">' + (isCx ? (d.refund > 0 ? "Refunded to " + esc(d.method) + "." : esc(d.method) + ".") : "Refunded to " + esc(refundToText(o, d)) + ".") + " This credit note reduces the value of invoice <span class=\"notranslate\">" + invNo(o) + "</span>.</p>";
    view.innerHTML = docShell("Credit note", [["Credit note no.", cnNo(d, o), 1], ["Date", new Date(d.at).toLocaleDateString("en-IN")], ["Against invoice", invNo(o) + " of " + new Date(o.created).toLocaleDateString("en-IN"), 1], ["Order no.", o.no, 1], [isCx ? "Cancellation no." : "Return no.", d.no, 1], ["Place of supply", esc(sp.state) + (sp.code ? " (" + sp.code + ")" : "")]], o, inner, u("/order/" + o.no + "#manage"));
    wirePrint(view);
  }

  // ---------- tracking ----------
  function trackDoc(no, mob, out) {
    var d = findDoc(no), o = d && A.findOrder(d.order);
    if (!d || !o || A.digits(o.mobile) !== A.digits(mob)) { out.innerHTML = '<div class="empty" role="status">' + I.box + "<h2>Nothing found</h2><p>Check the number (returns start with RX-, cancellations with CX-) and use the mobile number from the order. Sample requests are saved only in the browser where they were made.</p></div>"; return; }
    out.innerHTML = '<div class="box">' + docCardHTML(o, d, { timeline: true }) + '<div class="btn-row" style="margin-top:.4rem"><a class="btn btn--ghost btn--sm" href="' + u("/order/" + o.no + "#manage") + '">Open order <span class="notranslate">' + o.no + "</span></a></div></div>";
  }
  function trackExtra(o, el) {
    var d = docsFor(o), list = d.cx.concat(d.rx).sort(function (a, b) { return b.at - a.at; });
    el.innerHTML = list.length ? '<div class="docs" style="margin-top:.4rem">' + list.map(function (x) { return docCardHTML(o, x); }).join("") + "</div>" : "";
  }

  // ---------- owner's card ----------
  var adminFilter = "open", rejectFor = "";
  var REJECT = ["Used or washed, cannot be resold", "Outside the return window", "Photo does not show a problem", "Personalised item, print matches the proof"];
  function adminCard(box) {
    if (!box) return;
    function rows() {
      return allDocs().map(function (d) { var o = A.findOrder(d.order); return o ? { d: d, o: o, st: stepOf(d), stt: docStatus(d), open: d.no.indexOf("CX") === 0 ? d.refund > 0 && stepOf(d) < 2 : !d.rejected && stepOf(d) < 4 } : null; }).filter(Boolean);
    }
    function draw(focusSel) {
      var list = rows(), shown = list.filter(function (x) { return adminFilter === "all" || (adminFilter === "open" ? x.open : !x.open); });
      var pend = list.filter(function (x) { return x.open; }).reduce(function (a, x) { return a + (x.d.no.indexOf("CX") === 0 ? x.d.refund : x.d.kind === "refund" ? x.d.amounts.net : 0); }, 0);
      var weekCx = list.filter(function (x) { return x.d.no.indexOf("CX") === 0 && Date.now() - x.d.at < 7 * DAY; }).length;
      box.innerHTML = '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:.7rem;align-items:center"><div><h2 id="afterAdminH" style="margin:0">Cancellations and returns</h2><p class="small muted">Refunds still to pay: <b class="notranslate">' + money(pend) + "</b> · Open requests: <b>" + list.filter(function (x) { return x.open; }).length + "</b> · Cancellations this week: <b>" + weekCx + "</b></p></div>" +
        '<div class="chips" role="group" aria-label="Filter requests">' + [["open", "Open"], ["done", "Done"], ["all", "All"]].map(function (f) { return '<button type="button" class="chip" data-af="' + f[0] + '" aria-pressed="' + (adminFilter === f[0]) + '">' + f[1] + "</button>"; }).join("") + "</div></div>" +
        (shown.length ? '<ul class="alist">' + shown.map(function (x) {
          var d = x.d, o = x.o, cx = d.no.indexOf("CX") === 0, acts = "";
          if (!cx && !d.rejected) {
            if (x.st < 1) acts += '<button type="button" class="btn btn--blue btn--sm" data-aa="approve|' + d.no + '">Approve</button>';
            if (x.st >= 1 && x.st < 3) acts += '<button type="button" class="btn btn--ghost btn--sm" data-aa="received|' + d.no + '">' + (d.kind === "replace" ? "Mark packed" : "Mark received and checked") + "</button>";
            if (x.st === 3) acts += '<button type="button" class="btn btn--blue btn--sm" data-aa="done|' + d.no + '">' + (d.kind === "refund" ? "Send refund" : "Mark shipped") + "</button>";
            if (x.st < 2 && !d.seed) acts += '<button type="button" class="btn btn--ghost btn--sm" data-aa="reject|' + d.no + '" aria-expanded="' + (rejectFor === d.no) + '">Reject</button>';
          }
          if (cx && x.open) acts += '<button type="button" class="btn btn--blue btn--sm" data-aa="refund|' + d.no + '">Mark refund paid</button>';
          acts += '<a class="btn btn--ghost btn--sm" href="' + esc(S.wa("Hello " + o.name.split(" ")[0] + ", about " + d.no + " on your Kolom Khata order " + o.no + ": ")) + '" target="_blank" rel="noopener">WhatsApp the buyer</a>';
          if ((cx && d.credit > 0) || (!cx && d.kind === "refund" && x.st >= 3 && !d.rejected)) acts += '<a class="btn btn--ghost btn--sm" href="' + u("/credit/" + d.no) + '">Credit note</a>';
          return '<li style="display:block"><div style="display:flex;flex-wrap:wrap;gap:.5rem;align-items:center">' + (d.photo ? '<button type="button" class="rvphoto" style="width:44px;height:44px;margin:0" data-azoom="' + esc(d.photo.indexOf("data:") === 0 ? d.photo : A.D && u("/images/" + d.photo + "-800.webp")) + '" aria-label="Open the buyer\'s photo for ' + d.no + '"><img src="' + esc(d.photo.indexOf("data:") === 0 ? d.photo : u("/images/" + d.photo + "-400.webp")) + '" alt="" width="44" height="44"></button>' : "") +
            "<b>" + docTitle(d) + ' <span class="notranslate">' + d.no + '</span></b><span class="st st--' + A.stClass(x.stt) + '">' + x.stt + "</span>" + (d.seed ? "" : ' <span class="sample-tag">Yours</span>') + "</div>" +
            '<p class="small">' + esc(o.biz || o.name) + ", " + esc(o.addr.city) + ' · order <span class="notranslate">' + o.no + "</span> · " + A.fDT(d.at) + "</p>" +
            '<p class="small">' + esc(docLines(o, d)) + ". " + (cx ? esc(d.reason) + ". " + (d.refund > 0 ? "Refund " + money(d.refund) + "." : "Nothing paid, nothing to refund.") : esc(reasonText(d.reason)) + (d.note ? ': "' + esc(d.note) + '"' : "") + ". " + (d.kind === "refund" ? "Refund " + money(d.amounts.net) : KIND[d.kind]) + ", " + (d.how === "drop" ? "buyer drops it at the shop" : d.how === "none" ? "buyer keeps the item" : "pickup from the buyer") + ".") + "</p>" +
            (d.rejected ? '<p class="small" style="color:var(--err)">Rejected: ' + esc(d.rejected.reason) + "</p>" : "") +
            '<div class="job__acts">' + acts + "</div>" +
            (rejectFor === d.no ? '<form id="rejForm" novalidate style="display:grid;gap:.4rem;margin-top:.5rem"><label class="lab" for="rejWhy">Reason the buyer will see</label><select class="inp" id="rejWhy">' + REJECT.map(function (r) { return "<option>" + r + "</option>"; }).join("") + '</select><div><button class="btn btn--blue btn--sm" type="submit">Reject request</button></div></form>' : "") + "</li>";
        }).join("") + "</ul>" : '<p class="muted" style="margin-top:.6rem">' + (adminFilter === "open" ? "No open requests. Cancel or return something on one of your sample orders to see it here." : "Nothing here yet.") + "</p>");
      if (focusSel) { var f = $(focusSel, box); if (f) f.focus(); }
    }
    function setDoc(no, fn) {
      var a = all(), hit = false;
      Object.keys(a).forEach(function (k) { ["cx", "rx"].forEach(function (t) { (a[k][t] || []).forEach(function (d) { if (d.no === no) { fn(d); hit = true; } }); }); });
      if (hit) A.afterStore.set(a); else SEED_RX.forEach(function (d) { if (d.no === no) fn(d); });
    }
    function onClick(e) {
      var f = e.target.closest("[data-af]"); if (f) { adminFilter = f.getAttribute("data-af"); draw('[data-af="' + adminFilter + '"]'); S.announce("Showing " + f.textContent.toLowerCase() + " requests"); return; }
      var z = e.target.closest("[data-azoom]"); if (z) { A.openZoom(z.getAttribute("data-azoom"), "Photo from the buyer"); return; }
      var b = e.target.closest("[data-aa]"); if (!b) return;
      var x = b.getAttribute("data-aa").split("|"), msg = "";
      if (x[0] === "reject") { rejectFor = rejectFor === x[1] ? "" : x[1]; draw(rejectFor ? "#rejWhy" : '[data-aa="reject|' + x[1] + '"]'); return; }
      setDoc(x[1], function (d) {
        var cur = stepOf(d);
        if (x[0] === "approve") { d.adminStep = Math.max(cur, 1); msg = d.no + " approved. The buyer gets a WhatsApp update (sample)."; }
        if (x[0] === "received") { d.adminStep = Math.max(cur, 3); msg = d.no + (d.kind === "replace" ? " packed." : " received and checked."); }
        if (x[0] === "done" || x[0] === "refund") { d.adminStep = 4; if (d.fixedStep != null) d.fixedStep = 4; msg = d.no + (d.kind === "refund" || x[0] === "refund" ? " refund marked as paid (sample)." : " marked as shipped."); }
      });
      draw(); S.toast(msg || "Updated");
    }
    function onSubmit(e) {
      if (e.target.id !== "rejForm") return; e.preventDefault();
      var why = $("#rejWhy", box).value, no = rejectFor;
      setDoc(no, function (d) { d.rejected = { reason: why, at: Date.now() }; });
      rejectFor = ""; draw(); S.toast(no + " rejected. The buyer sees the reason (sample).");
    }
    box.addEventListener("click", onClick); box.addEventListener("submit", onSubmit);
    A.onCleanup(function () { box.removeEventListener("click", onClick); box.removeEventListener("submit", onSubmit); });
    draw();
  }

  window.KKOrders = { manage: manage, invoice: invoice, credit: credit, trackDoc: trackDoc, trackExtra: trackExtra, adminCard: adminCard, inWords: inWords };
})();
