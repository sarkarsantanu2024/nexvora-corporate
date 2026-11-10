/* Nexvora Edit Panel: applies saved content to a demo or client page.
 *
 * The page carries <meta name="nx-site"> with its slug and data-nx attributes
 * on every editable element (added by scripts/nx-annotate.mjs). This script
 * fetches the saved content and writes it into those elements. With no saved
 * content the page shows exactly what is in the HTML.
 *
 * Preview: open the page with ?nx-preview=1 to see the draft instead of the
 * published content, with a banner saying customers cannot see it yet.
 */
(function () {
  var meta = document.querySelector('meta[name="nx-site"]');
  if (!meta) return;
  var site = meta.getAttribute("content");
  var defaults = {};
  try {
    defaults = JSON.parse((document.querySelector('meta[name="nx-defaults"]') || {}).getAttribute("content") || "{}");
  } catch (e) {}
  var params = new URLSearchParams(location.search);
  var preview = params.get("nx-preview") === "1";
  var state = preview ? "draft" : "published";
  var localKey = "nx:" + state + ":" + site;

  function readLocal() {
    try {
      var raw = localStorage.getItem(localKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  // If this browser already holds content, hide the page until it is
  // applied so the original text never flashes first.
  var hasLocal = !!readLocal();
  var hide = document.createElement("style");
  hide.id = "nx-hide";
  hide.textContent = "html.nx-loading body{visibility:hidden}";
  if (hasLocal) {
    document.head.appendChild(hide);
    document.documentElement.classList.add("nx-loading");
  }
  var reveal = function () {
    document.documentElement.classList.remove("nx-loading");
  };
  setTimeout(reveal, 1500);

  var ALLOWED = { B: 1, STRONG: 1, I: 1, EM: 1, SMALL: 1, BR: 1, U: 1, SUP: 1, SUB: 1, MARK: 1, SPAN: 1 };
  function sanitize(html) {
    var doc = new DOMParser().parseFromString("<div>" + html + "</div>", "text/html");
    var root = doc.body.firstChild;
    (function walk(node) {
      var kids = Array.prototype.slice.call(node.childNodes);
      kids.forEach(function (k) {
        if (k.nodeType === 1) {
          if (!ALLOWED[k.tagName]) {
            var text = doc.createTextNode(k.textContent);
            node.replaceChild(text, k);
            return;
          }
          var attrs = Array.prototype.slice.call(k.attributes);
          attrs.forEach(function (a) {
            if (a.name !== "class") k.removeAttribute(a.name);
          });
          walk(k);
        } else if (k.nodeType !== 3) {
          node.removeChild(k);
        }
      });
    })(root);
    return root.innerHTML;
  }

  function setField(el, value, keyHint) {
    if (!el || value === undefined || value === null) return;
    if (el.tagName === "IMG") {
      if (typeof value === "object") {
        if (value.src) {
          el.src = value.src;
          el.removeAttribute("srcset");
        }
        if (value.alt !== undefined) el.alt = value.alt;
      }
      return;
    }
    if (typeof value === "object" && value.src !== undefined) {
      el.style.backgroundImage = "url(" + JSON.stringify(value.src) + ")";
      return;
    }
    if (typeof value === "object" && value.href !== undefined) {
      if (el.tagName === "A") el.href = value.href;
      if (value.text !== undefined) el.innerHTML = sanitize(value.text);
      return;
    }
    if (typeof value === "string") {
      if (/<[a-z]/i.test(value)) el.innerHTML = sanitize(value);
      else el.textContent = value;
    }
  }

  function applyLists(content) {
    var lists = document.querySelectorAll("[data-nx-list]");
    Array.prototype.forEach.call(lists, function (container) {
      var id = container.getAttribute("data-nx-list").split(".");
      var sec = content[id[0]];
      var list = sec && sec[id[1]];
      if (!list || !Array.isArray(list.items)) return;
      var items = container.querySelectorAll(":scope > [data-nx-item]");
      if (!items.length) return;
      var template = items[0].cloneNode(true);
      Array.prototype.forEach.call(items, function (it) {
        container.removeChild(it);
      });
      list.items.forEach(function (item) {
        var node = template.cloneNode(true);
        Object.keys(item).forEach(function (k) {
          var el = node.matches('[data-nx-f="' + k + '"]') ? node : node.querySelector('[data-nx-f="' + k + '"]');
          setField(el, item[k], k);
        });
        // Cloned nodes miss the page's scroll-in observer; show them.
        var reveals = node.querySelectorAll(".reveal");
        Array.prototype.forEach.call(reveals, function (r) {
          r.classList.add("is-visible");
        });
        if (node.classList.contains("reveal")) node.classList.add("is-visible");
        container.appendChild(node);
      });
    });
  }

  function applyFields(content) {
    var els = document.querySelectorAll("[data-nx]");
    Array.prototype.forEach.call(els, function (el) {
      var id = el.getAttribute("data-nx").split(".");
      var sec = content[id[0]];
      if (!sec || !(id[1] in sec)) return;
      setField(el, sec[id[1]], id[1]);
    });
  }

  function digits(s) {
    return String(s || "").replace(/\D/g, "");
  }
  function formatIndian(d) {
    d = digits(d).slice(-10);
    return "+91 " + d.slice(0, 5) + " " + d.slice(5);
  }
  function replaceText(from, to) {
    if (!from || from === to) return;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var n;
    var nodes = [];
    while ((n = walker.nextNode())) if (n.nodeValue.indexOf(from) !== -1) nodes.push(n);
    nodes.forEach(function (t) {
      t.nodeValue = t.nodeValue.split(from).join(to);
    });
  }

  function applyContact(content) {
    var c = content.contact;
    if (!c) return;
    if (c.phone) {
      var tel = "+91" + digits(c.phone).slice(-10);
      Array.prototype.forEach.call(document.querySelectorAll('a[href^="tel:"]'), function (a) {
        a.href = "tel:" + tel;
      });
      var shown = formatIndian(c.phone);
      replaceText(defaults.phoneDisplay, shown);
      if (defaults.phone) replaceText(defaults.phone, tel);
    }
    if (c.whatsapp || c.whatsappText !== undefined) {
      var wa = c.whatsapp ? "91" + digits(c.whatsapp).slice(-10) : defaults.whatsapp;
      Array.prototype.forEach.call(document.querySelectorAll('a[href*="wa.me/"]'), function (a) {
        var m = a.href.match(/\?text=([^&]*)/);
        var text = c.whatsappText !== undefined ? c.whatsappText : m ? decodeURIComponent(m[1]) : "";
        a.href = "https://wa.me/" + wa + (text ? "?text=" + encodeURIComponent(text) : "");
      });
    }
    if (c.maps) {
      Array.prototype.forEach.call(document.querySelectorAll('a[href*="google.com/maps"], a[href*="maps.google"], a[href*="maps.app.goo.gl"], a[href*="goo.gl/maps"]'), function (a) {
        a.href = c.maps;
      });
      Array.prototype.forEach.call(document.querySelectorAll('iframe[src*="google.com/maps"]'), function (f) {
        var src = c.maps;
        if (/google\.[a-z.]+\/maps\?q=/.test(src)) src = src.replace(/&output=embed/, "") + "&output=embed";
        else if (!/output=embed|\/embed/.test(src)) src = "https://www.google.com/maps?q=" + encodeURIComponent(src) + "&output=embed";
        f.src = src;
      });
    }
    [
      ["facebook", 'a[href*="facebook.com"], a[href*="fb.com"]'],
      ["instagram", 'a[href*="instagram.com"]'],
      ["youtube", 'a[href*="youtube.com"], a[href*="youtu.be"]'],
    ].forEach(function (pair) {
      if (!c[pair[0]]) return;
      Array.prototype.forEach.call(document.querySelectorAll(pair[1]), function (a) {
        if (/nexvoratechnologies/.test(a.href)) return;
        a.href = c[pair[0]];
      });
    });
  }

  function applySeo(content) {
    var s = content.seo;
    if (!s) return;
    if (s.title) document.title = s.title;
    if (s.description !== undefined) {
      var m = document.querySelector('meta[name="description"]');
      if (m) m.setAttribute("content", s.description);
    }
  }

  function banner() {
    if (!preview) return;
    var b = document.createElement("div");
    b.setAttribute("role", "status");
    b.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#0a1128;color:#fff;font:600 14px/1.4 system-ui,sans-serif;padding:10px 14px;text-align:center;box-shadow:0 -6px 20px rgba(0,0,0,.25)";
    b.innerHTML = 'This is a preview. Customers cannot see it yet. <span style="opacity:.85;font-weight:500">এটি একটি প্রিভিউ। গ্রাহকরা এখনো এটি দেখতে পাচ্ছেন না।</span>';
    document.body.appendChild(b);
  }

  function apply(content) {
    if (!content) return;
    try {
      applyLists(content);
      applyFields(content);
      applyContact(content);
      applySeo(content);
    } catch (e) {
      if (window.console) console.warn("nx-content: could not apply content", e);
    }
  }

  function run() {
    var done = false;
    var finish = function (content) {
      if (done) return;
      done = true;
      apply(content);
      reveal();
      banner();
    };
    var fromServer = fetch("/api/nx/content/" + encodeURIComponent(site) + "?state=" + state, { credentials: "same-origin" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .catch(function () {
        return null;
      });
    fromServer.then(function (res) {
      if (res && res.storage && res.storage !== "browser" && res.content) finish(res.content);
      else finish(readLocal());
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
