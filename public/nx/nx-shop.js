/* Nexvora sample stores: the small shared core both online-store demos use
 * (/demo/mishti-store and /demo/craft-store).
 *
 * Nothing here talks to a server. Carts, wishlists and "orders" live in the
 * visitor's own browser; the only thing that ever leaves the page is a
 * WhatsApp link the visitor taps themselves.
 *
 *   NxShop.money(1249)            -> "₹1,249"
 *   NxShop.moneyHTML(1249)        -> '<span class="notranslate">₹1,249</span>'
 *   NxShop.store("key")           -> { get(fallback), set(value), remove() }
 *   NxShop.toast("Added to cart") -> short toast, also read out by screen readers
 *   NxShop.announce("3 items")    -> screen-reader only
 *   NxShop.trap(el, onClose)      -> focus trap + Escape; returns release()
 *   NxShop.lockScroll(true|false)
 *   NxShop.wa(text)               -> wa.me link to Nexvora's number
 *   NxShop.validMobile / validPin / validEmail
 *   NxShop.orderNo("NMG-", 5)     -> "NMG-24817"
 *   NxShop.esc(str)               -> HTML-escaped text
 *
 * Theme the toast with CSS variables on :root: --nxs-toast-bg, --nxs-toast-fg,
 * --nxs-radius, --nxs-font.
 */
