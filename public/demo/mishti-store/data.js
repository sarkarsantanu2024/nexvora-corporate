/* Nolen Mishti Ghar (sample online sweet shop): every product, category,
 * delivery area, slot, coupon and review in one place.
 *
 * The demos are static pages, so this is plain JavaScript with JSDoc types
 * (editors type-check it the same way as a .ts file). The shop, the people
 * and the reviews are made up.
 */

/**
 * @typedef {{ label: string, price: number }} Pack
 *   One size the customer can pick: "4 pcs", "500 g", "Box".
 * @typedef {"Bestseller" | "Seasonal" | "New"} Badge
 * @typedef {{
 *   id: string,
 *   name: string,
 *   cat: string,
 *   line: string,
 *   desc: string,
 *   ingredients: string,
 *   shelf: string,
 *   veg: boolean,
 *   packs: Pack[],
 *   badges: Badge[],
 *   soldOut?: boolean,
 *   img: string[],
 *   contents?: string[]
 * }} Product
 *   `img` holds names under images/p/; each exists as <name>-320.webp and <name>-640.webp.
 *   `contents` is only set on festival boxes.
 * @typedef {{ id: string, name: string, tag?: string }} Category
 * @typedef {{ name: string, fee: number }} Area
 * @typedef {{ id: string, label: string, day: 0 | 1, start: number, end: number }} Slot
 *   `day` 0 is today, 1 is tomorrow; `start` and `end` are hours on a 24-hour clock.
 * @typedef {{ code: string, kind: "percent" | "freedel", value?: number, min?: number, text: string }} Coupon
 * @typedef {{ name: string, area: string, stars: number, text: string }} Review
 */

