/* Mati Kotha Crafts, sample store data.
 *
 * Everything on this store is invented for a sample website: the shop, the
 * makers, the products, the prices, the reviews and the orders. Plain JS with
 * JSDoc types, because the demo is a static page with no build step.
 * Image keys map to /demo/craft-store/images/<key>-800.webp and -400.webp.
 */
(function () {
  "use strict";

  /** @typedef {"terracotta"|"dokra"|"kantha"|"patachitra"|"sholapith"|"cane-bamboo"} CraftId */
  /** @typedef {"living"|"dining"|"puja-corner"|"wall-decor"} RoomId */
  /**
   * @typedef {Object} Variant
   * @property {string} id
   * @property {string} [size]    size label, e.g. "Small (8 in)"
   * @property {string} [colour]  colour name, a key of COLOURS
   * @property {number} price     selling price in rupees, GST included
   * @property {number} mrp
   * @property {number} stock
   * @property {string} img       image key shown for this variant
   */
  /**
   * @typedef {Object} Product
   * @property {string} slug
   * @property {string} name
   * @property {CraftId} craft
   * @property {RoomId[]} rooms
   * @property {string} desc
   * @property {string} materials
   * @property {string} care
   * @property {string} dims
   * @property {string} maker     key of MAKERS
   * @property {string[]} imgs    at least two image keys
   * @property {number} rating
   * @property {number} reviews   review count
   * @property {string[]} tags
   * @property {string} created   ISO date, used for "Newest"
   * @property {number} rank      featured order, lower first
   * @property {boolean} [best]   shown in Bestsellers
   * @property {Variant[]} variants
   */
  /** @typedef {{id:CraftId,name:string,line:string,img:string,place:string}} Craft */
  /** @typedef {{id:string,name:string,craft:CraftId,village:string,since:number,quote:string,story:string,img:string}} Maker */
  /** @typedef {{code:string,label:string,type:"percent"|"flat"|"ship",value:number,min:number,firstOnly:boolean}} Coupon */

  /** @type {Craft[]} */
  var CRAFTS = [
    { id: "terracotta", name: "Terracotta", place: "Panchmura, Bankura", img: "tc-horse", line: "River clay shaped by hand and fired in village kilns." },
    { id: "dokra", name: "Dokra", place: "Bikna, Bankura", img: "dk-vessels", line: "Brass cast by the lost-wax method, 4,000 years old." },
    { id: "kantha", name: "Kantha", place: "Santiniketan, Birbhum", img: "kn-yellow", line: "Running stitch on soft cotton and silk, by women's groups." },
    { id: "patachitra", name: "Patachitra", place: "Naya, Pingla", img: "pc-scroll", line: "Painted scrolls in natural colours, sung as they unroll." },
    { id: "sholapith", name: "Sholapith", place: "Bishnupur, Bankura", img: "sh-topor", line: "Featherlight pith carved into crowns, flowers and ornaments." },
    { id: "cane-bamboo", name: "Cane & Bamboo", place: "Bolpur, Birbhum", img: "cb-baskets", line: "Baskets and planters woven from split cane and bamboo." }
  ];

  var ROOMS = [
    { id: "living", name: "Living" },
    { id: "dining", name: "Dining" },
    { id: "puja-corner", name: "Puja corner" },
    { id: "wall-decor", name: "Wall decor" }
  ];

  var GIFTS = [
    { max: 499, name: "Gifts under ₹499", img: "tc-diyas" },
    { max: 999, name: "Gifts under ₹999", img: "pc-coconut" },
    { max: 1999, name: "Gifts under ₹1,999", img: "dk-owl" }
  ];

  /** Swatch colours. "Multi" is drawn as a gradient. */
  var COLOURS = {
    "Natural clay": "#B4693F", "Sand": "#C9A88A", "Chalk white": "#EEE8DD", "Black patina": "#2E2B27", "Brass": "#B08D3C",
    "Mustard": "#D2A12E", "Sindoor red": "#A8322B", "Indigo": "#2B3A67", "Ivory": "#F1EADB",
    "Rust": "#9C4A26", "Cane": "#C79A5B", "Multi": "multi", "Pink": "#D97B93"
  };

  /** @type {Object<string, Maker>} */
  var MAKERS = {
    haradhan: { id: "haradhan", name: "Haradhan Kumbhakar", craft: "terracotta", village: "Panchmura, Bankura", since: 1988, img: "tc-row",
      quote: "The horse must stand up straight before it goes in the kiln. If it leans now, it leans for a hundred years.",
      story: "Haradhan learnt to throw the long horse neck from his father at the village wheel. Today his family of six makes about 300 horses a season, and every one is dried in the sun for a week before firing." },
    bishnu: { id: "bishnu", name: "Bishnu Karmakar", craft: "dokra", village: "Bikna, Bankura", since: 1995, img: "dk-vessels",
      quote: "Each piece has its own wax model, so no two owls are ever the same. The mould breaks when the brass is poured.",
      story: "Bishnu's workshop casts brass in an open clay furnace behind his house. He builds every model from beeswax thread by hand, which is why a Dokra piece shows fine lines like woven cloth." },
    shyamali: { id: "shyamali", name: "Shyamali Mondal", craft: "kantha", village: "Santiniketan, Birbhum", since: 2004, img: "kn-yellow",
      quote: "My mother stitched old saris into quilts. We stitch new silk now, but the running stitch is the same one.",
      story: "Shyamali leads a group of 22 women who stitch from home between farm work. A single stole takes 12 to 15 days, and each woman signs her work with a small knot in the corner." },
    rahim: { id: "rahim", name: "Rahim Chitrakar", craft: "patachitra", village: "Naya, Pingla", since: 1999, img: "pc-sign",
      quote: "A pata is a song first. I paint the story, then I sing it for you while I unroll it.",
      story: "Rahim grinds his own colours: yellow from turmeric, blue from aparajita flowers, black from lamp soot. His family paints the fish wedding, the Ramayana and stories about the rains." },
    ananda: { id: "ananda", name: "Ananda Malakar", craft: "sholapith", village: "Bishnupur, Bankura", since: 1991, img: "sh-durga",
      quote: "Shola is softer than paper and lighter than a feather. You cut it with a thin knife and a steady breath.",
      story: "Ananda's family has made the white crowns and ornaments for Durga idols for four generations. Outside the puja season they make wedding toporer, flowers and small decor for homes." },
    lakshmi: { id: "lakshmi", name: "Lakshmi Bauri", craft: "cane-bamboo", village: "Bolpur, Birbhum", since: 2010, img: "cb-stack",
      quote: "We split the cane at dawn, when it is still soft from the night air. By noon it is too dry to bend.",
      story: "Lakshmi runs a weaving shed with her two sisters near the Kopai river. They make baskets, hampers and planters to order, and train young women from nearby villages." }
  };

  function v(id, size, colour, price, mrp, stock, img) {
    return { id: id, size: size || "", colour: colour || "", price: price, mrp: mrp, stock: stock, img: img };
  }

  /** @type {Product[]} */
  var PRODUCTS = [
    // Terracotta
    { slug: "bankura-ghora-classic-horse", name: "Bankura Ghora, Classic Horse", craft: "terracotta", rooms: ["living"], maker: "haradhan",
      imgs: ["tc-horse", "tc-horse-d", "tc-shop"], rating: 4.8, reviews: 214, tags: ["bankura horse", "ghora", "bestseller", "gift"], created: "2026-03-10", rank: 1, best: true,
      desc: "The long-necked horse of Panchmura, shaped on the wheel in four parts and joined by hand. A symbol of Bengal's crafts, and a calm, earthy piece for a shelf or console.",
      materials: "Local river clay, fired in a wood kiln. Natural finish, no paint.", care: "Dust with a dry soft brush. Keep away from water and direct rain.", dims: "Small 8 in tall, Medium 12 in tall, Large 18 in tall. Weight 0.6 to 2.8 kg.",
      variants: [v("s", "Small (8 in)", "Natural clay", 649, 799, 18, "tc-horse"), v("m", "Medium (12 in)", "Natural clay", 1199, 1499, 9, "tc-horse"), v("l", "Large (18 in)", "Natural clay", 2499, 2999, 3, "tc-horse-d")] },
    { slug: "panchmura-horse-pair-painted", name: "Panchmura Horse Pair, Painted", craft: "terracotta", rooms: ["living", "puja-corner"], maker: "haradhan",
      imgs: ["tc-row", "tc-row-d", "tc-horse"], rating: 4.7, reviews: 96, tags: ["bankura horse", "pair", "painted"], created: "2026-09-02", rank: 6, best: true,
      desc: "A matched pair of temple horses painted in chalk white with sindoor and turmeric bands, the way they are offered at village shrines.",
      materials: "Terracotta with mineral paint and a light lacquer.", care: "Wipe gently with a dry cloth. Do not wash.", dims: "Small pair 10 in tall each. Large pair 16 in tall each.",
      variants: [v("s", "Small pair (10 in)", "Chalk white", 1499, 1799, 7, "tc-row"), v("l", "Large pair (16 in)", "Chalk white", 2299, 2799, 0, "tc-row-d")] },
    { slug: "rangin-ghora-painted-horse-head", name: "Rangin Ghora, Painted Horse Head", craft: "terracotta", rooms: ["living", "wall-decor"], maker: "haradhan",
      imgs: ["tc-head", "tc-head-d"], rating: 4.6, reviews: 58, tags: ["horse", "painted", "folk"], created: "2026-10-18", rank: 12,
      desc: "A bold folk horse head with a white face, red bridle and big black eyes. Stands on a shelf or hangs from its back loop.",
      materials: "Terracotta, mineral paints.", care: "Dry dusting only.", dims: "9 in tall, 7 in deep. Weight 900 g.",
      variants: [v("one", "", "Multi", 899, 1099, 12, "tc-head")] },
    { slug: "mati-pradip-diya-set", name: "Mati Pradip, Diya Set", craft: "terracotta", rooms: ["puja-corner"], maker: "haradhan",
      imgs: ["tc-diyas", "tc-diyas-d", "tc-diya"], rating: 4.9, reviews: 388, tags: ["diya", "puja", "diwali", "gift", "bestseller"], created: "2026-10-01", rank: 2, best: true,
      desc: "Hand-pressed clay lamps with a fluted rim, ready for oil or ghee. Fired hard so they do not crack on the first lighting.",
      materials: "Terracotta, unglazed.", care: "Soak in water for an hour before the first use so the clay does not drink the oil.", dims: "Each diya 3 in across, 1 in tall.",
      variants: [v("12", "Set of 12", "Natural clay", 349, 449, 40, "tc-diyas"), v("24", "Set of 24", "Natural clay", 599, 799, 22, "tc-diyas-d")] },
    { slug: "kolshi-pot-set", name: "Kolshi Pot Set with Diya Tray", craft: "terracotta", rooms: ["dining", "living"], maker: "haradhan",
      imgs: ["tc-potdiya", "tc-potdiya-d", "tc-pots"], rating: 4.5, reviews: 41, tags: ["pots", "kolshi", "water"], created: "2026-07-21", rank: 18,
      desc: "Three round-bellied kolshi pots in graded sizes for water, flowers or dried grass, with a small tray of matching diyas.",
      materials: "Terracotta, unglazed inside, burnished outside.", care: "Rinse with plain water. Keeps water cool in summer.", dims: "Pots 5, 7 and 9 in tall.",
      variants: [v("one", "", "Natural clay", 799, 999, 2, "tc-potdiya")] },
    { slug: "matir-tob-planter-trio", name: "Matir Tob, Planter Trio", craft: "terracotta", rooms: ["living"], maker: "haradhan",
      imgs: ["tc-plates", "tc-pots", "tc-pots-d"], rating: 4.4, reviews: 33, tags: ["planter", "garden", "pots"], created: "2026-11-12", rank: 20,
      desc: "Three low planters with lids and drainage holes, for succulents, money plant or herbs on a sunny sill.",
      materials: "Terracotta.", care: "Use a saucer under each pot. Scrub with a soft brush.", dims: "6, 8 and 10 in across.",
      variants: [v("one", "", "Natural clay", 1099, 1299, 14, "tc-plates")] },
    { slug: "ghora-wall-relief-tile", name: "Ghora Wall Relief Tile", craft: "terracotta", rooms: ["wall-decor"], maker: "haradhan",
      imgs: ["tc-relief", "tc-relief-d"], rating: 4.7, reviews: 67, tags: ["wall", "relief", "horse"], created: "2026-11-05", rank: 9,
      desc: "A leaping horse in high relief, inspired by the temple walls of Bishnupur, finished in black with copper and white details.",
      materials: "Terracotta, oxide paints.", care: "Indoor use. Dust with a dry brush.", dims: "12 x 12 in, 2 in deep. Hanging hook fixed at the back.",
      variants: [v("one", "", "Black patina", 1299, 1599, 8, "tc-relief")] },
    { slug: "matir-ghanti-wind-chime", name: "Matir Ghanti, Clay Wind Chime", craft: "terracotta", rooms: ["living", "puja-corner"], maker: "haradhan",
      imgs: ["tc-chimes", "tc-shop"], rating: 4.6, reviews: 120, tags: ["wind chime", "bells", "gift"], created: "2026-08-14", rank: 14,
      desc: "Five little clay bells on a jute cord that knock softly in the breeze. A happy gift that costs less than a box of sweets.",
      materials: "Terracotta bells, jute cord, wooden beads.", care: "Hang under a roof, away from heavy rain.", dims: "28 in long overall.",
      variants: [v("one", "", "Natural clay", 449, 549, 25, "tc-chimes")] },

    // Dokra
    { slug: "dokra-owl-pair", name: "Dokra Owl Pair", craft: "dokra", rooms: ["living"], maker: "bishnu",
      imgs: ["dk-owl", "dk-owl-d"], rating: 4.9, reviews: 172, tags: ["owl", "lakshmi", "pair", "bestseller", "gift"], created: "2026-05-02", rank: 3, best: true,
      desc: "Lakshmi's owl, cast as a pair with spread wings and wire-thread feathers. Every owl is made from its own wax model, so each pair is one of a kind.",
      materials: "Brass alloy, lost-wax cast. Antique finish.", care: "Wipe with a dry cloth. A drop of coconut oil brings back the shine.", dims: "Each owl 5 in tall. Weight 700 g for the pair.",
      variants: [v("one", "", "Brass", 1899, 2299, 2, "dk-owl")] },
    { slug: "dokra-haathi-elephant", name: "Dokra Haathi, Elephant", craft: "dokra", rooms: ["living", "puja-corner"], maker: "bishnu",
      imgs: ["dk-elephant", "dk-elephant-d"], rating: 4.8, reviews: 143, tags: ["elephant", "haathi", "brass"], created: "2026-04-11", rank: 4, best: true,
      desc: "A sturdy elephant with a raised trunk for good luck, its body covered in fine spiral patterns of brass thread.",
      materials: "Brass alloy, lost-wax cast.", care: "Dry cloth only. Keep away from damp corners.", dims: "Small 4 in, Medium 6 in, Large 9 in tall.",
      variants: [v("s", "Small (4 in)", "Brass", 899, 1099, 15, "dk-elephant"), v("m", "Medium (6 in)", "Brass", 1599, 1899, 6, "dk-elephant"), v("l", "Large (9 in)", "Brass", 2899, 3499, 0, "dk-elephant-d")] },
    { slug: "dokra-bagh-tiger", name: "Dokra Bagh, Tiger", craft: "dokra", rooms: ["living"], maker: "bishnu",
      imgs: ["dk-tiger", "dk-tiger-d"], rating: 4.6, reviews: 49, tags: ["tiger", "bagh", "paperweight", "gift"], created: "2026-10-26", rank: 15,
      desc: "A small, heavy tiger of the Sundarbans, mid-stride. Works as a paperweight on a study table.",
      materials: "Brass alloy, polished.", care: "Wipe with a dry cloth.", dims: "5 in long, 2.5 in tall. Weight 450 g.",
      variants: [v("one", "", "Brass", 999, 1199, 11, "dk-tiger")] },
    { slug: "dokra-kettle-pair", name: "Dokra Kettle Pair", craft: "dokra", rooms: ["dining", "living"], maker: "bishnu",
      imgs: ["dk-vessels", "dk-vessels-a", "dk-vessels-b"], rating: 4.7, reviews: 38, tags: ["vessel", "kettle", "decor"], created: "2026-11-15", rank: 10,
      desc: "Two decorative spouted vessels with tribal figures in relief. Choose the smoky black patina or the warm polished brass.",
      materials: "Brass alloy, lost-wax cast.", care: "Decorative only, not for food or water.", dims: "Each 6 in tall.",
      variants: [v("black", "", "Black patina", 2499, 2999, 5, "dk-vessels-a"), v("brass", "", "Brass", 2699, 3199, 4, "dk-vessels-b")] },
    { slug: "mayur-dokra-lidded-bowl", name: "Mayur Dokra Lidded Bowl", craft: "dokra", rooms: ["dining", "puja-corner"], maker: "bishnu",
      imgs: ["dk-peacock", "dk-peacock-d"], rating: 4.9, reviews: 27, tags: ["peacock", "mayur", "bowl"], created: "2026-11-19", rank: 8,
      desc: "A round lidded bowl with a dancing peacock on top. Lovely for sindoor, cardamom or keepsakes. Our most detailed Dokra piece.",
      materials: "Brass alloy, lost-wax cast, hand-chased.", care: "Dry cloth only.", dims: "7 in tall, 5 in across.",
      variants: [v("one", "", "Brass", 3999, 4799, 3, "dk-peacock")] },
    { slug: "dokra-mandir-ghanta-bell", name: "Dokra Mandir Ghanta, Temple Bell", craft: "dokra", rooms: ["puja-corner"], maker: "bishnu",
      imgs: ["dk-bell", "dk-chimes"], rating: 4.8, reviews: 91, tags: ["bell", "puja", "ghanta", "gift"], created: "2026-09-20", rank: 11,
      desc: "A hanging temple bell with a clear, long ring. Comes with a chain and hook for the puja corner or the front door.",
      materials: "Brass alloy.", care: "Polish with tamarind paste once a year if you like it bright.", dims: "Bell 4 in tall, chain 12 in.",
      variants: [v("one", "", "Brass", 749, 899, 19, "dk-bell")] },
    { slug: "surya-wall-hanging-with-bells", name: "Surya Wall Hanging with Bells", craft: "dokra", rooms: ["wall-decor"], maker: "bishnu",
      imgs: ["dk-sun", "dk-chimes"], rating: 4.5, reviews: 22, tags: ["sun", "surya", "wall", "bells"], created: "2026-06-09", rank: 22,
      desc: "A sun face with a ring of rays and seven small bells below. Hangs in a doorway or on a bare wall.",
      materials: "Brass and iron, antique finish.", care: "Indoor use. Dry cloth only.", dims: "Sun 8 in across, 22 in long overall.",
      variants: [v("one", "", "Brass", 2199, 2599, 6, "dk-sun")] },

    // Kantha
    { slug: "hand-stitched-kantha-stole", name: "Hand-stitched Kantha Stole", craft: "kantha", rooms: ["living"], maker: "shyamali",
      imgs: ["kn-yellow", "kn-yellow-d", "kn-red", "kn-flowers"], rating: 4.8, reviews: 256, tags: ["stole", "kantha", "gift", "bestseller"], created: "2026-02-14", rank: 5, best: true,
      desc: "A light cotton silk stole covered in tiny running stitches, so soft it folds into a handbag. Each colour is stitched by a different group in Santiniketan.",
      materials: "Cotton silk blend, cotton thread.", care: "Dry clean the first time, then a gentle hand wash in cold water. Dry in shade.", dims: "200 x 70 cm.",
      variants: [v("mustard", "", "Mustard", 1499, 1899, 12, "kn-yellow"), v("red", "", "Sindoor red", 1699, 2099, 6, "kn-red"), v("ivory", "", "Ivory", 1299, 1699, 0, "kn-flowers")] },
    { slug: "tussar-kantha-stole-lal", name: "Tussar Kantha Stole, Lal", craft: "kantha", rooms: ["living"], maker: "shyamali",
      imgs: ["kn-red2", "kn-red-d"], rating: 4.9, reviews: 64, tags: ["stole", "tussar", "silk", "wedding"], created: "2026-10-09", rank: 7, best: true,
      desc: "Pure tussar silk in deep red, densely stitched with elephants and lotus borders. A festive stole for weddings and pujo evenings.",
      materials: "Tussar silk, silk and cotton thread.", care: "Dry clean only.", dims: "220 x 72 cm.",
      variants: [v("one", "", "Sindoor red", 2999, 3599, 4, "kn-red2")] },
    { slug: "kantha-cushion-cover", name: "Kantha Cushion Cover", craft: "kantha", rooms: ["living"], maker: "shyamali",
      imgs: ["kn-cushion", "kn-patch"], rating: 4.6, reviews: 112, tags: ["cushion", "cover", "home"], created: "2026-08-28", rank: 13,
      desc: "Bold embroidered cushion covers with a hidden zip. Mix the indigo and rust for a bright sofa.",
      materials: "Cotton, cotton thread. Insert not included.", care: "Turn inside out, gentle machine wash, dry in shade.", dims: "16 x 16 in or 18 x 18 in.",
      variants: [v("i16", "16 x 16 in", "Indigo", 649, 799, 20, "kn-cushion"), v("i18", "18 x 18 in", "Indigo", 749, 899, 9, "kn-cushion"),
                 v("r16", "16 x 16 in", "Rust", 649, 799, 8, "kn-patch"), v("r18", "18 x 18 in", "Rust", 749, 899, 0, "kn-patch")] },
    { slug: "kantha-patchwork-throw", name: "Kantha Patchwork Throw", craft: "kantha", rooms: ["living"], maker: "shyamali",
      imgs: ["kn-patch", "kn-patch-d", "kn-tapestry"], rating: 4.7, reviews: 45, tags: ["throw", "quilt", "patchwork"], created: "2026-11-21", rank: 16,
      desc: "Old-style kantha quilting over a patchwork of cotton prints in rust, saffron and blue. Light enough for a Kolkata winter.",
      materials: "Layered cotton, cotton thread.", care: "Gentle hand wash, dry flat in shade.", dims: "Single 150 x 220 cm, Double 220 x 250 cm.",
      variants: [v("single", "Single", "Rust", 2799, 3299, 5, "kn-patch"), v("double", "Double", "Rust", 3499, 4199, 2, "kn-patch-d")] },
    { slug: "kantha-wall-panel", name: "Kantha Wall Panel", craft: "kantha", rooms: ["wall-decor"], maker: "shyamali",
      imgs: ["kn-hang", "kn-tapestry"], rating: 4.5, reviews: 19, tags: ["wall", "hanging", "panel"], created: "2026-07-03", rank: 24,
      desc: "A long embroidered panel made from stitched textile pieces, with a wooden rod sleeve at the top.",
      materials: "Cotton and silk pieces, cotton thread. Rod not included.", care: "Dust with a soft brush. Dry clean if needed.", dims: "36 x 14 in.",
      variants: [v("one", "", "Multi", 1899, 2299, 7, "kn-hang")] },
    { slug: "embroidered-door-toran", name: "Embroidered Door Toran", craft: "kantha", rooms: ["puja-corner", "wall-decor"], maker: "shyamali",
      imgs: ["kn-toran", "kn-toran-d"], rating: 4.7, reviews: 83, tags: ["toran", "door", "festive", "gift"], created: "2026-09-29", rank: 17,
      desc: "A bright door hanging with lotus panels and little parrot tassels, to welcome guests at pujo and weddings.",
      materials: "Cotton, satin thread, glass beads.", care: "Dry clean or gentle hand wash.", dims: "40 x 10 in, tassels 4 in.",
      variants: [v("one", "", "Multi", 549, 699, 16, "kn-toran")] },
    { slug: "kantha-table-runner", name: "Kantha Table Runner", craft: "kantha", rooms: ["dining"], maker: "shyamali",
      imgs: ["kn-paisley", "kn-flowers"], rating: 4.6, reviews: 37, tags: ["table runner", "dining", "paisley"], created: "2026-06-25", rank: 21,
      desc: "A linen-look runner with a paisley or a scattered-leaf design in kantha stitch. Dresses up a plain dining table.",
      materials: "Cotton linen blend, cotton thread.", care: "Gentle wash, iron on the reverse.", dims: "180 x 35 cm.",
      variants: [v("ivory", "", "Ivory", 999, 1199, 10, "kn-paisley"), v("beige", "", "Sand", 999, 1199, 3, "kn-flowers")] },

    // Patachitra
    { slug: "machh-pata-fish-wedding-scroll", name: "Machh Pata, Fish Wedding Scroll", craft: "patachitra", rooms: ["wall-decor", "living"], maker: "rahim",
      imgs: ["pc-scroll", "pc-scroll-d", "pc-sign"], rating: 4.9, reviews: 76, tags: ["scroll", "fish", "pata", "bestseller"], created: "2026-03-30", rank: 19, best: true,
      desc: "The famous fish wedding of Pingla, painted panel by panel on a cloth-backed scroll. Comes rolled, with the song written on a card.",
      materials: "Handmade paper on cotton, natural colours, tamarind seed gum.", care: "Hang away from sun and damp. Roll, never fold.", dims: "2 ft, 4 ft or 6 ft long, 1 ft wide.",
      variants: [v("2", "2 ft", "Multi", 1499, 1799, 9, "pc-scroll"), v("4", "4 ft", "Multi", 2999, 3499, 4, "pc-scroll-d"), v("6", "6 ft", "Multi", 4500, 5200, 1, "pc-scroll-d")] },
    { slug: "painted-pata-plates", name: "Painted Pata Plates, Set of 4", craft: "patachitra", rooms: ["dining", "wall-decor"], maker: "rahim",
      imgs: ["pc-plates", "pc-plates-d"], rating: 4.6, reviews: 51, tags: ["plates", "wall", "fish"], created: "2026-08-08", rank: 23,
      desc: "Four square wooden plates painted with fish and peacocks. Hang them as a set or use them as serving trays for dry snacks.",
      materials: "Mango wood, natural colours, food-safe lacquer.", care: "Wipe clean. Not for the dishwasher.", dims: "Each 8 x 8 in.",
      variants: [v("one", "", "Multi", 1199, 1499, 13, "pc-plates")] },
    { slug: "painted-coconut-shell-hanging", name: "Painted Coconut Shell Hanging", craft: "patachitra", rooms: ["puja-corner", "wall-decor"], maker: "rahim",
      imgs: ["pc-coconut", "pc-coconut-d"], rating: 4.7, reviews: 133, tags: ["coconut", "hanging", "gift", "jagannath"], created: "2026-10-14", rank: 25,
      desc: "A whole coconut shell painted with a bright face in red, pink and black. A cheerful hanging for a balcony or the puja corner.",
      materials: "Coconut shell, natural colours.", care: "Indoor or covered balcony.", dims: "6 in tall.",
      variants: [v("one", "", "Pink", 399, 499, 30, "pc-coconut")] },
    { slug: "patachitra-painted-dupatta", name: "Patachitra Painted Dupatta", craft: "patachitra", rooms: ["living"], maker: "rahim",
      imgs: ["pc-textile", "pc-textile-d"], rating: 4.5, reviews: 28, tags: ["dupatta", "painted", "textile"], created: "2026-11-09", rank: 26,
      desc: "A khadi cotton dupatta with a hand-painted folk figure at each end. No two are the same.",
      materials: "Khadi cotton, fabric colours.", care: "Dry clean, or a gentle cold hand wash after the first month.", dims: "230 x 90 cm.",
      variants: [v("one", "", "Mustard", 2299, 2699, 6, "pc-textile")] },
    { slug: "pata-trinket-box", name: "Pata Trinket Box", craft: "patachitra", rooms: ["living", "puja-corner"], maker: "rahim",
      imgs: ["pc-box", "pc-box-d"], rating: 4.4, reviews: 44, tags: ["box", "trinket", "gift"], created: "2026-07-17", rank: 27,
      desc: "A little curved box painted in red and white with a bride's face on the front. Keeps rings, bindis or cardamom.",
      materials: "Woven palm leaf base, natural colours.", care: "Keep dry.", dims: "5 x 3 x 4 in.",
      variants: [v("one", "", "Sindoor red", 649, 799, 0, "pc-box")] },
    { slug: "mayur-wall-plaque", name: "Mayur Wall Plaque", craft: "patachitra", rooms: ["wall-decor"], maker: "rahim",
      imgs: ["pc-peacock", "pc-peacock-d"], rating: 4.6, reviews: 31, tags: ["peacock", "mayur", "wall"], created: "2026-09-11", rank: 28,
      desc: "A painted peacock on a woven fan, mounted on a jute stand. Stands on a shelf or hangs on the wall.",
      materials: "Wood, palm fibre, natural colours.", care: "Dust gently.", dims: "11 in tall.",
      variants: [v("one", "", "Multi", 899, 1099, 8, "pc-peacock")] },

    // Sholapith
    { slug: "shola-topor-wedding-crown", name: "Shola Topor, Wedding Crown", craft: "sholapith", rooms: ["puja-corner"], maker: "ananda",
      imgs: ["sh-topor", "sh-topor-d"], rating: 4.9, reviews: 58, tags: ["topor", "wedding", "crown"], created: "2026-10-22", rank: 29, best: true,
      desc: "The tall white Bengali groom's crown, cut and layered from sholapith with a red tassel on top. Packed in a hard box so it travels safely.",
      materials: "Sholapith, cotton thread, zari.", care: "Keep in its box. Handle by the base.", dims: "16 in tall.",
      variants: [v("one", "", "Chalk white", 1899, 2199, 5, "sh-topor")] },
    { slug: "shola-durga-mukh", name: "Shola Durga Mukh", craft: "sholapith", rooms: ["puja-corner", "wall-decor"], maker: "ananda",
      imgs: ["sh-durga", "sh-durga-d"], rating: 4.8, reviews: 42, tags: ["durga", "mask", "pujo"], created: "2026-09-25", rank: 30,
      desc: "Durga's face with a carved white crown, the way she looks in Kolkata's pandals. Mounts on the wall with a single nail.",
      materials: "Sholapith, clay face, natural colours.", care: "Indoor wall only. Dust with a soft brush.", dims: "10 in or 14 in tall.",
      variants: [v("10", "10 in", "Chalk white", 2499, 2999, 4, "sh-durga"), v("14", "14 in", "Chalk white", 3999, 4599, 0, "sh-durga-d")] },
    { slug: "shola-saraswati-idol", name: "Shola Saraswati Idol", craft: "sholapith", rooms: ["puja-corner"], maker: "ananda",
      imgs: ["sh-idol", "sh-idol-d"], rating: 4.8, reviews: 25, tags: ["saraswati", "idol", "puja"], created: "2026-11-17", rank: 31,
      desc: "A small Saraswati in white sholapith robes with a carved crown, for the study table or the puja shelf.",
      materials: "Sholapith over a clay core, natural colours.", care: "Keep away from water and incense smoke.", dims: "12 in tall.",
      variants: [v("one", "", "Chalk white", 3499, 3999, 3, "sh-idol")] },
    { slug: "shola-phool-flower-stems", name: "Shola Phool, Flower Stems", craft: "sholapith", rooms: ["living", "dining"], maker: "ananda",
      imgs: ["sh-flowers", "sh-flowers-w"], rating: 4.5, reviews: 69, tags: ["flowers", "phool", "gift"], created: "2026-08-19", rank: 32,
      desc: "Six long-stemmed flowers that never wilt. Pick the white set for a quiet look or the mixed set for colour.",
      materials: "Sholapith petals, painted cane stems.", care: "Keep dry. Blow off dust.", dims: "Each stem 18 in long. Set of 6.",
      variants: [v("white", "", "Chalk white", 449, 549, 18, "sh-flowers-w"), v("multi", "", "Multi", 499, 599, 12, "sh-flowers")] },
    { slug: "daker-saaj-hanging", name: "Daker Saaj Hanging", craft: "sholapith", rooms: ["puja-corner", "wall-decor"], maker: "ananda",
      imgs: ["sh-shop", "sh-durga-d"], rating: 4.6, reviews: 18, tags: ["daker saaj", "pujo", "hanging"], created: "2026-10-30", rank: 33,
      desc: "A fan of white sholapith lace in the daker saaj style that dresses Durga idols, made as a hanging for your own puja corner.",
      materials: "Sholapith, foil, cotton thread.", care: "Indoor only. Keep in its box between festivals.", dims: "15 x 12 in.",
      variants: [v("one", "", "Chalk white", 1299, 1499, 6, "sh-shop")] },

    // Cane & Bamboo
    { slug: "bet-fruit-basket", name: "Bet Fruit Basket", craft: "cane-bamboo", rooms: ["dining"], maker: "lakshmi",
      imgs: ["cb-baskets", "cb-baskets-d"], rating: 4.6, reviews: 88, tags: ["basket", "fruit", "cane", "gift"], created: "2026-05-27", rank: 34,
      desc: "A round cane basket with a high handle, for fruit on the dining table or rolls of bread on Sunday.",
      materials: "Split cane, natural finish.", care: "Wipe with a damp cloth and dry in the air.", dims: "Medium 10 in across, Large 13 in across.",
      variants: [v("m", "Medium", "Cane", 549, 699, 14, "cb-baskets"), v("l", "Large", "Cane", 799, 999, 7, "cb-baskets-d")] },
    { slug: "bamboo-storage-basket-pair", name: "Bamboo Storage Basket Pair", craft: "cane-bamboo", rooms: ["living"], maker: "lakshmi",
      imgs: ["cb-stack", "cb-stack-d"], rating: 4.7, reviews: 54, tags: ["storage", "bamboo", "basket"], created: "2026-11-02", rank: 35, best: true,
      desc: "Two round bamboo baskets with lids that stack into one neat tower. Good for wool, toys or spare cables.",
      materials: "Bamboo strips, natural finish.", care: "Keep dry. Air in the sun once a month.", dims: "Each 10 in across, 9 in tall.",
      variants: [v("one", "", "Cane", 1199, 1499, 9, "cb-stack")] },
    { slug: "woven-cane-hamper", name: "Woven Cane Hamper", craft: "cane-bamboo", rooms: ["living"], maker: "lakshmi",
      imgs: ["cb-baskets2", "cb-weave"], rating: 4.5, reviews: 23, tags: ["hamper", "laundry", "gift box"], created: "2026-07-29", rank: 36,
      desc: "A deep hamper with a double rim, woven tight so it holds its shape for years. Also makes a fine gift hamper for Bijoya.",
      materials: "Cane, cotton lining on request.", care: "Wipe clean. Keep away from damp walls.", dims: "16 in across, 18 in tall.",
      variants: [v("one", "", "Rust", 1799, 2199, 4, "cb-baskets2")] },
    { slug: "hand-coiled-table-mats", name: "Hand-coiled Table Mats, Set of 6", craft: "cane-bamboo", rooms: ["dining"], maker: "lakshmi",
      imgs: ["cb-mats", "cb-mats-d"], rating: 4.6, reviews: 61, tags: ["mats", "table", "dining", "gift"], created: "2026-06-12", rank: 37,
      desc: "Round mats coiled from natural fibre rope and stitched by hand. Hot pots, steel plates and clay handis all sit happily on them.",
      materials: "Natural fibre rope, cotton thread.", care: "Shake out and wipe. Dry fully before stacking.", dims: "Each 12 in across.",
      variants: [v("one", "", "Cane", 699, 899, 2, "cb-mats")] },
    { slug: "hanging-cane-planter", name: "Hanging Cane Planter", craft: "cane-bamboo", rooms: ["living"], maker: "lakshmi",
      imgs: ["cb-hanging", "cb-poles"], rating: 4.4, reviews: 29, tags: ["planter", "hanging", "balcony"], created: "2026-11-23", rank: 38,
      desc: "An open-weave cone that hangs from a hook, for a trailing money plant or a light lamp shade.",
      materials: "Cane, jute rope.", care: "Use a plastic pot inside if you water from above.", dims: "12 in across, 14 in tall, rope 30 in.",
      variants: [v("one", "", "Cane", 649, 799, 15, "cb-hanging")] },
    { slug: "hand-painted-bamboo-box", name: "Hand-painted Bamboo Box", craft: "cane-bamboo", rooms: ["living", "puja-corner"], maker: "lakshmi",
      imgs: ["pc-basket", "pc-basket-d"], rating: 4.7, reviews: 47, tags: ["box", "painted", "gift"], created: "2026-10-05", rank: 39,
      desc: "A round woven box painted red with blue birds and green leaves. Holds puja things, jewellery or a gift of sweets.",
      materials: "Bamboo, natural colours, lacquer.", care: "Keep dry.", dims: "7 in across, 4 in tall.",
      variants: [v("one", "", "Sindoor red", 849, 999, 10, "pc-basket")] }
  ];

  /** Products often bought together, by slug. */
  var BUNDLES = {
    terracotta: ["mati-pradip-diya-set", "dokra-mandir-ghanta-bell", "matir-ghanti-wind-chime"],
    dokra: ["dokra-owl-pair", "mati-pradip-diya-set", "embroidered-door-toran"],
    kantha: ["kantha-cushion-cover", "hand-stitched-kantha-stole", "kantha-table-runner"],
    patachitra: ["painted-coconut-shell-hanging", "pata-trinket-box", "mayur-wall-plaque"],
    sholapith: ["shola-phool-flower-stems", "mati-pradip-diya-set", "dokra-mandir-ghanta-bell"],
    "cane-bamboo": ["hand-coiled-table-mats", "bet-fruit-basket", "kantha-table-runner"]
  };

  var REVIEW_POOL = [
    { n: "Ananya", c: "Kolkata", s: 5, t: "Even better in person", b: "The finish is lovely and it came packed in so much straw that nothing could break. Looks perfect on our shelf." },
    { n: "Rohit", c: "Pune", s: 5, t: "Arrived in 4 days", b: "Ordered on Monday, got it Friday. Good packing and the maker's card inside was a sweet touch." },
    { n: "Meera", c: "Bengaluru", s: 4, t: "Beautiful, slightly smaller", b: "Very pretty and clearly handmade. A little smaller than I pictured, so check the size in the details tab." },
    { n: "Sourav", c: "Durgapur", s: 5, t: "Gift for my mother", b: "Bought it for Ma's birthday and she called three aunts to show it off. Will order the diyas next." },
    { n: "Fatima", c: "Hyderabad", s: 5, t: "Real craft, fair price", b: "I have bought the same thing at fairs for more. Paid by UPI and got WhatsApp updates all the way." },
    { n: "Karthik", c: "Chennai", s: 4, t: "Good quality", b: "Solid and well made. The colour is a shade darker than the photo, but I like it more." },
    { n: "Priyanka", c: "Delhi", s: 5, t: "Third order from here", b: "Everything I have ordered has been exactly as shown. Cash on delivery worked without any fuss." },
    { n: "Debashis", c: "Siliguri", s: 3, t: "Nice, packing could be better", b: "The piece is lovely. One corner of the box was crushed, but the item inside was safe." },
    { n: "Naina", c: "Mumbai", s: 5, t: "Looks expensive", b: "Guests always ask where it is from. It has a warmth that factory decor does not have." },
    { n: "Arijit", c: "Howrah", s: 4, t: "Happy with it", b: "Simple and honest. Delivery was quick within Bengal, two days." }
  ];

  /** Questions and answers per craft. */
  var QA = {
    terracotta: [["Will it break in the post?", "Every piece is wrapped in paddy straw and bubble wrap inside a double box. If anything arrives broken, send a photo on WhatsApp within 48 hours and we replace it."], ["Can I keep it outdoors?", "Under a roof, yes. Heavy rain softens unglazed clay over time, so keep it out of direct rain."], ["Is the colour natural?", "Yes. The red-brown comes from the river clay and the kiln. Natural pieces are not painted."]],
    dokra: [["Will the brass turn dark?", "Dokra is given an antique finish, so it is meant to look aged. A drop of coconut oil on a cloth brings back the shine."], ["Is every piece the same?", "No. Each piece is cast from its own wax model, so small differences are a sign it is handmade."], ["Is it heavy?", "Dokra is solid brass, so it feels heavier than it looks. Weights are in the Dimensions tab."]],
    kantha: [["Does the colour run?", "The threads are colourfast, but wash the first time in cold water on its own to be safe."], ["Is it stitched by hand?", "Yes, every stitch. A stole takes 12 to 15 days. Tiny uneven stitches are part of the craft."], ["Is it warm enough for winter?", "Stoles are light, for evenings and travel. For winter, choose the patchwork throw."]],
    patachitra: [["Are the colours natural?", "Yes. Turmeric, flowers, clay, lamp soot and indigo, fixed with tamarind seed gum."], ["Does it come framed?", "Scrolls come rolled in a tube. Most customers hang them with a wooden rod; a frame shop can also mount them."], ["Can I ask for a custom story?", "In the real store, yes. Message us on WhatsApp with the story and size."]],
    sholapith: [["Is it fragile?", "Sholapith is very light and soft, so handle it by the base. It is packed in a hard box with tissue."], ["Will it turn yellow?", "Over many years in sunlight it can turn ivory. Keep it out of direct sun to keep it white."], ["Can it be used for a real wedding?", "Yes, the topor is made the same way as the ones worn at Bengali weddings."]],
    "cane-bamboo": [["Will it get mould in the monsoon?", "Keep it dry and put it in the sun once a month. A dry cloth with a little neem oil also helps."], ["Can it hold weight?", "The baskets hold fruit, books or toys easily. They are not meant to be sat on."], ["Is the colour painted?", "Natural pieces are not painted. The darker ones are smoked over a fire, the old way."]]
  };

  /** Mock PIN prefix table: city and state for the checkout auto-fill. */
  var PINS = {
    "700": ["Kolkata", "West Bengal"], "711": ["Howrah", "West Bengal"], "712": ["Hooghly", "West Bengal"], "713": ["Bardhaman", "West Bengal"],
    "721": ["Medinipur", "West Bengal"], "722": ["Bankura", "West Bengal"], "731": ["Bolpur", "West Bengal"], "734": ["Siliguri", "West Bengal"],
    "743": ["North 24 Parganas", "West Bengal"], "110": ["New Delhi", "Delhi"], "400": ["Mumbai", "Maharashtra"], "411": ["Pune", "Maharashtra"],
    "560": ["Bengaluru", "Karnataka"], "600": ["Chennai", "Tamil Nadu"], "500": ["Hyderabad", "Telangana"], "380": ["Ahmedabad", "Gujarat"],
    "395": ["Surat", "Gujarat"], "302": ["Jaipur", "Rajasthan"], "226": ["Lucknow", "Uttar Pradesh"], "201": ["Ghaziabad", "Uttar Pradesh"],
    "122": ["Gurugram", "Haryana"], "160": ["Chandigarh", "Chandigarh"], "800": ["Patna", "Bihar"], "751": ["Bhubaneswar", "Odisha"],
    "781": ["Guwahati", "Assam"], "834": ["Ranchi", "Jharkhand"], "452": ["Indore", "Madhya Pradesh"], "462": ["Bhopal", "Madhya Pradesh"],
    "682": ["Kochi", "Kerala"], "695": ["Thiruvananthapuram", "Kerala"], "190": ["Srinagar", "Jammu and Kashmir"], "194": ["Leh", "Ladakh"],
    "744": ["Port Blair", "Andaman and Nicobar Islands"], "795": ["Imphal", "Manipur"], "797": ["Kohima", "Nagaland"], "799": ["Agartala", "Tripura"]
  };

  var STATES = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

  /** @type {Coupon[]} */
  var COUPONS = [
    { code: "WELCOME10", label: "10% off your first order", type: "percent", value: 10, min: 0, firstOnly: true },
    { code: "FREESHIP", label: "Free shipping on any order", type: "ship", value: 0, min: 0, firstOnly: false },
    { code: "CRAFT200", label: "₹200 off orders of ₹1,999 or more", type: "flat", value: 200, min: 1999, firstOnly: false }
  ];

  var STORE = {
    name: "Mati Kotha Crafts",
    tagline: "Handmade in Bengal. Delivered across India.",
    address: "14 Lake Terrace, Kolkata 700029",
    phone: "+919804243159", phoneDisplay: "+91 98042 43159",
    email: "hello@matikotha.example",
    gstin: "19ABCDE1234F1Z5",
    freeShipAt: 999, shipFee: 79, codFee: 49, expressFee: 149, giftWrap: 49,
    hsn: { terracotta: "6913", dokra: "8306", kantha: "6214", patachitra: "9701", sholapith: "4602", "cane-bamboo": "4602" }
  };

  /** Pre-seeded sample orders so tracking works before the visitor buys. Times are hours before page load. */
  var SEED_ORDERS = [
    { no: "MKC-100311", mobile: "9830012345", name: "Ritika S.", city: "Kolkata", state: "West Bengal", pin: "700029", hoursAgo: 76, stage: 4, pay: "upi",
      items: [["bankura-ghora-classic-horse", "m", 1], ["mati-pradip-diya-set", "12", 2]] },
    { no: "MKC-100298", mobile: "9876543210", name: "Arjun M.", city: "Bengaluru", state: "Karnataka", pin: "560034", hoursAgo: 30, stage: 2, pay: "cod",
      items: [["dokra-owl-pair", "one", 1]] },
    { no: "MKC-100305", mobile: "9123456780", name: "Sneha P.", city: "Pune", state: "Maharashtra", pin: "411001", hoursAgo: 5, stage: 1, pay: "card",
      items: [["hand-stitched-kantha-stole", "mustard", 1], ["kantha-cushion-cover", "i16", 2]] }
  ];

  /** Extra orders for the owner's dashboard. */
  var ADMIN_ORDERS = [
    ["MKC-100339", "Pallavi D.", "Kolkata", 2, "New", "upi", [["machh-pata-fish-wedding-scroll", "4", 1]]],
    ["MKC-100338", "Imran K.", "Lucknow", 3, "New", "cod", [["dokra-haathi-elephant", "s", 1], ["matir-ghanti-wind-chime", "one", 1]]],
    ["MKC-100337", "Shreya B.", "Mumbai", 5, "Packed", "card", [["tussar-kantha-stole-lal", "one", 1]]],
    ["MKC-100336", "Vikram R.", "Delhi", 7, "Packed", "upi", [["mati-pradip-diya-set", "24", 2], ["embroidered-door-toran", "one", 1]]],
    ["MKC-100335", "Moumita G.", "Howrah", 9, "Shipped", "netbanking", [["shola-topor-wedding-crown", "one", 1]]],
    ["MKC-100334", "Anil T.", "Patna", 20, "Shipped", "cod", [["bet-fruit-basket", "m", 1], ["hand-coiled-table-mats", "one", 1]]],
    ["MKC-100333", "Lavanya N.", "Chennai", 26, "Shipped", "upi", [["mayur-dokra-lidded-bowl", "one", 1]]],
    ["MKC-100332", "Saurabh J.", "Jaipur", 31, "Delivered", "card", [["kantha-cushion-cover", "i18", 2]]],
    ["MKC-100331", "Tanushree C.", "Siliguri", 44, "Delivered", "upi", [["bankura-ghora-classic-horse", "l", 1]]],
    ["MKC-100330", "Neha V.", "Gurugram", 50, "Delivered", "upi", [["dokra-owl-pair", "one", 1], ["painted-coconut-shell-hanging", "one", 2]]],
    ["MKC-100329", "Rakesh P.", "Bhubaneswar", 70, "Returned", "cod", [["kolshi-pot-set", "one", 1]]],
    ["MKC-100328", "Ishita M.", "Kolkata", 96, "Delivered", "upi", [["hand-stitched-kantha-stole", "red", 1]]]
  ];

  /** Sales for the last 6 days before today, in rupees, for the 7-day chart. */
  var SALES_7 = [18420, 22690, 15340, 27810, 24150, 31260];

  var ABANDONED = [
    { name: "Rupa S.", mobile: "98310 4xxxx", items: "Kantha Stole, Mustard", value: 1499, ago: "2 hours ago" },
    { name: "Aditya K.", mobile: "99030 7xxxx", items: "Dokra Haathi, Medium + 1 more", value: 2048, ago: "5 hours ago" },
    { name: "Megha R.", mobile: "90070 2xxxx", items: "Shola Topor, Wedding Crown", value: 1899, ago: "Yesterday" },
    { name: "Farhan A.", mobile: "97480 1xxxx", items: "Diya Set of 24 + 2 more", value: 1647, ago: "Yesterday" }
  ];

  var TOP_MONTH = [["mati-pradip-diya-set", 182], ["hand-stitched-kantha-stole", 96], ["bankura-ghora-classic-horse", 88], ["dokra-owl-pair", 61], ["painted-coconut-shell-hanging", 54]];

  var POLICIES = {
    shipping: { title: "Shipping policy", body: [
      ["Where we ship", "We ship to every serviceable PIN code in India through our courier partners."],
      ["Charges", "Shipping is free on orders of ₹999 or more. Below that, standard shipping is ₹79. Express delivery is ₹149."],
      ["Dispatch", "Orders leave our Kolkata packing room in 24 to 48 hours. Large scrolls and made-to-order pieces may take 3 days."],
      ["Delivery time", "West Bengal: 2 to 3 days. Metro cities: 3 to 5 days. Rest of India: 5 to 7 days. Remote areas can take longer."],
      ["Cash on delivery", "COD is available on most PIN codes for a ₹49 fee. It is not available in a few remote areas; the PIN check on each product tells you."]] },
    returns: { title: "Returns and refunds", body: [
      ["7-day easy returns", "If you do not love it, tell us within 7 days of delivery. The item must be unused and in its original packing."],
      ["Damaged in transit", "Send a photo or short video of the parcel and the item on WhatsApp within 48 hours. We replace it or refund it in full."],
      ["How refunds work", "Prepaid orders are refunded to the same method within 5 to 7 working days of pickup. COD orders are refunded by UPI or bank transfer."],
      ["Not returnable", "Custom pieces, gift-wrapped items with a personal message, and items marked final sale."]] },
    privacy: { title: "Privacy policy", body: [
      ["What we collect", "Your name, mobile number, email and address, only to deliver your order and send you updates about it."],
      ["Payments", "Payments are handled on Razorpay's secure page. We never see or store your card, UPI or bank details."],
      ["Messages", "We send order updates on WhatsApp, SMS and email. Offers are sent only if you sign up, and you can stop them at any time."],
      ["Sharing", "We share your address and phone number only with the courier delivering your parcel."]] },
    terms: { title: "Terms of use", body: [
      ["Handmade pieces", "Each item is made by hand, so small differences in colour, size and finish from the photos are normal and are not defects."],
      ["Prices", "All prices are in Indian rupees and include GST. Prices can change without notice, but never after you have placed an order."],
      ["Orders", "We may cancel an order if an item is out of stock or a price was shown wrongly. You will get a full refund."],
      ["Disputes", "These terms follow Indian law, with courts in Kolkata."]] }
  };

  window.MK = {
    CRAFTS: CRAFTS, ROOMS: ROOMS, GIFTS: GIFTS, COLOURS: COLOURS, MAKERS: MAKERS, PRODUCTS: PRODUCTS, BUNDLES: BUNDLES,
    REVIEW_POOL: REVIEW_POOL, QA: QA, PINS: PINS, STATES: STATES, COUPONS: COUPONS, STORE: STORE,
    SEED_ORDERS: SEED_ORDERS, ADMIN_ORDERS: ADMIN_ORDERS, SALES_7: SALES_7, ABANDONED: ABANDONED, TOP_MONTH: TOP_MONTH, POLICIES: POLICIES
  };
})();
