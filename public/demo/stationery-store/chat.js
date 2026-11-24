/* Kolom Khata Stationers, sample store: the chat window.
 * Loaded on first open. Answers come from the store's own data and functions,
 * written by simple keyword matching. Nothing is sent anywhere; "Talk to a
 * person" opens WhatsApp with a summary the visitor sends themselves.
 */
(function () {
  "use strict";
  var A = window.KKApp && window.KKApp.chatAPI, S = window.NxShop;
  if (!A || !S) return;
  var el = null, release = null, ctx = null, hist = null, opener = null, store = null;
  var CHIPS = [["price", "Wholesale price?"], ["min", "Minimum order?"], ["pin", "Delivery to my PIN"], ["stock", "Stock left?"], ["print", "Can you print my logo?"], ["coupon", "Coupons for this?"], ["size", "Size guide"], ["quote", "Bulk quote for my school"], ["order", "Where is my order?"], ["human", "Talk to a person"]];
  function $(s) { return el.querySelector(s); }
  function hours() { var d = new Date(), h = d.getHours() + d.getMinutes() / 60; return d.getDay() !== 0 && h >= 9.5 && h < 20; }
  function css() {
    if (document.getElementById("kk-chat-css")) return;
    var s = document.createElement("style"); s.id = "kk-chat-css";
    s.textContent = ".chat{position:fixed;z-index:320;right:16px;bottom:16px;width:min(380px,calc(100vw - 32px));height:min(560px,calc(100vh - 32px));background:var(--card);border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow);display:flex;flex-direction:column}" +
      "@media (max-width:599px){.chat{inset:0;width:auto;height:auto;border-radius:0}}" +
      ".chat__head{display:flex;align-items:center;gap:.5rem;padding:.6rem .75rem;border-bottom:1px solid var(--line)}.chat__head b{display:block}.chat__dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#1D6B3B;margin-right:.3rem}.chat__dot.off{background:#8B8576}" +
      ".chat__log{flex:1;overflow-y:auto;padding:.75rem;display:flex;flex-direction:column;gap:.5rem}.msg{max-width:88%;padding:.5rem .7rem;border-radius:10px;font-size:.9375rem;line-height:1.45}.msg--bot{background:var(--paper);align-self:flex-start}.msg--me{background:var(--blue);color:#fff;align-self:flex-end}" +
      ".msg .btn{margin-top:.4rem}.chat__ctx{display:flex;gap:.6rem;align-items:center;padding:.5rem;border:1px solid var(--line);border-radius:8px;font-size:.8125rem}.chat__ctx img{width:44px;height:44px;border-radius:6px;object-fit:cover}" +
      ".chat__chips{display:flex;gap:.35rem;overflow-x:auto;padding:.4rem .75rem;border-top:1px solid var(--line);scrollbar-width:none}.chat__chips button{flex:none;min-height:36px;padding:.2rem .7rem;border:1px solid var(--line-strong);border-radius:999px;font-size:.8125rem;font-weight:600;background:var(--card)}" +
      ".chat__form{display:flex;gap:.4rem;padding:.6rem .75rem calc(.6rem + env(safe-area-inset-bottom,0px));border-top:1px solid var(--line)}.chat__form input{flex:1;min-width:0}.typing{font-size:.8125rem;color:var(--muted)}";
    document.head.appendChild(s);
  }
  function save() { store.set(hist.slice(-40)); }
  function add(who, html, raw) { hist.push({ w: who, h: html, t: raw || "" }); save(); draw(); }
  function draw() {
    var log = $(".chat__log");
    log.innerHTML = (ctx.p ? ctxCard() : "") + hist.map(function (m) { return '<div class="msg msg--' + m.w + '">' + m.h + "</div>"; }).join("");
    log.scrollTop = log.scrollHeight;
  }
  function ctxCard() { var p = ctx.p, v = ctx.v, t = A.tierOf(p, v, ctx.qty); return '<div class="chat__ctx"><img src="' + A.IMG + v.img + '-400.webp" alt=""><span><b>' + A.esc(p.name) + "</b><br>" + A.esc(v.label) + " · " + A.qtyText(p, ctx.qty) + " · " + A.money(t.price) + " " + A.perText(p) + " (" + t.name.toLowerCase() + ")</span></div>"; }
  function reply(html) { var log = $(".chat__log"), ty = document.createElement("p"); ty.className = "typing"; ty.textContent = "Kolom Khata is typing..."; log.appendChild(ty); log.scrollTop = log.scrollHeight; setTimeout(function () { if (!el) return; add("bot", html); var last = hist[hist.length - 1]; A.announce(last.h.replace(/<[^>]+>/g, " ")); }, 600); }
  function need() { return ctx.p ? "" : "Open a product first, or tell me what you need. "; }
  function answer(intent, text) {
    var p = ctx.p, v = ctx.v, q = ctx.qty;
    if (intent === "human") { var s = "Hello Kolom Khata Stationers, I was chatting on your website." + (p ? "\nProduct: " + p.name + (p.variants.length > 1 ? " (" + v.label + ")" : "") + ", " + A.qtyText(p, q) : "") + (ctx.order ? "\nOrder: " + ctx.order : "") + "\nMy questions:\n" + hist.filter(function (m) { return m.w === "me"; }).map(function (m) { return "- " + m.t; }).join("\n") + "\n\n" + A.WA_END; return reply('A person can answer on WhatsApp. Your questions are written out for you.<br><a class="btn btn--wa btn--sm" href="' + A.esc(A.wa(s)) + '" target="_blank" rel="noopener">Continue on WhatsApp</a>'); }
    if (intent === "order") {
      var os = ctx.order ? [A.findOrder(ctx.order)] : A.myOrders().slice(0, 2);
      os = os.filter(Boolean);
      if (!os.length) return reply('I cannot see a sample order on this device. Try the sample order <b class="notranslate">KKS-200311</b> on the Track page.<br><a class="btn btn--ghost btn--sm" href="' + A.u("/track") + '">Open tracking</a>');
      return reply(os.map(function (o) { var st = A.stageOf(o); return '<b class="notranslate">' + o.no + "</b>: " + (st === 3 ? "Out for delivery" : A.STATUS[st]) + ", expected by " + A.fDate(o.eta[1]) + "."; }).join("<br>"));
    }
    if (!p) return reply("Ask me about any product: open it and tap Chat about this product. For everything else, a person can help on WhatsApp.");
    if (intent === "price") { return reply("Shop price " + A.money(v.price) + " " + A.perText(p) + ". From " + p.wq + " it is " + A.money(v.wp) + " (" + A.mkName(p) + " rate)" + (p.bq && v.bp ? ", and from " + p.bq + " it is " + A.money(v.bp) : "") + '. The cart applies it on its own.<br><button type="button" class="btn btn--blue btn--sm" data-chat-add="' + p.wq + '">Add ' + p.wq + " to cart</button>"); }
    if (intent === "min") return reply("You can buy from " + A.qtyText(p, p.min) + (p.step > 1 ? ", in steps of " + p.step : "") + ". The wholesale price starts at " + p.wq + ".");
    if (intent === "stock") return reply(A.stockText(p, v)[0] + " for " + A.esc(v.label) + ".");
    if (intent === "pin") { var m = (text || "").match(/\b[1-9]\d{5}\b/); if (!m) { ctx.wantPin = true; return reply("Type your 6-digit PIN code, for example 700009."); } var e = A.eta({ p: p, v: v, qty: q, pin: m[0] }), dv = A.delivery(m[0]); ctx.wantPin = false; return reply(e ? "To " + m[0] + (dv.city ? " (" + dv.city + ")" : "") + ": get it by <b>" + A.fDate(e.to) + "</b>. Delivery " + A.money(dv.fee) + ", free above " + A.money(A.STORE.ship.freeAt) + "." : "This option is out of stock, back soon."); }
    if (intent === "print" && !p.custom) return reply("This item is sold plain. It is not personalised. See the Customise button on items like caps, bags, mugs, medals and diaries.");
    if (intent === "return") { var rp = window.KK.returnPolicy(p); return reply(A.esc(rp.short + ". " + rp.text)); }
    if (intent === "print") { return reply("Yes: " + p.pr.methods.map(function (mm) { return A.esc(window.KK.METHODS[mm.id].name) + (mm.min > 1 ? " from " + mm.min : " from 1 piece"); }).join(", ") + '.<br><a class="btn btn--blue btn--sm" href="' + A.u("/design/" + p.slug + "?v=" + v.id) + '">Customise with your logo</a>'); }
    if (intent === "coupon") { var of = A.offersFor(p, v, q); return reply(of.length ? of.map(function (o) { return '<b class="notranslate">' + o.c.code + "</b>: " + A.esc(o.c.label) + ". " + A.esc(o.r.ok ? "Applies now." : o.r.msg); }).join("<br>") : "No coupon fits this right now."); }
    if (intent === "size") return reply('Here is the size guide.<br><button type="button" class="btn btn--ghost btn--sm" data-chat-size>Open size guide</button>');
    if (intent === "quote") return reply('Schools get special rates. Start a quote and add other items too.<br><button type="button" class="btn btn--blue btn--sm" data-chat-quote>Start bulk quote</button>');
    // Free text: look in the product's own questions.
    var words = (text || "").toLowerCase().split(/\W+/).filter(function (w) { return w.length > 3; }), best = null, score = 0;
    A.qaOf(p).forEach(function (x) { if (!x.a) return; var hay = (x.q + " " + x.a).toLowerCase(), s = words.filter(function (w) { return hay.indexOf(w) > -1; }).length; if (s > score) { score = s; best = x; } });
    if (best && score >= 1) return reply(A.esc(best.a));
    return reply('I am not sure about that. A person can answer on WhatsApp.<br><button type="button" class="btn btn--wa btn--sm" data-chat-intent="human">Talk to a person</button>');
  }
  function intentOf(t) {
    t = t.toLowerCase();
    if (/\b[1-9]\d{5}\b/.test(t) || /deliver|pin|when.*(reach|arrive)/.test(t)) return "pin";
    if (/where.*order|my order|track/.test(t)) return "order";
    if (/wholesale|price|rate|cost|how much/.test(t)) return "price";
    if (/minimum|moq|least|how many/.test(t)) return "min";
    if (/stock|available|left/.test(t)) return "stock";
    if (/print|logo|engrav|embroider|custom/.test(t)) return "print";
    if (/coupon|offer|discount|code/.test(t)) return "coupon";
    if (/return|exchange|refund/.test(t)) return "return";
    if (/size|fit|measure/.test(t)) return "size";
    if (/quote|school rate|bulk/.test(t)) return "quote";
    if (/person|human|call|whatsapp/.test(t)) return "human";
    return "";
  }
  function open(o) {
    css(); close(true);
    var p = o.slug && A.P[o.slug];
    ctx = { p: p, v: p ? (A.vOf(p, o.vid) || A.defV(p)) : null, qty: p ? (o.qty || p.min) : 0, order: o.order || "" };
    opener = o.opener || document.activeElement;
    store = A.store("kk:chat:" + (p ? p.slug : "general"));
    hist = store.get([]) || [];
    el = document.createElement("div"); el.className = "chat"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "chatT");
    var on = hours();
    el.innerHTML = '<div class="chat__head"><div style="flex:1"><b id="chatT" class="notranslate">Kolom Khata Stationers</b><span class="small"><span class="chat__dot' + (on ? "" : " off") + '"></span>' + (on ? "Online now · 9:30 am to 8 pm" : "We are offline. Leave a message or continue on WhatsApp") + '</span></div><button type="button" class="textbtn" data-chat-clear>Clear chat</button><button type="button" class="icon-btn" data-chat-close aria-label="Close chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true" style="width:20px;height:20px"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
      '<p class="small muted" style="padding:.4rem .75rem 0">Instant answers are automatic in this sample. Tap "Talk to a person" to continue on WhatsApp.</p>' +
      '<div class="chat__log" role="log" aria-live="polite"></div><div class="chat__chips" role="group" aria-label="Quick questions">' + CHIPS.map(function (c) { return '<button type="button" data-chat-intent="' + c[0] + '">' + c[1] + "</button>"; }).join("") + '</div><form class="chat__form" novalidate><label class="sr" for="chatIn">Type your question</label><input class="inp" id="chatIn" autocomplete="off" placeholder="Type your question"><button class="btn btn--blue btn--sm" type="submit">Send</button></form>';
    document.body.appendChild(el);
    if (!hist.length) hist.push({ w: "bot", h: "Namaskar. " + (p ? "Ask me anything about " + A.esc(p.name) + "." : "How can we help?") + (o.order ? " I can see order " + A.esc(o.order) + "." : "") });
    draw();
    el.addEventListener("click", onClick); el.addEventListener("submit", onSubmit);
    release = A.trap(el, function () { close(); }, "#chatIn");
  }
  function onClick(e) {
    var b;
    if (e.target.closest("[data-chat-close]")) return close();
    if (e.target.closest("[data-chat-clear]")) { hist = []; save(); draw(); A.announce("Chat cleared"); return; }
    if ((b = e.target.closest("[data-chat-intent]"))) { var it = b.getAttribute("data-chat-intent"), label = b.textContent; add("me", A.esc(label), label); answer(it, ""); return; }
    if ((b = e.target.closest("[data-chat-add]"))) { A.addToCart(ctx.p.slug, ctx.v.id, +b.getAttribute("data-chat-add"), { quiet: true }); add("bot", "Added " + A.qtyText(ctx.p, +b.getAttribute("data-chat-add")) + " to your cart."); return; }
    if (e.target.closest("[data-chat-size]")) { close(); A.openSizeGuide(ctx.p.slug); return; }
    if (e.target.closest("[data-chat-quote]")) { close(); A.openQuote({ slug: ctx.p.slug, vid: ctx.v.id, qty: ctx.p.wq * 2 }); }
  }
  function onSubmit(e) {
    e.preventDefault(); var i = $("#chatIn"), t = i.value.trim(); if (!t) return; i.value = "";
    add("me", A.esc(t), t);
    answer(ctx.wantPin && /\b[1-9]\d{5}\b/.test(t) ? "pin" : (intentOf(t) || ""), t);
  }
  function close(silent) { if (!el) return; el.remove(); el = null; if (release) release(!silent); release = null; }
  window.KKChat = { open: open, close: close };
})();
