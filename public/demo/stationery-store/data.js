/* Kolom Khata Stationers, sample store data.
 *
 * Everything here is invented for a sample website: the shop, the products,
 * the prices, the reviews, the orders and the quotes. Plain JS with JSDoc
 * types, because the demo is a static page with no build step.
 * Image keys map to /demo/stationery-store/images/<key>-800.webp and -400.webp.
 *
 * Pricing: every variant has an MRP, a retail price (buyable from the
 * product's retail minimum) and a wholesale price that applies on its own
 * once a cart line reaches the product's wholesale quantity (wq). Some
 * products have a third, bulk tier (bq / bp).
 */
(function () {
  "use strict";

  /** @typedef {"office"|"school"|"art"|"play"|"toys"|"gifts"|"prizes"|"bags"|"uniform"|"calendars"} CatId */
  /** @typedef {"school"|"play"|"shop"|"office"|"event"} BuyerId */
  /**
   * @typedef {Object} Variant
   * @property {string} id
   * @property {string} label     size or colour shown on the button, e.g. "Blue" or "10 in"
   * @property {string} [colour]  swatch colour (hex) when the option is a colour
   * @property {number} mrp       printed MRP per unit
   * @property {number} price     retail price per unit, GST included
   * @property {number} wp        wholesale price per unit from Product.wq
   * @property {number} [bp]      bulk price per unit from Product.bq
   * @property {number} stock
   * @property {string} img       image key shown for this variant
   * @property {string} [tint]    mockup tint for the design studio when the photo is another colour
   * @property {string} [plate]   medal or plate colour under engraving
   */
  /**
   * Print area on a product photo, as fractions of the square image.
   * @typedef {Object} Area
   * @property {number} x
   * @property {number} y
   * @property {number} w
   * @property {number} h
   * @property {number} [r]       rotation in degrees
   * @property {"rect"|"circle"|"label"} [shape]
   * @property {string} [plate]   fill drawn under the design (blank label, plate)
   */
  /** @typedef {{id:string,name:string,img:string,area:Area}} Side */
  /**
   * One way of printing a product. Rates are per unit: [below the wholesale
   * quantity, at or above it]. Setup is charged once per design.
   * @typedef {{id:string,rate:number[],setup:number,min:number}} PrintMethod
   */
  /**
   * @typedef {Object} PrintSpec
   * @property {"print"|"engrave"} blend
   * @property {Side[]} sides
   * @property {PrintMethod[]} methods
   * @property {boolean} [names]   certificates and ID cards: a list of names
   * @property {boolean} [months]  photo calendars: one photo per month
   * @property {string} kind       template family: "school"|"company"|"sports"|"prize"|"calendar"|"label"
   */
  /**
   * @typedef {Object} Product
   * @property {string} slug
   * @property {string} name
   * @property {CatId} cat
   * @property {BuyerId[]} buyers
   * @property {string} unit      what one unit is, e.g. "pc", "box of 12"
   * @property {number} min       retail minimum, in units
   * @property {number} step      sold in multiples of this
   * @property {number} wq        wholesale price from this quantity
   * @property {number} [bq]      bulk price from this quantity
   * @property {string} desc
   * @property {string[][]} specs [label, value] pairs
   * @property {string[]} imgs    at least two image keys
   * @property {number} rating
   * @property {number} reviews
   * @property {string[]} tags
   * @property {string} created   ISO date
   * @property {number} rank
   * @property {boolean} [best]
   * @property {Variant[]} variants
   * @property {PrintSpec} pr
   */

  /** @type {{id:CatId,img:string,name:string,short:string,icon:string,line:string}[]} */
  var CATS = [
    { id: "office", img: "of-desk", name: "Office stationery", short: "Office", icon: "file", line: "Pens, paper, files, registers and desk basics." },
    { id: "school", img: "sc-notebooks", name: "School stationery", short: "School", icon: "pencil", line: "Pencils, notebooks, geometry boxes and exam boards." },
    { id: "art", img: "ac-crayons", name: "Art and craft", short: "Art", icon: "brush", line: "Crayons, colours, brushes, craft paper and glitter." },
    { id: "play", img: "pl-blocks", name: "Play school materials", short: "Play school", icon: "blocks", line: "Flash cards, wooden puzzles, blocks and play dough." },
    { id: "toys", img: "ty-board", name: "Toys and games", short: "Toys", icon: "cube", line: "Board games, puzzle cubes, cars, balls and soft toys." },
    { id: "gifts", img: "gf-mug", name: "Gift items", short: "Gifts", icon: "gift", line: "Mugs, pen sets, frames, keychains and gift wrap." },
    { id: "prizes", img: "pr-cup", name: "Prizes and trophies", short: "Prizes", icon: "trophy", line: "Medals, cups, shields, mementos, certificates and ribbons." },
    { id: "bags", img: "bg-bag", name: "School bags and bottles", short: "Bags", icon: "bag", line: "Backpacks, steel bottles, lunch boxes and pouches." },
    { id: "uniform", img: "un-cap", name: "Caps and uniform accessories", short: "Caps and ties", icon: "cap", line: "Printed caps, ID card holders, ties and belts." },
    { id: "calendars", img: "cl-diary", name: "Calendars and diaries", short: "Calendars", icon: "calendar", line: "Wall and desk calendars, photo calendars and diaries." }
  ];

  var BUYERS = [
    { id: "school", name: "Schools", img: "ln-school", line: "Notebooks, exam boards, ID cards, ties and annual prizes." },
    { id: "play", name: "Play schools", img: "ln-play", line: "Flash cards, wooden puzzles, crayons and play dough." },
    { id: "shop", name: "Shops", img: "ln-shop", line: "Fast-moving stock to resell: pens, pencils, gifts, toys." },
    { id: "office", name: "Offices", img: "ln-office", line: "A4 paper, files, registers, diaries and printed mugs." },
    { id: "event", name: "Events and prizes", img: "ln-event", line: "Medals, cups, shields, certificates and caps." }
  ];

  var BUDGETS = [50, 199, 499];

  /** Print methods: name and a one-line explanation. */
  var METHODS = {
    digital: { name: "Full colour digital print", short: "Digital print", line: "Any colours and photos. Good for small quantities." },
    screen: { name: "One-colour screen print", short: "Screen print", line: "One ink colour, sharp and long lasting. Best for big runs." },
    laser: { name: "Laser engraving", short: "Laser engraving", line: "Cut into metal or wood. Never fades." },
    embroidery: { name: "Embroidery", short: "Embroidery", line: "Stitched in thread. Looks premium on caps and bags." },
    label: { name: "Printed sticker label", short: "Sticker label", line: "Your name and logo on a label on each pack." }
  };

  // Short builders keep the catalogue readable.
  function v(id, label, colour, mrp, price, wp, stock, img, extra) {
    var o = { id: id, label: label, colour: colour || "", mrp: mrp, price: price, wp: wp, stock: stock, img: img };
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }
  function side(id, name, img, x, y, w, h, r, shape, plate) {
    return { id: id, name: name, img: img, area: { x: x, y: y, w: w, h: h, r: r || 0, shape: shape || "rect", plate: plate || "" } };
  }
  function m(id, small, big, setup, min) { return { id: id, rate: [small, big], setup: setup, min: min }; }
  /** A sticker label on the pack, for things with no flat surface to print on. */
  function label(img, rate, min) {
    return { blend: "print", kind: "label", sides: [side("front", "Pack label", img, .3, .58, .4, .22, -3, "label", "#ffffff")], methods: [m("label", rate[0], rate[1], 0, min || 10)] };
  }

  /** @type {Product[]} */
  var PRODUCTS = [
    // ---------- Office ----------
    { slug: "smooth-ball-pen", name: "Smooth-write Ball Pen", cat: "office", buyers: ["office", "school", "shop"], unit: "pc", min: 1, step: 1, wq: 50, bq: 500,
      imgs: ["of-pens", "of-pens-d"], rating: 4.6, reviews: 318, tags: ["pen", "ball pen", "office", "bestseller"], created: "2026-04-02", rank: 1, best: true,
      desc: "A light, everyday ball pen with a 0.7 mm tip that does not blot. The most asked-for pen at our counter, by schools and offices alike.",
      specs: [["Tip", "0.7 mm"], ["Ink", "Oil based, smudge resistant"], ["Writes", "About 1,200 metres"], ["Pack", "Sold loose, packed in boxes of 50"]],
      variants: [v("blue", "Blue", "#1F4FB4", 10, 8, 6, 2400, "of-pens", { bp: 5 }), v("black", "Black", "#1C1C1C", 10, 8, 6, 1800, "of-pens-d", { bp: 5 }), v("red", "Red", "#C0261E", 10, 8, 6, 40, "of-pens", { bp: 5 })],
      pr: { blend: "print", kind: "company", sides: [side("barrel", "Pen barrel", "of-pens", .4, .24, .26, .05, 64)], methods: [m("screen", 3, 2, 300, 100), m("digital", 6, 4, 0, 25)] } },
    { slug: "gel-pen-pack-10", name: "Gel Pens, Pack of 10 Colours", cat: "office", buyers: ["school", "shop"], unit: "pack of 10", min: 1, step: 1, wq: 12,
      imgs: ["of-gelpens", "of-pens-d"], rating: 4.5, reviews: 141, tags: ["gel pen", "colour pen", "glitter"], created: "2026-08-11", rank: 14,
      desc: "Ten bright gel pens in one pack, including glitter shades. Children love them for project work and greeting cards.",
      specs: [["In the pack", "10 pens, 10 colours"], ["Tip", "0.8 mm"], ["Barrel", "Clear, with grip"]],
      variants: [v("one", "Pack of 10", "", 120, 99, 72, 260, "of-gelpens")], pr: label("of-gelpens", [6, 3], 12) },
    { slug: "a4-copier-paper-ream", name: "A4 Copier Paper Ream", cat: "office", buyers: ["office", "school"], unit: "ream (500 sheets)", min: 1, step: 1, wq: 5, bq: 50,
      imgs: ["of-paper", "of-paper-d"], rating: 4.7, reviews: 206, tags: ["a4", "paper", "copier", "printer paper"], created: "2026-02-20", rank: 4, best: true,
      desc: "Bright white A4 paper that runs through office printers and photocopiers without jamming. 500 sheets in each ream.",
      specs: [["Size", "210 x 297 mm"], ["Sheets", "500 per ream, 5 reams per box"], ["Whiteness", "High white"]],
      variants: [v("70", "70 gsm", "", 340, 299, 259, 300, "of-paper", { bp: 249 }), v("75", "75 gsm", "", 380, 330, 285, 180, "of-paper-d", { bp: 275 })],
      pr: label("of-paper", [10, 6], 5) },
    { slug: "stapler-with-pins", name: "Stapler No. 10 with 1,000 Pins", cat: "office", buyers: ["office", "school", "shop"], unit: "pc", min: 1, step: 1, wq: 12,
      imgs: ["of-stapler", "of-desk"], rating: 4.4, reviews: 88, tags: ["stapler", "pins", "office"], created: "2026-03-14", rank: 22,
      desc: "A handy stapler that fits in a pencil box, with a box of 1,000 No. 10 pins. Staples up to 15 sheets.",
      specs: [["Pins", "No. 10, box of 1,000 included"], ["Staples", "Up to 15 sheets"], ["Body", "Metal with plastic cover"]],
      variants: [v("one", "With 1,000 pins", "", 120, 95, 72, 140, "of-stapler")], pr: label("of-stapler", [6, 3], 12) },
    { slug: "box-file-foolscap", name: "Box File, Foolscap", cat: "office", buyers: ["office", "school"], unit: "pc", min: 1, step: 1, wq: 20,
      imgs: ["of-files", "of-files-d"], rating: 4.5, reviews: 74, tags: ["file", "box file", "folder", "office"], created: "2026-05-09", rank: 26,
      desc: "Strong board box file with a lever clip and a spine label. Holds about 400 sheets.",
      specs: [["Size", "Foolscap"], ["Holds", "About 400 sheets"], ["Clip", "Spring lever"]],
      variants: [v("black", "Black", "#1C1C1C", 110, 85, 62, 90, "of-files"), v("yellow", "Yellow", "#F2C230", 110, 85, 62, 60, "of-files-d"), v("red", "Red", "#C0261E", 110, 85, 62, 0, "of-files-d", { tint: "#C0261E" })],
      pr: { blend: "print", kind: "company", sides: [side("front", "Front cover", "of-files-d", .12, .56, .3, .22, -14)], methods: [m("digital", 25, 15, 0, 1), m("screen", 10, 6, 300, 50)] } },
    { slug: "sticky-notes-3x3", name: "Sticky Notes, 3 x 3 in", cat: "office", buyers: ["office", "shop"], unit: "pad of 100", min: 1, step: 1, wq: 24,
      imgs: ["of-notes", "of-desk"], rating: 4.6, reviews: 120, tags: ["sticky notes", "post it", "notes", "office"], created: "2026-09-01", rank: 18,
      desc: "Soft pastel sticky notes that stay stuck and peel off clean. 100 sheets in each pad.",
      specs: [["Size", "76 x 76 mm"], ["Sheets", "100 per pad"]],
      variants: [v("pink", "Pink", "#E9B8E0", 60, 45, 32, 200, "of-notes"), v("blue", "Blue", "#A9E1F2", 60, 45, 32, 160, "of-notes"), v("mix", "Mixed pastel", "#F4E7A1", 60, 45, 32, 120, "of-notes")],
      pr: { blend: "print", kind: "company", sides: [side("top", "Top sheet", "of-notes", .24, .43, .32, .3, 0)], methods: [m("digital", 14, 9, 0, 10)] } },
    { slug: "long-register-khata", name: "Long Register (Khata Book)", cat: "office", buyers: ["office", "shop", "school"], unit: "pc", min: 1, step: 1, wq: 12,
      imgs: ["of-register", "of-register-d"], rating: 4.8, reviews: 162, tags: ["register", "khata", "ledger", "account book"], created: "2026-01-18", rank: 6, best: true,
      desc: "The classic hardbound long register with ruled and numbered pages. Used for accounts, attendance and stock books.",
      specs: [["Size", "Long, 33 x 20 cm"], ["Binding", "Hardbound, sewn"], ["Pages", "Numbered, ruled"]],
      variants: [v("100", "100 pages", "", 90, 72, 58, 160, "of-register"), v("200", "200 pages", "", 160, 130, 104, 120, "of-register"), v("300", "300 pages", "", 230, 189, 152, 30, "of-register-d")],
      pr: label("of-register-d", [12, 8], 12) },
    { slug: "highlighter-set-5", name: "Highlighter Pens, Set of 5", cat: "office", buyers: ["office", "school", "shop"], unit: "set of 5", min: 1, step: 1, wq: 10,
      imgs: ["of-highlighter", "of-desk"], rating: 4.5, reviews: 69, tags: ["highlighter", "marker", "fluorescent"], created: "2026-10-02", rank: 30,
      desc: "Five fluorescent highlighters with a chisel tip for thick and thin lines. Quick-dry ink that does not bleed through.",
      specs: [["Colours", "Yellow, green, pink, orange, purple"], ["Tip", "Chisel, 1 to 5 mm"]],
      variants: [v("one", "Set of 5", "", 150, 120, 92, 85, "of-highlighter")], pr: label("of-highlighter", [8, 5], 10) },

    // ---------- School ----------
    { slug: "hb-pencils", name: "HB Pencils with Eraser Tip", cat: "school", buyers: ["school", "shop", "play"], unit: "pc", min: 5, step: 5, wq: 50, bq: 500,
      imgs: ["sc-pencils", "sc-pencils-d"], rating: 4.7, reviews: 402, tags: ["pencil", "hb", "school", "bestseller"], created: "2026-03-01", rank: 2, best: true,
      desc: "Smooth HB pencils that sharpen without breaking, with a small eraser on top. Sold from 5 pencils; schools take them by the hundred.",
      specs: [["Grade", "HB"], ["Length", "17.5 cm"], ["Pack", "Boxes of 10, cartons of 500"]],
      variants: [v("one", "HB with eraser", "", 7, 6, 4, 6000, "sc-pencils", { bp: 3 })],
      pr: { blend: "print", kind: "school", sides: [side("front", "Pencil box label", "sc-pencils-d", .28, .62, .44, .2, 0, "label", "#ffffff")], methods: [m("screen", 2, 1, 400, 200), m("label", 3, 2, 0, 50)] } },
    { slug: "ruled-notebook-172", name: "Ruled Notebook, 172 Pages", cat: "school", buyers: ["school", "shop"], unit: "pc", min: 1, step: 1, wq: 24, bq: 500,
      imgs: ["sc-notebooks", "sc-notebooks-d"], rating: 4.7, reviews: 288, tags: ["notebook", "copy", "khata", "school", "bestseller"], created: "2026-02-02", rank: 3, best: true,
      desc: "Thick 58 gsm pages that take ink without showing through, with a laminated cover. Schools can order them with their own name and crest on the cover.",
      specs: [["Pages", "172 (long size: 160)"], ["Paper", "58 gsm"], ["Cover", "Laminated board"]],
      variants: [v("single", "Single line", "", 55, 45, 34, 900, "sc-notebooks", { bp: 31 }), v("four", "Four line", "", 55, 45, 34, 600, "sc-notebooks", { bp: 31 }), v("long", "Long size", "", 65, 55, 42, 400, "sc-notebooks-d", { bp: 38 })],
      pr: { blend: "print", kind: "school", sides: [side("cover", "Front cover", "ac-drawbook", .5, .56, .32, .2, -20)], methods: [m("digital", 20, 7, 0, 1), m("screen", 6, 3, 400, 100)] } },
    { slug: "eraser-sharpener-combo", name: "Eraser and Sharpener Combo", cat: "school", buyers: ["school", "shop", "play"], unit: "set", min: 5, step: 5, wq: 50,
      imgs: ["sc-eraser", "sc-pencils"], rating: 4.4, reviews: 96, tags: ["eraser", "sharpener", "rubber"], created: "2026-06-12", rank: 25,
      desc: "A dust-free eraser and a single-hole sharpener with a steel blade. A favourite return gift for small children.",
      specs: [["Eraser", "Dust-free, white"], ["Sharpener", "Steel blade"]],
      variants: [v("one", "Eraser + sharpener", "", 10, 8, 5, 1400, "sc-eraser")], pr: label("sc-eraser", [3, 2], 50) },
    { slug: "geometry-box", name: "Geometry Box", cat: "school", buyers: ["school", "shop"], unit: "pc", min: 1, step: 1, wq: 12,
      imgs: ["sc-geometry", "sc-geometry-d"], rating: 4.6, reviews: 133, tags: ["geometry", "compass", "maths"], created: "2026-03-22", rank: 12,
      desc: "Compass, divider, protractor, set squares, scale, pencil and eraser in a snap-shut box. Everything for Class 5 to 10 maths.",
      specs: [["Inside", "9 pieces"], ["Compass", "Metal, with lead holder"]],
      variants: [v("blue", "Blue box", "#2E5DB8", 120, 99, 76, 120, "sc-geometry"), v("pink", "Pink box", "#E58FB2", 120, 99, 76, 70, "sc-geometry-d")],
      pr: label("sc-geometry-d", [8, 5], 12) },
    { slug: "wooden-scale-30cm", name: "Wooden Scale, 30 cm", cat: "school", buyers: ["school", "shop"], unit: "pc", min: 1, step: 1, wq: 50,
      imgs: ["sc-scale", "sc-geometry"], rating: 4.3, reviews: 57, tags: ["scale", "ruler"], created: "2026-04-28", rank: 33,
      desc: "A straight, smooth wooden scale marked in centimetres and inches. Does not bend or snap like thin plastic.",
      specs: [["Length", "30 cm / 12 in"], ["Marking", "cm and inch"]],
      variants: [v("one", "30 cm", "", 25, 20, 13, 500, "sc-scale")], pr: label("sc-scale", [3, 2], 50) },
    { slug: "exam-clip-board", name: "Exam Clip Board", cat: "school", buyers: ["school", "office"], unit: "pc", min: 1, step: 1, wq: 24,
      imgs: ["sc-clipboard", "sc-notebooks"], rating: 4.6, reviews: 104, tags: ["exam board", "clip board", "pad"], created: "2026-01-30", rank: 15,
      desc: "A firm hardboard exam pad with a strong metal clip. Print your school name and crest on it and every child carries your name to the exam hall.",
      specs: [["Size", "Foolscap, 35 x 23 cm"], ["Board", "3 mm hardboard"], ["Clip", "Metal, wide grip"]],
      variants: [v("one", "Foolscap", "", 80, 65, 48, 300, "sc-clipboard")],
      pr: { blend: "print", kind: "school", sides: [side("front", "Front", "sc-clipboard", .14, .2, .72, .6, 0)], methods: [m("screen", 12, 7, 350, 50), m("digital", 30, 18, 0, 1)] } },
    { slug: "chart-paper", name: "Chart Paper, 50 x 70 cm", cat: "school", buyers: ["school", "play", "shop"], unit: "sheet", min: 5, step: 5, wq: 50,
      imgs: ["sc-chart", "ac-paper"], rating: 4.5, reviews: 77, tags: ["chart paper", "project", "poster"], created: "2026-07-07", rank: 28,
      desc: "Smooth coloured chart paper for school projects, notice boards and classroom displays.",
      specs: [["Size", "50 x 70 cm"], ["Thickness", "120 gsm"]],
      variants: [v("white", "White", "#FFFFFF", 10, 8, 5, 800, "sc-chart"), v("yellow", "Yellow", "#F2D03B", 10, 8, 5, 500, "sc-chart"), v("pink", "Pink", "#E88BB0", 10, 8, 5, 450, "sc-chart"), v("green", "Green", "#55A868", 10, 8, 5, 40, "sc-chart")],
      pr: label("sc-chart", [2, 1], 100) },
    { slug: "brown-cover-roll", name: "Brown Book Cover Paper, 10 m Roll", cat: "school", buyers: ["school", "shop"], unit: "roll", min: 1, step: 1, wq: 20,
      imgs: ["sc-cover", "sc-notebooks-d"], rating: 4.4, reviews: 61, tags: ["brown paper", "book cover", "khaki"], created: "2026-05-15", rank: 36,
      desc: "Strong brown kraft paper for covering books at the start of the session. One roll covers about 40 notebooks.",
      specs: [["Length", "10 m"], ["Width", "50 cm"]],
      variants: [v("one", "10 m roll", "", 60, 50, 38, 150, "sc-cover")], pr: label("sc-cover", [5, 3], 20) },

    // ---------- Art ----------
    { slug: "wax-crayons", name: "Wax Crayons", cat: "art", buyers: ["play", "school", "shop"], unit: "box", min: 1, step: 1, wq: 24,
      imgs: ["ac-crayons", "ac-crayons-d"], rating: 4.6, reviews: 190, tags: ["crayons", "colours", "drawing"], created: "2026-02-10", rank: 8, best: true,
      desc: "Bright, non-toxic wax crayons that do not snap easily in small hands. The first box every play school child needs.",
      specs: [["Safe", "Non-toxic"], ["Length", "9 cm"]],
      variants: [v("12", "12 colours", "", 40, 34, 25, 600, "ac-crayons"), v("24", "24 colours", "", 75, 64, 48, 240, "ac-crayons-d")], pr: label("ac-crayons", [4, 2], 24) },
    { slug: "watercolour-cakes-12", name: "Watercolour Cakes, 12 Shades", cat: "art", buyers: ["school", "shop"], unit: "box", min: 1, step: 1, wq: 12,
      imgs: ["ac-paints", "ac-paints-d"], rating: 4.5, reviews: 82, tags: ["watercolour", "paint", "drawing"], created: "2026-06-21", rank: 27,
      desc: "Twelve rich watercolour cakes with a brush, in a flat tin that fits in a school bag.",
      specs: [["Shades", "12"], ["Includes", "One round brush"]],
      variants: [v("one", "12 shades", "", 90, 75, 56, 140, "ac-paints")], pr: label("ac-paints", [5, 3], 12) },
    { slug: "paint-brush-set-6", name: "Paint Brush Set of 6", cat: "art", buyers: ["school", "shop"], unit: "set of 6", min: 1, step: 1, wq: 12,
      imgs: ["ac-brushes", "ac-paints"], rating: 4.4, reviews: 49, tags: ["brush", "paint brush", "art"], created: "2026-07-19", rank: 38,
      desc: "Six brushes from fine to flat, with soft synthetic hair that holds its shape wash after wash.",
      specs: [["Sizes", "0, 2, 4, 6, 8 and flat 10"], ["Hair", "Synthetic"]],
      variants: [v("one", "Set of 6", "", 80, 65, 48, 110, "ac-brushes")], pr: label("ac-brushes", [5, 3], 12) },
    { slug: "colour-craft-paper-a4", name: "Colour Craft Paper, A4, 50 Sheets", cat: "art", buyers: ["play", "school", "shop"], unit: "pack of 50", min: 1, step: 1, wq: 10,
      imgs: ["ac-paper", "ac-paper-d"], rating: 4.6, reviews: 98, tags: ["craft paper", "colour paper", "origami"], created: "2026-08-30", rank: 20,
      desc: "Fifty sheets in ten bright colours, firm enough for cut-outs, cards and paper folding.",
      specs: [["Size", "A4"], ["Weight", "80 gsm"], ["Colours", "10"]],
      variants: [v("one", "Pack of 50", "", 120, 99, 75, 160, "ac-paper")], pr: label("ac-paper", [6, 3], 10) },
    { slug: "glitter-glue-set-6", name: "Glitter Glue, Set of 6", cat: "art", buyers: ["play", "school", "shop"], unit: "set of 6", min: 1, step: 1, wq: 12,
      imgs: ["ac-glue", "ac-craft"], rating: 4.3, reviews: 44, tags: ["glitter", "glue", "craft"], created: "2026-10-12", rank: 40,
      desc: "Six squeezy tubes of glitter glue for cards, rangoli designs and project files. Washable.",
      specs: [["Tubes", "6 x 10 ml"], ["Washable", "Yes"]],
      variants: [v("one", "Set of 6", "", 70, 58, 42, 40, "ac-glue")], pr: label("ac-glue", [5, 3], 12) },
    { slug: "sketch-pens-12", name: "Sketch Pens, 12 Colours", cat: "art", buyers: ["play", "school", "shop"], unit: "pack of 12", min: 1, step: 1, wq: 24,
      imgs: ["ac-sketch", "ac-crayons-d"], rating: 4.5, reviews: 151, tags: ["sketch pen", "felt pen", "colour"], created: "2026-03-05", rank: 13,
      desc: "Twelve washable sketch pens with a fat, safe tip. Caps snap on tight so they do not dry out.",
      specs: [["Colours", "12"], ["Ink", "Washable"]],
      variants: [v("one", "12 colours", "", 50, 42, 30, 300, "ac-sketch")], pr: label("ac-sketch", [4, 2], 24) },
    { slug: "drawing-book-36", name: "Drawing Book, 36 Pages", cat: "art", buyers: ["school", "play", "shop"], unit: "pc", min: 1, step: 1, wq: 24,
      imgs: ["ac-drawbook", "ac-sketch"], rating: 4.5, reviews: 72, tags: ["drawing book", "sketch book", "art"], created: "2026-05-27", rank: 24,
      desc: "Thick white drawing sheets with a spiral binding that lies flat. Order with your school name on the cover.",
      specs: [["Pages", "36"], ["Paper", "120 gsm"], ["Binding", "Spiral"]],
      variants: [v("one", "36 pages", "", 40, 34, 24, 260, "ac-drawbook")],
      pr: { blend: "print", kind: "school", sides: [side("cover", "Front cover", "ac-drawbook", .5, .56, .32, .2, -20)], methods: [m("digital", 18, 6, 0, 1), m("screen", 5, 3, 400, 100)] } },
    { slug: "kids-craft-kit", name: "Kids Craft Kit", cat: "art", buyers: ["play", "school", "event"], unit: "kit", min: 1, step: 1, wq: 10,
      imgs: ["ac-craft", "ac-glue"], rating: 4.7, reviews: 63, tags: ["craft kit", "return gift", "activity"], created: "2026-11-02", rank: 16,
      desc: "Scissors, colour pencils, pom-poms, paints and paper in one box. A ready activity for summer camps and return gifts.",
      specs: [["Inside", "About 40 pieces"], ["Age", "4 years and up"]],
      variants: [v("one", "One kit", "", 299, 249, 189, 60, "ac-craft")], pr: label("ac-craft", [10, 6], 10) },

    // ---------- Play school ----------
    { slug: "flash-card-set", name: "Flash Card Set", cat: "play", buyers: ["play", "school", "shop"], unit: "set of 26", min: 1, step: 1, wq: 10,
      imgs: ["pl-cards", "pl-cards-d"], rating: 4.8, reviews: 176, tags: ["flash cards", "abc", "123", "play school", "bestseller"], created: "2026-04-16", rank: 5, best: true,
      desc: "Thick, wipe-clean picture cards with rounded corners. Teachers use them for circle time, children use them for games.",
      specs: [["Cards", "26 per set (Numbers: 20)"], ["Size", "15 x 10 cm"], ["Finish", "Laminated, rounded corners"]],
      variants: [v("abc", "ABC", "", 120, 99, 72, 140, "pl-cards"), v("123", "Numbers", "", 110, 89, 65, 120, "pl-cards-d"), v("fruit", "Fruits", "", 120, 99, 72, 80, "pl-cards"), v("animal", "Animals", "", 120, 99, 72, 0, "pl-cards-d")],
      pr: label("pl-cards", [8, 5], 10) },
    { slug: "wooden-alphabet-puzzle", name: "Wooden Alphabet Puzzle", cat: "play", buyers: ["play", "shop"], unit: "pc", min: 1, step: 1, wq: 6,
      imgs: ["pl-alphabet", "pl-blocks"], rating: 4.7, reviews: 91, tags: ["alphabet", "puzzle", "wooden", "play school"], created: "2026-06-03", rank: 17,
      desc: "Chunky, bright wooden letters that children lift out and fit back in. Safe paints and smooth edges.",
      specs: [["Pieces", "26 letters"], ["Material", "Wood, non-toxic paint"]],
      variants: [v("one", "A to Z", "", 299, 249, 189, 45, "pl-alphabet")], pr: label("pl-alphabet", [10, 6], 6) },
    { slug: "wooden-building-blocks", name: "Wooden Building Blocks, 50 Pieces", cat: "play", buyers: ["play", "shop"], unit: "set", min: 1, step: 1, wq: 6,
      imgs: ["pl-blocks", "pl-blocks-d"], rating: 4.8, reviews: 84, tags: ["blocks", "wooden", "building"], created: "2026-07-25", rank: 19,
      desc: "Fifty smooth wooden blocks in arches, pillars and cubes. Builds towers, bridges and patience.",
      specs: [["Pieces", "50"], ["Material", "Pine wood"]],
      variants: [v("natural", "Natural wood", "", 450, 389, 299, 30, "pl-blocks"), v("colour", "Coloured", "", 499, 429, 329, 22, "pl-blocks-d")], pr: label("pl-blocks", [10, 6], 6) },
    { slug: "bead-counting-frame", name: "Bead Counting Frame", cat: "play", buyers: ["play", "school"], unit: "pc", min: 1, step: 1, wq: 6,
      imgs: ["pl-abacus", "ln-play"], rating: 4.6, reviews: 58, tags: ["abacus", "counting", "maths", "play school"], created: "2026-08-19", rank: 29,
      desc: "Ten rows of ten wooden beads on a sturdy stand. The easiest way to show tens and ones.",
      specs: [["Beads", "100"], ["Height", "30 cm"]],
      variants: [v("one", "10 rows", "", 350, 299, 229, 26, "pl-abacus")], pr: label("pl-abacus", [10, 6], 6) },
    { slug: "play-dough-6", name: "Play Dough, 6 Colours", cat: "play", buyers: ["play", "shop"], unit: "pack", min: 1, step: 1, wq: 12,
      imgs: ["pl-clay", "pl-clay-d"], rating: 4.6, reviews: 112, tags: ["play dough", "clay", "modelling"], created: "2026-09-09", rank: 21,
      desc: "Soft, non-sticky dough in six colours that stays fresh in its tub. Made for little hands.",
      specs: [["Colours", "6 x 50 g"], ["Safe", "Non-toxic, wheat based"]],
      variants: [v("one", "6 colours", "", 150, 125, 90, 90, "pl-clay")], pr: label("pl-clay", [6, 4], 12) },

    // ---------- Toys ----------
    { slug: "puzzle-cube-3x3", name: "Puzzle Cube 3 x 3", cat: "toys", buyers: ["shop", "event", "school"], unit: "pc", min: 1, step: 1, wq: 12,
      imgs: ["ty-cube", "ty-cube-d"], rating: 4.5, reviews: 139, tags: ["cube", "puzzle", "brain game", "return gift"], created: "2026-05-05", rank: 23,
      desc: "A smooth-turning 3 x 3 puzzle cube. A favourite prize for quiz winners and a steady seller in any toy shop.",
      specs: [["Size", "5.6 cm"], ["Turning", "Smooth, adjustable"]],
      variants: [v("one", "3 x 3", "", 199, 159, 115, 120, "ty-cube")], pr: label("ty-cube", [8, 5], 12) },
    { slug: "ludo-snakes-ladders", name: "Ludo and Snakes and Ladders, 2 in 1", cat: "toys", buyers: ["shop", "school"], unit: "set", min: 1, step: 1, wq: 12,
      imgs: ["ty-board", "ty-board-d"], rating: 4.7, reviews: 156, tags: ["ludo", "snakes and ladders", "board game"], created: "2026-03-29", rank: 10,
      desc: "A folding board with ludo on one side and snakes and ladders on the other, with dice and counters.",
      specs: [["Board", "Folding, 40 x 40 cm"], ["Includes", "2 dice, 16 counters"]],
      variants: [v("one", "2 in 1", "", 120, 99, 70, 200, "ty-board")], pr: label("ty-board-d", [8, 5], 12) },
    { slug: "pull-back-toy-car", name: "Pull-back Toy Car", cat: "toys", buyers: ["shop", "event"], unit: "pc", min: 1, step: 1, wq: 12,
      imgs: ["ty-cars", "ty-cars-d"], rating: 4.4, reviews: 87, tags: ["car", "toy car", "return gift"], created: "2026-06-30", rank: 31,
      desc: "Pull it back, let it go. Die-cast style cars in assorted colours and shapes.",
      specs: [["Length", "7 cm"], ["Colours", "Assorted"]],
      variants: [v("one", "Assorted", "", 99, 79, 55, 300, "ty-cars")], pr: label("ty-cars-d", [6, 4], 12) },
    { slug: "teddy-bear", name: "Teddy Bear with Scarf", cat: "toys", buyers: ["shop", "event"], unit: "pc", min: 1, step: 1, wq: 6,
      imgs: ["ty-teddy", "ty-teddy-d"], rating: 4.8, reviews: 74, tags: ["teddy", "soft toy", "gift"], created: "2026-10-20", rank: 32,
      desc: "A soft, well-stitched teddy with a cotton scarf. Hypoallergenic filling.",
      specs: [["Filling", "Polyester fibre"], ["Wash", "Hand wash"]],
      variants: [v("s", "8 in", "", 299, 249, 189, 40, "ty-teddy"), v("m", "12 in", "", 499, 429, 329, 25, "ty-teddy-d")], pr: label("ty-teddy", [12, 8], 6) },
    { slug: "soft-play-balls-25", name: "Soft Play Balls, Pack of 25", cat: "toys", buyers: ["play", "shop"], unit: "pack of 25", min: 1, step: 1, wq: 6,
      imgs: ["ty-balls", "ty-balls-d"], rating: 4.5, reviews: 52, tags: ["balls", "ball pit", "play school"], created: "2026-09-14", rank: 37,
      desc: "Light, crush-proof plastic balls for ball pits and play corners. Bright mixed colours.",
      specs: [["Size", "7 cm each"], ["Material", "Soft PE, BPA free"]],
      variants: [v("one", "Pack of 25", "", 299, 249, 189, 34, "ty-balls")], pr: label("ty-balls", [10, 6], 6) },
    { slug: "jigsaw-puzzle-100", name: "Jigsaw Puzzle, 100 Pieces", cat: "toys", buyers: ["shop", "school"], unit: "box", min: 1, step: 1, wq: 12,
      imgs: ["ty-jigsaw", "ty-cube-d"], rating: 4.4, reviews: 39, tags: ["jigsaw", "puzzle"], created: "2026-11-08", rank: 41,
      desc: "A 100-piece picture puzzle on thick board. Pieces fit snugly and do not peel.",
      specs: [["Pieces", "100"], ["Finished size", "33 x 23 cm"]],
      variants: [v("one", "100 pieces", "", 149, 125, 89, 70, "ty-jigsaw")], pr: label("ty-jigsaw", [8, 5], 12) },

    // ---------- Gifts ----------
    { slug: "gift-wrap-sheets", name: "Gift Wrapping Paper, 10 Sheets", cat: "gifts", buyers: ["shop", "event"], unit: "pack of 10", min: 1, step: 1, wq: 10,
      imgs: ["gf-wrap", "gf-wrap-d"], rating: 4.5, reviews: 66, tags: ["gift wrap", "wrapping paper"], created: "2026-10-01", rank: 35,
      desc: "Glossy wrapping paper in festive prints, 50 x 70 cm. Ten sheets, assorted designs.",
      specs: [["Size", "50 x 70 cm"], ["Sheets", "10, assorted"]],
      variants: [v("one", "10 sheets", "", 100, 80, 58, 120, "gf-wrap")], pr: label("gf-wrap", [6, 4], 10) },
    { slug: "metal-pen-gift-box", name: "Metal Pen in Gift Box", cat: "gifts", buyers: ["office", "event", "school"], unit: "pc", min: 1, step: 1, wq: 10, bq: 100,
      imgs: ["gf-penset", "of-pens-d"], rating: 4.6, reviews: 95, tags: ["pen gift", "corporate gift", "engraved pen"], created: "2026-07-12", rank: 9,
      desc: "A weighty metal pen in a velvet-lined box. Engrave a name on the barrel for teachers' day, staff awards or guests.",
      specs: [["Body", "Metal, chrome trim"], ["Box", "Hard box with velvet lining"]],
      variants: [v("one", "Pen with box", "", 299, 249, 179, 80, "gf-penset", { bp: 165 })],
      pr: { blend: "engrave", kind: "company", sides: [side("barrel", "Pen barrel", "gf-penset", .02, .31, .26, .055, -9)], methods: [m("laser", 40, 25, 0, 1)] } },
    { slug: "white-ceramic-mug", name: "White Ceramic Mug, 330 ml", cat: "gifts", buyers: ["office", "event", "school", "shop"], unit: "pc", min: 1, step: 1, wq: 12, bq: 100,
      imgs: ["gf-mug", "gf-mug-d"], rating: 4.7, reviews: 210, tags: ["mug", "coffee mug", "printed mug", "corporate gift"], created: "2026-06-08", rank: 7, best: true,
      desc: "A plain white mug ready for printing. Photo, logo or name, printed all round and safe in the dishwasher.",
      specs: [["Size", "330 ml"], ["Print", "Sublimation, both sides"], ["Care", "Dishwasher and microwave safe"]],
      variants: [v("one", "White", "", 199, 149, 99, 260, "gf-mug", { bp: 89 })],
      pr: { blend: "print", kind: "company", sides: [side("front", "Front", "gf-mug", .27, .32, .34, .34, 0), side("back", "Back", "gf-mug-d", .55, .2, .34, .34, 0)], methods: [m("digital", 60, 35, 0, 1)] } },
    { slug: "wooden-doll-keychain", name: "Wooden Doll Keychain", cat: "gifts", buyers: ["shop", "event"], unit: "pc", min: 1, step: 1, wq: 25,
      imgs: ["gf-keychain", "gf-wrap-d"], rating: 4.4, reviews: 48, tags: ["keychain", "return gift", "wooden"], created: "2026-08-05", rank: 39,
      desc: "Hand-painted wooden doll keychains. Cheerful return gifts that cost less than a chocolate.",
      specs: [["Height", "5 cm"], ["Ring", "Steel split ring"]],
      variants: [v("one", "Assorted", "", 60, 49, 32, 400, "gf-keychain")], pr: label("gf-keychain", [4, 2], 25) },
    { slug: "photo-frame-5x7", name: "Photo Frame, 5 x 7 in", cat: "gifts", buyers: ["shop", "event", "office"], unit: "pc", min: 1, step: 1, wq: 12,
      imgs: ["gf-frame", "of-desk"], rating: 4.5, reviews: 58, tags: ["photo frame", "frame", "gift"], created: "2026-09-26", rank: 34,
      desc: "A classic black frame with glass and a stand. Order it with a printed photo or certificate inside.",
      specs: [["Photo size", "5 x 7 in"], ["Stand", "Table stand and wall hook"]],
      variants: [v("one", "Black", "", 199, 169, 119, 90, "gf-frame")],
      pr: { blend: "print", kind: "company", sides: [side("photo", "Photo", "gf-frame", .31, .36, .32, .38, 0, "rect", "#ffffff")], methods: [m("digital", 30, 18, 0, 1)] } },

    // ---------- Prizes ----------
    { slug: "sports-medal-50mm", name: "Sports Medal with Ribbon, 50 mm", cat: "prizes", buyers: ["school", "event"], unit: "pc", min: 1, step: 1, wq: 25, bq: 500,
      imgs: ["pr-medals", "pr-medals-d"], rating: 4.8, reviews: 264, tags: ["medal", "sports day", "prize", "bestseller"], created: "2026-01-12", rank: 1.5, best: true,
      desc: "A heavy 50 mm medal on a bright ribbon, in gold, silver or bronze finish. Engrave the event name and year on the face.",
      specs: [["Size", "50 mm"], ["Ribbon", "22 mm, with clip"], ["Engraving", "Face, up to 3 lines"]],
      variants: [v("gold", "Gold", "#D4AF37", 60, 45, 30, 900, "pr-medals", { bp: 27, plate: "#D8B65A" }), v("silver", "Silver", "#BFC3C7", 60, 45, 30, 700, "pr-medals-d", { bp: 27, plate: "#C9CDD1" }), v("bronze", "Bronze", "#B07B48", 55, 42, 28, 40, "pr-medals", { bp: 25, plate: "#B9824D", tint: "#B07B48" })],
      pr: { blend: "engrave", kind: "sports", sides: [side("face", "Medal face", "pr-medals", .59, .685, .18, .18, 0, "circle", "plate")], methods: [m("laser", 15, 8, 0, 1), m("digital", 8, 4, 0, 25)] } },
    { slug: "trophy-cup", name: "Trophy Cup", cat: "prizes", buyers: ["school", "event"], unit: "pc", min: 1, step: 1, wq: 5,
      imgs: ["pr-cup", "pr-cup-d"], rating: 4.7, reviews: 143, tags: ["trophy", "cup", "prize", "annual day"], created: "2026-02-25", rank: 11, best: true,
      desc: "A shining gold cup with side handles on a marble-look base. Engraving on the cup is included in the price from 5 pieces.",
      specs: [["Finish", "Gold metallic"], ["Base", "Marble look"], ["Engraving", "On the cup, up to 4 lines"]],
      variants: [v("8", "8 in", "", 299, 249, 199, 60, "pr-cup"), v("10", "10 in", "", 399, 329, 265, 45, "pr-cup"), v("12", "12 in", "", 549, 449, 359, 30, "pr-cup-d"), v("16", "16 in", "", 899, 749, 599, 0, "pr-cup-d")],
      pr: { blend: "engrave", kind: "prize", sides: [side("cup", "Cup front", "pr-cup", .4, .33, .2, .14, 0)], methods: [m("laser", 30, 0, 0, 1)] } },
    { slug: "wooden-award-shield", name: "Wooden Award Shield with Plate", cat: "prizes", buyers: ["school", "event", "office"], unit: "pc", min: 1, step: 1, wq: 5,
      imgs: ["pr-shield", "pr-shield-d"], rating: 4.7, reviews: 97, tags: ["shield", "plaque", "award", "annual day"], created: "2026-03-18", rank: 12.5,
      desc: "A polished wooden shield with a black metal plate, ready to engrave. For annual prizes, retirements and thank-you awards.",
      specs: [["Wood", "Polished MDF, walnut finish"], ["Plate", "Black anodised metal"]],
      variants: [v("s", "8 x 10 in", "", 450, 379, 299, 40, "pr-shield"), v("l", "10 x 12 in", "", 599, 499, 399, 25, "pr-shield")],
      pr: { blend: "engrave", kind: "prize", sides: [side("plate", "Plate", "pr-shield", .26, .39, .56, .26, 0)], methods: [m("laser", 60, 40, 0, 1)] } },
    { slug: "star-award-memento", name: "Star Award Memento", cat: "prizes", buyers: ["office", "event", "school"], unit: "pc", min: 1, step: 1, wq: 10,
      imgs: ["pr-memento", "pr-memento-d"], rating: 4.6, reviews: 61, tags: ["memento", "award", "star", "corporate"], created: "2026-09-30", rank: 26.5,
      desc: "A tall gold star memento on a black base. A smart award for best teacher, best employee or chief guest.",
      specs: [["Height", "10 in"], ["Base", "Black, engravable plate"]],
      variants: [v("one", "10 in", "", 499, 420, 329, 35, "pr-memento")],
      pr: { blend: "engrave", kind: "prize", sides: [side("base", "Base plate", "pr-memento", .25, .915, .18, .055, 0, "rect", "#151515")], methods: [m("laser", 40, 25, 0, 1)] } },
    { slug: "certificate-sheets-a4", name: "Certificate Paper, A4", cat: "prizes", buyers: ["school", "event", "office"], unit: "sheet", min: 10, step: 5, wq: 100,
      imgs: ["pr-cert", "pr-cert-d"], rating: 4.6, reviews: 118, tags: ["certificate", "merit", "award paper"], created: "2026-04-21", rank: 16.5,
      desc: "Thick ivory certificate sheets with a printed border. Order blank, or send us the names and we print each one for you.",
      specs: [["Paper", "250 gsm, ivory"], ["Size", "A4"], ["Names", "Printed one by one, no extra setup"]],
      variants: [v("one", "Ivory, gold border", "", 12, 10, 7, 2000, "pr-cert")],
      pr: { blend: "print", kind: "prize", names: true, sides: [side("front", "Certificate", "pr-cert", .06, .3, .46, .16, -4)], methods: [m("digital", 8, 4, 0, 10)] } },
    { slug: "pin-badge-58mm", name: "Pin Badge, 58 mm", cat: "prizes", buyers: ["school", "event", "office"], unit: "pc", min: 1, step: 1, wq: 50, bq: 500,
      imgs: ["pr-badge", "pr-ribbon"], rating: 4.5, reviews: 70, tags: ["badge", "button badge", "pin"], created: "2026-07-03", rank: 30.5,
      desc: "Round pin badges with a safety pin back. For prefects, house captains, volunteers and election days.",
      specs: [["Size", "58 mm"], ["Back", "Safety pin"]],
      variants: [v("one", "58 mm", "", 30, 25, 15, 1000, "pr-badge", { bp: 12 })],
      pr: { blend: "print", kind: "school", sides: [side("face", "Badge face", "pr-badge", .1, .325, .35, .35, 0, "circle", "")], methods: [m("digital", 10, 5, 0, 1)] } },
    { slug: "prize-rosette-ribbon", name: "Prize Rosette Ribbon", cat: "prizes", buyers: ["school", "event"], unit: "pc", min: 1, step: 1, wq: 25,
      imgs: ["pr-ribbon", "pr-medals-d"], rating: 4.5, reviews: 45, tags: ["rosette", "ribbon", "prize", "sports day"], created: "2026-08-24", rank: 33.5,
      desc: "A pleated paper rosette with tails, for first, second and third prizes. Print the event name in the centre.",
      specs: [["Size", "12 cm across"], ["Back", "Safety pin"]],
      variants: [v("1", "1st, gold", "#D4AF37", 40, 32, 22, 300, "pr-ribbon"), v("2", "2nd, silver", "#BFC3C7", 40, 32, 22, 200, "pr-ribbon", { tint: "#9AA3AD" }), v("3", "3rd, bronze", "#B07B48", 40, 32, 22, 150, "pr-ribbon", { tint: "#B07B48" })],
      pr: { blend: "print", kind: "sports", sides: [side("centre", "Centre disc", "pr-ribbon", .505, .265, .17, .17, 0, "circle", "#f8f3ea")], methods: [m("digital", 8, 4, 0, 1)] } },

    // ---------- Bags ----------
    { slug: "school-backpack", name: "School Backpack, 24 L", cat: "bags", buyers: ["school", "shop"], unit: "pc", min: 1, step: 1, wq: 6,
      imgs: ["bg-bag", "bg-bag-d"], rating: 4.6, reviews: 122, tags: ["school bag", "backpack", "bag"], created: "2026-03-08", rank: 8.5, best: true,
      desc: "A light, water-resistant backpack with padded straps, a front pocket and a bottle pocket. Schools order them with their crest.",
      specs: [["Size", "24 litres, 43 x 30 x 15 cm"], ["Fabric", "Polyester, water resistant"], ["Pockets", "2 main, 1 front, 1 bottle"]],
      variants: [v("pink", "Pink", "#D51D8C", 899, 699, 549, 50, "bg-bag"), v("red", "Red", "#E3123D", 899, 699, 549, 40, "bg-bag-d"), v("navy", "Navy", "#1F2F5C", 899, 699, 549, 60, "bg-bag", { tint: "#1F2F5C" }), v("black", "Black", "#1C1C1C", 899, 699, 549, 0, "bg-bag-d", { tint: "#262626" })],
      pr: { blend: "print", kind: "school", tintArea: [.12, .02, .78, .96], sides: [side("front", "Front", "bg-bag", .32, .3, .38, .28, 0), side("pocket", "Front pocket", "bg-bag", .2, .76, .58, .16, 0)], methods: [m("digital", 150, 90, 0, 1), m("screen", 60, 35, 400, 25), m("embroidery", 120, 80, 500, 25)] } },
    { slug: "steel-water-bottle-750", name: "Steel Water Bottle, 750 ml", cat: "bags", buyers: ["school", "office", "shop", "event"], unit: "pc", min: 1, step: 1, wq: 12,
      imgs: ["bg-bottle", "bg-bottle-d"], rating: 4.6, reviews: 109, tags: ["bottle", "water bottle", "steel"], created: "2026-05-21", rank: 14.5,
      desc: "A single-wall steel bottle that does not hold smells. Leak-proof cap. Laser engrave a name or logo.",
      specs: [["Size", "750 ml"], ["Material", "Food grade steel"], ["Cap", "Leak proof, steel"]],
      variants: [v("blue", "Blue", "#1C6FB8", 499, 399, 299, 80, "bg-bottle"), v("red", "Red", "#9E2A2A", 499, 399, 299, 50, "bg-bottle-d"), v("teal", "Teal", "#2A8C96", 499, 399, 299, 40, "bg-bottle-d")],
      pr: { blend: "engrave", kind: "company", sides: [side("front", "Front", "bg-bottle", .545, .6, .14, .22, 0)], methods: [m("laser", 50, 30, 0, 1), m("screen", 25, 15, 350, 25)] } },
    { slug: "lunch-box-3-compartment", name: "Lunch Box, 3 Compartments", cat: "bags", buyers: ["school", "shop"], unit: "pc", min: 1, step: 1, wq: 12,
      imgs: ["bg-lunch", "bg-bottle"], rating: 4.5, reviews: 81, tags: ["lunch box", "tiffin"], created: "2026-04-11", rank: 21.5,
      desc: "A leak-resistant lunch box with three compartments and a snap lid. Fits roti, sabzi and fruit.",
      specs: [["Size", "900 ml total"], ["Material", "BPA-free plastic"]],
      variants: [v("one", "Green", "#4CA54A", 299, 249, 185, 70, "bg-lunch")], pr: label("bg-lunch", [12, 8], 12) },
    { slug: "zip-pencil-pouch", name: "Zip Pencil Pouch", cat: "bags", buyers: ["school", "shop"], unit: "pc", min: 1, step: 1, wq: 12,
      imgs: ["bg-pouch", "sc-pencils-d"], rating: 4.4, reviews: 64, tags: ["pouch", "pencil case"], created: "2026-07-30", rank: 35.5,
      desc: "A roomy zip pouch with a cheerful print. Holds 30 pencils and a scale.",
      specs: [["Size", "21 x 9 cm"], ["Fabric", "Polyester"]],
      variants: [v("one", "Striped", "", 120, 99, 72, 140, "bg-pouch")], pr: label("bg-pouch", [8, 5], 12) },

    // ---------- Uniform ----------
    { slug: "cotton-cap-printed", name: "Cotton Cap, Ready to Print", cat: "uniform", buyers: ["school", "event", "office"], unit: "pc", min: 1, step: 1, wq: 25, bq: 250,
      imgs: ["un-cap", "un-cap-d"], rating: 4.6, reviews: 137, tags: ["cap", "printed cap", "sports day", "event"], created: "2026-02-14", rank: 6.5, best: true,
      desc: "A cotton cap with an adjustable strap. Print or embroider your school, club or company name. Sports days, rallies and staff outings.",
      specs: [["Fabric", "Cotton twill"], ["Fit", "Adjustable strap, adult and child"], ["Print area", "Front panel, 10 x 5 cm"]],
      variants: [v("yellow", "Yellow and navy", "#E8C21A", 199, 149, 99, 300, "un-cap", { bp: 89 }), v("red", "Red", "#A8453F", 199, 149, 99, 220, "un-cap-d", { bp: 89 }), v("white", "White", "#F2F2F2", 199, 149, 99, 180, "un-cap", { bp: 89, tint: "#F4F4F4" }), v("navy", "Navy", "#1F2F5C", 199, 149, 99, 40, "un-cap-d", { bp: 89, tint: "#1F2F5C" })],
      pr: { blend: "print", kind: "sports", tintArea: [.08, .3, .62, .55], sides: [side("front", "Front panel", "un-cap", .31, .39, .26, .14, -6)], methods: [m("digital", 70, 45, 0, 1), m("screen", 25, 15, 300, 25), m("embroidery", 60, 35, 400, 25)] } },
    { slug: "id-card-holder-lanyard", name: "ID Card with Holder and Lanyard", cat: "uniform", buyers: ["school", "office", "event"], unit: "pc", min: 1, step: 1, wq: 50,
      imgs: ["un-idcard", "un-idcard-d"], rating: 4.6, reviews: 92, tags: ["id card", "lanyard", "holder"], created: "2026-05-02", rank: 18.5,
      desc: "A clear card holder on a 12 mm lanyard with a hook. Add printed PVC ID cards with each student's or staff member's name.",
      specs: [["Holder", "Clear, 86 x 54 mm card"], ["Lanyard", "12 mm, with hook"], ["Names", "Printed one by one"]],
      variants: [v("blue", "Blue lanyard", "#1F4FB4", 50, 40, 26, 900, "un-idcard"), v("black", "Black lanyard", "#1C1C1C", 50, 40, 26, 600, "un-idcard-d")],
      pr: { blend: "print", kind: "school", names: true, sides: [side("card", "ID card", "un-idcard", .275, .565, .165, .21, -3, "rect", "#ffffff")], methods: [m("digital", 25, 12, 0, 1)] } },
    { slug: "school-tie-striped", name: "School Tie, Striped", cat: "uniform", buyers: ["school", "shop"], unit: "pc", min: 1, step: 1, wq: 24,
      imgs: ["un-tie", "un-tie-d"], rating: 4.4, reviews: 53, tags: ["tie", "school tie", "uniform"], created: "2026-01-25", rank: 34.5,
      desc: "A ready-knot elastic tie for juniors or a full tie for seniors. Stripes made to your school colours on bigger orders.",
      specs: [["Type", "Elastic ready-knot or full"], ["Fabric", "Polyester"]],
      variants: [v("elastic", "Elastic, junior", "", 120, 99, 70, 160, "un-tie"), v("full", "Full, senior", "", 150, 125, 90, 110, "un-tie-d")], pr: label("un-tie", [10, 6], 24) },
    { slug: "school-belt", name: "School Belt", cat: "uniform", buyers: ["school", "shop"], unit: "pc", min: 1, step: 1, wq: 24,
      imgs: ["un-belt", "un-tie-d"], rating: 4.3, reviews: 38, tags: ["belt", "school belt", "uniform"], created: "2026-06-16", rank: 42,
      desc: "A sturdy belt with a steel buckle. The buckle can carry your school crest on orders of 100 or more.",
      specs: [["Width", "30 mm"], ["Buckle", "Steel"]],
      variants: [v("brown", "Brown", "#7A4A2A", 150, 125, 90, 80, "un-belt"), v("black", "Black", "#1C1C1C", 150, 125, 90, 70, "un-belt")], pr: label("un-belt", [10, 6], 24) },

    // ---------- Calendars ----------
    { slug: "wall-calendar-2027", name: "Wall Calendar 2027", cat: "calendars", buyers: ["shop", "office"], unit: "pc", min: 1, step: 1, wq: 25, bq: 500,
      imgs: ["cl-wall", "cl-wall-d"], rating: 4.5, reviews: 72, tags: ["calendar", "2027", "wall calendar"], created: "2026-11-01", rank: 9.5,
      desc: "A 12-page wall calendar with Bengali and English dates and holidays marked. Shops give them away to customers.",
      specs: [["Pages", "12 + cover"], ["Size", "30 x 45 cm"], ["Dates", "English and Bengali"]],
      variants: [v("one", "12 pages", "", 150, 120, 85, 400, "cl-wall", { bp: 70 })],
      pr: { blend: "print", kind: "company", sides: [side("top", "Top strip", "cl-wall", .43, .29, .44, .2, -4, "rect", "#ece6d8")], methods: [m("digital", 40, 20, 0, 1), m("screen", 15, 8, 500, 100)] } },
    { slug: "custom-photo-calendar", name: "Custom Photo Calendar 2027", cat: "calendars", buyers: ["school", "office", "shop"], unit: "pc", min: 1, step: 1, wq: 100,
      imgs: ["cl-wall", "cl-custom"], rating: 4.8, reviews: 66, tags: ["photo calendar", "custom calendar", "2027", "printed"], created: "2026-11-10", rank: 2.5, best: true,
      desc: "Your 12 photos, one for each month, with your name and logo on every page. Schools use their own events; shops use their products.",
      specs: [["Pages", "12 months"], ["Size", "30 x 45 cm"], ["Print", "Full colour, matt"]],
      variants: [v("one", "12 photo pages", "", 299, 249, 129, 999, "cl-wall")],
      pr: { blend: "print", kind: "calendar", months: true, sides: [side("photo", "Month photo", "cl-wall", .43, .29, .44, .2, -4, "rect", "#ece6d8")], methods: [m("digital", 0, 0, 0, 1)] } },
    { slug: "desk-calendar-2027", name: "Desk Calendar 2027", cat: "calendars", buyers: ["office", "shop"], unit: "pc", min: 1, step: 1, wq: 25,
      imgs: ["cl-desk", "cl-desk-d"], rating: 4.5, reviews: 47, tags: ["desk calendar", "2027", "table calendar"], created: "2026-10-27", rank: 27.5,
      desc: "A tent-style desk calendar with a spiral top. Your logo on each page keeps your name on your client's desk all year.",
      specs: [["Pages", "12 + cover"], ["Size", "21 x 15 cm"]],
      variants: [v("one", "12 pages", "", 199, 159, 109, 150, "cl-desk")],
      pr: { blend: "print", kind: "company", sides: [side("page", "Page top", "cl-desk", .1, .26, .52, .16, 0, "rect", "#f1f1f0")], methods: [m("digital", 35, 18, 0, 1)] } },
    { slug: "diary-2027-a5", name: "Diary 2027, A5 Hardbound", cat: "calendars", buyers: ["office", "school", "shop"], unit: "pc", min: 1, step: 1, wq: 12, bq: 100,
      imgs: ["cl-diary", "cl-diary-d"], rating: 4.6, reviews: 88, tags: ["diary", "2027", "planner", "corporate gift"], created: "2026-10-15", rank: 10.5,
      desc: "A day-per-page A5 diary with a soft fabric cover. Print your logo on the cover for staff and clients.",
      specs: [["Size", "A5"], ["Pages", "Day per page, 384"], ["Cover", "Fabric-look hardbound"]],
      variants: [v("pink", "Pink", "#E9878F", 349, 279, 199, 60, "cl-diary", { bp: 179 }), v("blue", "Blue and yellow", "#1E6FA8", 349, 279, 199, 45, "cl-diary-d", { bp: 179 })],
      pr: { blend: "print", kind: "company", sides: [side("cover", "Front cover", "cl-diary", .32, .24, .46, .46, 0)], methods: [m("digital", 60, 30, 0, 1), m("screen", 25, 15, 400, 50)] } }
  ];

  // ---------- more of the catalogue: uniforms, sports, festivals, the school and office sweep ----------
  /** Size variants for clothing: [label, age] pairs share one price ladder. */
  function sizes(list, mrp, price, wp, stock, img, colour) {
    return list.map(function (s, i) { var k = i / Math.max(1, list.length - 1); return v("s" + s[0], "Size " + s[0] + (s[1] ? " (" + s[1] + ")" : ""), colour || "", Math.round(mrp * (1 + k * .35)), Math.round(price * (1 + k * .35)), Math.round(wp * (1 + k * .35)), Math.round(stock * (i === list.length - 1 ? .2 : 1 - k * .5)), img); });
  }
  var SHIRT = [["22", "age 3-4"], ["24", "age 5-6"], ["26", "age 7-8"], ["28", "age 9-10"], ["30", "age 11-12"], ["32", "age 13-14"], ["34", "age 15-16"], ["36", "teacher S"]];
  var WAIST = [["20", "age 4-5"], ["22", "age 6-7"], ["24", "age 8-9"], ["26", "age 10-11"], ["28", "age 12-13"], ["30", "age 14-15"], ["32", "age 16-17"]];
  var SHOE = [["10C", "age 4"], ["12C", "age 6"], ["1", "age 7-8"], ["3", "age 9-10"], ["5", "age 12-13"], ["7", "adult"], ["8", "adult"]];
  /** Short product builder for the added catalogue. o: extra fields. */
  function X(slug, name, cat, unit, min, step, wq, imgs, desc, specs, variants, pr, o) {
    var p = { slug: slug, name: name, cat: cat, buyers: (o && o.buyers) || ["school", "shop"], unit: unit, min: min, step: step, wq: wq, imgs: imgs, rating: 4.5, reviews: 0, tags: (o && o.tags) || [], created: (o && o.created) || "2026-10-20", rank: (o && o.rank) || 50, desc: desc, specs: specs, variants: variants, pr: pr };
    for (var k in o || {}) if (!(k in p) || k === "best" || k === "bq") p[k] = o[k];
    return p;
  }
  var EMB = [m("embroidery", 45, 28, 350, 12), m("screen", 20, 12, 300, 24)];
  var MORE = [
    // School uniforms
    X("white-school-shirt-half", "White School Shirt, Half Sleeve", "schoolwear", "pc", 1, 1, 12, ["un-shirt-white", "un-shirt-blue"], "A crisp white half-sleeve shirt in easy-iron poly-cotton with a pocket. Matches most CBSE, ICSE and state board uniform codes.", [["Fabric", "Poly-cotton, 65:35"], ["Fit", "Regular"], ["Care", "Machine wash, warm iron"]], sizes(SHIRT, 380, 299, 239, 400, "un-shirt-white", "#FFFFFF"),
      { blend: "print", kind: "school", sides: [side("lchest", "Left chest pocket", "un-shirt-white", .5, .31, .13, .12, 0), side("rchest", "Right chest", "un-shirt-white", .22, .2, .16, .12, 0)], methods: EMB }, { buyers: ["school", "shop"], tags: ["shirt", "uniform", "white shirt"], best: true, rank: 3.5, sz: "clothing" }),
    X("white-school-shirt-full", "White School Shirt, Full Sleeve", "schoolwear", "pc", 1, 1, 12, ["un-shirt-white", "un-shirt-blue"], "Full-sleeve white shirt for winter and for senior classes. Double-stitched cuffs that last the session.", [["Fabric", "Poly-cotton, 65:35"], ["Fit", "Regular"], ["Care", "Machine wash, warm iron"]], sizes(SHIRT, 440, 349, 279, 300, "un-shirt-white", "#FFFFFF"),
      { blend: "print", kind: "school", sides: [side("lchest", "Left chest pocket", "un-shirt-white", .5, .31, .13, .12, 0)], methods: EMB }, { tags: ["shirt", "uniform"], sz: "clothing" }),
    X("light-blue-school-shirt", "Light Blue School Shirt", "schoolwear", "pc", 1, 1, 12, ["un-shirt-blue", "un-shirt-white"], "Light blue half-sleeve shirt, the most common colour after white in Kolkata schools.", [["Fabric", "Terry-cot"], ["Fit", "Regular"], ["Care", "Machine wash"]], sizes(SHIRT, 390, 309, 245, 260, "un-shirt-blue", "#A9C8E8"),
      { blend: "print", kind: "school", sides: [side("lchest", "Chest", "un-shirt-blue", .12, .15, .18, .12, 0)], methods: EMB }, { tags: ["shirt", "uniform", "blue"], sz: "clothing" }),
    X("house-polo-tshirt", "House Polo T-shirt", "schoolwear", "pc", 1, 1, 24, ["un-tshirt", "un-shirt-white"], "Breathable PT and house T-shirt with a collar. Four house colours; print the house name and school crest on the back.", [["Fabric", "Polyester pique, 180 gsm"], ["Fit", "Slightly loose"], ["Colours", "Red, blue, green, yellow houses"]],
      [v("red", "Red house", "#C0261E", 299, 229, 175, 300, "un-tshirt"), v("blue", "Blue house", "#1F4FB4", 299, 229, 175, 280, "un-tshirt"), v("green", "Green house", "#2E8B57", 299, 229, 175, 240, "un-tshirt"), v("yellow", "Yellow house", "#F2C230", 299, 229, 175, 30, "un-tshirt")],
      label("un-tshirt", [40, 25], 12), { tags: ["t-shirt", "pt", "house", "sports day"], sz: "clothing", buyers: ["school", "event"] }),
    X("school-trousers-navy", "School Trousers, Navy", "schoolwear", "pc", 1, 1, 12, ["un-trousers", "un-shirt-white"], "Navy full trousers with an adjustable inner waist band, so they fit for two sessions.", [["Fabric", "Terry-wool blend"], ["Fit", "Regular, adjustable waist"]], sizes(WAIST, 520, 429, 345, 220, "un-trousers", "#1F2F5C"), label("un-trousers", [12, 8], 12), { tags: ["trousers", "pant", "uniform"], sz: "clothing" }),
    X("school-half-pant-grey", "School Half Pant, Grey", "schoolwear", "pc", 1, 1, 12, ["un-trousers", "un-shirt-blue"], "Grey half pants for primary boys, with an elastic back.", [["Fabric", "Terry-cot"], ["Fit", "Regular"]], sizes(WAIST.slice(0, 5), 320, 259, 205, 260, "un-trousers", "#8A8F96"), label("un-trousers", [12, 8], 12), { tags: ["half pant", "shorts"], sz: "clothing" }),
    X("pleated-skirt-navy", "Pleated School Skirt, Navy", "schoolwear", "pc", 1, 1, 12, ["un-skirt", "un-shirt-white"], "Box-pleated navy skirt with a side zip and an adjustable button band.", [["Fabric", "Terry-wool blend"], ["Length", "Knee length"]], sizes(WAIST, 480, 389, 309, 200, "un-skirt", "#1F2F5C"), label("un-skirt", [12, 8], 12), { tags: ["skirt", "uniform"], sz: "clothing" }),
    X("salwar-kameez-uniform-set", "Salwar Kameez Uniform Set with Dupatta", "schoolwear", "set", 1, 1, 12, ["un-salwar", "un-shirt-blue"], "Three-piece uniform set for senior girls: kameez, salwar and dupatta in matching shades.", [["Fabric", "Poly-cotton"], ["In the set", "Kameez, salwar, dupatta"]], sizes(SHIRT.slice(2), 899, 749, 599, 120, "un-salwar", "#7FA6D6"), label("un-salwar", [20, 12], 12), { tags: ["salwar", "kameez", "uniform"], sz: "clothing" }),
    X("primary-frock-check", "Primary School Frock", "schoolwear", "pc", 1, 1, 12, ["un-frock", "un-ribbon"], "A simple frock for nursery and primary girls with a sash at the back. Ask for your school's check pattern on bulk orders.", [["Fabric", "Poly-cotton"], ["Fit", "Slightly loose"]], sizes(SHIRT.slice(0, 5), 420, 339, 269, 150, "un-frock", "#FFFFFF"), label("un-frock", [15, 10], 12), { tags: ["frock", "girls"], sz: "clothing" }),
    X("school-sweater-v-neck", "School Sweater, V-neck", "schoolwear", "pc", 1, 1, 12, ["un-sweater", "un-blazer"], "Warm acrylic V-neck sweater for Kolkata winters. School crest embroidery on the chest on bulk orders.", [["Fabric", "Acrylic knit"], ["Fit", "Regular"]],
      [v("navy", "Navy", "#1F2F5C", 650, 529, 419, 140, "un-sweater"), v("maroon", "Maroon", "#7A1F2B", 650, 529, 419, 90, "un-sweater", { tint: "#7A1F2B" }), v("grey", "Grey", "#8A8F96", 650, 529, 419, 0, "un-sweater", { tint: "#8A8F96" })],
      { blend: "print", kind: "school", sides: [side("chest", "Chest", "un-sweater", .12, .28, .2, .12, 0)], methods: [m("embroidery", 60, 35, 400, 12)] }, { tags: ["sweater", "winter", "cardigan"], sz: "clothing" }),
    X("school-blazer-navy", "School Blazer, Navy", "schoolwear", "pc", 1, 1, 6, ["un-blazer", "un-sweater"], "A lined navy blazer for seniors and staff, with your crest embroidered on the pocket.", [["Fabric", "Poly-viscose, lined"], ["Fit", "Regular"]], sizes(SHIRT.slice(3), 2200, 1799, 1499, 60, "un-blazer", "#1F2F5C"),
      { blend: "print", kind: "school", sides: [side("pocket", "Pocket crest", "un-blazer", .6, .19, .13, .1, 0)], methods: [m("embroidery", 120, 80, 500, 6)] }, { tags: ["blazer", "winter"], sz: "clothing", buyers: ["school", "office"] }),
    X("school-track-suit", "School Track Suit", "schoolwear", "set", 1, 1, 12, ["un-tracksuit", "un-tshirt"], "Jacket and track pants for PT and winter. Print the school name on the back of the jacket.", [["Fabric", "Polyester, brushed inside"], ["Fit", "Slightly loose"]], sizes(SHIRT, 999, 829, 659, 120, "un-tracksuit"), label("un-tracksuit", [40, 25], 12), { tags: ["track suit", "pt"], sz: "clothing" }),
    X("school-socks", "School Socks, Pack of 3 Pairs", "schoolwear", "pack of 3", 1, 1, 12, ["un-socks", "un-shoes-black"], "Cotton-rich socks with a ribbed top that stays up. Three pairs in a pack.", [["Fabric", "Cotton 80%, nylon"], ["Pack", "3 pairs"]],
      [v("w-s", "White, small (age 3-7)", "#FFFFFF", 199, 159, 119, 400, "un-socks"), v("w-l", "White, large (age 8-16)", "#FFFFFF", 229, 179, 135, 360, "un-socks"), v("n-s", "Navy, small", "#1F2F5C", 199, 159, 119, 200, "un-socks"), v("n-l", "Navy, large", "#1F2F5C", 229, 179, 135, 30, "un-socks"), v("g-l", "Grey, large", "#8A8F96", 229, 179, 135, 0, "un-socks")],
      label("un-socks", [6, 4], 12), { tags: ["socks"], sz: "shoes" }),
    X("black-school-shoes", "Black School Shoes", "schoolwear", "pair", 1, 1, 12, ["un-shoes-black", "un-socks"], "Polishable black school shoes with a velcro strap for juniors and laces for seniors. Non-marking sole.", [["Upper", "Synthetic leather"], ["Sole", "PVC, non-marking"]], sizes(SHOE, 799, 649, 519, 120, "un-shoes-black"), label("un-shoes-black", [10, 6], 12), { tags: ["shoes", "black shoes"], sz: "shoes" }),
    X("white-canvas-pt-shoes", "White Canvas PT Shoes", "schoolwear", "pair", 1, 1, 12, ["un-shoes-white", "un-shoes-black"], "Light canvas shoes for PT days, washable and white again with a little chalk.", [["Upper", "Canvas"], ["Sole", "Rubber"]], sizes(SHOE, 499, 399, 309, 160, "un-shoes-white"), label("un-shoes-white", [10, 6], 12), { tags: ["pt shoes", "canvas"], sz: "shoes" }),
    X("school-raincoat", "School Raincoat with Bag Cover", "schoolwear", "pc", 1, 1, 12, ["un-raincoat", "bg-umbrella"], "Full-length raincoat with a hood and room for the school bag on the back. For Kolkata's monsoon.", [["Material", "PVC-coated polyester"], ["Includes", "Pouch"]], sizes(SHIRT.slice(0, 6), 599, 479, 379, 90, "un-raincoat"), label("un-raincoat", [15, 10], 12), { tags: ["raincoat", "monsoon"], sz: "clothing" }),
    X("hair-ribbons-bands", "Hair Ribbons and Bands", "schoolwear", "pack of 6", 1, 1, 12, ["un-ribbon", "un-frock"], "Satin ribbons and soft hair bands in school colours. Six in a pack.", [["Pack", "6 pieces"], ["Colours", "White, navy, red, maroon"]],
      [v("white", "White", "#FFFFFF", 90, 75, 52, 300, "un-ribbon"), v("navy", "Navy", "#1F2F5C", 90, 75, 52, 200, "un-ribbon"), v("red", "Red", "#C0261E", 90, 75, 52, 180, "un-ribbon")], label("un-ribbon", [4, 2], 24), { tags: ["ribbon", "hair band"] }),
    X("lab-coat", "Lab Coat", "schoolwear", "pc", 1, 1, 12, ["of-labcoat", "un-shirt-white"], "White cotton lab coat for school science labs and teachers.", [["Fabric", "Cotton twill"], ["Pockets", "3"]], sizes(SHIRT.slice(3), 549, 449, 349, 100, "of-labcoat"), { blend: "print", kind: "school", sides: [side("chest", "Chest", "of-labcoat", .55, .4, .16, .1, 0)], methods: [m("embroidery", 50, 30, 350, 12)] }, { tags: ["lab coat", "science"], sz: "clothing", buyers: ["school"] }),

    // Sweep: school and office
    X("slate-with-chalk", "Writing Slate with Chalk", "school", "pc", 1, 1, 24, ["sc-slate", "pl-cards"], "A light board slate with a wooden frame and a box of 10 chalks. Still the best first writing board.", [["Size", "A4 approx"], ["Includes", "10 chalks"]], [v("one", "With chalk", "", 90, 75, 52, 300, "sc-slate")], label("sc-slate", [6, 3], 24), { tags: ["slate", "chalk", "play school"], buyers: ["play", "school", "shop"] }),
    X("whiteboard-markers", "Whiteboard Markers, Set of 4", "office", "set of 4", 1, 1, 12, ["of-whiteboard", "of-highlighter"], "Dry-erase markers that wipe clean and do not stain the board.", [["Colours", "Black, blue, red, green"]], [v("one", "Set of 4", "", 140, 115, 84, 160, "of-whiteboard")], label("of-whiteboard", [6, 3], 12), { tags: ["marker", "whiteboard"], buyers: ["office", "school"] }),
    X("classroom-whiteboard", "Classroom Whiteboard with Duster", "school", "pc", 1, 1, 5, ["of-whiteboard", "sc-slate"], "Magnetic whiteboard with an aluminium frame, tray and duster.", [["Frame", "Aluminium"]], [v("2x3", "2 x 3 ft", "", 1450, 1199, 989, 25, "of-whiteboard"), v("3x4", "3 x 4 ft", "", 2450, 1999, 1690, 12, "of-whiteboard"), v("4x6", "4 x 6 ft", "", 4200, 3499, 2990, 0, "of-whiteboard")], label("of-whiteboard", [60, 40], 5), { tags: ["whiteboard", "board", "duster"], buyers: ["school", "office"] }),
    X("school-globe", "School Globe, 30 cm", "school", "pc", 1, 1, 5, ["sc-globe", "sc-map"], "A political globe on a metal stand with country names in English.", [["Diameter", "30 cm"], ["Stand", "Metal"]], [v("one", "30 cm", "", 899, 749, 599, 30, "sc-globe")], label("sc-globe", [20, 12], 5), { tags: ["globe", "geography"], buyers: ["school"] }),
    X("wall-map-india-world", "Wall Map, India or World", "school", "pc", 1, 1, 10, ["sc-map", "sc-globe"], "Laminated wall map with wooden rollers, in English.", [["Size", "100 x 70 cm"], ["Finish", "Laminated"]], [v("india", "India map", "", 350, 289, 219, 60, "sc-map"), v("world", "World map", "", 350, 289, 219, 50, "sc-map")], label("sc-map", [10, 6], 10), { tags: ["map", "geography"], buyers: ["school"] }),
    X("alphabet-wall-chart", "Alphabet Wall Chart", "play", "pc", 1, 1, 10, ["sc-chart", "pl-cards"], "Big, bright laminated alphabet chart for classroom walls, in English, Bengali or Hindi.", [["Size", "50 x 75 cm"], ["Finish", "Laminated, with eyelets"]],
      [v("en", "English A to Z", "", 120, 99, 72, 200, "sc-chart"), v("bn", "Bengali Swarabarna and Byanjanbarna", "", 120, 99, 72, 180, "sc-chart"), v("hi", "Hindi Varnamala", "", 120, 99, 72, 120, "sc-chart")], label("sc-chart", [8, 5], 10), { tags: ["chart", "alphabet", "bengali", "hindi"], buyers: ["play", "school"], kolkata: true }),
    X("attendance-register", "Attendance Register", "office", "pc", 1, 1, 12, ["of-register", "of-register-d"], "Ruled attendance register for 60 students and a full session, with month headings.", [["Pages", "200"], ["Size", "Foolscap"]], [v("one", "200 pages", "", 180, 149, 115, 90, "of-register")], label("of-register-d", [10, 6], 12), { tags: ["attendance", "register"], buyers: ["school"], sz: "paper" }),
    X("report-cards-printed", "Report Cards, Printed with School Name", "school", "pc", 50, 25, 200, ["pr-cert", "of-paper"], "Folded report cards printed with your school name, crest and subjects. Send your format on WhatsApp.", [["Size", "A4 folded"], ["Paper", "250 gsm"]], [v("one", "Folded A4", "", 18, 15, 9, 5000, "pr-cert")],
      { blend: "print", kind: "school", sides: [side("front", "Front", "pr-cert", .06, .3, .46, .16, -4)], methods: [m("digital", 6, 3, 0, 50)] }, { tags: ["report card", "printed"], buyers: ["school"], sz: "paper" }),
    X("admission-forms-printed", "Admission Forms, Printed", "school", "pc", 100, 50, 500, ["of-paper", "pr-cert"], "Admission forms printed with your school name and fields, on good paper.", [["Size", "A4"], ["Paper", "90 gsm"]], [v("one", "A4", "", 6, 5, 3, 9000, "of-paper")], label("of-paper", [2, 1], 100), { tags: ["admission form", "printed"], buyers: ["school"], sz: "paper" }),
    X("answer-sheet-paper", "Answer Sheet Paper, Ruled", "school", "ream", 1, 1, 10, ["of-paper-d", "sc-notebooks"], "Ruled exam answer sheets with a margin, 500 sheets per ream.", [["Size", "Foolscap"], ["Sheets", "500"]], [v("one", "500 sheets", "", 420, 359, 299, 80, "of-paper-d")], label("of-paper-d", [10, 6], 10), { tags: ["answer sheet", "exam"], buyers: ["school"], sz: "paper" }),
    X("custom-rubber-stamp", "Custom Rubber Stamp", "office", "pc", 1, 1, 10, ["of-stamp", "of-desk"], "Self-ink stamp made with your school, shop or office name and address. Ready in 2 days.", [["Size", "38 x 14 mm or 47 x 18 mm"], ["Ink", "Blue, refillable"]], [v("s", "38 x 14 mm", "", 350, 299, 229, 100, "of-stamp"), v("l", "47 x 18 mm", "", 450, 379, 299, 80, "of-stamp")], label("of-stamp", [0, 0], 1), { tags: ["stamp", "seal"], buyers: ["office", "school", "shop"], market: "lalbazar" }),
    X("printed-envelopes", "Envelopes, Printed with Your Name", "office", "pc", 100, 50, 500, ["of-envelope", "of-paper"], "White and brown envelopes printed with your letterhead.", [["Sizes", "DL, A4, cloth-lined"]], [v("dl", "DL white", "", 4, 3, 2, 8000, "of-envelope"), v("a4", "A4 brown", "", 8, 6, 4, 6000, "of-envelope")], label("of-envelope", [2, 1], 100), { tags: ["envelope", "letterhead"], buyers: ["office", "school"], market: "chitpur", sz: "paper" }),
    X("visiting-cards", "Visiting Cards, Box of 100", "office", "box of 100", 1, 1, 10, ["of-cards", "of-desk"], "Matt or gloss visiting cards printed both sides. Proof on WhatsApp before printing.", [["Size", "90 x 54 mm"], ["Card", "350 gsm"]], [v("matt", "Matt", "", 299, 249, 179, 500, "of-cards"), v("gloss", "Gloss", "", 299, 249, 179, 400, "of-cards")],
      { blend: "print", kind: "company", sides: [side("front", "Front", "of-cards", .62, .42, .3, .18, 28)], methods: [m("digital", 0, 0, 0, 1)] }, { tags: ["visiting card", "business card"], buyers: ["office", "shop"], market: "chitpur" }),
    X("cash-book-voucher-pad", "Cash Book and Voucher Pad", "office", "pc", 1, 1, 12, ["of-register-d", "of-notes"], "Cash book with ruled columns, or a carbon voucher pad of 100.", [["Pages", "150 (cash book), 100 vouchers"]], [v("cash", "Cash book", "", 160, 129, 99, 90, "of-register-d"), v("voucher", "Voucher pad", "", 60, 49, 35, 200, "of-notes")], label("of-register-d", [8, 5], 12), { tags: ["cash book", "voucher"], buyers: ["office", "shop"], sz: "paper" }),
    X("tape-and-rubber-bands", "Tape Rolls and Rubber Bands", "office", "pack", 1, 1, 12, ["of-tape", "of-rubberband"], "Clear tape rolls and rubber bands for the office and the shop counter.", [["Tape", "24 mm x 50 m"], ["Rubber bands", "100 g pack"]], [v("tape", "Tape, 6 rolls", "", 180, 149, 109, 150, "of-tape"), v("band", "Rubber bands, 100 g", "", 60, 49, 34, 300, "of-rubberband")], label("of-tape", [4, 2], 12), { tags: ["tape", "rubber band"], buyers: ["office", "shop"] }),
    X("school-umbrella", "School Umbrella", "bags", "pc", 1, 1, 12, ["bg-umbrella", "un-raincoat"], "A strong 3-fold umbrella that fits in the bag pocket. Print your school or shop name on a panel.", [["Folds", "3"], ["Ribs", "8, steel"]], [v("black", "Black", "#1C1C1C", 399, 329, 249, 120, "bg-umbrella"), v("navy", "Navy", "#1F2F5C", 399, 329, 249, 80, "bg-umbrella", { tint: "#1F2F5C" })],
      { blend: "print", kind: "company", sides: [side("panel", "Panel", "bg-umbrella", .2, .25, .3, .2, -15)], methods: [m("screen", 30, 18, 350, 25)] }, { tags: ["umbrella", "monsoon"] }),

    // Sports goods
    X("school-football", "Football, Size 5", "sports", "pc", 1, 1, 6, ["sp-football", "sp-cones"], "A stitched football for school grounds and para matches.", [["Size", "5 (size 4 for juniors)"], ["Cover", "PU, hand stitched"]], [v("5", "Size 5", "", 599, 499, 389, 60, "sp-football"), v("4", "Size 4", "", 549, 449, 349, 40, "sp-football")], label("sp-football", [15, 10], 6), { tags: ["football", "sports"], buyers: ["school", "event"] }),
    X("cricket-set", "Cricket Set: Bat, Ball and Stumps", "sports", "set", 1, 1, 5, ["sp-cricket", "sp-cones"], "A wooden bat, a tennis ball and a set of stumps in a bag. For school and para cricket.", [["Bat", "Size 5 / full"], ["Includes", "Bat, ball, 3 stumps, bails, bag"]], [v("jr", "Junior (size 5)", "", 899, 749, 599, 30, "sp-cricket"), v("full", "Full size", "", 1199, 999, 799, 20, "sp-cricket")], label("sp-cricket", [20, 12], 5), { tags: ["cricket", "bat"], buyers: ["school", "event"] }),
    X("badminton-set", "Badminton Set", "sports", "set", 1, 1, 6, ["sp-badminton", "sp-rope"], "Two rackets and three shuttlecocks in a cover.", [["Includes", "2 rackets, 3 shuttles"]], [v("one", "2 rackets", "", 699, 579, 459, 40, "sp-badminton")], label("sp-badminton", [15, 10], 6), { tags: ["badminton", "racket"], buyers: ["school", "shop"] }),
    X("skipping-rope", "Skipping Rope", "sports", "pc", 1, 1, 24, ["sp-rope", "sp-cones"], "Adjustable skipping rope with plastic handles.", [["Length", "2.7 m, adjustable"]], [v("one", "Adjustable", "", 90, 75, 52, 300, "sp-rope")], label("sp-rope", [4, 2], 24), { tags: ["skipping", "rope", "pt"], buyers: ["school", "play"] }),
    X("carrom-board", "Carrom Board with Coins", "sports", "pc", 1, 1, 3, ["sp-carrom", "sp-chess"], "A full-size carrom board with coins, striker and powder. The favourite indoor game of every para club.", [["Size", "32 in"], ["Includes", "Coins, striker, powder"]], [v("32", "32 in", "", 2200, 1849, 1549, 15, "sp-carrom"), v("26", "26 in (junior)", "", 1400, 1199, 989, 20, "sp-carrom")], label("sp-carrom", [30, 20], 3), { tags: ["carrom", "indoor game"], buyers: ["shop", "event", "school"] }),
    X("chess-set", "Chess Set, Folding Board", "sports", "set", 1, 1, 6, ["sp-chess", "sp-carrom"], "Folding board with full-size pieces, stored inside the board.", [["Board", "40 x 40 cm"]], [v("one", "Folding", "", 399, 329, 249, 60, "sp-chess")], label("sp-chess", [10, 6], 6), { tags: ["chess", "board game"], buyers: ["school", "shop"] }),
    X("training-cones", "Training Cones, Set of 10", "sports", "set of 10", 1, 1, 6, ["sp-cones", "sp-football"], "Bright cones for drills, races and sports day lanes.", [["Height", "23 cm"]], [v("one", "Set of 10", "", 499, 419, 329, 40, "sp-cones")], label("sp-cones", [10, 6], 6), { tags: ["cones", "sports day"], buyers: ["school", "event"] }),
    X("whistle-stopwatch", "Stopwatch and Whistle", "sports", "pc", 1, 1, 6, ["sp-whistle", "sp-cones"], "A digital stopwatch with lap times, and a metal whistle on a cord. For PT teachers and race days.", [["Includes", "Stopwatch or whistle"]], [v("watch", "Stopwatch", "", 399, 329, 259, 40, "sp-whistle"), v("whistle", "Metal whistle", "", 99, 79, 55, 200, "sp-whistle")], label("sp-whistle", [10, 6], 6), { tags: ["stopwatch", "whistle", "pt"], buyers: ["school", "event"], market: "chandni" }),
    X("house-flags-sashes", "House Flags and Sashes", "sports", "pc", 1, 1, 12, ["ev-flags", "un-tshirt"], "Satin house flags on a pole and sashes for house captains, in four house colours. Print the house name.", [["Flag", "60 x 90 cm"], ["Sash", "Satin, 10 cm wide"]], [v("flag", "Flag", "", 299, 249, 189, 60, "ev-flags"), v("sash", "Sash", "", 149, 125, 89, 120, "ev-flags")], label("ev-flags", [20, 12], 12), { tags: ["house flag", "sash", "sports day"], buyers: ["school", "event"] }),
    X("sports-day-bibs", "Sports Day Bibs, Set of 10", "sports", "set of 10", 1, 1, 5, ["un-tshirt", "sp-cones"], "Mesh bibs with numbers 1 to 10, in house colours.", [["Fabric", "Polyester mesh"]], [v("red", "Red", "#C0261E", 699, 579, 449, 20, "un-tshirt"), v("blue", "Blue", "#1F4FB4", 699, 579, 449, 20, "un-tshirt")], label("un-tshirt", [20, 12], 5), { tags: ["bibs", "sports day"], buyers: ["school", "event"] }),
    X("balloons-pack", "Balloons, Pack of 100", "sports", "pack of 100", 1, 1, 10, ["ev-balloons", "ev-flags"], "Mixed colour balloons for annual day, birthdays and club functions.", [["Size", "10 in"]], [v("mix", "Mixed colours", "", 199, 159, 115, 200, "ev-balloons")], label("ev-balloons", [6, 3], 10), { tags: ["balloons", "party", "event"], buyers: ["event", "shop"], market: "burrabazar" }),

    // Puja, festivals and Kolkata specials
    X("haal-khata-lal-khata", "Haal Khata, Red Cloth Ledger", "festive", "pc", 1, 1, 12, ["kk-lalkhata", "of-register"], "The red cloth-bound ledger that every Kolkata shop opens on Poila Baisakh. Thread sewn, with a swastik on the cover.", [["Binding", "Red cloth, thread sewn"], ["Pages", "200 / 400"]], [v("200", "200 pages", "#B02A2A", 220, 185, 145, 300, "kk-lalkhata"), v("400", "400 pages", "#B02A2A", 380, 319, 249, 150, "kk-lalkhata")], label("kk-lalkhata", [10, 6], 12), { tags: ["haal khata", "lal khata", "poila baisakh", "ledger"], buyers: ["shop", "office"], kolkata: true, market: "college", rank: 2.2, best: true, sz: "paper" }),
    X("bengali-panjika-1433", "Bengali Panjika 1433", "festive", "pc", 1, 1, 25, ["kk-panjika", "cl-wall"], "The Bengali almanac for the year 1433, with tithi, puja dates and auspicious times. Full and pocket editions.", [["Language", "Bengali"], ["Editions", "Full, pocket"]], [v("full", "Full edition", "", 180, 160, 125, 400, "kk-panjika"), v("pocket", "Pocket edition", "", 60, 50, 38, 800, "kk-panjika")], label("kk-panjika", [4, 2], 25), { tags: ["panjika", "almanac", "bengali"], buyers: ["shop"], kolkata: true, market: "chitpur", sz: "paper" }),
    X("bengali-wall-calendar", "Bengali Wall Calendar 1433", "calendars", "pc", 1, 1, 25, ["cl-wall", "kk-panjika"], "Wall calendar with Bengali months, tithi and festival dates. Shops give it with their name printed at the top.", [["Pages", "12 + cover"], ["Dates", "Bengali and English"]], [v("one", "12 pages", "", 140, 115, 79, 500, "cl-wall", { bp: 65 })],
      { blend: "print", kind: "company", sides: [side("top", "Top strip", "cl-wall", .43, .29, .44, .2, -4, "rect", "#ece6d8")], methods: [m("digital", 40, 20, 0, 1), m("screen", 12, 6, 500, 100)] }, { tags: ["bengali calendar", "panjika", "1433"], buyers: ["shop", "office"], kolkata: true, market: "chitpur", bq: 500, sz: "paper" }),
    X("hate-khori-set", "Hate Khori Set for Saraswati Puja", "festive", "set", 1, 1, 12, ["sc-slate", "kk-sholapith"], "Slate, chalk, a reed pen and a small clay inkpot for a child's first letters on Saraswati Puja.", [["Includes", "Slate, chalk, pen, inkpot"]], [v("one", "Full set", "", 199, 169, 125, 150, "sc-slate")], label("sc-slate", [6, 3], 12), { tags: ["hate khori", "saraswati puja", "vidyarambha"], buyers: ["school", "shop", "play"], kolkata: true }),
    X("saraswati-puja-decoration-kit", "Saraswati Puja Decoration Kit", "festive", "kit", 1, 1, 6, ["kk-sholapith", "ev-flags"], "Shola flowers, a white and yellow paper chain, a small banner and marigold strings for a school or club Saraswati Puja.", [["Includes", "About 40 pieces"]], [v("one", "School kit", "", 899, 749, 599, 40, "kk-sholapith")], label("kk-sholapith", [20, 12], 6), { tags: ["saraswati puja", "decoration"], buyers: ["school", "event"], kolkata: true, market: "kumartuli" }),
    X("alpana-stencils-colour", "Alpana Stencils and Colours", "festive", "set", 1, 1, 12, ["kk-alpana", "ac-paints"], "Six alpana stencils and four tubs of ready colour for Lakshmi Puja and school functions.", [["Includes", "6 stencils, 4 colours"]], [v("one", "Set", "", 249, 209, 159, 100, "kk-alpana")], label("kk-alpana", [6, 3], 12), { tags: ["alpana", "rangoli", "lakshmi puja"], buyers: ["shop", "school"], kolkata: true }),
    X("bengali-alphabet-flash-cards", "Bengali Alphabet Flash Cards", "play", "set of 50", 1, 1, 10, ["pl-cards", "pl-cards-d"], "Swarabarna and Byanjanbarna cards with a picture for each letter. Laminated, rounded corners.", [["Cards", "50"], ["Language", "Bengali"]], [v("one", "50 cards", "", 160, 135, 99, 120, "pl-cards")], label("pl-cards", [8, 5], 10), { tags: ["bengali", "flash cards", "swarabarna"], buyers: ["play", "school"], kolkata: true, market: "college" }),
    X("bengali-practice-copy", "Bengali Letter Practice Copy", "school", "pc", 1, 1, 24, ["sc-notebooks", "pl-cards"], "Barnaparichay-style tracing copies for Bengali letters, with dotted lines to write over.", [["Pages", "48"], ["Language", "Bengali"]], [v("one", "48 pages", "", 40, 34, 24, 600, "sc-notebooks")], label("sc-notebooks", [4, 2], 24), { tags: ["bengali", "practice copy", "barnaparichay"], buyers: ["school", "play", "shop"], kolkata: true, market: "college", sz: "paper" }),
    X("bengali-calligraphy-pens", "Calligraphy Pens, Set of 5", "art", "set of 5", 1, 1, 12, ["of-pens-d", "ac-brushes"], "Flat-nib pens for Bengali and English calligraphy, with three ink cartridges.", [["Nibs", "1.5 to 3.8 mm"]], [v("one", "Set of 5", "", 220, 185, 139, 80, "of-pens-d")], label("of-pens-d", [8, 5], 12), { tags: ["calligraphy", "bengali"], buyers: ["school", "shop"], kolkata: true }),
    X("kites-bundle", "Paper Kites for Vishwakarma Puja", "festive", "bundle of 10", 1, 1, 10, ["kk-kite", "ev-flags"], "Ten light paper kites in mixed colours, the way the rooftops look on Vishwakarma Puja.", [["Pack", "10 kites"], ["Size", "Medium"]], [v("one", "10 kites", "", 150, 120, 85, 300, "kk-kite")], label("kk-kite", [4, 2], 10), { tags: ["kite", "ghuri", "vishwakarma puja"], buyers: ["shop"], kolkata: true, market: "burrabazar" }),
    X("manja-reel", "Manja with Lattai", "festive", "pc", 1, 1, 12, ["kk-kite", "kk-gulal"], "Coloured cotton kite thread on a wooden lattai. Cotton, not glass-coated.", [["Thread", "Cotton, 500 m"]], [v("one", "500 m", "", 199, 169, 125, 100, "kk-kite")], label("kk-kite", [6, 3], 12), { tags: ["manja", "lattai", "kite thread"], buyers: ["shop"], kolkata: true, market: "burrabazar" }),
    X("club-shield-sarbojanin", "Sarbojanin Club Shield", "prizes", "pc", 1, 1, 5, ["pr-shield", "pr-shield-d"], "A tall wooden shield for Durga Puja pandal awards and club tournaments, with an engraved plate.", [["Height", "14 in"], ["Plate", "Engraved"]], [v("one", "14 in", "", 899, 749, 599, 25, "pr-shield")],
      { blend: "engrave", kind: "prize", sides: [side("plate", "Plate", "pr-shield", .26, .39, .56, .26, 0)], methods: [m("laser", 60, 40, 0, 1)] }, { tags: ["club shield", "durga puja", "pandal award"], buyers: ["event"], kolkata: true, sz: "award" }),
    X("puja-committee-memento", "Puja Committee Memento", "prizes", "pc", 1, 1, 10, ["pr-memento", "pr-memento-d"], "A gold memento for chief guests and volunteers at the Puja committee programme.", [["Height", "10 in"]], [v("one", "10 in", "", 499, 420, 329, 30, "pr-memento")],
      { blend: "engrave", kind: "prize", sides: [side("base", "Base plate", "pr-memento", .25, .915, .18, .055, 0, "rect", "#151515")], methods: [m("laser", 40, 25, 0, 1)] }, { tags: ["memento", "puja committee"], buyers: ["event"], kolkata: true, sz: "award" }),
    X("sarbojanin-trophy-cup", "Sarbojanin Trophy Cup", "prizes", "pc", 1, 1, 5, ["pr-cup-d", "pr-cup"], "Big gold and blue trophy cups for para football, best pandal and best idol awards.", [["Height", "18 to 30 in"]], [v("18", "18 in", "", 1500, 1249, 999, 15, "pr-cup-d"), v("24", "24 in", "", 2200, 1849, 1499, 10, "pr-cup-d"), v("30", "30 in", "", 3200, 2699, 2199, 6, "pr-cup-d")], label("pr-cup-d", [0, 0], 1), { tags: ["trophy", "durga puja", "para football"], buyers: ["event"], kolkata: true, sz: "award" }),
    X("bijoya-greeting-cards", "Shubho Bijoya and Poila Baisakh Cards", "gifts", "pc", 10, 10, 100, ["kk-greeting", "kk-wedding"], "Greeting cards with envelopes, printed with your shop or family name for Bijoya and the Bengali new year.", [["Size", "5 x 7 in"], ["Includes", "Envelope"]], [v("bijoya", "Shubho Bijoya", "", 25, 20, 12, 3000, "kk-greeting"), v("baisakh", "Poila Baisakh", "", 25, 20, 12, 3000, "kk-greeting")],
      label("kk-greeting", [5, 3], 10), { tags: ["greeting card", "bijoya", "poila baisakh"], buyers: ["shop", "office"], kolkata: true, market: "chitpur" }),
    X("wedding-card-printing", "Wedding Card Printing", "gifts", "pc", 50, 50, 300, ["kk-wedding", "kk-greeting"], "Bengali and English wedding cards printed in Chitpur style, with envelope. Proof on WhatsApp.", [["Size", "7 x 9 in"], ["Language", "Bengali, English"]], [v("one", "Card with envelope", "", 45, 38, 26, 5000, "kk-wedding")],
      { blend: "print", kind: "simple", sides: [side("front", "Card", "kk-wedding", .56, .12, .18, .22, 0)], methods: [m("digital", 0, 0, 0, 50)] }, { tags: ["wedding card", "biye", "invitation"], buyers: ["shop"], kolkata: true, market: "chitpur" }),
    X("rakhi-wholesale-pack", "Rakhi, Pack of 12", "festive", "pack of 12", 1, 1, 10, ["kk-rakhi", "kk-gulal"], "Twelve thread rakhis in mixed designs, packed for shop counters.", [["Pack", "12 rakhis"]], [v("one", "Mixed", "", 180, 149, 99, 400, "kk-rakhi")], label("kk-rakhi", [4, 2], 10), { tags: ["rakhi", "raksha bandhan"], buyers: ["shop"], kolkata: true, market: "burrabazar" }),
    X("holi-gulal-pack", "Herbal Gulal, Pack of 5", "festive", "pack of 5", 1, 1, 12, ["kk-gulal", "kk-alpana"], "Five colours of soft herbal gulal for Dol Jatra and Holi. Skin friendly.", [["Pack", "5 x 100 g"]], [v("one", "5 colours", "", 199, 165, 119, 300, "kk-gulal")], label("kk-gulal", [4, 2], 12), { tags: ["gulal", "holi", "dol jatra"], buyers: ["shop"], kolkata: true, market: "burrabazar" }),
    X("terracotta-return-gift", "Terracotta Return Gift", "gifts", "pc", 1, 1, 25, ["kk-terracotta", "kk-diya"], "Small hand-painted terracotta pieces from Bengal's potters. Return gifts for weddings and annual days.", [["Height", "3 to 4 in"]], [v("one", "Assorted", "", 99, 79, 52, 300, "kk-terracotta")], label("kk-terracotta", [4, 2], 25), { tags: ["terracotta", "return gift"], buyers: ["event", "shop"], kolkata: true, market: "kumartuli" }),
    X("sholapith-return-gift", "Sholapith Flower Return Gift", "gifts", "pc", 1, 1, 25, ["kk-sholapith", "kk-terracotta"], "White shola flowers in a small box, made by Bengal's shola artisans.", [["Box", "4 x 4 in"]], [v("one", "Boxed", "", 120, 99, 69, 200, "kk-sholapith")], label("kk-sholapith", [4, 2], 25), { tags: ["sholapith", "return gift"], buyers: ["event", "shop"], kolkata: true, market: "kumartuli" }),
    X("kalighat-pat-print", "Kalighat Pat Style Art Print", "gifts", "pc", 1, 1, 10, ["kk-pat", "gf-frame"], "A print of a folk painting in the Kalighat pat style, on thick paper. Frame it for a gift.", [["Size", "A4 or A3"]], [v("a4", "A4", "", 199, 169, 119, 80, "kk-pat"), v("a3", "A3", "", 349, 299, 219, 40, "kk-pat")], label("kk-pat", [10, 6], 10), { tags: ["kalighat pat", "art print", "folk art"], buyers: ["shop", "office"], kolkata: true, market: "newmarket", sz: "paper" }),
    X("gamchha-gift-set", "Gamchha Gift Set", "gifts", "set of 2", 1, 1, 12, ["kk-gamchha", "kk-jute"], "Two soft handloom gamchhas in a jute pouch. A useful gift for guests and staff.", [["Size", "150 x 75 cm each"]], [v("one", "Set of 2", "", 299, 249, 179, 100, "kk-gamchha")], label("kk-gamchha", [10, 6], 12), { tags: ["gamchha", "handloom", "gift"], buyers: ["event", "office", "shop"], kolkata: true, market: "burrabazar" }),
    X("jute-bag-printed", "Jute Bag, Printed with Your Name", "bags", "pc", 1, 1, 25, ["kk-jute", "kk-gamchha"], "A sturdy jute bag with rope handles. Print your school, shop or event name on the front.", [["Size", "14 x 12 x 5 in"], ["Handle", "Cotton rope"]], [v("one", "Natural", "", 199, 159, 109, 400, "kk-jute", { bp: 95 })],
      { blend: "print", kind: "company", sides: [side("front", "Front", "kk-jute", .28, .52, .46, .36, 0)], methods: [m("screen", 25, 15, 350, 25), m("digital", 60, 35, 0, 1)] }, { tags: ["jute bag", "eco bag", "printed bag"], buyers: ["event", "shop", "school"], kolkata: true, market: "burrabazar", bq: 250, best: true, rank: 7.5 }),
    X("clay-diyas-kali-puja", "Clay Diyas for Kali Puja and Diwali", "festive", "pack of 25", 1, 1, 10, ["kk-diya", "kk-terracotta"], "Twenty-five hand-pressed clay diyas, fired hard so they do not crack.", [["Pack", "25 diyas"], ["Size", "2.5 in"]], [v("plain", "Plain", "", 120, 99, 69, 500, "kk-diya"), v("painted", "Painted", "", 199, 165, 119, 200, "kk-diya")], label("kk-diya", [4, 2], 10), { tags: ["diya", "kali puja", "diwali"], buyers: ["shop", "school"], kolkata: true, market: "kumartuli", best: true, rank: 4.5 })
  ];
  PRODUCTS.push.apply(PRODUCTS, MORE);
  /** Own primary photo for products that used to share one. Variants that showed the old photo move too. */
  var PRIMARY = { "admission-forms-printed": "of-forms", "attendance-register": "of-attendance", "bengali-practice-copy": "sc-practice", "alphabet-wall-chart": "sc-alphachart", "bengali-alphabet-flash-cards": "pl-bnletters",
    "club-shield-sarbojanin": "pr-clubshield", "puja-committee-memento": "pr-memento2", "report-cards-printed": "pr-reportcard", "custom-photo-calendar": "cl-photo", "bengali-wall-calendar": "cl-bengali",
    "white-school-shirt-full": "un-shirt-full", "sports-day-bibs": "un-bibs", "school-half-pant-grey": "un-halfpant", "hate-khori-set": "sc-hatekhori", "whiteboard-markers": "of-markers", "saraswati-puja-decoration-kit": "kk-decor", "manja-reel": "kk-manja" };
  PRODUCTS.forEach(function (p) {
    var k = PRIMARY[p.slug]; if (!k) return;
    var old = p.imgs[0]; p.imgs = [k].concat(p.imgs.filter(function (x) { return x !== k; }));
    p.variants.forEach(function (vv) { if (vv.img === old) vv.img = k; });
  });
  /**
   * Who can be customised: only items that are really personalised in the school, office and gift
   * trade AND whose photo gives a believable print surface. Everything else has no Customise button.
   */
  var NOT_CUSTOM = ["club-shield-sarbojanin", "white-school-shirt-full", "visiting-cards", "wedding-card-printing"];
  PRODUCTS.forEach(function (p) { p.custom = p.pr.kind !== "label" && NOT_CUSTOM.indexOf(p.slug) < 0; });

  /** Returns and exchanges, one rule per kind of item. */
  var CONSUMABLE = ["glitter-glue-set-6", "holi-gulal-pack", "play-dough-6", "slate-with-chalk", "lunch-box-3-compartment", "tape-and-rubber-bands"];
  function returnPolicy(p, custom) {
    if (custom) return { returnable: false, exchange: false, days: 0, short: "No return on personalised items", text: "This item carries your name or logo, so it cannot be returned or exchanged. If there is a printing defect or our mistake, we replace it free." };
    if (CONSUMABLE.indexOf(p.slug) > -1) return { returnable: false, exchange: false, days: 0, short: "No return once opened", text: "Hygiene and consumable item: no return once opened. Damaged or wrong items are always replaced." };
    if (p.cat === "festive") return { returnable: false, exchange: false, days: 2, short: "Return only if damaged on arrival", text: "Festival items can be returned only if they arrive damaged. Tell us within 48 hours with a photo on WhatsApp." };
    if (p.sz === "clothing" || p.sz === "shoes") return { returnable: true, exchange: true, days: 7, short: "7-day size exchange · Easy returns", text: "Exchange the size within 7 days if unworn with tags. Return for a refund within 7 days if unused. Free pickup if it was our mistake." };
    return { returnable: true, exchange: true, days: 7, short: "7-day return or exchange", text: "Return or exchange within 7 days if unopened and unused. Damaged or wrong items are always replaced free. Wholesale orders: unopened full packs within 7 days, 10% restocking fee (sample)." };
  }
  CATS.push(
    { id: "schoolwear", img: "un-shirt-white", name: "School uniforms", short: "Uniforms", icon: "cap", line: "Shirts, trousers, skirts, sweaters, shoes and socks in every size." },
    { id: "sports", img: "sp-football", name: "Sports and events", short: "Sports", icon: "cube", line: "Footballs, cricket sets, cones, house flags and balloons." },
    { id: "festive", img: "kk-diya", name: "Puja and festival", short: "Puja and festival", icon: "gift", line: "Haal khata, panjika, kites, diyas, rakhi and Puja kits." });
  ["school-tie-striped", "school-belt", "id-card-holder-lanyard"].forEach(function (s) { PRODUCTS.forEach(function (p) { if (p.slug === s) { p.tags.push("uniform"); } }); });
  // A few of the first products are Kolkata specials too.
  ["long-register-khata", "wall-calendar-2027"].forEach(function (s) { PRODUCTS.forEach(function (p) { if (p.slug === s) p.kolkata = true; }); });

  /** Kolkata wholesale markets. Sample: shows where this kind of item is usually bought wholesale. */
  var MARKETS = [
    { id: "burrabazar", name: "Burrabazar", line: "General wholesale: toys, gifts, plastics, festival goods, rakhi, colours and kites." },
    { id: "bagree", name: "Bagree Market", line: "Toys, gifts, small stationery and fancy goods." },
    { id: "poddar", name: "Poddar Court", line: "Paper, files, registers and office supplies." },
    { id: "college", name: "College Street", line: "Books, notebooks, exam stationery and practice copies." },
    { id: "canning", name: "Canning Street", line: "Stationery, art material, plastic goods and bags." },
    { id: "chandni", name: "Chandni Chowk", line: "Stopwatches, calculators, lights and small electronics." },
    { id: "chitpur", name: "Chitpur Road", line: "Printing: calendars, panjika, wedding and greeting cards." },
    { id: "lalbazar", name: "Lalbazar", line: "Rubber stamps and seals." },
    { id: "mangla", name: "Mangla Haat, Howrah", line: "Garments: school uniforms, T-shirts and trousers." },
    { id: "acmarket", name: "Burrabazar AC Market", line: "Garments wholesale: sweaters, blazers and winter wear." },
    { id: "newmarket", name: "New Market", line: "Gifts and decor, a retail and wholesale mix." },
    { id: "kumartuli", name: "Kumartuli", line: "Clay, terracotta, shola and Puja items." }
  ];
  var CAT_MARKET = { office: "poddar", school: "college", art: "canning", play: "bagree", toys: "bagree", gifts: "newmarket", prizes: "burrabazar", bags: "canning", uniform: "mangla", calendars: "chitpur", schoolwear: "mangla", sports: "burrabazar", festive: "burrabazar" };
  var MARKET_SLUG = { "school-sweater-v-neck": "acmarket", "school-blazer-navy": "acmarket", "school-track-suit": "acmarket", "diary-2027-a5": "chitpur", "custom-photo-calendar": "chitpur", "certificate-sheets-a4": "chitpur", "a4-copier-paper-ream": "poddar", "gel-pen-pack-10": "canning", "white-ceramic-mug": "newmarket", "metal-pen-gift-box": "newmarket" };
  PRODUCTS.forEach(function (p) { if (!p.market) p.market = MARKET_SLUG[p.slug] || CAT_MARKET[p.cat] || "burrabazar"; });

  /** Which size guide each product uses. */
  var BAG_SLUGS = ["school-backpack"], CAPBELT = ["cotton-cap-printed", "school-belt"];
  PRODUCTS.forEach(function (p) {
    if (p.sz) return;
    if (CAPBELT.indexOf(p.slug) > -1) p.sz = "capbelt";
    else if (BAG_SLUGS.indexOf(p.slug) > -1) p.sz = "bag";
    else if (p.cat === "prizes") p.sz = "award";
    else if (/notebook|register|paper|certificate|calendar|diary|file|chart-paper|drawing-book|envelope/.test(p.slug)) p.sz = "paper";
    else p.sz = "dims";
  });
  var SIZE = {
    clothing: { cols: ["Size", "Age", "Height", "Chest", "Waist", "Length", "Sleeve"], rows: [["22", "3-4", 98, 56, 50, 42, 13], ["24", "5-6", 110, 61, 53, 45, 14], ["26", "7-8", 122, 66, 56, 49, 15], ["28", "9-10", 134, 71, 59, 53, 16], ["30", "11-12", 146, 76, 63, 57, 17], ["32", "13-14", 156, 81, 67, 61, 18], ["34", "15-16", 164, 86, 72, 65, 19], ["36", "S (adult)", 168, 92, 78, 69, 20], ["38", "M (adult)", 172, 98, 84, 71, 21], ["40", "L (adult)", 176, 104, 90, 73, 22], ["42", "XL (adult)", 180, 110, 96, 75, 23], ["44", "XXL (adult)", 184, 116, 102, 77, 24]] },
    shoes: { cols: ["Size (UK/India)", "Age", "Foot length"], rows: [["10C", "4", 17.5], ["12C", "6", 19], ["1", "7-8", 20.5], ["3", "9-10", 22], ["5", "12-13", 24], ["7", "adult", 25.5], ["8", "adult", 26.5]] },
    capbelt: { cols: ["Size", "Head (cap)", "Waist (belt)"], rows: [["Junior", "50 to 54", "55 to 70"], ["Senior", "54 to 58", "65 to 85"], ["Adult", "56 to 60", "75 to 100"]] },
    bag: { cols: ["Bag", "Capacity", "Size (H x W x D)", "Suits"], rows: [["24 L backpack", "24 litres", "43 x 30 x 15", "Class 3 to 10"]] },
    award: { note: "Engraving area depends on the item. Plates and cups are engraved on the front." },
    paper: { cols: ["Size", "Millimetres", "Inches"], rows: [["A3", "297 x 420", "11.7 x 16.5"], ["A4", "210 x 297", "8.3 x 11.7"], ["A5", "148 x 210", "5.8 x 8.3"], ["B5", "176 x 250", "6.9 x 9.8"], ["Long book", "200 x 330", "7.9 x 13"], ["Foolscap", "216 x 343", "8.5 x 13.5"], ["Legal", "216 x 356", "8.5 x 14"]] }
  };

  var REVIEW_POOL = [
    { n: "Sudipta", c: "Barasat", s: 5, t: "Better rate than the local market", b: "Took 200 notebooks for our coaching centre. Same quality as the shop next door, and the wholesale price came on its own in the cart." },
    { n: "Ruksana", c: "Kolkata", s: 5, t: "Delivered next day", b: "Ordered in the evening, the parcel came to the school office the next afternoon. Bill had our GST number on it." },
    { n: "Pritam", c: "Bardhaman", s: 4, t: "Good, packing could be tighter", b: "All items fine. One box of pencils was a bit crushed at the corner but nothing broke." },
    { n: "Mousumi", c: "Siliguri", s: 5, t: "Our play school's regular supplier now", b: "Crayons, flash cards and play dough every term. They reply on WhatsApp quickly." },
    { n: "Anirban", c: "Howrah", s: 5, t: "Medals looked great", b: "Sports day medals with our school name. The engraving was neat and the ribbons were bright." },
    { n: "Kavita", c: "Durgapur", s: 4, t: "Fair prices", b: "Bought one diary first to check, then 40 for the office with our logo. Printing was clear." },
    { n: "Rafiq", c: "Malda", s: 5, t: "Small shop, small quantities, no problem", b: "I run a small stationery shop. I can take 50 pens one week and 200 the next. COD worked fine." },
    { n: "Tanmoy", c: "Kalyani", s: 3, t: "Took a day longer", b: "Products are good. Delivery took 4 days instead of 3 but they told me in advance." },
    { n: "Shreya", c: "Kolkata", s: 5, t: "Printed caps for our rally", b: "75 caps with our club name, ready in 4 days. The preview on the site matched the real thing." },
    { n: "Bikash", c: "Asansol", s: 4, t: "Happy", b: "Simple ordering. The minimum quantity and wholesale price are shown clearly, no haggling needed." }
  ];

  /** Questions and answers per category. */
  var QA = {
    default: [["Can I buy just one piece?", "Yes. Every product can be bought at the shop price from one piece or one small pack. The wholesale price starts on its own when you reach the wholesale quantity."], ["Do you give a GST bill?", "Yes. Add your GSTIN at checkout and the bill shows it, so you can claim the input credit."], ["Can a school get a better rate for large orders?", "Yes. Tap Get a bulk quote and we reply within 2 working hours with a school rate."]],
    prizes: [["How long does engraving take?", "Two working days for up to 100 pieces. Larger orders take 3 to 4 days."], ["Can each medal have a different name?", "Yes. Use the name list in the design studio or paste the names in a bulk quote."], ["Is engraving included?", "Engraving is charged per piece and shown in the studio before you order. Trophy cups from 5 pieces include it."]],
    uniform: [["Embroidery or print for caps?", "Print is cheaper and fine for one-day events. Embroidery lasts years and looks premium; it needs 25 pieces or more."], ["Can I mix colours in one order?", "Yes. The wholesale price counts each colour line separately, so ask for a bulk quote to combine them."], ["How do you print ID cards with names?", "Paste the names in the design studio. Each card is printed with its own name at no extra setup cost."]]
  };

  /** Mock PIN prefix table: city and state for the checkout auto-fill. */
  var PINS = {
    "700": ["Kolkata", "West Bengal"], "711": ["Howrah", "West Bengal"], "712": ["Hooghly", "West Bengal"], "713": ["Bardhaman", "West Bengal"],
    "721": ["Medinipur", "West Bengal"], "722": ["Bankura", "West Bengal"], "731": ["Bolpur", "West Bengal"], "732": ["Malda", "West Bengal"], "734": ["Siliguri", "West Bengal"],
    "741": ["Nadia", "West Bengal"], "742": ["Murshidabad", "West Bengal"], "743": ["North 24 Parganas", "West Bengal"], "110": ["New Delhi", "Delhi"], "400": ["Mumbai", "Maharashtra"], "411": ["Pune", "Maharashtra"],
    "560": ["Bengaluru", "Karnataka"], "600": ["Chennai", "Tamil Nadu"], "500": ["Hyderabad", "Telangana"], "380": ["Ahmedabad", "Gujarat"],
    "302": ["Jaipur", "Rajasthan"], "226": ["Lucknow", "Uttar Pradesh"], "800": ["Patna", "Bihar"], "751": ["Bhubaneswar", "Odisha"],
    "781": ["Guwahati", "Assam"], "834": ["Ranchi", "Jharkhand"], "826": ["Dhanbad", "Jharkhand"], "799": ["Agartala", "Tripura"], "744": ["Port Blair", "Andaman and Nicobar Islands"]
  };

  var STATES = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

  /** @type {{code:string,label:string,type:"percent"|"flat"|"ship",value:number,min:number,firstOnly:boolean}[]} */
  /**
   * Coupons. scope: "all", or {cats:[...]} / {slugs:[...]} / "custom" / "kolkata". min is the cart
   * subtotal (or the subtotal of in-scope lines when scoped). cap limits a percent discount. Sample codes.
   */
  var COUPONS = [
    { code: "FIRST50", label: "₹50 off your first order", type: "flat", value: 50, min: 499, firstOnly: true, scope: "all", till: "2027-03-31" },
    { code: "SCHOOL5", label: "5% off orders of ₹10,000 or more", type: "percent", value: 5, min: 10000, cap: 2500, firstOnly: false, scope: "all", till: "2027-03-31" },
    { code: "FREEDEL", label: "Free delivery on this order", type: "ship", value: 0, min: 0, firstOnly: false, scope: "all", till: "2027-03-31" },
    { code: "UNIFORM10", label: "10% off school uniforms", type: "percent", value: 10, min: 5000, cap: 1500, firstOnly: false, scope: { cats: ["schoolwear"] }, where: "uniforms", till: "2027-04-30" },
    { code: "PRIZE100", label: "₹100 off prizes and trophies", type: "flat", value: 100, min: 1500, firstOnly: false, scope: { cats: ["prizes"] }, where: "prizes and trophies", till: "2027-03-31" },
    { code: "BACK2SCHOOL", label: "5% off school stationery", type: "percent", value: 5, min: 999, cap: 500, firstOnly: false, scope: { cats: ["school", "art", "bags"] }, where: "school stationery, art and bags", till: "2027-04-30" },
    { code: "PUJO50", label: "₹50 off Kolkata specials", type: "flat", value: 50, min: 499, firstOnly: false, scope: "kolkata", where: "Kolkata specials", till: "2026-12-31" },
    { code: "PRINTFREE", label: "Print setup fee waived on one design", type: "setup", value: 0, min: 0, firstOnly: false, scope: "custom", where: "custom printed items", till: "2027-03-31" }
  ];

  var STORE = {
    name: "Kolom Khata Stationers",
    sub: "Retail and wholesale · College Street · Since 1979",
    address: "18 College Row, College Street, Kolkata 700009",
    phone: "+919804243159", phoneDisplay: "+91 98042 43159",
    email: "orders@kolomkhata.example",
    gstin: "19ABCDE1234F1Z5",
    hours: "Mon to Sat, 9:30 am to 8 pm",
    ship: { kolkata: 40, wb: 60, india: 80, freeAt: 799, bigAt: 5000 },
    codMaxOutside: 3000,
    bank: { name: "Kolom Khata Stationers", bank: "Sample Bank of India, College Street branch", ac: "000123456789", ifsc: "SBIN0SAMPLE" },
    hsn: { office: "4820", school: "9609", art: "9609", play: "9503", toys: "9503", gifts: "6912", prizes: "8306", bags: "4202", uniform: "6505", calendars: "4910" }
  };

  /** Pre-seeded sample orders so tracking works before the visitor buys. Times are hours before page load. */
  var SEED_ORDERS = [
    { no: "KKS-200311", mobile: "9830012345", name: "Ritika S.", biz: "Sunbeam Kids Play School", city: "Kolkata", state: "West Bengal", pin: "700029", hoursAgo: 76, stage: 4, pay: "upi",
      items: [["flash-card-set", "abc", 10], ["wax-crayons", "12", 24]] },
    { no: "KKS-200298", mobile: "9876543210", name: "Arjun M.", biz: "", city: "Siliguri", state: "West Bengal", pin: "734001", hoursAgo: 30, stage: 2, pay: "cod",
      items: [["smooth-ball-pen", "blue", 50]] },
    { no: "KKS-200305", mobile: "9123456780", name: "Sneha P.", biz: "", city: "Patna", state: "Bihar", pin: "800001", hoursAgo: 5, stage: 1, pay: "upi",
      items: [["geometry-box", "blue", 1], ["ruled-notebook-172", "single", 6]] },
    { no: "KKS-200318", mobile: "9831122334", name: "Moumita D.", biz: "Kheyal Tuition Centre", city: "Kolkata", state: "West Bengal", pin: "700032", hoursAgo: 1, stage: 0, pay: "upi",
      items: [["hb-pencils", "one", 100], ["ruled-notebook-172", "single", 30], ["white-school-shirt-half", "s26", 2]] }
  ];

  /** Extra orders for the owner's dashboard: [no, name, city, hoursAgo, status, pay, items, buyer type]. */
  var ADMIN_ORDERS = [
    ["KKS-200339", "St. Aloysius Primary", "Kolkata", 2, "New", "bank", [["sports-medal-50mm", "gold", 150], ["trophy-cup", "10", 12]], "School"],
    ["KKS-200338", "Imran K.", "Murshidabad", 3, "New", "cod", [["hb-pencils", "one", 10], ["eraser-sharpener-combo", "one", 5]], "Retail"],
    ["KKS-200337", "Maa Tara Stores", "Bardhaman", 5, "Packed", "upi", [["smooth-ball-pen", "black", 500], ["ruled-notebook-172", "single", 96]], "Shop"],
    ["KKS-200336", "Vikram R.", "Kolkata", 7, "Packed", "upi", [["white-ceramic-mug", "one", 1]], "Retail"],
    ["KKS-200335", "Little Steps Play School", "Howrah", 9, "Shipped", "bank", [["wooden-building-blocks", "natural", 6], ["play-dough-6", "one", 24]], "Play school"],
    ["KKS-200334", "Anil T.", "Ranchi", 20, "Shipped", "cod", [["school-backpack", "navy", 1]], "Retail"],
    ["KKS-200333", "Dutta and Sons Traders", "Asansol", 26, "Shipped", "netbanking", [["a4-copier-paper-ream", "75", 20], ["box-file-foolscap", "black", 40]], "Office"],
    ["KKS-200332", "Green Valley School", "Kalyani", 31, "Delivered", "bank", [["exam-clip-board", "one", 240]], "School"],
    ["KKS-200331", "Tanushree C.", "Kolkata", 44, "Delivered", "upi", [["diary-2027-a5", "pink", 1]], "Retail"],
    ["KKS-200330", "Rising Star Club", "Barasat", 50, "Delivered", "upi", [["cotton-cap-printed", "white", 75]], "Event"],
    ["KKS-200329", "Rakesh P.", "Bhubaneswar", 70, "Returned", "cod", [["puzzle-cube-3x3", "one", 2]], "Retail"]
  ];

  /** Sales for the last 6 days before today, in rupees, for the 7-day chart. */
  var SALES_7 = [38420, 52690, 31340, 61810, 47150, 58260];

  var ABANDONED = [
    { name: "Rupa S.", mobile: "98310 4xxxx", items: "Sports Medal, Gold x 60", value: 1800, ago: "2 hours ago" },
    { name: "Aditya K.", mobile: "99030 7xxxx", items: "School Backpack, Navy + 1 more", value: 1098, ago: "5 hours ago" },
    { name: "Bright Minds Coaching", mobile: "90070 2xxxx", items: "Diary 2027 x 40 (printed)", value: 9160, ago: "Yesterday" },
    { name: "Farhan A.", mobile: "97480 1xxxx", items: "HB Pencils x 200 + 2 more", value: 1460, ago: "Yesterday" }
  ];

  var TOP_MONTH = [["hb-pencils", 6200], ["smooth-ball-pen", 4850], ["ruled-notebook-172", 2310], ["sports-medal-50mm", 1420], ["flash-card-set", 380]];

  /** Top buyers this month for the dashboard: [name, type, city, orders, value]. */
  var TOP_BUYERS = [
    ["St. Aloysius Primary", "School", "Kolkata", 4, 48600],
    ["Maa Tara Stores", "Shop", "Bardhaman", 6, 39250],
    ["Dutta and Sons Traders", "Office", "Asansol", 3, 21400],
    ["Little Steps Play School", "Play school", "Howrah", 2, 14780],
    ["Rising Star Club", "Event", "Barasat", 2, 11900]
  ];

  /** Seeded print jobs for the dashboard: [job no, product slug, qty, method, sides, status, customer]. */
  var PRINT_JOBS = [
    ["PJ-4108", "sports-medal-50mm", 150, "laser", "Face", "Proof approved", "St. Aloysius Primary"],
    ["PJ-4107", "cotton-cap-printed", 75, "screen", "Front panel", "In print", "Rising Star Club"],
    ["PJ-4105", "diary-2027-a5", 40, "digital", "Front cover", "Ready", "Bright Minds Coaching"]
  ];

  /** Seeded quote requests for the dashboard. */
  var SEED_QUOTES = [
    { no: "QR-3104", school: "Hindu Girls' High School, Kolkata", contact: "Mrs. S. Ghosh", city: "Kolkata", status: "New", hoursAgo: 3,
      items: [["sports-medal-50mm", "gold", 300, "Laser engraving: Annual Sports 2027"], ["trophy-cup", "12", 20, "Laser engraving"]] },
    { no: "QR-3101", school: "Tiny Tots Play School, Siliguri", contact: "Mr. R. Thapa", city: "Siliguri", status: "Quoted", hoursAgo: 28,
      items: [["flash-card-set", "abc", 60, ""], ["flash-card-set", "123", 60, ""]] },
    { no: "QR-3097", school: "Pathfinder Coaching Centre, Howrah", contact: "Mr. A. Saha", city: "Howrah", status: "Won", hoursAgo: 75,
      items: [["diary-2027-a5", "blue", 250, "Full colour digital print: logo on cover"]] }
  ];

  var FAQ = [
    ["Is there a minimum order?", "No. You can buy one pencil. Each product shows its shop price for small quantities and its wholesale price, which starts on its own once your quantity reaches the wholesale number shown on the product."],
    ["How does the wholesale price work?", "It is worked out for each line in your cart. For example, HB pencils are ₹6 each, and from 50 pencils every pencil in that line is ₹4. The cart tells you how many more you need."],
    ["Do you deliver outside Kolkata?", "Yes. Small parcels go by courier or India Post across India for ₹80 (₹60 in West Bengal, ₹40 in Kolkata). Big orders over ₹5,000 go free in West Bengal and by transport elsewhere."],
    ["Can you print our school or company name?", "Yes, on almost everything. Open Customise on any product, add your name and logo, and see the preview before you order."],
    ["Do you give GST bills?", "Yes. Add your GSTIN at checkout. Schools and offices can also pay by bank transfer (NEFT or RTGS)."]
  ];

  var POLICIES = {
    shipping: { title: "Delivery policy", body: [
      ["Charges", "Kolkata ₹40, rest of West Bengal ₹60, rest of India ₹80, by courier or India Post. Delivery is free on orders of ₹799 or more."],
      ["Big orders", "Orders of ₹5,000 or more are delivered free anywhere in West Bengal. Outside West Bengal we send them by road transport; the transport charge is confirmed with you on WhatsApp before dispatch."],
      ["Dispatch", "Stock items leave College Street within 24 hours. Printed and engraved items take 2 to 4 working days after you approve the proof."],
      ["Cash on delivery", "COD is open across West Bengal, and on orders up to ₹3,000 elsewhere. It is not available on a few remote PIN codes."]] },
    returns: { title: "Returns and replacements", body: [
      ["Stock items", "Unused items in their original packing can be returned within 7 days of delivery."],
      ["Damaged or short", "Send a photo on WhatsApp within 48 hours. We send the missing or damaged items free."],
      ["Printed items", "Items printed or engraved to your approved design cannot be returned, unless the print is faulty or does not match the proof."],
      ["Refunds", "Prepaid orders are refunded to the same method within 5 to 7 working days. COD orders are refunded by UPI or bank transfer."]] },
    privacy: { title: "Privacy policy", body: [
      ["What we collect", "Your name, mobile number, address and GSTIN, only to deliver your order and send the bill."],
      ["Your designs", "Logos and photos you use in the design studio stay on your device until you place an order."],
      ["Payments", "Payments are handled on Razorpay's secure page. We never see or store your card, UPI or bank details."],
      ["Sharing", "We share your address and phone number only with the courier or transporter delivering your parcel."]] },
    terms: { title: "Terms of sale", body: [
      ["Prices", "All prices are in Indian rupees and include GST. The wholesale price applies per cart line once the quantity reaches the number shown on the product."],
      ["Printing", "You are responsible for the spelling, colours and logo in your approved proof. Colours on paper and fabric can look a little different from the screen."],
      ["Orders", "We may cancel an order if an item is out of stock or a price was shown wrongly. You get a full refund."],
      ["Disputes", "These terms follow Indian law, with courts in Kolkata."]] }
  };

  /** Delivery date rules. Days are working days (Sundays and HOLIDAYS skipped). */
  var DELIVERY = {
    cutoff: 14,                              // orders before 2 pm leave the same day
    holidays: ["2026-12-25", "2027-01-01", "2027-01-23", "2027-01-26", "2027-03-03"],
    zones: { kolkata: [1, 2], wb: [2, 3], north: [3, 5], metro: [3, 5], india: [4, 7] },
    express: { kolkata: [0, 1], metro: [1, 2] },
    remoteExtra: [2, 4],
    northPins: ["732", "733", "734", "735", "736"],
    metroPins: ["110", "400", "560", "600", "500", "411", "380", "122", "201"],
    lowStockExtra: 1,                        // low stock is counted by hand, one more day
    bigOrderExtra: 1,                        // five times the wholesale quantity or more
    production: { digital: 1, screen: 3, laser: 2, embroidery: 4, label: 1 },
    calendarProduction: 5,
    lowAt: function (p) { return p.wq >= 50 ? 100 : p.wq >= 12 ? 25 : 10; }
  };

  // ---------- reviews ----------
  /**
   * @typedef {Object} Review
   * @property {string} id
   * @property {string} name     first name and initial
   * @property {string} town
   * @property {"School"|"Shop owner"|"Office"|"Parent"} type
   * @property {number} stars
   * @property {string} title
   * @property {string} text
   * @property {string} qty      what they bought, e.g. "200 pcs (wholesale)"
   * @property {string} [photo]  image key
   * @property {number} days     days ago
   * @property {number} helpful
   * @property {boolean} verified
   */
  var NAMES = ["Sudipta B.", "Ruksana K.", "Pritam D.", "Mousumi S.", "Anirban G.", "Kavita M.", "Rafiq A.", "Tanmoy P.", "Shreya C.", "Bikash R.", "Moumita H.", "Arijit N.", "Priyanka S.", "Debashis M.", "Sabina Y.", "Rajib K.", "Nandini B.", "Soumen D.", "Farhana I.", "Amit J.", "Sharmila R.", "Joydeep L.", "Paramita G.", "Imran H."];
  var TOWNS = ["Kolkata (Shyambazar)", "Kolkata (Behala)", "Kolkata (Garia)", "Kolkata (Dum Dum)", "Howrah", "Barasat", "Bardhaman", "Siliguri", "Krishnanagar", "Haldia", "Asansol", "Malda", "Kalyani", "Bankura", "Durgapur", "Contai", "Jalpaiguri", "Chinsurah"];
  /** Review lines per category: [stars, title, text, buyer type, wholesale?]. {q} is replaced with the quantity. */
  var RV = {
    office: [[5, "Smooth and no blots", "Ordered {q} for our accounts office. Writes clean on ledger paper and the ink lasts.", "Office", 1], [5, "Same as the market, cheaper", "I run a xerox shop. Took {q} at the wholesale rate and the GST bill came with it.", "Shop owner", 1], [4, "Good for daily use", "Bought {q} for home. Fine quality, a little plain to look at.", "Parent", 0], [3, "Okay, one piece faulty", "Out of {q}, one was not working. They replaced it in the next parcel without fuss.", "Office", 1], [5, "Regular order now", "Third month we are ordering {q} for the branch. Never short in count.", "Office", 1]],
    school: [[5, "Children like them", "Took {q} for our primary section. Good quality, the children use them every day and nothing broke in the first month.", "School", 1], [5, "Wholesale price came on its own", "Ordered {q} for my shop near the station. The lower price showed in the cart, no bargaining.", "Shop owner", 1], [4, "Good, delivery took 3 days", "Bought {q} for my son and his cousins. Quality is good. Delivery to our town took 3 days.", "Parent", 0], [5, "Exam season stock", "We order {q} before every exam. Packing is neat, counted in bundles.", "School", 1], [3, "Fine for the price", "Bought {q}. Average quality, but the price is fair for daily use.", "Parent", 0]],
    art: [[5, "Bright colours", "Bought {q} for the drawing class. Colours are bright and the children could use them easily.", "School", 1], [4, "Good value", "Took {q} for my daughter's art class. Lasted the whole term.", "Parent", 0], [5, "Sells fast in my shop", "Ordered {q} to resell. Customers come back for the same one.", "Shop owner", 1], [3, "A few broke in transit", "{q} ordered, two were broken in the box. Rest are fine.", "Shop owner", 1]],
    play: [[5, "Our teachers love it", "Ordered {q} for our play school rooms. Strong, safe and easy to clean.", "School", 1], [5, "Safe for small kids", "Bought {q} for my 3 year old. No sharp edges, colours did not come off.", "Parent", 0], [4, "Good, wanted more colours", "Took {q} for our centre. Good quality. Wish there were more options.", "School", 1], [5, "Repeat order", "Second time we bought {q} for the new batch. Same quality as before.", "School", 1]],
    toys: [[5, "Return gifts sorted", "Bought {q} as return gifts for my son's birthday. Kids were happy.", "Parent", 0], [4, "Good margin for my shop", "Ordered {q} for my toy counter. Sells well before Durga Puja.", "Shop owner", 1], [5, "Quiz prizes", "We gave these as prizes. Took {q}, all packed well.", "School", 1], [3, "Box was dented", "Toy is fine but the outer box was dented. Ordered {q}.", "Shop owner", 1]],
    gifts: [[5, "Printed mugs for the office", "Ordered {q} with our logo for the staff. Print is sharp and did not fade in the wash.", "Office", 1], [5, "Teachers day gift", "Took {q} for our teachers. They looked expensive, cost was fair.", "School", 1], [4, "Nice gift", "Bought {q} for a family function. Neatly packed.", "Parent", 0], [4, "Good, delivery a day late", "Ordered {q}. Good quality, came one day after the date they said.", "Office", 1]],
    prizes: [[5, "Engraving was clean", "Ordered {q} for our sports day. The engraving was clean and the ribbons bright.", "School", 1], [5, "Annual day sorted in time", "We needed {q} in a week. They sent the proof on WhatsApp and delivered in 5 days.", "School", 1], [4, "Good finish", "Took {q} for our club tournament. Finish is good, a bit lighter than I expected.", "Shop owner", 1], [5, "Club prize", "Bought {q} for our para football final. Everyone liked them.", "Parent", 0], [3, "One name spelt wrong", "Out of {q}, one had a spelling mistake. My fault in the list, they redid it at cost.", "School", 1]],
    bags: [[5, "Strong stitching", "Bought {q} for my children. Zips are strong and the straps are padded.", "Parent", 0], [5, "Bags with our crest", "Ordered {q} with our school crest for the new session. Print matched the preview.", "School", 1], [4, "Good, colour a shade darker", "Took {q}. Good bag, colour a little darker than the photo.", "Shop owner", 1], [4, "Value for money", "Ordered {q} for my shop. Customers like the bottle pocket.", "Shop owner", 1]],
    uniform: [[5, "Caps for our rally", "Ordered {q} with our club name. Ready in 4 days, the preview matched.", "Shop owner", 1], [5, "ID cards with names", "Ordered {q} with every child's name. No spelling mistakes, lanyards are strong.", "School", 1], [4, "Good for the price", "Bought {q} for the new session. Fine quality for school use.", "School", 1], [4, "Fits well", "Bought {q} for my son. Fits well, colour is fine.", "Parent", 0]],
    calendars: [[5, "Clients liked our calendar", "Ordered {q} with our shop name and photos. Printing was clear and the colours true.", "Shop owner", 1], [5, "School calendar with our events", "Took {q} with photos of our annual day. Parents were happy.", "School", 1], [4, "Good diary", "Bought {q} for the office. Good paper, cover a bit soft.", "Office", 1], [4, "Neat", "Bought {q} for home. Neat and useful.", "Parent", 0]]
  };
  RV.schoolwear = [[5, "Fits well, colour matches", "Ordered {q} for our school. The white is the same as our old supplier and sizes are true.", "School", 1], [4, "Good, sizes slightly big", "Bought {q} for my son. Good stitching. Size runs a little big, fine for a growing child.", "Parent", 0], [5, "Uniform shop restock", "I run a uniform shop in the market. Took {q} at the wholesale rate before the new session.", "Shop owner", 1], [4, "Logo embroidery neat", "{q} with our crest on the pocket. Embroidery is neat, took 5 days.", "School", 1]];
  RV.sports = [[5, "Sports day sorted", "Bought {q} for our sports day. Strong and good value.", "School", 1], [4, "Good for the para club", "Took {q} for our club. Good quality for the price.", "Shop owner", 1], [5, "Children enjoy it", "Bought {q} for the kids. Lasted the whole winter.", "Parent", 0]];
  RV.festive = [[5, "Just like the old shops", "Bought {q} before the puja. Same quality as we used to get in Burrabazar, delivered home.", "Shop owner", 1], [5, "For our shop's haal khata", "Took {q}. Good and on time for the new year.", "Shop owner", 1], [4, "Good, delivery took 2 days", "Ordered {q} for the family. Good quality.", "Parent", 0], [5, "School function", "Took {q} for our school function. Children loved it.", "School", 1]];
  function uw(p, n) { var un = p.unit.replace(/\s*\(.*\)/, ""), sp = un.indexOf(" "), w = sp < 0 ? un : un.slice(0, sp), rest = sp < 0 ? "" : un.slice(sp); if (n !== 1) w = w === "pc" ? "pcs" : /(x|s|ch)$/.test(w) ? w + "es" : w + "s"; return w + rest; }
  function seeded(n) { var x = Math.sin(n) * 10000; return x - Math.floor(x); }
  function hashStr(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  /** @type {Object<string, Review[]>} */
  var REVIEWS = {};
  PRODUCTS.forEach(function (p) {
    var h = hashStr(p.slug), pool = RV[p.cat], n = p.best ? 6 + (h % 5) : 3 + (h % 3), out = [];
    for (var i = 0; i < n; i++) {
      var t = pool[(h + i * 3) % pool.length], r = seeded(h + i * 7);
      var whole = t[4] && p.wq > 1, q = whole ? p.wq * (1 + Math.floor(r * 4)) : p.min * (1 + Math.floor(r * 2));
      var unit = uw(p, q);
      var stars = t[0];
      if (p.best && stars < 4 && i % 2) stars = 4;
      out.push({ id: p.slug + "-r" + i, name: NAMES[(h + i * 5) % NAMES.length], town: TOWNS[(h + i * 11) % TOWNS.length], type: t[3], stars: stars, title: t[1],
        text: t[2].replace("{q}", q + " " + unit), qty: q + " " + unit + (whole ? " (wholesale)" : " (retail)"),
        photo: i === 1 || i === 2 ? "rv-" + p.slug + "-" + i : "", days: 2 + i * 9 + (h % 7), helpful: Math.floor(seeded(h + i) * 24), verified: i % 5 !== 4 });
    }
    REVIEWS[p.slug] = out;
  });

  // ---------- questions and answers ----------
  /** Q&A per product, built from the product's own numbers so answers match its MOQ, tiers and print methods. */
  var MNAME = { digital: "full colour digital print", screen: "one-colour screen print", laser: "laser engraving", embroidery: "embroidery", label: "a printed sticker label" };
  var QAS = {};
  PRODUCTS.forEach(function (p) {
    var h = hashStr(p.slug + "q"), v0 = p.variants[0], mk = (MARKETS.filter(function (x) { return x.id === p.market; })[0] || {}).name || "Burrabazar";
    var meths = p.pr.methods.map(function (x) { return MNAME[x.id] + (x.min > 1 ? " (minimum " + x.min + ")" : " (from 1 piece)"); }).join(", ");
    var qs = [
      ["What is the wholesale price and from how many?", "The shop price is ₹" + v0.price + " " + (p.unit === "pc" ? "each" : "per " + p.unit) + ". From " + p.wq + " the wholesale price of ₹" + v0.wp + " applies on its own in the cart" + (p.bq ? ", and from " + p.bq + " it is ₹" + (v0.bp || v0.wp) : "") + "."],
      ["Can you print our school or shop name on it?", "Yes, with " + meths + ". Open Customise to see a preview and the exact print charge before you order."],
      ["Is the " + mk + " rate fixed?", "These are sample prices that show the usual " + mk + " wholesale level. Your final rate for a big order is confirmed on WhatsApp."],
      ["How soon will it reach us?", "Stock items leave College Street the same day if you order before 2 pm. Kolkata 1 to 2 days, rest of West Bengal 2 to 5 days, rest of India 4 to 7 days. Printing adds 1 to 4 working days."],
      ["Do you give a GST bill?", "Yes. Add your GSTIN at checkout and the bill shows it."]
    ];
    if (p.sz === "clothing") qs.splice(1, 0, ["Do the sizes run small?", "They run true to the size chart. For growing children, choose the larger size if you are between two sizes."], ["Can you match our school's shade?", "For " + p.wq * 10 + " pieces or more we can match your school's shade and check pattern. Send a sample piece or photo on WhatsApp."]);
    if (p.cat === "prizes") qs.splice(1, 0, ["Is the engraving on the front or the back?", "On the front plate or face. Back engraving can be added for a small extra charge."], ["Can we get ribbons in our house colours?", "Yes, for 25 pieces or more. Tell us the colours in the order note or the bulk quote."]);
    if (p.kolkata) qs.splice(1, 0, ["Do you deliver outside West Bengal?", "Yes, by courier or India Post across India for ₹80. Big orders go by transport."]);
    if (p.cat === "festive" || p.slug === "haal-khata-lal-khata") qs.splice(1, 0, ["When should we order for the festival?", "Two weeks before is safe. In the last week before Poila Baisakh, Durga Puja and Diwali our stock moves fast."]);
    var n = 3 + (h % 4);
    QAS[p.slug] = qs.slice(0, Math.max(3, Math.min(6, n))).map(function (x, i) {
      return { id: p.slug + "-q" + i, q: x[0], a: x[1], name: NAMES[(h + i * 7) % NAMES.length].split(" ")[0], town: TOWNS[(h + i * 5) % TOWNS.length], type: ["School", "Shop owner", "Office", "Parent"][(h + i) % 4], days: 4 + i * 11 + (h % 9), helpful: Math.floor(seeded(h + i * 3) * 20), by: i === 3 ? "Verified buyer" : "Kolom Khata Stationers" };
    });
  });
  var SEED_QUESTIONS = [
    { id: "sq1", slug: "sports-medal-50mm", q: "Can you deliver 300 medals to our school in Behala by next Friday?", name: "Rupa", town: "Kolkata (Behala)", type: "School", mobile: "98310xxxxx" },
    { id: "sq2", slug: "white-school-shirt-half", q: "Do you have size 38 and 40 for our teachers?", name: "Amit", town: "Barasat", type: "School", mobile: "" },
    { id: "sq3", slug: "haal-khata-lal-khata", q: "Is the haal khata cloth-bound with a swastik printed or embossed?", name: "Gopal", town: "Bardhaman", type: "Shop owner", mobile: "90070xxxxx" }
  ];

  /** Frequently bought together: explicit where it matters, otherwise by category. */
  var FBT = {
    "hb-pencils": ["eraser-sharpener-combo", "ruled-notebook-172"], "ruled-notebook-172": ["smooth-ball-pen", "geometry-box"], "sports-medal-50mm": ["prize-rosette-ribbon", "certificate-sheets-a4"],
    "trophy-cup": ["certificate-sheets-a4", "wooden-award-shield"], "white-school-shirt-half": ["school-trousers-navy", "school-tie-striped", "school-belt"], "white-school-shirt-full": ["school-trousers-navy", "school-tie-striped", "school-socks"],
    "light-blue-school-shirt": ["school-half-pant-grey", "school-socks", "school-belt"], "school-trousers-navy": ["white-school-shirt-half", "school-belt", "black-school-shoes"], "pleated-skirt-navy": ["white-school-shirt-half", "hair-ribbons-bands", "school-socks"],
    "flash-card-set": ["wax-crayons", "slate-with-chalk"], "haal-khata-lal-khata": ["smooth-ball-pen", "custom-rubber-stamp"], "kites-bundle": ["manja-reel"], "manja-reel": ["kites-bundle"],
    "bengali-panjika-1433": ["bengali-wall-calendar"], "bengali-wall-calendar": ["bengali-panjika-1433"], "black-school-shoes": ["school-socks"], "white-canvas-pt-shoes": ["school-socks", "house-polo-tshirt"],
    "white-ceramic-mug": ["gift-wrap-sheets", "photo-frame-5x7"], "school-backpack": ["steel-water-bottle-750", "lunch-box-3-compartment"], "cotton-cap-printed": ["house-polo-tshirt", "steel-water-bottle-750"],
    "clay-diyas-kali-puja": ["alpana-stencils-colour"], "hate-khori-set": ["bengali-alphabet-flash-cards", "bengali-practice-copy"], "school-football": ["training-cones", "whistle-stopwatch"]
  };

  /**
   * GST on the bill: [HSN, rate %] by category, then products that differ from their category.
   * Rates as we understand them after the September 2025 GST changes. Sample only: a real
   * shop confirms every HSN and rate with its CA before billing.
   */
  var TAX = {
    cat: { office: ["4820", 18], school: ["4820", 0], art: ["3213", 5], play: ["9503", 5], toys: ["9503", 5], gifts: ["6912", 5], prizes: ["8306", 5],
      bags: ["4202", 18], uniform: ["6505", 5], calendars: ["4910", 5], schoolwear: ["6206", 5], sports: ["9506", 5], festive: ["4820", 18] },
    slug: {
      "smooth-ball-pen": ["9608", 18], "gel-pen-pack-10": ["9608", 18], "highlighter-set-5": ["9608", 18], "whiteboard-markers": ["9608", 18], "a4-copier-paper-ream": ["4802", 18],
      "stapler-with-pins": ["8472", 18], "box-file-foolscap": ["3926", 18], "custom-rubber-stamp": ["9611", 18], "printed-envelopes": ["4817", 18], "visiting-cards": ["4911", 18], "tape-and-rubber-bands": ["3919", 18],
      "hb-pencils": ["9609", 0], "eraser-sharpener-combo": ["4016", 0], "ruled-notebook-172": ["4820", 0], "bengali-practice-copy": ["4820", 0], "answer-sheet-paper": ["4820", 0],
      "geometry-box": ["9017", 5], "wooden-scale-30cm": ["9017", 5], "exam-clip-board": ["4420", 18], "chart-paper": ["4802", 18], "brown-cover-roll": ["4823", 18], "slate-with-chalk": ["9610", 5],
      "classroom-whiteboard": ["9610", 18], "school-globe": ["4905", 0], "wall-map-india-world": ["4905", 0], "report-cards-printed": ["4911", 18], "admission-forms-printed": ["4911", 18],
      "wax-crayons": ["9609", 0], "paint-brush-set-6": ["9603", 18], "colour-craft-paper-a4": ["4802", 18], "glitter-glue-set-6": ["3506", 18], "sketch-pens-12": ["9608", 18], "drawing-book-36": ["4820", 0],
      "kids-craft-kit": ["9503", 5], "bengali-calligraphy-pens": ["9608", 18], "flash-card-set": ["4903", 0], "bengali-alphabet-flash-cards": ["4903", 0], "alphabet-wall-chart": ["4905", 0], "play-dough-6": ["3407", 5],
      "ludo-snakes-ladders": ["9504", 5], "gift-wrap-sheets": ["4823", 18], "metal-pen-gift-box": ["9608", 18], "wooden-doll-keychain": ["4420", 5], "photo-frame-5x7": ["4414", 5], "bijoya-greeting-cards": ["4909", 5],
      "wedding-card-printing": ["4909", 5], "terracotta-return-gift": ["6913", 5], "sholapith-return-gift": ["4602", 5], "kalighat-pat-print": ["4911", 5], "gamchha-gift-set": ["6302", 5],
      "wooden-award-shield": ["4420", 5], "certificate-sheets-a4": ["4911", 18], "pin-badge-58mm": ["8308", 18], "prize-rosette-ribbon": ["5808", 5],
      "steel-water-bottle-750": ["7323", 5], "lunch-box-3-compartment": ["3924", 5], "school-umbrella": ["6601", 5], "jute-bag-printed": ["4202", 5],
      "id-card-holder-lanyard": ["3926", 18], "school-tie-striped": ["6215", 5], "school-belt": ["4203", 18], "diary-2027-a5": ["4820", 18],
      "house-polo-tshirt": ["6105", 5], "school-trousers-navy": ["6203", 5], "school-half-pant-grey": ["6203", 5], "pleated-skirt-navy": ["6204", 5], "salwar-kameez-uniform-set": ["6211", 5],
      "primary-frock-check": ["6204", 5], "school-sweater-v-neck": ["6110", 5], "school-blazer-navy": ["6203", 5], "school-track-suit": ["6112", 5], "school-socks": ["6115", 5],
      "black-school-shoes": ["6402", 5], "white-canvas-pt-shoes": ["6404", 5], "school-raincoat": ["6210", 5], "hair-ribbons-bands": ["5808", 5], "lab-coat": ["6211", 5],
      "carrom-board": ["9504", 5], "chess-set": ["9504", 5], "whistle-stopwatch": ["9102", 18], "house-flags-sashes": ["6307", 5], "sports-day-bibs": ["6307", 5], "balloons-pack": ["9505", 18],
      "bengali-panjika-1433": ["4901", 0], "hate-khori-set": ["9610", 5], "saraswati-puja-decoration-kit": ["9505", 5], "alpana-stencils-colour": ["3213", 5], "kites-bundle": ["9503", 5],
      "manja-reel": ["5607", 5], "rakhi-wholesale-pack": ["5808", 5], "holi-gulal-pack": ["3204", 5], "clay-diyas-kali-puja": ["6913", 0]
    },
    /** GST state codes, for the place of supply on the bill. */
    states: { "Andaman and Nicobar Islands": "35", "Andhra Pradesh": "37", "Arunachal Pradesh": "12", "Assam": "18", "Bihar": "10", "Chandigarh": "04", "Chhattisgarh": "22", "Delhi": "07", "Goa": "30", "Gujarat": "24",
      "Haryana": "06", "Himachal Pradesh": "02", "Jammu and Kashmir": "01", "Jharkhand": "20", "Karnataka": "29", "Kerala": "32", "Ladakh": "38", "Lakshadweep": "31", "Madhya Pradesh": "23", "Maharashtra": "27",
      "Manipur": "14", "Meghalaya": "17", "Mizoram": "15", "Nagaland": "13", "Odisha": "21", "Puducherry": "34", "Punjab": "03", "Rajasthan": "08", "Sikkim": "11", "Tamil Nadu": "33", "Telangana": "36",
      "Tripura": "16", "Uttar Pradesh": "09", "Uttarakhand": "05", "West Bengal": "19" }
  };
  /** Real video clips (Pexels, see videos/CREDITS.md): slug -> [file key, seconds, what it shows]. Only where the clip truly shows this kind of item. */
  var VIDEOS = {"smooth-ball-pen":["pen-writing",6.9,"A hand writing in a notebook with a pink ball pen"],"ruled-notebook-172":["notebook-writing",7.6,"A hand writing with a pen in an open ruled notebook"],"diary-2027-a5":["diary-writing",8,"A hand writing in a bound notebook diary"],"wax-crayons":["crayons-rainbow",9,"Hands colouring a rainbow with wax crayons, more crayons lying beside"],"paint-brush-set-6":["watercolour-brush",8.5,"A hand painting leaves in watercolour with a thin round brush"],"play-dough-6":["play-dough",8,"Small hands shaping coloured modelling dough, crayons on the table"],"jigsaw-puzzle-100":["jigsaw-hands",8,"Hands fitting jigsaw puzzle pieces together on a table"],"chess-set":["chess-move",8,"Hands moving wooden chess pieces on a board"],"school-globe":["globe-spin",8.5,"A hand spinning a classroom globe on its stand"],"sports-medal-50mm":["medal-ribbon",8,"A gold medal on a blue ribbon on a dark sparkly surface, then a hand picks it up"],"white-ceramic-mug":["mug-pour",7.4,"Coffee being poured into a white ceramic mug"],"brown-cover-roll":["brown-paper-wrap",8,"Hands rolling out brown paper from a roll and wrapping a box in it"],"gift-wrap-sheets":["gift-ribbon",8,"Hands tying a ribbon around a gift box wrapped in orange paper"],"balloons-pack":["balloons-float",6.4,"Coloured rubber balloons drifting down through the air"],"wall-calendar-2027":["calendar-marking",8.9,"A hand circling a date on a printed calendar page"],"clay-diyas-kali-puja":["clay-diyas",8,"Rows of lit clay diyas on the floor"],"school-umbrella":["umbrella-open",8,"Inside of a black umbrella after it opens, ribs and canopy"],"badminton-set":["badminton-shuttle",6.9,"A shuttlecock placed on a badminton racket"],"holi-gulal-pack":["holi-colours",7.9,"Bowls heaped with green, orange and blue colour powder"],"kites-bundle":["kites-sky",8,"Many small diamond paper kites flying in a blue sky"]};

  function taxOf(p) { return TAX.slug[p.slug] || TAX.cat[p.cat] || ["4820", 18]; }

  window.KK = {
    TAX: TAX, taxOf: taxOf, VIDEOS: VIDEOS,
    QAS: QAS, SEED_QUESTIONS: SEED_QUESTIONS, FBT: FBT, returnPolicy: returnPolicy,
    NAMES: NAMES, TOWNS: TOWNS, REVIEWS: REVIEWS, DELIVERY: DELIVERY, MARKETS: MARKETS, SIZE: SIZE,
    CATS: CATS, BUYERS: BUYERS, BUDGETS: BUDGETS, METHODS: METHODS, PRODUCTS: PRODUCTS, REVIEW_POOL: REVIEW_POOL, QA: QA, PINS: PINS, STATES: STATES,
    COUPONS: COUPONS, STORE: STORE, SEED_ORDERS: SEED_ORDERS, ADMIN_ORDERS: ADMIN_ORDERS, SALES_7: SALES_7, ABANDONED: ABANDONED, TOP_MONTH: TOP_MONTH,
    TOP_BUYERS: TOP_BUYERS, PRINT_JOBS: PRINT_JOBS, SEED_QUOTES: SEED_QUOTES, FAQ: FAQ, POLICIES: POLICIES
  };
})();
