/* Kolom Khata Stationers, sample store: the design studio.
 * Loaded only when /design/<slug> opens (and, once the visitor scrolls near
 * it, for the "Your brand on everything" previews on the home page).
 *
 * Everything happens on this device: logos and photos are read with
 * FileReader, resized on a <canvas> and kept in this browser's storage.
 * Nothing is uploaded and nothing is sent anywhere.
 */
(function () {
  "use strict";
  var A = window.KKApp, S = window.NxShop;
  if (!A || !S) return;
  var D = A.D, P = A.P, esc = A.esc, money = A.money, M = A.M;

  var FONTS = [["Hanken Grotesk", "Clean"], ["Zilla Slab", "Slab"], ["Oswald", "Tall"], ["Playfair Display", "Classic"], ["Pacifico", "Script"], ["Noto Sans Bengali", "বাংলা"]];
  var SWATCH = ["#14213D", "#1D3F8F", "#C62A1F", "#1E6B3A", "#F2B705", "#7A3E9D", "#FFFFFF", "#000000"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var SHAPES = [["ring", "Round frame"], ["ribbon", "Ribbon banner"], ["star", "Star"], ["laurel", "Laurel"], ["frame", "Box frame"], ["crest", "Shield"]];
  /** Photos of other colours have their own print area. [slug][variant] -> {side: [image, area]} */
  var ALT = {
    "cotton-cap-printed": { red: { front: ["un-cap-d", { x: .25, y: .28, w: .3, h: .14, r: -4 }] }, navy: { front: ["un-cap-d", { x: .25, y: .28, w: .3, h: .14, r: -4 }] } },
    "school-backpack": { red: { front: ["bg-bag-d", { x: .4, y: .3, w: .34, h: .26 }], pocket: ["bg-bag-d", { x: .28, y: .74, w: .5, h: .14 }] }, black: { front: ["bg-bag-d", { x: .4, y: .3, w: .34, h: .26 }], pocket: ["bg-bag-d", { x: .28, y: .74, w: .5, h: .14 }] } },
    "steel-water-bottle-750": { red: { front: ["bg-bottle-d", { x: .225, y: .6, w: .12, h: .2 }] }, teal: { front: ["bg-bottle-d", { x: .6, y: .6, w: .13, h: .2 }] } },
    "sports-medal-50mm": { silver: { face: ["pr-medals-d", { x: .33, y: .63, w: .15, h: .15, shape: "circle", plate: "plate" }] } },
    "diary-2027-a5": { blue: { cover: ["cl-diary-d", { x: .25, y: .3, w: .34, h: .36, r: -14 }] } }
  };

  // Made-up sample artwork for templates. Never a real brand.
  var CREST = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 230"><path d="M100 6l88 28v74c0 58-38 100-88 116C50 208 12 166 12 108V34z" fill="#1D3F8F" stroke="#F2B705" stroke-width="8"/><path d="M40 120a60 60 0 0 1 120 0z" fill="#F2B705"/><g stroke="#F2B705" stroke-width="6" stroke-linecap="round"><path d="M100 46v18M58 62l10 13M142 62l-10 13M34 96l16 6M166 96l-16 6"/></g><path d="M48 132h104v52c-18-8-36-8-52 2-16-10-34-10-52-2z" fill="#fff"/><path d="M100 136v48" stroke="#1D3F8F" stroke-width="4"/><text x="100" y="214" font-family="Georgia,serif" font-size="26" font-weight="700" fill="#fff" text-anchor="middle">SPS</text></svg>');
  var LOGO = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="#C62A1F"/><circle cx="100" cy="100" r="78" fill="none" stroke="#fff" stroke-width="5"/><path d="M58 64v72M58 102l38-38M70 92l30 44" stroke="#fff" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M112 64h44M134 64v72" stroke="#fff" stroke-width="13" stroke-linecap="round" fill="none"/></svg>');
  var SAMPLE_IMGS = { crest: CREST, logo: LOGO };

  // ---------- small helpers ----------
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function uid() { return "x" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function lum(hex) { var h = hex.replace("#", ""); if (h.length === 3) h = h.replace(/(.)/g, "$1$1"); var r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255; return .2126 * r + .7152 * g + .0722 * b; }
  var imgCache = {};
  /** Load an image once; calls onload listeners so canvases can redraw. */
  function getImg(src, cb) {
    var c = imgCache[src];
    if (c) { if (c.done) return c.img; if (cb) c.cbs.push(cb); return null; }
    var im = new Image(); c = imgCache[src] = { img: im, done: false, cbs: cb ? [cb] : [] };
    im.decoding = "async";
    im.onload = function () { c.done = true; var l = c.cbs; c.cbs = []; l.forEach(function (f) { f(); }); };
    im.onerror = function () { c.done = true; c.bad = true; };
    im.src = src;
    return null;
  }
  var mctx = document.createElement("canvas").getContext("2d");
  function fontStr(l, px) { return (l.italic ? "italic " : "") + (l.bold ? "700 " : "400 ") + Math.max(1, px) + 'px "' + l.font + '", "Hanken Grotesk", sans-serif'; }

  // ---------- geometry ----------
  function sidesOf(p) {
    if (p.pr.months) return MONTHS.map(function (m, i) { var s = p.pr.sides[0]; return { id: "m" + i, name: m, img: s.img, area: s.area, month: i }; });
    return p.pr.sides;
  }
  function sideFor(p, v, sd) {
    var alt = ALT[p.slug] && ALT[p.slug][v.id] && ALT[p.slug][v.id][sd.id];
    if (!alt) return { img: sd.img, area: sd.area, tint: v.tint };
    var a = {}; for (var k in sd.area) a[k] = sd.area[k]; for (var k2 in alt[1]) a[k2] = alt[1][k2];
    return { img: alt[0], area: a, tint: v.tint && alt[0] === sd.img ? v.tint : (v.tint && v.id === "navy" || v.id === "black" ? v.tint : "") };
  }
  function geom(area, W) { var aw = area.w * W, ah = area.h * W; return { cx: (area.x + area.w / 2) * W, cy: (area.y + area.h / 2) * W, aw: aw, ah: ah, rot: (area.r || 0) * Math.PI / 180, shape: area.shape || "rect" }; }
  /** Size of a layer in area pixels. */
  function measure(l, aw, ah, images) {
    if (l.type === "text") {
      var px = l.size * ah; mctx.font = fontStr(l, px);
      var lines = String(l.text || " ").split("\n"), w = 0;
      lines.forEach(function (t) { w = Math.max(w, mctx.measureText(t).width); });
      if (l.curve && lines.length === 1) { var R = px * 3.2, ang = w / R; return { w: Math.max(px, 2 * R * Math.sin(Math.min(Math.PI, ang) / 2) + px * .6), h: R * (1 - Math.cos(Math.min(Math.PI, ang) / 2)) + px * 1.2 }; }
      return { w: Math.max(px * .5, w), h: lines.length * px * 1.15 };
    }
    var ratio = l.type === "image" ? (l.ar || 1) : ({ ribbon: .32, laurel: .8, frame: .64, crest: 1.15 }[l.shape] || 1);
    return { w: l.w * aw, h: l.w * aw * ratio };
  }

  // ---------- drawing layers ----------
  function drawShape(ctx, l, w, h, col) {
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1.5, w * .045); ctx.lineJoin = "round";
    var lw = ctx.lineWidth;
    if (l.shape === "ring") { ctx.beginPath(); ctx.arc(0, 0, w / 2 - lw / 2, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = lw * .45; ctx.beginPath(); ctx.arc(0, 0, w / 2 - lw * 1.9, 0, Math.PI * 2); ctx.stroke(); }
    else if (l.shape === "frame") { ctx.strokeRect(-w / 2 + lw / 2, -h / 2 + lw / 2, w - lw, h - lw); ctx.lineWidth = lw * .45; ctx.strokeRect(-w / 2 + lw * 1.9, -h / 2 + lw * 1.9, w - lw * 3.8, h - lw * 3.8); }
    else if (l.shape === "star") { ctx.beginPath(); for (var i = 0; i < 10; i++) { var r = i % 2 ? w * .2 : w / 2, a = -Math.PI / 2 + i * Math.PI / 5; ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * r, Math.sin(a) * r + h * .04); } ctx.closePath(); ctx.fill(); }
    else if (l.shape === "ribbon") { var n = h * .5; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w / 2 - n, 0); ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.lineTo(-w / 2 + n, 0); ctx.closePath(); ctx.fill(); }
    else if (l.shape === "crest") { ctx.beginPath(); ctx.moveTo(0, -h / 2 + lw); ctx.lineTo(w / 2 - lw, -h / 2 + h * .14); ctx.lineTo(w / 2 - lw, 0); ctx.quadraticCurveTo(w / 2 - lw, h * .32, 0, h / 2 - lw); ctx.quadraticCurveTo(-w / 2 + lw, h * .32, -w / 2 + lw, 0); ctx.lineTo(-w / 2 + lw, -h / 2 + h * .14); ctx.closePath(); ctx.stroke(); }
    else if (l.shape === "laurel") {
      for (var s = -1; s <= 1; s += 2) for (var k = 0; k < 7; k++) {
        var t = -Math.PI * .95 + k * .3, rx = w * .42, ry = h * .45, x = s * Math.cos(t + Math.PI / 2) * rx, y = -Math.sin(t + Math.PI / 2) * ry * -1;
        ctx.save(); ctx.translate(x, y + h * .05); ctx.rotate(s * (t + Math.PI)); ctx.beginPath(); ctx.ellipse(0, 0, w * .045, w * .1, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }
    ctx.restore();
  }
  var engraveCache = {};
  /** Engraving reads dark parts of a logo as cut: make an alpha-only version once. */
  function engraveVersion(im, key) {
    if (engraveCache[key]) return engraveCache[key];
    var c = document.createElement("canvas"), w = c.width = Math.min(600, im.naturalWidth || 300), h = c.height = Math.round(w * (im.naturalHeight || 300) / (im.naturalWidth || 300)), x = c.getContext("2d");
    x.drawImage(im, 0, 0, w, h);
    var d = x.getImageData(0, 0, w, h), a = d.data;
    for (var i = 0; i < a.length; i += 4) { var L = (.2126 * a[i] + .7152 * a[i + 1] + .0722 * a[i + 2]) / 255; a[i] = a[i + 1] = a[i + 2] = 0; a[i + 3] = a[i + 3] * clamp(1.15 - L, 0, 1); }
    x.putImageData(d, 0, 0);
    return (engraveCache[key] = c);
  }
  function drawLayer(ctx, l, aw, ah, images, mono, nameText, redraw) {
    if (l.hidden) return;
    var m = measure(l, aw, ah, images), col = mono ? "#000" : l.color;
    ctx.save(); ctx.translate(l.x * aw, l.y * ah); ctx.rotate((l.rot || 0) * Math.PI / 180);
    if (l.type === "text") {
      var px = l.size * ah, txt = String(l.text || "").replace(/\{name\}/gi, nameText || "Student Name");
      ctx.font = fontStr(l, px); ctx.fillStyle = col; ctx.textBaseline = "middle";
      var lines = txt.split("\n");
      if (l.curve && lines.length === 1) {
        var R = px * 3.2, w = ctx.measureText(txt).width, ang = Math.min(Math.PI, w / R), a = -ang / 2;
        ctx.textAlign = "center"; ctx.translate(0, -m.h / 2 + px * .6);
        for (var i = 0; i < txt.length; i++) { var cw = ctx.measureText(txt[i]).width, step = cw / w * ang; a += step / 2; ctx.save(); ctx.translate(0, R); ctx.rotate(a); ctx.fillText(txt[i], 0, -R); ctx.restore(); a += step / 2; }
      } else {
        ctx.textAlign = l.align || "center";
        var x0 = l.align === "left" ? -m.w / 2 : l.align === "right" ? m.w / 2 : 0;
        lines.forEach(function (t, k) { ctx.fillText(t, x0, -m.h / 2 + px * .575 + k * px * 1.15); });
      }
    } else if (l.type === "image") {
      var src = images[l.src] || SAMPLE_IMGS[l.src];
      var im = src && getImg(src, redraw);
      if (im) ctx.drawImage(mono ? engraveVersion(im, l.src + (l.nobg ? "nb" : "")) : im, -m.w / 2, -m.h / 2, m.w, m.h);
    } else drawShape(ctx, l, m.w, m.h, col);
    ctx.restore();
  }

  /**
   * Draw one side of a product with its design onto a canvas.
   * o: { p, v, sd, layers, images, preview, sel, guides, nameText, size, redraw }
   * Returns the print area geometry for hit testing.
   */
  function drawSide(cv, o) {
    var W = cv.width, ctx = cv.getContext("2d"), sf = sideFor(o.p, o.v, o.sd), g = geom(sf.area, W);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
    var base = getImg(A.IMG + sf.img + "-" + (o.size || 800) + ".webp", o.redraw);
    ctx.fillStyle = "#EEE9DD"; ctx.fillRect(0, 0, W, W);
    g.L = null;
    if (!base) return g;
    ctx.drawImage(base, 0, 0, W, W);
    // Product colour: tint the product body.
    if (sf.tint) recolour(ctx, W, o.p.pr.tintArea || [0, 0, 1, 1], sf.area, sf.tint);
    var area = sf.area;
    function clipShape(c, pad) { c.beginPath(); if (g.shape === "circle") c.ellipse(0, 0, g.aw / 2 - (pad || 0), g.ah / 2 - (pad || 0), 0, 0, Math.PI * 2); else if (g.shape === "label") roundRect(c, -g.aw / 2 + (pad || 0), -g.ah / 2 + (pad || 0), g.aw - 2 * (pad || 0), g.ah - 2 * (pad || 0), Math.min(g.aw, g.ah) * .12); else c.rect(-g.aw / 2 + (pad || 0), -g.ah / 2 + (pad || 0), g.aw - 2 * (pad || 0), g.ah - 2 * (pad || 0)); }
    // Plate or label under the design.
    if (area.plate) {
      ctx.save(); ctx.translate(g.cx, g.cy); ctx.rotate(g.rot);
      if (g.shape === "label") { ctx.shadowColor = "rgba(0,0,0,.28)"; ctx.shadowBlur = W * .012; ctx.shadowOffsetY = W * .004; }
      var pc = area.plate === "plate" ? (o.v.plate || "#D8B65A") : area.plate;
      if (area.plate === "plate") { var gr = ctx.createRadialGradient(-g.aw * .15, -g.ah * .2, g.aw * .05, 0, 0, g.aw * .6); gr.addColorStop(0, shade(pc, .35)); gr.addColorStop(1, shade(pc, -.2)); ctx.fillStyle = gr; } else ctx.fillStyle = pc;
      clipShape(ctx); ctx.fill(); ctx.restore();
    }
    // Is the surface light or dark? Decides how ink and engraving look.
    var L = .6;
    try { var sx = Math.round(g.cx - g.aw * .3), sy = Math.round(g.cy - g.ah * .3), sw = Math.max(2, Math.round(g.aw * .6)), sh = Math.max(2, Math.round(g.ah * .6)); var dd = ctx.getImageData(clamp(sx, 0, W - 2), clamp(sy, 0, W - 2), Math.min(sw, W - sx), Math.min(sh, W - sy)).data, t = 0, n = 0; for (var i = 0; i < dd.length; i += 16) { t += (.2126 * dd[i] + .7152 * dd[i + 1] + .0722 * dd[i + 2]) / 255; n++; } L = n ? t / n : .6; } catch (e) {}
    var engrave = o.p.pr.blend === "engrave"; g.L = L;
    // The design itself, drawn flat on its own canvas first.
    var dc = document.createElement("canvas"); dc.width = Math.max(2, Math.round(g.aw)); dc.height = Math.max(2, Math.round(g.ah));
    var dx = dc.getContext("2d");
    if (o.sd.month != null && o.months !== false) {
      dx.fillStyle = "rgba(255,255,255,.88)"; dx.fillRect(0, dc.height * .82, dc.width, dc.height * .18);
      dx.fillStyle = "#14213D"; dx.font = "700 " + Math.round(dc.height * .11) + 'px "Zilla Slab", Georgia, serif'; dx.textAlign = "left"; dx.textBaseline = "middle";
      dx.fillText(MONTHS[o.sd.month].toUpperCase() + " 2027", dc.width * .04, dc.height * .91);
    }
    (o.layers || []).forEach(function (l) { drawLayer(dx, l, dc.width, dc.height, o.images || {}, engrave, o.nameText, o.redraw); });
    ctx.save(); ctx.translate(g.cx, g.cy); ctx.rotate(g.rot); clipShape(ctx);  ctx.clip();
    if (engrave) {
      var light = L < .45, col = light ? "#ECE6D6" : "rgba(58,42,16,.86)";
      var mk = document.createElement("canvas"); mk.width = dc.width; mk.height = dc.height; var mx = mk.getContext("2d");
      mx.drawImage(dc, 0, 0); mx.globalCompositeOperation = "source-in"; mx.fillStyle = col; mx.fillRect(0, 0, mk.width, mk.height);
      ctx.globalAlpha = .55; ctx.globalCompositeOperation = "source-over";
      var sh2 = document.createElement("canvas"); sh2.width = dc.width; sh2.height = dc.height; var s2 = sh2.getContext("2d"); s2.drawImage(dc, 0, 0); s2.globalCompositeOperation = "source-in"; s2.fillStyle = light ? "rgba(0,0,0,.8)" : "rgba(255,250,235,.9)"; s2.fillRect(0, 0, sh2.width, sh2.height);
      var off = Math.max(1, W / 700);
      ctx.drawImage(sh2, -g.aw / 2 + off, -g.ah / 2 + off, g.aw, g.ah); ctx.globalAlpha = 1;
      ctx.drawImage(mk, -g.aw / 2, -g.ah / 2, g.aw, g.ah);
    } else if (L > .5 || area.plate) { ctx.globalCompositeOperation = "multiply"; ctx.drawImage(dc, -g.aw / 2, -g.ah / 2, g.aw, g.ah); }
    else { ctx.restore(); shadeDesign(ctx, dc, g, W); ctx.save(); ctx.translate(g.cx, g.cy); ctx.rotate(g.rot); clipShape(ctx); ctx.clip(); ctx.globalAlpha = .96; ctx.drawImage(dc, -g.aw / 2, -g.ah / 2, g.aw, g.ah); }
    ctx.restore();
    // Guides: bleed, safe area, centre lines and the selected layer.
    if (!o.preview) {
      ctx.save(); ctx.translate(g.cx, g.cy); ctx.rotate(g.rot); var lw = Math.max(1, W / 500);
      ctx.lineWidth = lw; ctx.setLineDash([lw * 5, lw * 4]);
      ctx.strokeStyle = "rgba(198,42,31,.95)"; clipShape(ctx); ctx.stroke();
      ctx.strokeStyle = "rgba(29,63,143,.9)"; clipShape(ctx, Math.min(g.aw, g.ah) * .07); ctx.stroke();
      ctx.setLineDash([]);
      if (o.guides) { ctx.strokeStyle = "#E91E63"; ctx.lineWidth = lw * 1.4; if (o.guides.x) { ctx.beginPath(); ctx.moveTo(0, -g.ah / 2); ctx.lineTo(0, g.ah / 2); ctx.stroke(); } if (o.guides.y) { ctx.beginPath(); ctx.moveTo(-g.aw / 2, 0); ctx.lineTo(g.aw / 2, 0); ctx.stroke(); } }
      var sl = o.sel && (o.layers || []).filter(function (l) { return l.id === o.sel; })[0];
      if (sl && !sl.hidden) {
        var m = measure(sl, g.aw, g.ah, o.images || {}), hs = Math.max(7, W / 55);
        ctx.translate(-g.aw / 2 + sl.x * g.aw, -g.ah / 2 + sl.y * g.ah); ctx.rotate((sl.rot || 0) * Math.PI / 180);
        ctx.strokeStyle = "#1D3F8F"; ctx.lineWidth = lw * 1.5; ctx.strokeRect(-m.w / 2 - lw * 3, -m.h / 2 - lw * 3, m.w + lw * 6, m.h + lw * 6);
        if (!sl.locked) {
          ctx.fillStyle = "#fff"; ctx.strokeStyle = "#1D3F8F";
          ctx.beginPath(); ctx.rect(m.w / 2 + lw * 3 - hs / 2, m.h / 2 + lw * 3 - hs / 2, hs, hs); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, -m.h / 2 - lw * 3); ctx.lineTo(0, -m.h / 2 - hs * 2.2); ctx.stroke();
          ctx.beginPath(); ctx.arc(0, -m.h / 2 - hs * 2.2, hs / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
      }
      ctx.restore();
    }
    return g;
  }
  function hsl(r, g, b) { r /= 255; g /= 255; b /= 255; var mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, l = (mx + mn) / 2, d = mx - mn, sat = d ? d / (1 - Math.abs(2 * l - 1) || 1) : 0; if (d) { h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return [h, sat, l]; }
  /** Recolour only the product's own pixels: those close to the hue under the print area. */
  function recolour(ctx, W, ta, area, tint) {
    var x0 = Math.round(ta[0] * W), y0 = Math.round(ta[1] * W), w = Math.round(ta[2] * W), h = Math.round(ta[3] * W);
    var img = ctx.getImageData(x0, y0, w, h), a = img.data;
    var cx = Math.round((area.x + area.w / 2) * W) - x0, cy = Math.round((area.y + area.h / 2) * W) - y0, ref = [0, 0, 0], n = 0;
    for (var yy = -6; yy <= 6; yy += 3) for (var xx = -6; xx <= 6; xx += 3) { var k = ((cy + yy) * w + (cx + xx)) * 4; if (k >= 0 && k < a.length) { ref[0] += a[k]; ref[1] += a[k + 1]; ref[2] += a[k + 2]; n++; } }
    var rh = hsl(ref[0] / n, ref[1] / n, ref[2] / n), tr = parseInt(tint.slice(1, 3), 16), tg = parseInt(tint.slice(3, 5), 16), tb = parseInt(tint.slice(5, 7), 16), tl = Math.max(.08, hsl(tr, tg, tb)[2]);
    for (var i = 0; i < a.length; i += 4) {
      var c = hsl(a[i], a[i + 1], a[i + 2]), dh = Math.abs(c[0] - rh[0]); dh = Math.min(dh, 360 - dh);
      if (c[1] < .18 || dh > 38) continue;
      var f = c[2] / Math.max(.05, rh[2]), k2 = tl * f / tl;
      a[i] = clamp(tr * k2, 0, 255); a[i + 1] = clamp(tg * k2, 0, 255); a[i + 2] = clamp(tb * k2, 0, 255);
    }
    ctx.putImageData(img, x0, y0);
  }
  /** Let the photo's folds and light show through ink on a dark surface. */
  function shadeDesign(ctx, dc, g, W) {
    try {
      var r = Math.ceil(Math.hypot(g.aw, g.ah) / 2), bx = clamp(Math.round(g.cx - r), 0, W - 1), by = clamp(Math.round(g.cy - r), 0, W - 1), bw = Math.min(W - bx, 2 * r), bh = Math.min(W - by, 2 * r);
      var base = ctx.getImageData(bx, by, bw, bh).data, mean = 0, cnt = 0;
      for (var i = 0; i < base.length; i += 16) { mean += .2126 * base[i] + .7152 * base[i + 1] + .0722 * base[i + 2]; cnt++; } mean = Math.max(8, mean / cnt);
      var dx = dc.getContext("2d"), d = dx.getImageData(0, 0, dc.width, dc.height), p = d.data, cs = Math.cos(g.rot), sn = Math.sin(g.rot), sx = g.aw / dc.width, sy = g.ah / dc.height;
      for (var y = 0; y < dc.height; y++) for (var x = 0; x < dc.width; x++) {
        var k = (y * dc.width + x) * 4; if (!p[k + 3]) continue;
        var lx = x * sx - g.aw / 2, ly = y * sy - g.ah / 2, X = Math.round(g.cx + cs * lx - sn * ly) - bx, Y = Math.round(g.cy + sn * lx + cs * ly) - by;
        if (X < 0 || Y < 0 || X >= bw || Y >= bh) continue;
        var q = (Y * bw + X) * 4, f = clamp((.2126 * base[q] + .7152 * base[q + 1] + .0722 * base[q + 2]) / mean, .55, 1.25);
        p[k] = clamp(p[k] * f, 0, 255); p[k + 1] = clamp(p[k + 1] * f, 0, 255); p[k + 2] = clamp(p[k + 2] * f, 0, 255);
      }
      dx.putImageData(d, 0, 0);
    } catch (e) {}
  }
  function roundRect(c, x, y, w, h, r) { c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function shade(hex, k) { var h = hex.replace("#", ""), out = "#"; for (var i = 0; i < 3; i++) { var v = parseInt(h.substr(i * 2, 2), 16); v = k > 0 ? v + (255 - v) * k : v * (1 + k); out += ("0" + Math.round(clamp(v, 0, 255)).toString(16)).slice(-2); } return out; }

  // ---------- templates ----------
  /** Fit a text layer so it stays inside the safe area. */
  function fit(l, aw, ah) { var m = measure(l, aw, ah, {}); var max = aw * .86; if (m.w > max) l.size = l.size * max / m.w; return l; }
  function T(text, x, y, size, o) { var l = { id: uid(), type: "text", text: text, x: x, y: y, size: size, font: "Hanken Grotesk", bold: true, italic: false, align: "center", color: "#14213D", rot: 0 }; for (var k in o || {}) l[k] = o[k]; return l; }
  function IMGL(src, x, y, w, ar) { return { id: uid(), type: "image", src: src, x: x, y: y, w: w, ar: ar || 1, rot: 0 }; }
  function SH(shape, x, y, w, color) { return { id: uid(), type: "shape", shape: shape, x: x, y: y, w: w, color: color || "#1D3F8F", rot: 0 }; }
  var TEMPLATES = [
    ["school", "School name + crest"], ["company", "Company logo + tagline"], ["sports", "Sports day medal"], ["prize", "Annual prize shield"], ["names", "Name list (certificates, ID cards)"], ["simple", "Name only"]
  ];
  function template(kind, area) {
    var aw = area.w * 800, ah = area.h * 800, a = aw / ah, round = area.shape === "circle", out;
    if (aw < 130 && kind !== "names" && kind !== "calendar") { out = [IMGL(kind === "company" ? "logo" : "crest", .5, .5, Math.min(.8, ah * .85 / (aw * 1.15)), kind === "company" ? 1 : 1.15)]; return out; }
    var wide = a > 2.4, tall = a < 1.6;
    if (kind === "company") {
      out = wide ? [IMGL("logo", .12, .5, Math.min(.2, .8 / a)), T("Kaveri Traders", .58, .38, .4, { color: "#C62A1F", font: "Zilla Slab" }), T("Quality since 1988", .58, .76, .22, { bold: false })]
        : [IMGL("logo", .5, .34, round ? .38 : .3), T("Kaveri Traders", .5, .72, .14, { color: "#C62A1F", font: "Zilla Slab" }), T("Quality since 1988", .5, .86, .08, { bold: false })];
    } else if (kind === "sports") {
      out = round ? [SH("ring", .5, .5, .96, "#14213D"), T("ANNUAL SPORTS", .5, .32, .11, { font: "Oswald" }), T("2027", .5, .52, .2, { font: "Oswald" }), T("WINNER", .5, .72, .1, { font: "Oswald" })]
        : wide ? [T("ANNUAL SPORTS 2027", .5, .42, .42, { font: "Oswald" }), T("Sunrise Public School", .5, .8, .2, { bold: false })]
          : [SH("star", .5, .24, .18, "#C62A1F"), T("ANNUAL SPORTS 2027", .5, .55, .16, { font: "Oswald" }), T("Sunrise Public School", .5, .78, .1, { bold: false })];
    } else if (kind === "prize") {
      out = wide && a > 3.5 ? [T("Annual Prize Day 2027", .5, .5, .55, { font: "Playfair Display" })]
        : [SH("laurel", .5, .5, round ? .9 : Math.min(.5, .9 / a * 1.1), "#7A5A1A"), T("Annual Prize Day 2027", .5, .3, .12, { font: "Playfair Display" }), T("Best Student", .5, .52, .18, { font: "Playfair Display", italic: true }), T("Sunrise Public School", .5, .74, .09, { bold: false })];
    } else if (kind === "names") {
      out = [T("Certificate of Merit", .5, .2, .16, { font: "Playfair Display", color: "#7A5A1A" }), T("{name}", .5, .52, .26, { font: "Pacifico", bold: false, color: "#1D3F8F" }), T("Sunrise Public School, Est. 1995", .5, .84, .1, { bold: false })];
      if (tall) out = [IMGL("crest", .5, .2, .28, 1.15), T("{name}", .5, .58, .11), T("Class 5, Section A", .5, .72, .07, { bold: false }), T("Sunrise Public School", .5, .86, .08, { color: "#1D3F8F" })];
    } else if (kind === "simple") {
      out = [T("Sunrise Public School", .5, .5, wide ? .5 : .14)];
    } else if (kind === "calendar") {
      out = [T("Sunrise Public School", .5, .1, .1, { color: "#FFFFFF", font: "Zilla Slab" })];
    } else {
      out = wide ? [IMGL("crest", .1, .5, Math.min(.16, .75 / a), 1.15), T("Sunrise Public School", .57, .4, .42, { color: "#1D3F8F" }), T("Est. 1995", .57, .78, .22, { bold: false })]
        : [IMGL("crest", .5, round ? .36 : .33, round ? .34 : .26, 1.15), T("Sunrise Public School", .5, round ? .7 : .72, .12, { color: "#1D3F8F" }), T("Est. 1995", .5, round ? .82 : .86, .08, { bold: false })];
    }
    out.forEach(function (l) { if (l.type === "text") fit(l, aw, ah); });
    // An image in a very wide strip must stay inside it.
    out.forEach(function (l) { if (l.type !== "text") { var h = l.w * aw * (l.ar || 1); if (h > ah * .9) l.w = ah * .9 / (aw * (l.ar || 1)); } });
    return out;
  }
  function kindDefault(p) { if (p.pr.names) return "names"; if (p.pr.months) return "calendar"; return { label: "school", school: "school", company: "company", sports: "sports", prize: "prize" }[p.pr.kind] || "school"; }

  // ---------- home page samples ----------
  function sample(el, slug, kind) {
    var p = P[slug]; if (!p || el.querySelector("canvas")) return;
    var v = A.defV(p), sd = sidesOf(p)[0], cv = document.createElement("canvas"), size = Math.min(800, Math.round((el.clientWidth || 300) * (window.devicePixelRatio || 1)));
    cv.width = cv.height = size; cv.setAttribute("aria-hidden", "true"); el.appendChild(cv);
    var layers = template(kind, sideFor(p, v, sd).area);
    function draw() {
      var o = { p: p, v: v, sd: sd, layers: layers, images: {}, preview: true, size: size > 420 ? 800 : 400, redraw: draw };
      drawSide(cv, o);
      var base = imgCache[A.IMG + sideFor(p, v, sd).img + "-" + o.size + ".webp"];
      var ready = base && base.done && layers.every(function (l) { return l.type !== "image" || (imgCache[SAMPLE_IMGS[l.src]] || {}).done; });
      if (ready) { cv.classList.add("on"); var tg = el.querySelector(".mock__tag"); if (tg) tg.textContent = "With your name"; }
    }
    loadFonts(draw); draw();
  }
  var fontsAsked = false;
  function loadFonts(cb) {
    if (!fontsAsked) {
      fontsAsked = true;
      var l = document.createElement("link"); l.rel = "stylesheet"; l.id = "kk-studio-fonts";
      l.href = "https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Pacifico&family=Noto+Sans+Bengali:wght@400;700&display=swap";
      document.head.appendChild(l);
    }
    if (document.fonts && document.fonts.load) {
      Promise.all(FONTS.map(function (f) { return document.fonts.load('700 20px "' + f[0] + '"').catch(function () {}); })).then(function () { cb && cb(); });
      if (cb && fontCbs.indexOf(cb) < 0) fontCbs.push(cb);
      if (!fontListen && document.fonts.addEventListener) {
        fontListen = true;
        // One listener for the whole page, redrawing at most once per frame.
        document.fonts.addEventListener("loadingdone", function () {
          if (fontRaf) return;
          fontRaf = requestAnimationFrame(function () { fontRaf = 0; fontCbs.slice().forEach(function (f) { try { f(); } catch (e) {} }); });
        });
      }
    }
  }
  var fontCbs = [], fontListen = false, fontRaf = 0;

  // ---------- studio CSS ----------
  var CSS = ".studio{background:var(--paper);min-height:100vh}" +
    ".st__top{position:sticky;top:0;z-index:60;display:flex;align-items:center;gap:.4rem;padding:.4rem var(--gutter);background:var(--card);border-bottom:1px solid var(--line)}" +
    ".st__top h1{font-size:1.05rem;line-height:1.2;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".st__top .icon-btn:disabled{opacity:.35}" +
    ".st__top .back{display:inline-flex;align-items:center;gap:.25rem;min-height:44px;padding:0 .4rem;font-weight:700;color:var(--blue);text-decoration:none}" +
    ".st__top .back svg{width:18px;height:18px}" +
    ".st__pv[aria-pressed=true]{background:var(--ink);color:#fff;border-color:var(--ink)}" +
    ".st__main{display:grid;grid-template-columns:minmax(0,1fr);gap:1rem;padding:.8rem var(--gutter) 6.5rem}" +
    "@media (min-width:1000px){.st__main{grid-template-columns:290px minmax(0,1fr) 330px;align-items:start;padding-bottom:2rem}.st__tools{order:-1}.st__tools,.st__order{position:sticky;top:66px}}" +
    "@media (min-width:1300px){.st__main{grid-template-columns:320px minmax(0,1fr) 360px}}" +
    ".st__main>*{min-width:0}.st__stage{min-width:0}.studio{overflow-x:hidden}" +
    ".st__sides{display:flex;gap:.35rem;overflow-x:auto;margin-bottom:.5rem;scrollbar-width:thin}" +
    ".st__sides button{flex:none;min-height:40px;padding:.3rem .75rem;border:1.5px solid var(--line-strong);border-radius:999px;background:var(--card);font-weight:700;font-size:.84rem}" +
    ".st__sides button[aria-pressed=true]{background:var(--blue);border-color:var(--blue);color:#fff}" +
    "@media (pointer:coarse){.st__sides button{min-height:44px}}" +
    ".st__scroll{overflow:auto;border-radius:var(--r);border:1px solid var(--line);background:#E9E4D8;max-height:80vh}" +
    ".st__canvaswrap{position:relative;margin:0 auto}" +
    ".st__canvaswrap canvas{display:block;width:100%;height:auto;touch-action:none;cursor:default}" +
    ".st__canvaswrap canvas:focus-visible{outline:3px solid var(--blue);outline-offset:-3px}" +
    ".st__bar{display:flex;flex-wrap:wrap;align-items:center;gap:.4rem;margin-top:.5rem;font-size:.84rem}" +
    ".st__bar .grow{flex:1}" +
    ".st__legend{display:flex;flex-wrap:wrap;gap:.3rem .9rem;font-size:.78rem;color:var(--muted)}" +
    ".st__legend i{display:inline-block;width:18px;border-top:2px dashed;vertical-align:middle;margin-right:.3rem}" +
    ".st__priv{display:flex;gap:.45rem;align-items:flex-start;margin-top:.5rem;font-size:.82rem;color:var(--green);font-weight:700}" +
    ".st__priv svg{width:16px;height:16px;flex:none;margin-top:.15rem}" +
    ".st__tools,.st__order{background:var(--card);border:1px solid var(--line);border-radius:var(--r)}" +
    ".st__tabs{display:grid;grid-template-columns:repeat(auto-fit,minmax(74px,1fr));border-bottom:1px solid var(--line)}" +
    ".st__tabs::-webkit-scrollbar{display:none}" +
    ".st__tabs button{min-height:48px;padding:.3rem .4rem;font-weight:600;font-size:.84rem;color:var(--muted);border-bottom:2px solid transparent;margin-bottom:-1px}" +
    ".st__tabs button[aria-selected=true]{color:var(--ink);border-color:var(--blue)}" +".tcard{display:grid;gap:.5rem;padding:.7rem;border:1px solid var(--line);border-radius:var(--r-sm)}.tcard .row2{display:grid;grid-template-columns:1fr auto;gap:.4rem;align-items:center}.note-fix{font-size:.8125rem;color:var(--green);font-weight:600}" +
    ".st__panel{padding:.9rem;display:grid;grid-template-columns:minmax(0,1fr);gap:.75rem}.st__panel>*,.st__order>*,.pm label>span{min-width:0}" +
    ".st__panel h2{font-size:1.05rem;font-family:var(--sans)}" +
    ".st__row{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center}" +
    ".tbtn{min-height:44px;min-width:44px;padding:.3rem .6rem;border:1.5px solid var(--line-strong);border-radius:var(--r-sm);background:var(--card);font-weight:700;font-size:.85rem}" +
    ".tbtn[aria-pressed=true]{background:var(--blue-soft);border-color:var(--blue);box-shadow:inset 0 0 0 1px var(--blue)}" +
    ".tbtn:disabled{opacity:.4;cursor:not-allowed}" +
    ".sw8{display:flex;flex-wrap:wrap;gap:.35rem;align-items:center}" +
    ".sw8 button{width:36px;height:36px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1.5px var(--line-strong)}" +
    ".sw8 button[aria-pressed=true]{box-shadow:0 0 0 3px var(--blue)}" +
    "@media (pointer:coarse){.sw8 button{width:44px;height:44px}}" +
    ".sw8 input[type=color]{width:44px;height:40px;padding:0;border:1.5px solid var(--line-strong);border-radius:8px;background:none}" +
    ".drop{display:grid;place-items:center;gap:.3rem;text-align:center;padding:1rem;border:2px dashed var(--blue);border-radius:var(--r);background:var(--blue-soft);font-size:.88rem;cursor:pointer}" +
    ".drop.is-over{background:#d5e0f6}" +
    ".drop svg{width:30px;height:30px;color:var(--blue)}" +
    ".tpl{display:grid;gap:.45rem}" +
    ".tpl button{display:flex;justify-content:space-between;align-items:center;gap:.5rem;min-height:48px;padding:.4rem .75rem;border:1.5px solid var(--line);border-radius:var(--r-sm);background:var(--paper);font-weight:700;text-align:left}" +
    ".tpl button:hover{border-color:var(--blue)}" +
    ".tpl small{color:var(--muted);font-weight:600}" +
    ".lyr li{display:flex;align-items:center;gap:.3rem;padding:.25rem 0;border-bottom:1px solid var(--line)}" +
    ".lyr .nm{flex:1;min-width:0;text-align:left;min-height:44px;padding:0 .4rem;border-radius:6px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    ".lyr .nm[aria-current=true]{background:var(--blue-soft);color:var(--blue-deep)}" +
    ".lyr .ib{width:40px;height:40px;display:grid;place-items:center;border-radius:6px;font-size:.8rem;font-weight:800}" +
    ".lyr .ib[aria-pressed=true]{background:var(--accent-soft)}" +
    ".lyr .ib svg{width:18px;height:18px}" +
    "@media (pointer:coarse){.lyr .ib{width:44px;height:44px}}" +
    ".months{display:grid;grid-template-columns:repeat(4,1fr);gap:.35rem}" +
    ".months button{position:relative;aspect-ratio:1;border-radius:7px;overflow:hidden;border:2px solid var(--line);background:#EEE9DD;font-size:.7rem;font-weight:800;color:var(--ink)}" +
    ".months button img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}" +
    ".months button span{position:absolute;left:0;right:0;bottom:0;background:rgba(255,255,255,.85);padding:.1rem}" +
    ".months button[aria-pressed=true]{border-color:var(--blue)}" +
    ".st__order{padding:.9rem;display:grid;grid-template-columns:minmax(0,1fr);gap:.7rem}" +
    ".st__order h2{font-size:1.15rem}" +
    ".pm{display:grid;gap:.45rem}" +
    ".pm label{display:flex;gap:.6rem;align-items:flex-start;padding:.6rem .7rem;border:1.5px solid var(--line-strong);border-radius:var(--r-sm);cursor:pointer;font-size:.86rem}" +
    ".pm label:has(input:checked){border-color:var(--blue);background:var(--blue-soft)}" +
    ".pm input{width:20px;height:20px;accent-color:var(--blue);flex:none;margin-top:.1rem}" +
    ".pm b{display:block;font-size:.92rem}" +
    ".formula{display:grid;gap:.2rem;padding:.7rem 0;border-block:1px solid var(--line);font-size:.9375rem}.formula div{display:flex;justify-content:space-between;gap:1rem}.formula .tot{font-weight:700;font-size:1.0625rem}" +".approve{padding:.7rem;border:1px solid var(--line-strong);border-radius:var(--r-sm)}.approve input{width:22px;height:22px}" +
    
    ".st__sticky{position:fixed;left:0;right:0;bottom:0;z-index:70;display:flex;align-items:center;gap:.6rem;padding:.5rem var(--gutter) calc(.5rem + env(safe-area-inset-bottom,0px));background:var(--card);border-top:1px solid var(--line);box-shadow:0 -8px 24px -18px rgba(27,35,51,.5)}" +
    ".st__sticky .btn{flex:1}" +
    "@media (min-width:1000px){.st__sticky{display:none}}" +
    ".warn{padding:.5rem .7rem;border-radius:var(--r-sm);background:#FFF1D2;color:#5C3B00;font-size:.84rem;font-weight:600}" +
    "html.is-studio .added{z-index:280}";

  // ---------- the studio ----------
  var st = null, root = null, releaseKeys = null;
  var I = {
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="width:18px;height:18px"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.2 1.3-1.9 1.4-.5.1-1.1.2-3.2-.7-2.7-1.1-4.4-3.9-4.5-4-.1-.2-1.1-1.4-1.1-2.7s.7-1.9 1-2.2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5s.8 2 .9 2.1c.1.2.1.3 0 .5s-.2.4-.3.5l-.4.5c-.1.1-.3.3-.1.6s.6 1.1 1.4 1.8c1 .9 1.8 1.1 2.1 1.3.3.1.4.1.6-.1s.7-.8.9-1.1c.2-.3.4-.2.6-.1s1.6.8 1.8.9c.3.1.4.2.5.3.1.2.1.7-.1 1.3Z"/></svg>'
  };

  function sd() { return st.sides.filter(function (s) { return s.id === st.side; })[0]; }
  function layers() { return st.layers[st.side] || (st.layers[st.side] = []); }
  function selLayer() { return layers().filter(function (l) { return l.id === st.sel; })[0] || null; }
  function usedSides() { return st.sides.filter(function (s) { return (st.layers[s.id] || []).some(function (l) { return !l.hidden; }); }); }
  function snapshot() { return JSON.stringify({ layers: st.layers, names: st.names }); }
  function commit() { autoFix(); var s = snapshot(); if (st.hist[st.hist.length - 1] === s) return; st.hist.push(s); if (st.hist.length > 60) st.hist.shift(); st.fut = []; st.dirty = true; topBtns(); }
  function restore(s) { var o = JSON.parse(s); st.layers = o.layers; st.names = o.names; if (!selLayer()) st.sel = ""; draw(); panel(); order(); }
  function undo() { if (st.hist.length < 2) return; st.fut.push(st.hist.pop()); restore(st.hist[st.hist.length - 1]); topBtns(); A.announce("Undone"); }
  function redo() { if (!st.fut.length) return; var s = st.fut.pop(); st.hist.push(s); restore(s); topBtns(); A.announce("Redone"); }
  function topBtns() { var u = $("#stUndo"), r = $("#stRedo"); if (u) u.disabled = st.hist.length < 2; if (r) r.disabled = !st.fut.length; }

  function method() { return A.printOf(st.p, { method: st.method, sides: usedSides().map(function (s) { return s.name; }) }, st.qty); }
  function minQty() { return A.lineMin(st.p, { method: st.method }); }
  function nameList() { return String(st.names || "").split("\n").map(function (x) { return x.trim(); }).filter(Boolean); }

  function mount(view, o) {
    var p = P[o.slug];
    if (!document.getElementById("kk-studio-css")) { var s = document.createElement("style"); s.id = "kk-studio-css"; s.textContent = CSS; document.head.appendChild(s); }
    var from = o.designId ? A.designById(o.designId) : o.from ? A.designById(o.from) : null;
    var v = A.vOf(p, o.vid) || (from && from.slug === p.slug && A.vOf(p, from.vid)) || A.defV(p);
    st = { p: p, v: v, sides: sidesOf(p), side: "", sel: "", layers: {}, images: {}, orig: {}, names: "", nameIdx: 0, preview: false, zoom: 1, approved: false, hist: [], fut: [], tab: "text",
      method: p.pr.methods[0].id, qty: 0, designId: o.designId && from ? from.id : uid(), lineKey: o.lineKey || "", warn: "", stored: true };
    st.side = st.sides[0].id;
    if (from) {
      st.images = JSON.parse(JSON.stringify(from.images || {})); st.names = from.names || "";
      if (from.slug === p.slug) { st.layers = JSON.parse(JSON.stringify(from.layers)); st.method = from.method || st.method; }
      else {
        // Reuse on another product: copy the first side's layers to this product's first side, refitted.
        var firstSide = Object.keys(from.layers).filter(function (k) { return from.layers[k].length; })[0];
        st.layers[st.side] = JSON.parse(JSON.stringify(from.layers[firstSide] || []));
        var area = sideFor(p, v, st.sides[0]).area; st.layers[st.side].forEach(function (l) { if (l.type === "text") fit(l, area.w * 800, area.h * 800); });
      }
      if (!p.pr.methods.some(function (m) { return m.id === st.method; })) st.method = p.pr.methods[0].id;
    } else {
      var kind = kindDefault(p), ar = sideFor(p, v, st.sides[0]).area;
      if (p.pr.months) st.sides.forEach(function (s) { st.layers[s.id] = template("calendar", ar); });
      else st.layers[st.side] = template(kind, ar);
      if (p.pr.names) st.names = "Aarav Das\nRiya Sen\nIshaan Roy";
    }
    var cartLine = o.lineKey && A.cart().filter(function (l) { return A.lineKey(l) === o.lineKey; })[0];
    st.qty = A.snap(p, cartLine ? cartLine.qty : (o.qty || minQty()), minQty(), st.v.stock);
    st.hist = [snapshot()];
    root = view;
    view.innerHTML = '<div class="studio">' +
      '<div class="st__top"><a class="back" href="' + A.u("/products/" + p.slug) + '">' + I.back + '<span>Back</span></a><h1>Design your ' + esc(p.name) + '</h1>' +
      '<button type="button" class="icon-btn" id="stUndo" aria-label="Undo (Ctrl+Z)" disabled>' + I.undo + '</button><button type="button" class="icon-btn" id="stRedo" aria-label="Redo (Ctrl+Y)" disabled>' + I.redo + '</button>' +
      '</div>' +
      '<div class="st__main">' +
      '<section class="st__stage" aria-label="Preview of your design"><div class="st__sides" id="stSides" role="group" aria-label="Side to design"></div>' +
      '<div class="st__scroll" id="stScroll"><div class="st__canvaswrap" id="stWrap"><canvas id="stCanvas" role="img" aria-label="Preview of your printed product"></canvas></div></div>' +
      '<div class="st__bar"><div class="st__legend grow" id="stLegend"><span>The position and size are set for you, so it prints right.</span></div>' +
      '<label class="sr" for="stZoom">Zoom</label><select id="stZoom" class="tbtn"><option value="1">Zoom 100%</option><option value="1.5">150%</option><option value="2">200%</option></select></div>' +
      '<p class="warn" id="stWarn" role="status"' + (st.warn ? "" : " hidden") + '></p>' +
      '<p class="st__priv">' + I.shield + "Your logo and photos stay on this device. Nothing is uploaded.</p></section>" +
      '<section class="st__tools" aria-label="Design tools"><div class="st__tabs" role="tablist" id="stTabs"></div><div class="st__panel" id="stPanel" role="tabpanel"></div></section>' +
      '<aside class="st__order" id="stOrder" aria-label="Price and order"></aside></div>' +
      '<div class="st__sticky"><div><span class="small muted" id="stStickyQ"></span><b class="notranslate" id="stStickyT"></b></div><button type="button" class="btn btn--blue" data-act="addcart">Add to cart</button></div>' +
      '<input type="file" id="stFile" accept="image/png,image/jpeg,image/svg+xml,image/webp" hidden><input type="file" id="stFiles" accept="image/png,image/jpeg,image/webp" multiple hidden></div>';
    sidesBar(); sizeCanvas(); tabs(); panel(); order();
    loadFonts(draw);
    var cv = $("#stCanvas");
    autoFix(true); draw(); panel();
    root.addEventListener("click", onClick); root.addEventListener("input", onInput); root.addEventListener("change", onChange);
    window.addEventListener("resize", sizeCanvas);
    document.addEventListener("keydown", gKey);
    $("#stFile").addEventListener("change", function (e) { if (e.target.files[0]) readFile(e.target.files[0], false); e.target.value = ""; });
    $("#stFiles").addEventListener("change", function (e) { readMonths(e.target.files); e.target.value = ""; });
    if (from && from.slug !== p.slug) A.toast("Your design is ready on this product. Check the fit.");
  }
  function unmount() {
    if (!root) return;
    root.removeEventListener("click", onClick); root.removeEventListener("input", onInput); root.removeEventListener("change", onChange);
    window.removeEventListener("resize", sizeCanvas); document.removeEventListener("keydown", gKey);
    root = null; st = null;
  }
  function sizeCanvas() {
    if (!st) return;
    var sc = $("#stScroll"), wrap = $("#stWrap"), cv = $("#stCanvas"), w = sc.clientWidth || 340;
    var maxH = window.innerWidth < 1000 ? window.innerHeight * .62 : window.innerHeight * .78;
    var size = Math.min(w, 720, Math.max(260, maxH)) * st.zoom;
    wrap.style.width = Math.round(size) + "px";
    var px = Math.min(1600, Math.round(size * (window.devicePixelRatio || 1)));
    if (cv.width !== px) { cv.width = cv.height = px; }
    draw();
  }
  var guides = null;
  function draw() {
    if (!st) return;
    var cv = $("#stCanvas"); if (!cv) return;
    var names = nameList();
    var wasNull = !st.g || st.g.L == null;
    st.g = drawSide(cv, { p: st.p, v: st.v, sd: sd(), layers: layers(), images: st.images, preview: true, sel: "", guides: null, nameText: names[st.nameIdx % Math.max(1, names.length)] || "", size: cv.width > 450 ? 800 : 400, redraw: draw });
    if (wasNull && st.g.L != null && !st.inFix) { st.inFix = true; autoFix(true); st.inFix = false; panel(); draw(); return; }

  }
  function sidesBar() {
    var html = st.sides.length > 1 ? st.sides.map(function (s) { return '<button type="button" data-side="' + s.id + '" aria-pressed="' + (s.id === st.side) + '">' + esc(s.name) + ((st.layers[s.id] || []).length ? "" : ' <span class="sr">(empty)</span>') + "</button>"; }).join("") : "";
    $("#stSides").innerHTML = html; $("#stSides").hidden = !html;
  }
  var TABS = function () {
    var t = [["text", "Text"], ["logo", st.p.pr.months ? "Photos" : "Logo"], ["templates", "Layout"]];
    if (st.sides.length > 1 && !st.p.pr.months) t.push(["positions", "Positions"]);
    if (st.p.variants.length > 1) t.push(["colour", st.p.variants.some(function (v) { return v.colour; }) ? "Colour" : "Option"]);
    if (st.p.pr.names) t.push(["names", "Names"]);
    return t;
  };
  function tabs() {
    $("#stTabs").innerHTML = TABS().map(function (t) { return '<button type="button" role="tab" id="stt-' + t[0] + '" aria-controls="stPanel" aria-selected="' + (st.tab === t[0]) + '" tabindex="' + (st.tab === t[0] ? 0 : -1) + '" data-tab="' + t[0] + '">' + t[1] + "</button>"; }).join("");
    $("#stPanel").setAttribute("aria-labelledby", "stt-" + st.tab);
  }
  function swatches(cur, attr) {
    return '<div class="sw8" role="group" aria-label="Colour">' + SWATCH.map(function (c) { return '<button type="button" ' + attr + '="' + c + '" aria-pressed="' + (cur && cur.toLowerCase() === c.toLowerCase()) + '" aria-label="Colour ' + c + '" style="background:' + c + '"></button>'; }).join("") +
      '<label class="sr" for="stPick">Pick any colour</label><input type="color" id="stPick" ' + attr.replace("data-", "data-pick-") + ' value="' + (cur || "#14213D") + '"></div>';
  }
  function panel() {
    if (!st) return;
    var l = selLayer(), h = "";
    if (st.tab === "text") {
      var tl = layers().filter(function (x) { return x.type === "text"; });
      h = (tl.length ? tl.map(function (x, i) { var max = Math.max(12, Math.round(st.g.aw / (x.size * st.g.ah) * 1.6)); return '<div class="tcard" data-lid="' + x.id + '"><label class="lab" for="tx-' + x.id + '">Line ' + (i + 1) + ' <span class="muted" style="font-weight:400">(up to ' + max + ' letters)</span></label><input class="inp" id="tx-' + x.id + '" data-tx="' + x.id + '" maxlength="' + max + '" value="' + esc(x.text) + '"><div class="row2"><label class="sr" for="tf-' + x.id + '">Font</label><select class="inp" id="tf-' + x.id + '" data-tf="' + x.id + '">' + FONTS.slice(0, 4).concat([FONTS[5]]).map(function (f) { return '<option value="' + f[0] + '"' + (f[0] === x.font ? " selected" : "") + ">" + f[0] + "</option>"; }).join("") + '</select><button type="button" class="tbtn" data-tb="' + x.id + '" aria-pressed="' + !!x.bold + '"><b>B</b><span class="sr"> Bold</span></button></div><div class="sw8" role="group" aria-label="Colour of line ' + (i + 1) + '">' + SWATCH.map(function (c) { return '<button type="button" data-tc="' + x.id + "|" + c + '" aria-pressed="' + (x.color.toLowerCase() === c.toLowerCase()) + '" aria-label="Colour ' + c + '" style="background:' + c + '"></button>'; }).join("") + "</div></div>"; }).join("") : '<p class="small muted">This position carries your crest or logo only, so it stays sharp at this small size. Upload yours in the Logo tab.</p>') +
        (st.notes && st.notes.length ? '<p class="note-fix" role="status">' + esc(st.notes.join(" ")) + "</p>" : "");
      if (false) {
        h += '<div class="field"><label for="stText">Text' + (st.p.pr.names ? ' <span class="muted">(type {name} where each name goes)</span>' : "") + '</label><textarea class="inp" id="stText" rows="2" data-prop="text">' + esc(l.text) + "</textarea></div>" +
          '<div class="field"><label for="stFont">Font</label><select class="inp" id="stFont" data-prop="font">' + FONTS.map(function (f) { return '<option value="' + f[0] + '"' + (f[0] === l.font ? " selected" : "") + ' style="font-family:\'' + f[0] + '\'">' + f[0] + " (" + f[1] + ")</option>"; }).join("") + "</select></div>" +
          '<div class="field"><label for="stSize">Size</label><input type="range" id="stSize" min="4" max="80" value="' + Math.round(l.size * 100) + '" data-prop="size"></div>' +
          '<div class="st__row" role="group" aria-label="Style"><button type="button" class="tbtn" data-tog="bold" aria-pressed="' + !!l.bold + '"><b>B</b><span class="sr"> Bold</span></button><button type="button" class="tbtn" data-tog="italic" aria-pressed="' + !!l.italic + '"><i>I</i><span class="sr"> Italic</span></button>' +
          ["left", "center", "right"].map(function (a) { return '<button type="button" class="tbtn" data-align="' + a + '" aria-pressed="' + (l.align === a) + '">' + a.replace(/^./, function (c) { return c.toUpperCase(); }) + "</button>"; }).join("") +
          '<button type="button" class="tbtn" data-tog="curve" aria-pressed="' + !!l.curve + '">Curved</button></div>' + swatches(l.color, "data-col");
      }
    } else if (st.tab === "logo") {
      if (st.p.pr.months) {
        h = '<h2>Your 12 photos</h2><p class="small muted">One photo for each month. Pick up to 12 at once and they fill January to December in order.</p><button type="button" class="btn btn--blue" data-act="months">' + I.upload.replace("<svg", '<svg style="width:18px;height:18px"') + "Choose photos</button>" +
          '<div class="months" role="group" aria-label="Months">' + st.sides.map(function (s) { var im = (st.layers[s.id] || []).filter(function (x) { return x.type === "image"; })[0]; return '<button type="button" data-side="' + s.id + '" aria-pressed="' + (s.id === st.side) + '">' + (im && st.images[im.src] ? '<img src="' + st.images[im.src] + '" alt="">' : "") + "<span>" + s.name.slice(0, 3) + (im ? "" : '<span class="sr"> (no photo)</span>') + "</span></button>"; }).join("") + "</div>" +
          '<button type="button" class="btn btn--ghost btn--sm" data-act="upload">Replace this month\'s photo</button>';
      } else {
        h = '<div class="drop" id="stDrop" tabindex="0" role="button" aria-label="Upload a logo or image: PNG, JPG, SVG or WebP up to 5 MB">' + I.upload + '<b>Drop your logo here, or tap to choose</b><span class="small muted">PNG, JPG, SVG or WebP, up to 5 MB</span></div>';
        if (l && l.type === "image") {
          h += '<div class="field"><label for="stW">Logo size</label><input type="range" id="stW" min="5" max="120" value="' + Math.round(l.w * 100) + '" data-prop="w"></div>' +
            (l.custom ? '<label class="check"><input type="checkbox" data-nobg' + (l.nobg ? " checked" : "") + "><span>Remove white background</span></label>" : '<p class="small muted">This is the sample crest. Upload your own logo to replace it.</p>');
        }
        h += '<p class="small muted">Tip: a logo with a clear or white background works best. For engraving, dark parts of the logo are cut into the metal.</p>';
      }
    } else if (st.tab === "positions") {
      h = '<p class="small muted">Choose where to print. Each extra position adds half the print rate.</p>' + st.sides.map(function (sx) { var on = (st.layers[sx.id] || []).length > 0; return '<label class="check"><input type="checkbox" data-pos="' + sx.id + '"' + (on ? " checked" : "") + "><span>" + esc(sx.name) + "</span></label>"; }).join("");
    } else if (st.tab === "shapes") {
      h = '<p class="small muted">Frames, ribbons and badges. Tap to add.</p><div class="st__row">' + SHAPES.map(function (s) { return '<button type="button" class="tbtn" data-shape="' + s[0] + '">' + s[1] + "</button>"; }).join("") + "</div>";
      if (l && l.type === "shape") h += '<div class="field"><label for="stW2">Size</label><input type="range" id="stW2" min="5" max="120" value="' + Math.round(l.w * 100) + '" data-prop="w"></div>' + swatches(l.color, "data-col");
    } else if (st.tab === "templates") {
      var kd = kindDefault(st.p);
      h = '<p class="small muted">One tap replaces this side with a ready layout. You can undo.</p><div class="tpl">' + TEMPLATES.filter(function (t) { return t[0] !== "names" || st.p.pr.names; }).sort(function (a, b) { return (b[0] === kd) - (a[0] === kd); }).map(function (t) { return '<button type="button" data-tpl="' + t[0] + '"><span>' + t[1] + "</span>" + (t[0] === kd ? "<small>Suits this product</small>" : "") + "</button>"; }).join("") + "</div>";
    } else if (st.tab === "colour") {
      h = '<p class="small muted">The preview changes to the product colour you pick.</p><div class="opts">' + st.p.variants.map(function (v) { return '<button type="button" class="optbtn" data-var="' + v.id + '" aria-pressed="' + (v === st.v) + '"' + (v.stock <= 0 ? ' aria-disabled="true"' : "") + ">" + (v.colour ? '<i style="background:' + v.colour + '"></i>' : "") + esc(v.label) + (v.stock <= 0 ? " (out of stock)" : "") + "</button>"; }).join("") + "</div>";
    } else if (st.tab === "names") {
      var nl = nameList();
      h = '<div class="field"><label for="stNames">Names, one per line</label><textarea class="inp" id="stNames" rows="7">' + esc(st.names) + '</textarea><span class="hint">' + nl.length + " names. Each " + (st.p.slug.indexOf("id-card") > -1 ? "card" : "certificate") + " is printed with its own name where {name} sits in the text.</span></div>" +
        '<div class="st__row"><button type="button" class="tbtn" data-name="-1" aria-label="Previous name">‹</button><span class="small" aria-live="polite">Preview: <b>' + esc(nl[st.nameIdx % Math.max(1, nl.length)] || "Student Name") + '</b></span><button type="button" class="tbtn" data-name="1" aria-label="Next name">›</button></div>' +
        (nl.length ? '<button type="button" class="btn btn--ghost btn--sm" data-act="qtynames">Set quantity to ' + nl.length + " names</button>" : "");
    } else if (st.tab === "layers") {
      var ls = layers().slice().reverse();
      h = ls.length ? '<ul class="lyr" aria-label="Layers, top first">' + ls.map(function (x) {
        var nm = x.type === "text" ? "Text: " + x.text.split("\n")[0] : x.type === "image" ? (x.custom ? "Your image" : "Sample crest or logo") : "Shape: " + (SHAPES.filter(function (s) { return s[0] === x.shape; })[0] || [0, ""])[1];
        return '<li><button type="button" class="nm" data-pick="' + x.id + '" aria-current="' + (x.id === st.sel) + '">' + esc(nm) + "</button>" +
          '<button type="button" class="ib" data-lyr="up|' + x.id + '" aria-label="Move up">' + I.up + '</button><button type="button" class="ib" data-lyr="down|' + x.id + '" aria-label="Move down">' + I.down + "</button>" +
          '<button type="button" class="ib" data-lyr="hide|' + x.id + '" aria-pressed="' + !!x.hidden + '" aria-label="Hide">' + I.eye + '</button><button type="button" class="ib" data-lyr="lock|' + x.id + '" aria-pressed="' + !!x.locked + '" aria-label="Lock">' + I.lock + '</button><button type="button" class="ib" data-lyr="del|' + x.id + '" aria-label="Delete">' + I.del + "</button></li>";
      }).join("") + "</ul>" : '<p class="small muted">No layers on this side yet. Add text, a logo or a template.</p>';
      h += '<p class="small muted">On the product: drag to move, the square handle resizes, the round handle rotates. Keyboard: arrows move 1 px, Shift + arrows 10 px, Delete removes.</p>';
    }
    $("#stPanel").innerHTML = h;
  }
  function order() {
    if (!st) return;
    var p = st.p, v = st.v, pm = method(), t = A.tierOf(p, v, st.qty), min = minQty(), used = usedSides();
    var unit = t.price + pm.rate, total = unit * st.qty + pm.setup, next = p.wq - st.qty;
    var editing = !!st.lineKey;
    $("#stOrder").innerHTML = '<h2 id="stOrderH">Price and order</h2>' +
      '<fieldset class="pm" style="border:0;padding:0;margin:0"><legend class="lab">Print method</legend>' + p.pr.methods.map(function (m) {
        var info = D.METHODS[m.id];
        return '<label><input type="radio" name="stMethod" value="' + m.id + '"' + (m.id === st.method ? " checked" : "") + '><span><b>' + info.name + '</b><span class="muted">' + info.line + '</span><br><span class="notranslate">' + (m.rate[0] ? "+" + money(m.rate[0]) + " " + A.perText(p) + ", +" + money(m.rate[1]) + " from " + p.wq : "Printing included") + (m.setup ? ", setup " + money(m.setup) + " once" : ", no setup fee") + "</span>" + (m.min > 1 ? "<br>Minimum " + m.min : "") + "</span></label>";
      }).join("") + "</fieldset>" +
      '<div><label class="lab" for="stQty">Quantity (' + esc(A.unitWord(p, 2)) + ')</label><div style="display:flex;gap:.5rem;align-items:center;margin-top:.35rem;flex-wrap:wrap"><div class="qty" role="group" aria-label="Quantity"><button type="button" data-q="-1" aria-label="Decrease quantity"' + (st.qty <= min ? " disabled" : "") + '>&minus;</button><input id="stQty" class="notranslate" inputmode="numeric" value="' + st.qty + '" aria-describedby="stQmsg"><button type="button" data-q="1" aria-label="Increase quantity"' + (st.qty + p.step > v.stock ? " disabled" : "") + '>+</button></div><span class="small muted">Minimum ' + min + " for " + D.METHODS[st.method].short.toLowerCase() + '</span></div><p class="qmsg" id="stQmsg" role="status">' + esc(st.qmsg || "") + "</p></div>" +
      '<div class="formula notranslate" aria-live="polite"><div><span>' + A.qtyText(p, st.qty) + " × " + money(t.price) + " (" + t.name.toLowerCase() + ")</span><span>" + money(t.price * st.qty) + "</span></div><div><span>Print, " + A.qtyText(p, st.qty) + " × " + money(pm.rate) + "</span><span>" + money(pm.rate * st.qty) + "</span></div>" + (pm.setup ? "<div><span>Setup, one time</span><span>" + money(pm.setup) + "</span></div>" : "") + '<div class="tot"><span>Total</span><span>' + money(total) + "</span></div></div>" +
      (t.k === "retail" && next > 0 ? '<p class="small">Add ' + A.qtyText(p, A.snap(p, next, p.step)) + " more for the wholesale price of " + money(v.wp) + " " + A.perText(p) + ".</p>" : "") +
      (function () { var e = A.eta(p.slug, v.id, st.qty, st.method); return e ? '<p class="small"><b>Get it by ' + A.fDate(e.to) + "</b>. " + esc(e.notes.join(". ")) + "</p>" : ""; })() +
      '<p class="small"><b>Printed sides:</b> ' + (used.length ? esc(p.pr.months ? used.length + " of 12 months" : used.map(function (s) { return s.name; }).join(" + ")) : "none yet") + (used.length > 1 && !p.pr.months ? " (extra sides at half the print rate)" : "") + "</p>" +
      '<label class="check approve"><input type="checkbox" id="stApprove"' + (st.approved ? " checked" : "") + ' aria-describedby="stApproveErr"><span><b>I have checked the spelling, colours and logo.</b><br><span class="small muted">Personalised items cannot be returned unless the print is faulty.</span></span></label><p class="err" id="stApproveErr" role="alert">' + (st.apErr || "") + "</p>" +
      '<button type="button" class="btn btn--blue btn--block" data-act="addcart">' + (editing ? "Update cart line" : "Add to cart") + " · <span class=\"notranslate\">" + money(total) + "</span></button>" +
      '<a class="btn btn--wa btn--block" id="stWaOrder" data-wa-order href="' + esc(waOrderHref()) + '" target="_blank" rel="noopener">' + I.wa + "Order this design on WhatsApp</a>" +
      '<div class="st__row"><button type="button" class="textbtn" data-act="quote">Get a bulk quote for your school</button><button type="button" class="textbtn" data-act="proof">Download proof</button><a class="textbtn" id="stShare" href="#" target="_blank" rel="noopener">Share design on WhatsApp</a></div>' +
      '<p class="small muted">WhatsApp cannot attach the picture from here: send the downloaded proof in the chat.</p>' +
      (st.stored ? "" : '<p class="warn">This browser is not letting us save, so your design is kept only while this tab is open.</p>');
    $("#stShare").href = A.wa(shareText());
    $("#stStickyQ").textContent = A.qtyText(p, st.qty);
    $("#stStickyT").textContent = money(total);
  }
  function hasLogo() { return Object.keys(st.layers).some(function (k) { return st.layers[k].some(function (l) { return l.type === "image" && l.custom && !l.hidden; }); }); }
  function waOrderHref() {
    var used = usedSides();
    var d = { method: st.method, sides: st.p.pr.months ? [used.length + " months"] : used.map(function (s) { return s.name; }), names: st.p.pr.names ? nameList().length : 0 };
    return A.waDesign(st.p.slug, st.v.id, st.qty, d, texts(), hasLogo());
  }
  function texts() { var out = []; Object.keys(st.layers).forEach(function (k) { st.layers[k].forEach(function (l) { if (l.type === "text" && !l.hidden && out.indexOf(l.text) < 0) out.push(l.text.replace(/\n/g, " ")); }); }); return out; }
  function shareText() {
    var p = st.p, pm = method(), used = usedSides();
    return "Hello Kolom Khata Stationers, here is my design for " + A.qtyText(p, st.qty) + " of " + p.name + (p.variants.length > 1 ? " (" + st.v.label + ")" : "") + ".\nPrint: " + pm.name + ", " + (p.pr.months ? used.length + " months" : used.map(function (s) { return s.name; }).join(" + ") || "front") +
      "\nText: " + (texts().join(" / ") || "none") + (nameList().length && p.pr.names ? "\nNames: " + nameList().length : "") + "\nI will send the downloaded proof in this chat.\n(Sent from the Kolom Khata Stationers sample website by Nexvora)";
  }

  // ---------- pointer editing ----------
  var drag = null;
  function local(e) {
    var cv = $("#stCanvas"), r = cv.getBoundingClientRect(), k = cv.width / r.width, g = st.g;
    var x = (e.clientX - r.left) * k - g.cx, y = (e.clientY - r.top) * k - g.cy, c = Math.cos(-g.rot), s = Math.sin(-g.rot);
    return { x: x * c - y * s + g.aw / 2, y: x * s + y * c + g.ah / 2, k: k };
  }
  function inLayer(l, pt, pad) {
    var m = measure(l, st.g.aw, st.g.ah, st.images), dx = pt.x - l.x * st.g.aw, dy = pt.y - l.y * st.g.ah, a = -(l.rot || 0) * Math.PI / 180;
    var lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
    return { hit: Math.abs(lx) <= m.w / 2 + pad && Math.abs(ly) <= m.h / 2 + pad, lx: lx, ly: ly, m: m };
  }
  function pDown(e) {
    if (!st || st.preview) return;
    var pt = local(e), W = $("#stCanvas").width, hs = Math.max(7, W / 55) * (e.pointerType === "touch" ? 1.8 : 1.1), lw = Math.max(1, W / 500), sl = selLayer();
    if (sl && !sl.locked && !sl.hidden) {
      var h = inLayer(sl, pt, 0);
      if (Math.abs(h.lx - (h.m.w / 2 + lw * 3)) < hs && Math.abs(h.ly - (h.m.h / 2 + lw * 3)) < hs) { drag = { mode: "size", l: sl, d0: Math.hypot(h.lx, h.ly), s0: sl.type === "text" ? sl.size : sl.w }; }
      else if (Math.abs(h.lx) < hs && Math.abs(h.ly - (-h.m.h / 2 - hs * 2.2 / (e.pointerType === "touch" ? 1.8 : 1.1))) < hs) { drag = { mode: "rot", l: sl, a0: Math.atan2(pt.y - sl.y * st.g.ah, pt.x - sl.x * st.g.aw), r0: sl.rot || 0 }; }
    }
    if (!drag) {
      var ls = layers(), hit = null;
      for (var i = ls.length - 1; i >= 0; i--) if (!ls[i].hidden && inLayer(ls[i], pt, 4 * pt.k).hit) { hit = ls[i]; break; }
      if (hit) { if (st.sel !== hit.id) { st.sel = hit.id; st.tab = hit.type === "text" ? "text" : hit.type === "image" ? "logo" : "shapes"; tabs(); panel(); A.announce("Selected " + (hit.type === "text" ? "text " + hit.text : hit.type)); } if (!hit.locked) drag = { mode: "move", l: hit, ox: pt.x - hit.x * st.g.aw, oy: pt.y - hit.y * st.g.ah }; }
      else if (st.sel) { st.sel = ""; panel(); }
    }
    if (drag) { $("#stCanvas").setPointerCapture(e.pointerId); e.preventDefault(); }
    draw();
  }
  function pMove(e) {
    if (!drag || !st) return;
    var pt = local(e), l = drag.l, g = st.g;
    if (drag.mode === "move") {
      var nx = (pt.x - drag.ox) / g.aw, ny = (pt.y - drag.oy) / g.ah; guides = {};
      if (Math.abs(nx - .5) * g.aw < 6 * pt.k) { nx = .5; guides.x = true; }
      if (Math.abs(ny - .5) * g.ah < 6 * pt.k) { ny = .5; guides.y = true; }
      l.x = clamp(nx, -.2, 1.2); l.y = clamp(ny, -.2, 1.2);
    } else if (drag.mode === "size") {
      var h = inLayer(l, pt, 0), sc = Math.hypot(h.lx, h.ly) / Math.max(1, drag.d0);
      if (l.type === "text") l.size = clamp(drag.s0 * sc, .03, 1.2); else l.w = clamp(drag.s0 * sc, .04, 1.5);
    } else {
      var a = Math.atan2(pt.y - l.y * g.ah, pt.x - l.x * g.aw), deg = drag.r0 + (a - drag.a0) * 180 / Math.PI;
      deg = ((deg + 540) % 360) - 180; [0, 90, -90, 180, -180].forEach(function (s) { if (Math.abs(deg - s) < 4) deg = s; }); l.rot = Math.round(deg);
    }
    draw();
  }
  function pUp() { if (!drag) return; drag = null; guides = null; draw(); commit(); order(); if (st.tab === "text" || st.tab === "logo" || st.tab === "shapes") panel(); checkRes(); }
  function cKey(e) {
    var l = selLayer(); if (!l || l.locked) return;
    var step = e.shiftKey ? 10 : 1, k = $("#stCanvas").width / $("#stCanvas").getBoundingClientRect().width, dx = 0, dy = 0;
    if (e.key === "ArrowLeft") dx = -step; else if (e.key === "ArrowRight") dx = step; else if (e.key === "ArrowUp") dy = -step; else if (e.key === "ArrowDown") dy = step;
    else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); delLayer(l.id); return; } else return;
    e.preventDefault(); l.x += dx * k / st.g.aw; l.y += dy * k / st.g.ah; draw(); clearTimeout(cKey.t); cKey.t = setTimeout(commit, 400);
  }
  function gKey(e) {
    if (!st) return;
    var tag = (e.target.tagName || "").toLowerCase(), typing = tag === "textarea" || (tag === "input" && /text|search|tel|number/.test(e.target.type || "text"));
    if ((e.ctrlKey || e.metaKey) && !typing && (e.key === "z" || e.key === "Z")) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    else if ((e.ctrlKey || e.metaKey) && !typing && (e.key === "y" || e.key === "Y")) { e.preventDefault(); redo(); }
  }

  // ---------- automatic corrections ----------
  function cRatio(a, b) { var l1 = lum(a) + .05, l2 = lum(b) + .05; return Math.max(l1, l2) / Math.min(l1, l2); }
  function surfaceHex() { var L = st.g && st.g.L != null ? st.g.L : .7, v = Math.round(clamp(L, 0, 1) * 255).toString(16); v = ("0" + v).slice(-2); return "#" + v + v + v; }
  function autoFix(silent) {
    if (!st) return; st.notes = [];
    var surf = surfaceHex();
    Object.keys(st.layers).forEach(function (k) {
      st.layers[k].forEach(function (l) {
        if (l.type !== "text") return;
        var before = l.size; fit(l, st.g ? st.g.aw : 400, st.g ? st.g.ah : 200);
        if (l.size < before - .001 && k === st.side) st.notes.push("Text made smaller to fit the " + sd().name.toLowerCase() + ".");
        var ar = sideFor(st.p, st.v, st.sides.filter(function (x) { return x.id === k; })[0] || sd()).area, px = l.size * ar.h * 800, min = st.method === "embroidery" ? 11 : st.method === "laser" ? 6 : 7;
        if (px < min && k === st.side) st.notes.push("“" + l.text.slice(0, 20) + "” is too small to " + (st.method === "embroidery" ? "embroider" : "print") + " clearly. Shorten it" + (st.method === "embroidery" ? " or choose digital print." : "."));
        if (st.g && st.g.L != null && st.p.pr.blend !== "engrave" && cRatio(l.color, surf) < 3) { var w = cRatio("#FFFFFF", surf) >= cRatio("#14213D", surf) ? "#FFFFFF" : "#14213D"; l.color = w; if (k === st.side) st.notes.push("Text set to " + (w === "#FFFFFF" ? "white" : "navy") + " so it stands out on the " + (surf < "#808080" ? "dark" : "light") + " surface."); }
      });
    });
    st.notes = st.notes.filter(function (x, i, a) { return a.indexOf(x) === i; });
    var wn = $("#stWarn"); if (wn) { wn.textContent = st.notes.join(" "); wn.hidden = !st.notes.length; }
    if (!silent && st.notes.length) A.announce(st.notes.join(" "));
  }

  // ---------- layer actions ----------
  function addLayer(l) { layers().push(l); st.sel = l.id; commit(); draw(); sidesBar(); panel(); order(); A.announce("Layer added"); }
  function delLayer(id) { st.layers[st.side] = layers().filter(function (x) { return x.id !== id; }); if (st.sel === id) st.sel = ""; commit(); draw(); sidesBar(); panel(); order(); A.announce("Layer deleted"); var c = $("#stCanvas"); if (c && document.activeElement === document.body) c.focus(); }
  function checkRes() {
    var l = selLayer(), w = $("#stWarn");
    if (!w) return;
    var msg = "";
    if (l && l.type === "image" && l.custom && l.nat) { var printedPx = l.w * st.g.aw * (800 / $("#stCanvas").width); if (l.nat < 300 || printedPx > l.nat * 1.6) msg = "This image is small (" + l.nat + " px wide) for its print size. It may print blurry. Use a bigger file if you have one."; }
    w.textContent = msg; w.hidden = !msg;
  }
  /** Read a file on this device, check it, shrink it to at most 800 px. */
  function readFile(file, forMonth, cb) {
    var okType = /^image\/(png|jpeg|svg\+xml|webp)$/.test(file.type);
    if (!okType) { A.toast("Please choose a PNG, JPG, SVG or WebP image", { icon: false }); A.announce("That file type is not supported."); return; }
    if (file.size > 5 * 1024 * 1024) { A.toast("That file is over 5 MB. Choose a smaller one.", { icon: false }); return; }
    var fr = new FileReader();
    fr.onload = function () {
      var im = new Image();
      im.onload = function () {
        var max = forMonth ? 640 : 800, w = im.naturalWidth || 400, h = im.naturalHeight || 400, k = Math.min(1, max / Math.max(w, h));
        var c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
        var x = c.getContext("2d"); x.drawImage(im, 0, 0, c.width, c.height);
        var alpha = file.type !== "image/jpeg" && !forMonth, url = c.toDataURL(alpha ? "image/webp" : "image/jpeg", alpha ? .85 : .78);
        if (alpha && url.indexOf("data:image/webp") !== 0) url = c.toDataURL("image/png");
        var id = uid(); st.images[id] = url; st.orig[id] = url;
        var info = { id: id, w: c.width, h: c.height, nat: w };
        if (cb) cb(info); else placeImage(info);
      };
      im.onerror = function () { A.toast("That image could not be read. Try another file.", { icon: false }); };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  }
  function placeImage(info) {
    var ar = info.h / info.w, aw = st.g.aw, ah = st.g.ah, w = Math.min(.5, (ah * .6) / (aw * ar));
    var sl = selLayer();
    if (sl && sl.type === "image" && !sl.custom) { sl.src = info.id; sl.ar = ar; sl.custom = true; sl.nat = info.nat; st.sel = sl.id; commit(); draw(); panel(); order(); }
    else { var hasImg = layers().filter(function (x) { return x.type === "image"; })[0]; if (hasImg) { hasImg.src = info.id; hasImg.ar = ar; hasImg.custom = true; hasImg.nat = info.nat; var maxH = st.g.ah * .9; if (hasImg.w * st.g.aw * ar > maxH) hasImg.w = maxH / (st.g.aw * ar); commit(); draw(); panel(); order(); } else { st.layers[st.side] = template("school", sideFor(st.p, st.v, sd()).area); var im2 = layers().filter(function (x) { return x.type === "image"; })[0]; im2.src = info.id; im2.ar = ar; im2.custom = true; im2.nat = info.nat; commit(); draw(); panel(); order(); } }
    st.tab = "logo"; tabs(); panel(); checkRes(); A.announce("Logo uploaded"); A.toast("Logo added. Drag it into place.");
  }
  function readMonths(files) {
    var list = Array.prototype.slice.call(files, 0, 12), start = st.sides.map(function (s) { return s.id; }).indexOf(st.side), done = 0;
    if (files.length > 12) A.toast("Only the first 12 photos are used", { icon: false });
    if (list.length > 1) start = 0;
    list.forEach(function (f, i) {
      readFile(f, true, function (info) {
        var sid = "m" + ((start + i) % 12), ls = st.layers[sid] || (st.layers[sid] = []);
        var ex = ls.filter(function (l) { return l.type === "image"; })[0], ar = info.h / info.w, cover = Math.max(1, (st.g.ah / st.g.aw) / ar);
        if (ex) { ex.src = info.id; ex.ar = ar; ex.w = cover; ex.nat = info.nat; } else ls.unshift({ id: uid(), type: "image", src: info.id, x: .5, y: .5, w: cover, ar: ar, rot: 0, custom: true, nat: info.nat });
        if (++done === list.length) { st.side = "m" + start; commit(); sidesBar(); draw(); panel(); order(); A.announce(done + " photos added"); A.toast(done + (done === 1 ? " photo" : " photos") + " added"); }
      });
    });
  }
  function removeWhite(id, on, cb) {
    var src = st.orig[id] || st.images[id]; if (!on) { st.images[id] = src; cb(); return; }
    var im = new Image();
    im.onload = function () {
      var c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight; var x = c.getContext("2d"); x.drawImage(im, 0, 0);
      var d = x.getImageData(0, 0, c.width, c.height), a = d.data;
      for (var i = 0; i < a.length; i += 4) { var mn = Math.min(a[i], a[i + 1], a[i + 2]); if (mn > 235) a[i + 3] = 0; else if (mn > 210) a[i + 3] = Math.round(a[i + 3] * (235 - mn) / 25); }
      x.putImageData(d, 0, 0); var url = c.toDataURL("image/webp", .85); if (url.indexOf("data:image/webp") !== 0) url = c.toDataURL("image/png");
      st.images[id] = url; delete imgCache[url]; cb();
    };
    im.src = src;
  }

  // ---------- events ----------
  function onClick(e) {
    if (!st) return;
    var t = e.target, b;
    if (t.closest("#stUndo")) return undo();
    if (t.closest("#stRedo")) return redo();
    if (t.closest("#stPreview")) { st.preview = !st.preview; $("#stPreview").setAttribute("aria-pressed", st.preview); $("#stPreview").textContent = st.preview ? "Edit" : "Preview"; draw(); A.announce(st.preview ? "Preview: guides hidden" : "Editing: guides shown"); return; }
    if (t.closest("#stToOrder")) { var oh = $("#stOrderH"); oh.scrollIntoView({ behavior: S.reducedMotion() ? "auto" : "smooth", block: "start" }); oh.setAttribute("tabindex", "-1"); oh.focus({ preventScroll: true }); return; }
    if ((b = t.closest("[data-side]"))) { st.side = b.getAttribute("data-side"); st.sel = ""; sidesBar(); draw(); panel(); var nb = $('#stSides [data-side="' + st.side + '"]') || $('.months [data-side="' + st.side + '"]'); if (nb) nb.focus(); A.announce(sd().name + " side"); return; }
    if ((b = t.closest("[data-tab]")) && b.closest("#stTabs")) { st.tab = b.getAttribute("data-tab"); tabs(); panel(); $("#stt-" + st.tab).focus(); return; }
    if ((b = t.closest("[data-tb]"))) { var lb = layers().filter(function (x) { return x.id === b.getAttribute("data-tb"); })[0]; lb.bold = !lb.bold; commit(); draw(); panel(); $('[data-tb="' + lb.id + '"]').focus(); return; }
    if ((b = t.closest("[data-tc]"))) { var xx = b.getAttribute("data-tc").split("|"), lc = layers().filter(function (x) { return x.id === xx[0]; })[0]; lc.color = xx[1]; commit(); draw(); panel(); var nb3 = $('[data-tc="' + b.getAttribute("data-tc") + '"]'); if (nb3) nb3.focus(); A.announce("Colour changed"); return; }
    if ((b = t.closest("[data-act]"))) {
      var act = b.getAttribute("data-act");
      if (act === "addtext") { addLayer(T("Your text here", .5, .5, .14, { color: "#14213D" })); fit(selLayer(), st.g.aw, st.g.ah); draw(); var ta = $("#stText"); if (ta) { ta.focus(); ta.select(); } return; }
      if (act === "upload") { $("#stFile").click(); return; }
      if (act === "months") { $("#stFiles").click(); return; }
      if (act === "qtynames") { st.qty = A.snap(st.p, nameList().length, minQty(), st.v.stock); order(); A.announce("Quantity set to " + st.qty); return; }
      if (act === "addcart") return addCart();
      if (act === "quote") return quote();
      if (act === "proof") return proof();
    }
    if (t.closest("#stWaOrder")) {
      if (!usedSides().length) { e.preventDefault(); e.stopPropagation(); A.toast("Add some text or a logo first", { icon: false }); return; }
      if (!st.approved) { e.preventDefault(); e.stopPropagation(); st.apErr = "Please tick the box to confirm you have checked the spelling, colours and logo."; order(); $("#stApprove").focus(); A.announce(st.apErr); return; }
      t.closest("#stWaOrder").href = waOrderHref(); var rec = record(); st.stored = A.saveDesign(rec); return;
    }
    if (t.closest("#stDrop")) { $("#stFile").click(); return; }
    if ((b = t.closest("[data-shape]"))) { addLayer(SH(b.getAttribute("data-shape"), .5, .5, b.getAttribute("data-shape") === "ribbon" ? .8 : .4, "#1D3F8F")); return; }
    if ((b = t.closest("[data-tpl]"))) {
      var area = sideFor(st.p, st.v, sd()).area, k = b.getAttribute("data-tpl");
      if (st.p.pr.months && k !== "calendar") { st.layers[st.side] = (st.layers[st.side] || []).filter(function (l) { return l.type === "image" && l.custom; }).concat(template(k, area)); }
      else st.layers[st.side] = template(k, area);
      st.sel = ""; commit(); draw(); sidesBar(); order(); A.announce("Template applied"); A.toast("Template applied. Edit the text to make it yours."); return;
    }
    if ((b = t.closest("[data-var]")) && b.closest("#stPanel")) {
      var nv = A.vOf(st.p, b.getAttribute("data-var"));
      if (nv.stock <= 0) { A.toast(nv.label + " is out of stock", { icon: false }); return; }
      st.v = nv; st.qty = A.snap(st.p, st.qty, minQty(), nv.stock); draw(); autoFix(); draw(); panel(); order(); A.announce(nv.label + " chosen. Preview updated."); var fb = $('[data-var="' + nv.id + '"]'); if (fb) fb.focus(); return;
    }
    if ((b = t.closest("[data-pick]"))) { st.sel = b.getAttribute("data-pick"); draw(); panel(); var pb = $('[data-pick="' + st.sel + '"]'); if (pb) pb.focus(); A.announce("Layer selected. Use the arrow keys on the canvas to move it."); return; }
    if ((b = t.closest("[data-lyr]"))) {
      var x = b.getAttribute("data-lyr").split("|"), ls = layers(), i = ls.map(function (l) { return l.id; }).indexOf(x[1]), l = ls[i];
      if (!l) return;
      if (x[0] === "del") { delLayer(l.id); var nl = $(".lyr .nm"); if (nl) nl.focus(); return; }
      if (x[0] === "up" && i < ls.length - 1) { ls.splice(i, 1); ls.splice(i + 1, 0, l); }
      if (x[0] === "down" && i > 0) { ls.splice(i, 1); ls.splice(i - 1, 0, l); }
      if (x[0] === "hide") l.hidden = !l.hidden;
      if (x[0] === "lock") l.locked = !l.locked;
      commit(); draw(); panel(); order();
      var nb2 = $('[data-lyr="' + x[0] + "|" + l.id + '"]'); if (nb2) nb2.focus();
      A.announce({ up: "Moved up", down: "Moved down", hide: l.hidden ? "Hidden" : "Shown", lock: l.locked ? "Locked" : "Unlocked" }[x[0]]);
      return;
    }
    var sl = selLayer();
    if ((b = t.closest("[data-tog]")) && sl) { var pr = b.getAttribute("data-tog"); sl[pr] = !sl[pr]; commit(); draw(); panel(); var tb = $('[data-tog="' + pr + '"]'); if (tb) tb.focus(); return; }
    if ((b = t.closest("[data-align]")) && sl) { sl.align = b.getAttribute("data-align"); commit(); draw(); panel(); $('[data-align="' + sl.align + '"]').focus(); return; }
    if ((b = t.closest("[data-col]")) && sl) { sl.color = b.getAttribute("data-col"); commit(); draw(); panel(); var cb = $('[data-col="' + sl.color + '"]'); if (cb) cb.focus(); A.announce("Colour changed"); return; }
    if ((b = t.closest("[data-name]"))) { var n = nameList().length || 1; st.nameIdx = (st.nameIdx + +b.getAttribute("data-name") + n) % n; draw(); panel(); $('[data-name="' + b.getAttribute("data-name") + '"]').focus(); return; }
    if ((b = t.closest("[data-q]")) && b.closest("#stOrder")) { var dir = b.getAttribute("data-q"); setQty(st.qty + (+dir) * st.p.step, false); var qb = $('#stOrder [data-q="' + dir + '"]'); (qb && !qb.disabled ? qb : $("#stQty")).focus(); return; }
  }
  function setQty(q, typed) {
    var p = st.p, min = minQty(), n = A.snap(p, q, min, st.v.stock), raw = parseInt(q, 10), before = A.tierOf(p, st.v, st.qty).k;
    st.qmsg = typed && (isNaN(raw) || raw !== n) ? (isNaN(raw) ? "Type a number. Set to " + n + "." : raw < min ? "The minimum for this print method is " + min + ". Set to " + n + "." : raw > st.v.stock ? "Only " + st.v.stock + " in stock. Set to " + n + "." : "Sold in steps of " + p.step + ". Changed to " + n + ".") : "";
    st.qty = n; order();
    var t = A.tierOf(p, st.v, n);
    A.announce((t.k !== before ? t.name + " applied. " : "") + "Total " + money(A.tierOf(p, st.v, n).price * n + method().rate * n + method().setup));
  }
  function onInput(e) {
    if (!st) return;
    var tx = e.target.getAttribute("data-tx");
    if (tx) { var lt = layers().filter(function (x) { return x.id === tx; })[0]; lt.text = e.target.value; lt.size = lt.size0 || (lt.size0 = lt.size); draw(); clearTimeout(onInput.t2); onInput.t2 = setTimeout(function () { lt.size = lt.size0; commit(); draw(); var n = $("#stPanel .note-fix"); if (n) n.textContent = st.notes.join(" "); order(); }, 400); return; }
    var l = selLayer(), pr = e.target.getAttribute("data-prop");
    if (e.target.id === "stNames") { st.names = e.target.value; draw(); clearTimeout(onInput.n); onInput.n = setTimeout(function () { commit(); var hint = e.target.parentNode.querySelector(".hint"); if (hint) hint.textContent = nameList().length + " names. Each is printed with its own name where {name} sits in the text."; }, 500); return; }
    if (e.target.getAttribute("data-pick-col") != null && l) { l.color = e.target.value; draw(); return; }
    if (!l || !pr) return;
    if (pr === "text") { l.text = e.target.value; draw(); clearTimeout(onInput.t); onInput.t = setTimeout(function () { commit(); order(); }, 500); return; }
    if (pr === "size") l.size = +e.target.value / 100;
    if (pr === "w") { l.w = +e.target.value / 100; checkRes(); }
    draw();
  }
  function onChange(e) {
    if (!st) return;
    var tf = e.target.getAttribute("data-tf");
    if (tf) { var lf = layers().filter(function (x) { return x.id === tf; })[0]; lf.font = e.target.value; loadFonts(draw); commit(); draw(); return; }
    var ps = e.target.getAttribute("data-pos");
    if (ps) { if (e.target.checked) st.layers[ps] = template(kindDefault(st.p), sideFor(st.p, st.v, st.sides.filter(function (x) { return x.id === ps; })[0]).area); else st.layers[ps] = []; commit(); sidesBar(); draw(); order(); A.announce(e.target.checked ? "Position added" : "Position removed"); return; }
    var l = selLayer();
    if (e.target.name === "stMethod") { st.method = e.target.value; st.qty = A.snap(st.p, st.qty, minQty(), st.v.stock); order(); var r = $('input[name=stMethod][value="' + st.method + '"]'); if (r) r.focus(); A.announce(D.METHODS[st.method].name + ". Price updated."); return; }
    if (e.target.id === "stQty") { setQty(e.target.value, true); $("#stQty").focus(); return; }
    if (e.target.id === "stApprove") { st.approved = e.target.checked; if (st.approved) { st.apErr = ""; var er = $("#stApproveErr"); if (er) er.textContent = ""; } return; }
    if (e.target.id === "stZoom") { st.zoom = +e.target.value; sizeCanvas(); return; }
    if (e.target.getAttribute("data-prop") === "font" && l) { l.font = e.target.value; loadFonts(draw); commit(); draw(); return; }
    if ((e.target.getAttribute("data-prop") === "size" || e.target.getAttribute("data-prop") === "w") && l) { commit(); order(); return; }
    if (e.target.getAttribute("data-pick-col") != null && l) { commit(); return; }
    if (e.target.hasAttribute("data-nobg") && l) { var on = e.target.checked; removeWhite(l.src, on, function () { l.nobg = on; commit(); draw(); A.announce(on ? "White background removed" : "White background restored"); }); }
  }
  // Drag and drop a logo onto the drop zone or the canvas.
  document.addEventListener("dragover", function (e) { if (!st || !e.target.closest || !(e.target.closest("#stDrop") || e.target.closest("#stWrap"))) return; e.preventDefault(); var d = $("#stDrop"); if (d) d.classList.add("is-over"); });
  document.addEventListener("dragleave", function () { var d = st && $("#stDrop"); if (d) d.classList.remove("is-over"); });
  document.addEventListener("drop", function (e) { if (!st || !e.target.closest || !(e.target.closest("#stDrop") || e.target.closest("#stWrap"))) return; e.preventDefault(); var d = $("#stDrop"); if (d) d.classList.remove("is-over"); var f = e.dataTransfer && e.dataTransfer.files; if (f && f.length) { if (st.p.pr.months) readMonths(f); else readFile(f[0], false); } });
  document.addEventListener("keydown", function (e) { if (st && e.target.id === "stDrop" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); $("#stFile").click(); } });

  // ---------- output: thumbnail, proof, cart, quote ----------
  function renderTo(size, sideObj, preview) { var c = document.createElement("canvas"); c.width = c.height = size; var names = nameList(); drawSide(c, { p: st.p, v: st.v, sd: sideObj, layers: st.layers[sideObj.id] || [], images: st.images, preview: preview !== false, nameText: names[0] || "", size: size > 420 ? 800 : 400 }); return c; }
  function proofCanvas() {
    var used = usedSides(); if (!used.length) used = [st.sides[0]];
    var list = used.slice(0, st.p.pr.months ? 12 : 4), cols = list.length > 1 ? (list.length > 4 ? 4 : 2) : 1, cell = cols > 2 ? 300 : list.length > 1 ? 500 : 800, rows = Math.ceil(list.length / cols);
    var c = document.createElement("canvas"); c.width = cols * cell; c.height = rows * cell + 70; var x = c.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
    list.forEach(function (s, i) { x.drawImage(renderTo(cell, s, true), (i % cols) * cell, Math.floor(i / cols) * cell + 70); });
    x.fillStyle = "#14213D"; x.font = "700 22px Hanken Grotesk, Arial, sans-serif"; x.fillText("Proof: " + st.p.name + (st.p.variants.length > 1 ? " (" + st.v.label + ")" : ""), 16, 30);
    x.font = "16px Hanken Grotesk, Arial, sans-serif"; x.fillText(method().name + " · " + A.qtyText(st.p, st.qty) + " · Kolom Khata Stationers (sample) · " + new Date().toLocaleDateString("en-IN"), 16, 56);
    return c;
  }
  function proof() {
    var c = proofCanvas();
    c.toBlob(function (b) {
      if (!b) { A.toast("The proof could not be made in this browser", { icon: false }); return; }
      var url = URL.createObjectURL(b), a = document.createElement("a"); a.href = url; a.download = "kolom-khata-proof-" + st.p.slug + ".png"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      A.toast("Proof downloaded"); A.announce("Proof downloaded as a PNG picture");
    }, "image/png");
  }
  function record() {
    var used = usedSides(), first = used[0] || st.sides[0];
    var thumb = renderTo(200, first, true).toDataURL("image/jpeg", .8);
    var pc = proofCanvas(), proofUrl = pc.toDataURL("image/jpeg", .82);
    // Keep only the images this design still uses.
    var keep = {}; Object.keys(st.layers).forEach(function (k) { st.layers[k].forEach(function (l) { if (l.type === "image" && st.images[l.src]) keep[l.src] = st.images[l.src]; }); });
    return { id: st.designId, slug: st.p.slug, vid: st.v.id, method: st.method, layers: st.layers, images: keep, names: st.names, thumb: thumb, proof: proofUrl, title: (texts()[0] || st.p.name).slice(0, 40), updated: Date.now(),
      sides: st.p.pr.months ? [used.length + " months"] : used.map(function (s) { return s.name; }) };
  }
  function addCart() {
    var used = usedSides();
    if (!used.length) { A.toast("Add some text or a logo first", { icon: false }); A.announce("The design is empty. Add some text or a logo first."); return; }
    if (!st.approved) { st.apErr = "Please tick the box to confirm you have checked the spelling, colours and logo."; order(); var cb = $("#stApprove"); cb.focus(); A.announce(st.apErr); return; }
    var rec = record(), ok = A.saveDesign(rec); st.stored = ok;
    var d = { id: rec.id, method: rec.method, sides: rec.sides, thumb: rec.thumb, names: st.p.pr.names ? nameList().length : 0 };
    var lc = A.addCustom(st.p.slug, st.v.id, st.qty, d, st.lineKey || "");
    if (!lc) return;
    if (!ok) order();
    if (st.lineKey) { st.lineKey = A.lineKey(lc.l); A.navigate(A.u("/cart")); A.toast("Cart line updated"); }
    else st.lineKey = A.lineKey(lc.l);
  }
  function quote() {
    var used = usedSides(), rec = used.length ? record() : null;
    if (rec) { st.stored = A.saveDesign(rec); }
    var dtext = used.length ? A.customText({ method: st.method, sides: rec.sides, names: st.p.pr.names ? nameList().length : 0 }) + ". Text: " + (texts().join(" / ") || "none") : "";
    A.openQuote({ slug: st.p.slug, vid: st.v.id, qty: Math.max(st.qty, st.p.wq), dtext: dtext, thumb: rec ? rec.thumb : "" });
  }

  window.KKDesign = { mount: mount, unmount: unmount, sample: sample, drawSide: drawSide, template: template };
})();
