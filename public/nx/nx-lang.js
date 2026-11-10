/* Nexvora demos: the owner's Login / Sign up button and the language switch
 * (English, Bengali, Hindi), placed inside the sample website's own header.
 *
 * The demo is written in English. Bengali and Hindi come from Google's free
 * page translation, good enough to show a shopkeeper the site in their own
 * language during a demo. A real client's site is written in the languages
 * they need; this is only the demo convenience. Styles: /nx/nx-demo.css.
 */
(function () {
  var LANGS = [
    ["en", "English"],
    ["bn", "বাংলা"],
    ["hi", "हिन्दी"],
  ];
  var holder = document.querySelector(".nx-lang");
  if (!holder) return;

  var USER_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
  var GLOBE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>';
  var CHEVRON = '<svg class="nx-lang__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

  var siteMeta = document.querySelector('meta[name="nx-site"]');
  if (siteMeta) {
    var login = document.createElement("a");
    login.className = "nx-login notranslate";
    login.href = "/login/" + siteMeta.getAttribute("content");
    login.setAttribute("aria-label", "Login or sign up");
    login.title = "Login or sign up";
    login.innerHTML = USER_ICON + "<span>Login</span>";
    holder.appendChild(login);
  }

  function current() {
    var m = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([a-z-]+)/);
    return m ? m[1] : "en";
  }
  function setLang(code) {
    var exp = "expires=Fri, 31 Dec 2037 23:59:59 GMT;path=/";
    var gone = "expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    if (code === "en") {
      document.cookie = "googtrans=;" + gone;
      document.cookie = "googtrans=;domain=" + location.hostname + ";" + gone;
    } else {
      document.cookie = "googtrans=/en/" + code + ";" + exp;
      document.cookie = "googtrans=/en/" + code + ";domain=" + location.hostname + ";" + exp;
    }
    location.reload();
  }

  // The language control: a button with a globe, and a small list under it.
  var cur = current();
  var curName = (LANGS.filter(function (l) { return l[0] === cur; })[0] || LANGS[0])[1];
  var wrap = document.createElement("div");
  wrap.className = "nx-lang__dd notranslate";
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "nx-lang__btn";
  btn.setAttribute("aria-haspopup", "listbox");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-label", "Language: " + curName);
  btn.title = "Language: " + curName;
  btn.innerHTML = GLOBE_ICON + '<span class="nx-lang__code">' + cur + "</span>" + CHEVRON;
  var menu = document.createElement("ul");
  menu.className = "nx-lang__menu";
  menu.setAttribute("role", "listbox");
  LANGS.forEach(function (l) {
    var li = document.createElement("li");
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", l[0] === cur ? "true" : "false");
    li.tabIndex = 0;
    li.setAttribute("data-code", l[0]);
    li.textContent = l[1];
    var pick = function () { setLang(l[0]); };
    li.addEventListener("click", pick);
    li.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
    menu.appendChild(li);
  });
  function close() { wrap.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); }
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    var open = wrap.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  wrap.appendChild(btn);
  wrap.appendChild(menu);
  holder.appendChild(wrap);

  // Layout inside the header.
  //
  // Phone (hamburger visible): the two controls sit at the right of the
  // header row, just before the hamburger.
  //
  // Laptop (hamburger hidden): menu links, then a hairline, then Login and
  // the language, and the site's own call-to-action button stays last at
  // the far right. The 38 demos build their headers three ways:
  //   1. brand, nav, a .header__cta / .header__actions box (or one plain
  //      a.btn), burger -> the controls go just before that;
  //   2. brand, burger, nav that holds the links AND the .btn
  //      -> the controls go inside the nav, before the first .btn;
  //   3. brand, nav of links only, burger
  //      -> the controls go after the nav.
  // The controls take the menu links' font so they read as part of it.
  var burger = document.querySelector(".burger");
  var row = holder.parentElement;
  var nav = row ? row.querySelector("nav") : null;
  var marker = document.createComment("nx-lang");
  if (row) row.insertBefore(marker, holder);
  // The call-to-action beside the nav: a box of buttons, or one plain
  // button link, placed directly in the header row.
  var actions = null;
  if (row) {
    for (var r = 0; r < row.children.length; r++) {
      var ch = row.children[r];
      if (/(^|\s)(header__cta|header__actions)(\s|$)/.test(ch.className) || (ch.tagName === "A" && /(^|\s)btn(\s|$)/.test(ch.className))) { actions = ch; break; }
    }
  }
  // Or the call-to-action inside the nav itself: the first a.btn that is a
  // direct child of the nav (the phone-only .nav__mob block is ignored).
  var navCta = null;
  if (nav) {
    for (var i = 0; i < nav.children.length; i++) {
      var c = nav.children[i];
      if (c.tagName === "A" && /(^|\s)btn(\s|$)/.test(c.className)) { navCta = c; break; }
    }
  }
  var navLink = nav ? nav.querySelector("a:not(.btn)") : null;
  function place(parent, before) {
    if (holder.parentNode !== parent || holder.nextSibling !== before) parent.insertBefore(holder, before);
  }
  function layout() {
    if (!row) return;
    var mobile = burger && getComputedStyle(burger).display !== "none";
    row.style.justifyContent = "flex-start";
    if (mobile) {
      place(marker.parentNode, marker.nextSibling);
      holder.style.marginLeft = "auto";
      holder.style.marginRight = "";
      holder.style.fontSize = "";
      holder.style.fontWeight = "";
      holder.style.fontFamily = "";
      if (nav) nav.style.marginLeft = "";
      if (burger) burger.style.marginLeft = ".35rem";
      return;
    }
    if (burger) burger.style.marginLeft = "";
    if (actions) {
      place(actions.parentNode, actions);
      holder.style.marginLeft = ".5rem";
      holder.style.marginRight = ".35rem";
      if (nav) nav.style.marginLeft = "auto";
    } else if (navCta) {
      place(nav, navCta);
      holder.style.marginLeft = ".6rem";
      holder.style.marginRight = ".35rem";
      nav.style.marginLeft = "auto";
    } else {
      place(marker.parentNode, marker.nextSibling);
      holder.style.marginLeft = ".6rem";
      holder.style.marginRight = "";
      if (nav) nav.style.marginLeft = "auto";
    }
    if (navLink) {
      var cs = getComputedStyle(navLink);
      holder.style.fontSize = cs.fontSize;
      holder.style.fontWeight = cs.fontWeight;
      holder.style.fontFamily = cs.fontFamily;
    }
  }
  layout();
  window.addEventListener("resize", layout);

  if (cur === "en") return;
  var gt = document.createElement("div");
  gt.id = "nx-gt";
  document.body.appendChild(gt);
  window.nxGoogleTranslateInit = function () {
    /* global google */
    new google.translate.TranslateElement({ pageLanguage: "en", includedLanguages: "bn,hi,en", autoDisplay: false }, "nx-gt");
  };
  var s = document.createElement("script");
  s.src = "https://translate.google.com/translate_a/element.js?cb=nxGoogleTranslateInit";
  s.defer = true;
  document.body.appendChild(s);
})();