(function () {
  "use strict";
  var WA_NUMBER = "919804243159";

  var fmt;
  try {
    fmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  } catch (e) {
    fmt = null;
  }
  function money(n) {
    n = Math.round(Number(n) || 0);
    if (fmt) return fmt.format(n).replace(/\s/g, "");
    return "₹" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function moneyHTML(n) {
    return '<span class="notranslate">' + money(n) + "</span>";
  }

  // localStorage with a memory fallback: private mode, a blocked storage
  // permission or a full quota must never break the store.
  var memory = {};
  function store(key) {
    var k = "nxshop:" + key;
    return {
      get: function (fallback) {
        try {
          var raw = window.localStorage.getItem(k);
          if (raw != null) return JSON.parse(raw);
        } catch (e) {}
        return Object.prototype.hasOwnProperty.call(memory, k) ? memory[k] : fallback;
      },
      set: function (v) {
        memory[k] = v;
        try {
          window.localStorage.setItem(k, JSON.stringify(v));
        } catch (e) {}
      },
      remove: function () {
        delete memory[k];
        try {
          window.localStorage.removeItem(k);
        } catch (e) {}
      },
    };
  }

  // Live regions and the toast.
  var live, toastEl, toastTimer;
  function ensureUI() {
    if (live) return;
    var css = document.createElement("style");
    css.textContent =
      ".nxs-sr{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}" +
      ".nxs-toast{position:fixed;left:50%;bottom:calc(88px + env(safe-area-inset-bottom,0px));z-index:400;transform:translate(-50%,16px);opacity:0;pointer-events:none;" +
      "max-width:min(92vw,420px);padding:.75rem 1.1rem;border-radius:var(--nxs-radius,12px);background:var(--nxs-toast-bg,#1f1b18);color:var(--nxs-toast-fg,#fff);" +
      "font:600 .92rem/1.35 var(--nxs-font,system-ui,sans-serif);box-shadow:0 14px 30px -12px rgba(0,0,0,.45);display:flex;gap:.6rem;align-items:center;transition:opacity .2s ease,transform .2s ease}" +
      ".nxs-toast.is-on{opacity:1;transform:translate(-50%,0)}" +
      ".nxs-toast svg{width:18px;height:18px;flex:none}" +
      "@media (min-width:900px){.nxs-toast{bottom:28px}}" +
      "@media (prefers-reduced-motion:reduce){.nxs-toast{transition:none}}";
    document.head.appendChild(css);
    live = document.createElement("div");
    live.className = "nxs-sr";
    live.setAttribute("aria-live", "polite");
    live.setAttribute("role", "status");
    document.body.appendChild(live);
    toastEl = document.createElement("div");
    toastEl.className = "nxs-toast";
    toastEl.setAttribute("aria-hidden", "true");
    document.body.appendChild(toastEl);
  }
  function announce(msg) {
    ensureUI();
    live.textContent = "";
    // A fresh node each time so the same message is read out twice in a row.
    setTimeout(function () {
      live.textContent = msg;
    }, 40);
  }
  var TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  function toast(msg, opts) {
    ensureUI();
    opts = opts || {};
    toastEl.innerHTML = (opts.icon === false ? "" : TICK) + "<span>" + esc(msg) + "</span>";
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-on");
    }, opts.ms || 2200);
    if (opts.announce !== false) announce(msg);
  }

  // Focus trap for drawers, sheets and modals. Tab and Shift+Tab stay inside
  // `el`; Escape calls onClose; release() hands focus back to whatever had it.
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  var traps = [];
  function trap(el, onClose, first) {
    var before = document.activeElement;
    function items() {
      return Array.prototype.filter.call(el.querySelectorAll(FOCUSABLE), function (n) {
        return n.offsetWidth || n.offsetHeight || n.getClientRects().length;
      });
    }
    function onKey(e) {
      if (traps[traps.length - 1] !== entry) return;
      if (e.key === "Escape") {
        e.preventDefault();
        if (onClose) onClose();
        return;
      }
      if (e.key !== "Tab") return;
      var list = items();
      if (!list.length) {
        e.preventDefault();
        return;
      }
      var a = list[0], z = list[list.length - 1];
      if (e.shiftKey && (document.activeElement === a || !el.contains(document.activeElement))) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && (document.activeElement === z || !el.contains(document.activeElement))) {
        e.preventDefault();
        a.focus();
      }
    }
    var entry = { el: el };
    traps.push(entry);
    document.addEventListener("keydown", onKey);
    // A drawer that is still becoming visible cannot take focus yet, so try
    // a few times over the first ~300ms until focus actually lands inside.
    var tries = 0;
    (function tryFocus() {
      if (traps[traps.length - 1] !== entry) return;
      var f = (first && el.querySelector(first)) || items()[0] || el;
      if (f === el && !el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      try {
        f.focus({ preventScroll: true });
      } catch (e) {
        f.focus();
      }
      if (!el.contains(document.activeElement) && ++tries < 12) setTimeout(tryFocus, 25);
    })();
    return function release(restore) {
      document.removeEventListener("keydown", onKey);
      traps = traps.filter(function (t) {
        return t !== entry;
      });
      if (restore !== false && before && before.focus && document.contains(before)) {
        try {
          before.focus({ preventScroll: true });
        } catch (e) {}
      }
    };
  }

  var locks = 0;
  function lockScroll(on) {
    locks = Math.max(0, locks + (on ? 1 : -1));
    document.documentElement.style.overflow = locks ? "hidden" : "";
  }

  function wa(text) {
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text);
  }

  function digits(s) {
    return String(s || "").replace(/\D/g, "");
  }
  function validMobile(s) {
    var d = digits(s);
    if (d.length === 12 && d.indexOf("91") === 0) d = d.slice(2);
    return /^[6-9]\d{9}$/.test(d);
  }
  function validPin(s) {
    return /^[1-9]\d{5}$/.test(String(s || "").trim());
  }
  function validEmail(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || "").trim());
  }
  function orderNo(prefix, n) {
    var min = Math.pow(10, (n || 5) - 1);
    return prefix + String(min + Math.floor(Math.random() * 9 * min));
  }

  window.NxShop = {
    money: money,
    moneyHTML: moneyHTML,
    esc: esc,
    store: store,
    toast: toast,
    announce: announce,
    trap: trap,
    lockScroll: lockScroll,
    wa: wa,
    digits: digits,
    validMobile: validMobile,
    validPin: validPin,
    validEmail: validEmail,
    orderNo: orderNo,
    reducedMotion: function () {
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    },
  };
})();