(function () {
  var SHOP = {
    name: "Nolen Mishti Ghar",
    tagline: "Fresh sweets from our kitchen to your door, since 1987.",
    address: "42 Dum Dum Road, Kolkata 700030",
    hours: "7 am to 10 pm",
    deliveryHours: "10 am to 9 pm",
    phone: "+91 98042 43159",
    tel: "+919804243159",
    upi: "nolenmishti@upi",
    minOrder: 199,
    freeDeliveryAt: 499,
    cutoffHour: 18,
  };

  /** @type {Category[]} */
  var CATEGORIES = [
    { id: "rosogolla", name: "Rosogolla & Rasmalai" },
    { id: "sandesh", name: "Sandesh" },
    { id: "nolen-gur", name: "Nolen Gur Specials", tag: "Seasonal" },
    { id: "doi", name: "Mishti Doi" },
    { id: "namkeen", name: "Namkeen & Snacks" },
    { id: "boxes", name: "Festival Boxes" },
    { id: "sugar-free", name: "Sugar-free" },
  ];

  var PCS = function (each) {
    return [
      { label: "4 pcs", price: each * 4 },
      { label: "8 pcs", price: each * 8 },
      { label: "12 pcs", price: each * 12 },
    ];
  };
  var WT = function (g250, g500, kg1) {
    var p = [{ label: "250 g", price: g250 }, { label: "500 g", price: g500 }];
    if (kg1) p.push({ label: "1 kg", price: kg1 });
    return p;
  };
  var CHILLED = "Best eaten within 2 days. Keep refrigerated.";

  /** @type {Product[]} */
  var PRODUCTS = [
    // Rosogolla & Rasmalai
    {
      id: "rosogolla", name: "Rosogolla", cat: "rosogolla",
      line: "Soft, spongy, made with fresh chhena",
      desc: "Our everyday rosogolla, rolled by hand every morning from chhena made in our own kitchen and boiled in light sugar syrup until it springs back when you press it.",
      ingredients: "Cow milk chhena, sugar, water, a little semolina.",
      shelf: CHILLED, veg: true, packs: PCS(15), badges: ["Bestseller"],
      img: ["rosogolla-1", "rosogolla-2", "rosogolla-3"],
    },
    {
      id: "rasmalai", name: "Rasmalai", cat: "rosogolla",
      line: "Chhena discs in thick saffron milk",
      desc: "Flat chhena discs soaked overnight in reduced milk with saffron, cardamom and slivered pistachio. Served chilled.",
      ingredients: "Cow milk chhena, full cream milk, sugar, saffron, cardamom, pistachio.",
      shelf: CHILLED, veg: true, packs: PCS(30), badges: [],
      img: ["rasmalai-1", "rasmalai-2", "rasmalai-3"],
    },
    {
      id: "rajbhog", name: "Rajbhog", cat: "rosogolla",
      line: "Large saffron rosogolla with a nutty centre",
      desc: "A bigger, golden rosogolla coloured with saffron and filled with a small centre of khoa, cardamom and chopped dry fruit.",
      ingredients: "Cow milk chhena, sugar, saffron, khoa, cashew, pistachio, cardamom.",
      shelf: CHILLED, veg: true, packs: PCS(25), badges: [],
      img: ["rajbhog-1", "rajbhog-2", "rajbhog-3"],
    },
    {
      id: "kalo-jam", name: "Kalo Jam", cat: "rosogolla",
      line: "Dark, slow-fried and soaked in syrup",
      desc: "Chhena and khoa dumplings fried slowly until almost black outside, then soaked in syrup. Rich and not too sweet in the middle.",
      ingredients: "Chhena, khoa, flour, sugar, ghee for frying.",
      shelf: CHILLED, veg: true, packs: PCS(20), badges: [], soldOut: true,
      img: ["kalojam-1", "kalojam-2"],
    },
    {
      id: "pantua", name: "Pantua", cat: "rosogolla",
      line: "The Bengali cousin of gulab jamun",
      desc: "Golden brown pantua fried in ghee and rested in warm syrup. Good warm or straight from the fridge.",
      ingredients: "Chhena, khoa, semolina, sugar, ghee.",
      shelf: CHILLED, veg: true, packs: PCS(15), badges: [],
      img: ["pantua-1"],
    },
    {
      id: "rosogolla-handi", name: "Rosogolla Handi", cat: "rosogolla",
      line: "Rosogolla in a clay handi, for guests",
      desc: "Our rosogolla packed in a sealed clay handi with its own syrup. The handi keeps them cool and makes a nice gift for a visit.",
      ingredients: "Cow milk chhena, sugar, water. Packed in a clay pot.",
      shelf: "Best eaten within 3 days. Keep in a cool place or refrigerate.", veg: true,
      packs: [{ label: "500 g handi", price: 180 }, { label: "1 kg handi", price: 340 }], badges: [],
      img: ["handi-1", "handi-2", "handi-3"],
    },

    // Sandesh
    {
      id: "malai-sandesh", name: "Malai Sandesh", cat: "sandesh",
      line: "Soft chhena with malai, saffron and pistachio",
      desc: "Soft sandesh made from fresh chhena and malai, finished with saffron strands and pistachio. Our most ordered sweet for guests.",
      ingredients: "Cow milk chhena, malai, sugar, saffron, pistachio.",
      shelf: CHILLED, veg: true, packs: PCS(25), badges: ["Bestseller"],
      img: ["sandesh-1", "sandesh-2", "sandesh-3"],
    },
    {
      id: "chamcham", name: "Chamcham", cat: "sandesh",
      line: "Long, soft and coated in mawa",
      desc: "Oval chhena sweets cooked in syrup, then rolled in sweetened mawa and topped with pistachio.",
      ingredients: "Cow milk chhena, sugar, mawa, pistachio, saffron.",
      shelf: CHILLED, veg: true, packs: PCS(20), badges: [],
      img: ["chamcham-1", "chamcham-2"],
    },
    {
      id: "kalakand", name: "Kalakand", cat: "sandesh",
      line: "Grainy milk cake with silver leaf",
      desc: "Milk slowly reduced with chhena until grainy and set in trays, then cut into squares and topped with edible silver leaf.",
      ingredients: "Full cream milk, chhena, sugar, cardamom, edible silver leaf.",
      shelf: CHILLED, veg: true, packs: WT(140, 270, 520), badges: [],
      img: ["kalakand-1"],
    },
    {
      id: "dry-fruit-sandesh", name: "Dry Fruit Sandesh", cat: "sandesh",
      line: "Pressed sandesh with almonds and cashew",
      desc: "A firmer sandesh pressed with roasted almonds, cashew and pistachio. Keeps a little longer, so it travels well.",
      ingredients: "Chhena, sugar, almond, cashew, pistachio, cardamom.",
      shelf: "Best eaten within 4 days. Keep refrigerated.", veg: true,
      packs: WT(220, 420, 800), badges: ["New"],
      img: ["dryfruit-1"],
    },

    // Nolen Gur Specials
    {
      id: "nolen-gur-rosogolla", name: "Nolen Gur Rosogolla", cat: "nolen-gur",
      line: "Rosogolla in date palm jaggery syrup",
      desc: "Made only in winter, when fresh nolen gur comes in from the villages. The rosogolla is boiled in jaggery syrup, so it is light brown with a smoky sweetness.",
      ingredients: "Cow milk chhena, nolen gur (date palm jaggery), water.",
      shelf: CHILLED, veg: true, packs: PCS(20), badges: ["Seasonal", "Bestseller"],
      img: ["gur-rosogolla-1", "gur-rosogolla-2"],
    },
    {
      id: "nolen-gur-sandesh", name: "Nolen Gur Sandesh", cat: "nolen-gur",
      line: "Soft sandesh with fresh winter jaggery",
      desc: "Soft-cooked sandesh sweetened only with nolen gur. The colour and the taste change a little each week as the season goes on.",
      ingredients: "Cow milk chhena, nolen gur (date palm jaggery).",
      shelf: CHILLED, veg: true, packs: PCS(35), badges: ["Seasonal"],
      img: ["gur-sandesh-1", "gur-sandesh-2"],
    },
    {
      id: "nolen-gur-doi", name: "Nolen Gur Mishti Doi", cat: "nolen-gur",
      line: "Set curd sweetened with nolen gur",
      desc: "Our mishti doi made with nolen gur instead of sugar, set overnight in clay pots.",
      ingredients: "Full cream milk, nolen gur, curd culture.",
      shelf: CHILLED, veg: true, packs: WT(80, 150), badges: ["Seasonal"], soldOut: true,
      img: ["gur-doi-1"],
    },

    // Mishti Doi
    {
      id: "mishti-doi", name: "Mishti Doi", cat: "doi",
      line: "Caramel sweet curd set in clay pots",
      desc: "Milk boiled down with caramelised sugar and set overnight in clay pots, which soak up the extra water and leave the doi thick.",
      ingredients: "Full cream milk, sugar, curd culture.",
      shelf: CHILLED, veg: true, packs: WT(65, 120, 230), badges: ["Bestseller"],
      img: ["doi-1"],
    },
    {
      id: "sada-doi", name: "Sada Doi", cat: "doi",
      line: "Plain thick curd, no sugar",
      desc: "Thick plain curd for meals, raita or a summer lassi at home.",
      ingredients: "Full cream milk, curd culture.",
      shelf: CHILLED, veg: true, packs: WT(45, 80, 150), badges: [],
      img: ["sada-doi-1"],
    },

    // Namkeen & Snacks
    {
      id: "singara", name: "Singara", cat: "namkeen",
      line: "Crisp pastry with spiced potato and peanut",
      desc: "Fried fresh through the day. Flaky crust with a filling of potato, cauliflower in winter, peanuts and a little kalonji.",
      ingredients: "Flour, potato, peanut, cauliflower (seasonal), spices, oil.",
      shelf: "Best eaten the same day. Warm in a pan, not a microwave.", veg: true,
      packs: PCS(12), badges: ["Bestseller"],
      img: ["singara-1"],
    },
    {
      id: "phuchka-kit", name: "Phuchka Party Kit", cat: "namkeen",
      line: "Puris, filling and tamarind water to make at home",
      desc: "Crisp puris, spiced potato filling and a bottle of sour tamarind water, packed separately so nothing goes soggy on the way.",
      ingredients: "Semolina puris, potato, chickpea, tamarind, spices.",
      shelf: "Best eaten the same day. Keep the water chilled.", veg: true,
      packs: [{ label: "For 2", price: 99 }, { label: "For 4", price: 189 }, { label: "For 8", price: 359 }],
      badges: ["New"],
      img: ["phuchka-1", "phuchka-2", "phuchka-3"],
    },
    {
      id: "chakli", name: "Masala Chakli", cat: "namkeen",
      line: "Crunchy spirals for tea time",
      desc: "Rice and gram flour spirals with sesame and a little chilli. Crunchy for days in a closed tin.",
      ingredients: "Rice flour, gram flour, sesame, chilli, ajwain, oil.",
      shelf: "Keeps for 3 weeks in a closed tin.", veg: true,
      packs: WT(90, 170), badges: [],
      img: ["chakli-1"],
    },
    {
      id: "jilipi", name: "Jilipi", cat: "namkeen",
      line: "Hot, crisp and dripping with syrup",
      desc: "Fried fresh every evening from 4 pm. Crisp outside, soaked in syrup inside.",
      ingredients: "Flour, curd, sugar, saffron colour, oil.",
      shelf: "Best eaten the same day.", veg: true,
      packs: WT(70, 130, 250), badges: [],
      img: ["jilipi-1"],
    },
    {
      id: "mixed-namkeen", name: "Mixed Namkeen Platter", cat: "namkeen",
      line: "Nimki, chanachur and sweets on one tray",
      desc: "A ready tray for guests: nimki, chanachur, khasta and a few small sweets in the middle.",
      ingredients: "Flour, gram flour, peanuts, spices, oil, assorted sweets.",
      shelf: "Namkeen keeps for 2 weeks. Eat the sweets within 2 days.", veg: true,
      packs: WT(80, 150, 290), badges: [],
      img: ["namkeen-1"],
    },

    // Festival Boxes
    {
      id: "box-499", name: "Pujo Mini Box", cat: "boxes",
      line: "12 pieces in a gift box",
      desc: "A small box for a visit or a neighbour: twelve of our most loved sweets.",
      ingredients: "Assorted chhena sweets. See what is inside.",
      shelf: CHILLED, veg: true, packs: [{ label: "Box of 12", price: 499 }], badges: [],
      contents: ["4 Malai Sandesh", "4 Rosogolla", "4 Chamcham"],
      img: ["box-499-1"],
    },
    {
      id: "box-999", name: "Bijoya Box", cat: "boxes",
      line: "24 pieces and a pot of mishti doi",
      desc: "Our Bijoya favourite: sweets for the whole family and a pot of mishti doi.",
      ingredients: "Assorted sweets and mishti doi. See what is inside.",
      shelf: CHILLED, veg: true, packs: [{ label: "Box of 24", price: 999 }], badges: ["Bestseller"],
      contents: ["6 Malai Sandesh", "6 Rajbhog", "6 Rosogolla", "6 Motichoor Ladoo", "500 g Mishti Doi"],
      img: ["box-999-1"],
    },
    {
      id: "box-1999", name: "Grand Celebration Box", cat: "boxes",
      line: "A two-tier tray for weddings and big days",
      desc: "A decorated two-tier tray of sweets and dry fruit sandesh, wrapped for gifting.",
      ingredients: "Assorted sweets, dry fruit sandesh, ladoo. See what is inside.",
      shelf: CHILLED, veg: true, packs: [{ label: "Tray of 40", price: 1999 }], badges: [],
      contents: ["10 Malai Sandesh", "10 Rajbhog", "10 Motichoor Ladoo", "500 g Dry Fruit Sandesh", "500 g Kalakand"],
      img: ["box-1999-1", "ladoo-1"],
    },

    // Sugar-free
    {
      id: "sf-kaju", name: "Sugar-free Kaju Barfi", cat: "sugar-free",
      line: "Cashew barfi sweetened with dates",
      desc: "Thin cashew barfi with no added sugar, sweetened with dates. Ask your doctor if you are diabetic.",
      ingredients: "Cashew, dates, ghee, cardamom.",
      shelf: "Best eaten within 10 days. Keep in a cool place.", veg: true,
      packs: WT(320, 620), badges: [],
      img: ["sf-kaju-1"],
    },
    {
      id: "sf-sandesh", name: "Sugar-free Sandesh", cat: "sugar-free",
      line: "Soft sandesh with a natural sweetener",
      desc: "Our malai sandesh made with a natural sweetener in place of sugar. Lighter, still soft.",
      ingredients: "Cow milk chhena, malai, stevia, saffron, pistachio.",
      shelf: CHILLED, veg: true, packs: PCS(35), badges: ["New"],
      img: ["sf-sandesh-1"],
    },
  ];

  /** @type {Area[]} */
  var AREAS = [
    { name: "Dum Dum", fee: 30 },
    { name: "Nagerbazar", fee: 30 },
    { name: "Belgachia", fee: 30 },
    { name: "Ultadanga", fee: 50 },
    { name: "Lake Town", fee: 50 },
    { name: "Baguiati", fee: 50 },
    { name: "Kestopur", fee: 50 },
  ];

  /** @type {Slot[]} */
  var SLOTS = [
    { id: "t-16", label: "Today, 4 to 6 pm", day: 0, start: 16, end: 18 },
    { id: "t-18", label: "Today, 6 to 8 pm", day: 0, start: 18, end: 20 },
    { id: "m-10", label: "Tomorrow, 10 am to 12 pm", day: 1, start: 10, end: 12 },
    { id: "m-16", label: "Tomorrow, 4 to 6 pm", day: 1, start: 16, end: 18 },
  ];

  /** @type {Coupon[]} */
  var COUPONS = [
    { code: "PUJO10", kind: "percent", value: 10, min: 500, text: "10% off on orders above ₹500" },
    { code: "FREEDEL", kind: "freedel", text: "Free delivery on this order" },
  ];

  /** @type {Review[]} */
  var REVIEWS = [
    { name: "Sudeshna B.", area: "Nagerbazar", stars: 5, text: "Ordered the Bijoya box for my in-laws. Came in the 6 to 8 slot, packed well, and the mishti doi pot was still cold." },
    { name: "Arindam S.", area: "Lake Town", stars: 5, text: "Nolen gur rosogolla tastes exactly like the ones from my childhood. I order every Sunday now." },
    { name: "Priya M.", area: "Baguiati", stars: 4, text: "Easy to order on the phone and paid by UPI. Delivery was 20 minutes late but they called to tell me." },
    { name: "Rahul D.", area: "Dum Dum", stars: 5, text: "Took 300 pieces for our office Diwali party through the bulk order form. Got a reply in half an hour." },
    { name: "Mousumi G.", area: "Kestopur", stars: 5, text: "The sugar-free sandesh is a blessing for my father. Soft, not bitter at all." },
    { name: "Tanmoy C.", area: "Ultadanga", stars: 4, text: "Singara arrived warm. Wish they delivered a little later at night, but the food is lovely." },
  ];

  window.MISHTI = {
    SHOP: SHOP,
    CATEGORIES: CATEGORIES,
    PRODUCTS: PRODUCTS,
    AREAS: AREAS,
    SLOTS: SLOTS,
    COUPONS: COUPONS,
    REVIEWS: REVIEWS,
  };
})();
