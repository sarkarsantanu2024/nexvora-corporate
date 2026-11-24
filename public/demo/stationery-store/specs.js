/* Kolom Khata Stationers, sample store: specifications by category.
 * FIELDS: every field the store uses, with its label.
 * CATS: per category, the fields shown (in this order) and the ones offered as shop filters.
 * P: values per product. A value is a string, or {v: {variantId: string}} when it changes with
 *    the size or colour chosen. Filter fields use the short shared words listed in CATS[cat].values
 *    so that the shop filters group products cleanly.
 * Shown after these fields on every product: sold as, brand, personalisation, HSN, GST, sourced from.
 */
(function () {
  "use strict";
  var FIELDS = {
    type: "Type", material: "Material", colour: "Colour", size: "Size", length: "Length", height: "Height", capacity: "Capacity",
    pages: "Pages", paper: "Paper", ruling: "Ruling", binding: "Binding", cover: "Cover", tip: "Tip", ink: "Ink", writes: "Writes",
    shades: "Colours", pieces: "Pieces", age: "Age", safety: "Safety", washable: "Washable", finish: "Finish", engraving: "Engraving",
    fabric: "Fabric", fit: "Fit", care: "Care", sizes: "Sizes", chest: "Chest", waist: "Waist", feet: "Foot length", language: "Language", year: "Year",
    occasion: "Occasion", includes: "In the box", pack: "Pack", use: "Good for"
  };
  var CATS = {
    office: { fields: ["type", "material", "colour", "size", "pages", "paper", "binding", "tip", "ink", "writes", "includes", "pack", "use"], filters: ["type", "material"],
      values: { type: ["Pen", "Marker", "Paper", "Register", "File", "Desk tool", "Printed stationery"], material: ["Plastic", "Metal", "Paper", "Board", "Rubber"] } },
    school: { fields: ["type", "material", "colour", "size", "length", "pages", "paper", "ruling", "binding", "cover", "includes", "pack", "age", "use"], filters: ["type", "ruling"],
      values: { type: ["Notebook", "Pencil", "Geometry", "Exam supplies", "Classroom", "Paper", "Printed forms"], ruling: ["Single line", "Four line", "Plain", "Not ruled"] } },
    art: { fields: ["type", "shades", "material", "size", "paper", "pages", "binding", "safety", "washable", "includes", "pack", "age"], filters: ["type", "washable"],
      values: { type: ["Colours", "Brushes", "Paper", "Glue and glitter", "Craft kit", "Pens"], washable: ["Yes", "No"] } },
    play: { fields: ["type", "material", "pieces", "size", "height", "language", "safety", "finish", "age", "use"], filters: ["type", "age"],
      values: { type: ["Flash cards", "Puzzle", "Blocks", "Counting", "Modelling", "Wall chart"], age: ["2+", "3+", "4+"] } },
    toys: { fields: ["type", "material", "pieces", "size", "length", "includes", "safety", "age"], filters: ["type", "age"],
      values: { type: ["Puzzle", "Board game", "Toy car", "Soft toy", "Balls"], age: ["1+", "3+", "6+", "8+"] } },
    gifts: { fields: ["type", "material", "colour", "size", "capacity", "height", "finish", "includes", "occasion", "pack", "care"], filters: ["type", "occasion"],
      values: { type: ["Mug", "Pen", "Frame", "Keychain", "Cards", "Handicraft", "Wrap", "Textile"], occasion: ["Any time", "Bijoya and Poila Baisakh", "Wedding", "Return gift", "Office"] } },
    prizes: { fields: ["type", "material", "colour", "size", "height", "finish", "engraving", "includes", "pack"], filters: ["type", "material"],
      values: { type: ["Medal", "Trophy cup", "Shield", "Memento", "Certificate", "Badge", "Ribbon"], material: ["Metal", "Wood", "Acrylic", "Paper", "Satin"] } },
    bags: { fields: ["type", "material", "colour", "capacity", "size", "includes", "care", "age"], filters: ["type", "material"],
      values: { type: ["Backpack", "Bottle", "Lunch box", "Pouch", "Umbrella", "Tote bag"], material: ["Polyester", "Steel", "Plastic", "Jute"] } },
    uniform: { fields: ["type", "material", "fabric", "colour", "size", "fit", "includes", "care"], filters: ["type"],
      values: { type: ["Cap", "ID card", "Tie", "Belt"] } },
    calendars: { fields: ["type", "year", "size", "pages", "paper", "binding", "cover", "language", "finish"], filters: ["type", "language"],
      values: { type: ["Wall calendar", "Desk calendar", "Diary"], language: ["English", "Bengali", "English and Bengali"] } },
    schoolwear: { fields: ["type", "fabric", "colour", "fit", "chest", "waist", "length", "feet", "sizes", "pack", "care"], filters: ["type", "fabric"],
      values: { type: ["Shirt", "T-shirt", "Trousers", "Skirt and frock", "Sweater and blazer", "Track suit", "Socks", "Shoes", "Rainwear", "Accessories", "Lab coat"], fabric: ["Poly-cotton", "Terry-cot", "Wool blend", "Polyester", "Cotton", "Acrylic", "Synthetic leather", "Canvas", "PVC-coated"] } },
    sports: { fields: ["type", "material", "size", "length", "includes", "age", "use"], filters: ["type", "age"],
      values: { type: ["Ball", "Bat and racket", "Indoor game", "Training", "Event"], age: ["5+", "8+", "12+", "All ages"] } },
    festive: { fields: ["type", "material", "colour", "size", "pages", "binding", "language", "includes", "pack", "occasion"], filters: ["occasion", "type"],
      values: { type: ["Khata and panjika", "Puja items", "Kites", "Rakhi", "Colours", "Diyas"], occasion: ["Poila Baisakh", "Saraswati Puja", "Lakshmi Puja", "Vishwakarma Puja", "Rakhi", "Holi", "Kali Puja and Diwali", "Hate khori"] } }
  };
  // Values per product. Filled in below.
  var P = {
    // office
    "smooth-ball-pen": { type: "Pen", material: "Plastic", colour: { v: { blue: "Blue ink, clear barrel", black: "Black ink, clear barrel", red: "Red ink, clear barrel" } }, size: "14 cm long", tip: "0.7 mm", ink: "Oil based, smudge resistant", writes: "About 1,200 metres", pack: "Sold loose, boxes of 50", use: "Office, school, counters" },
    "gel-pen-pack-10": { type: "Pen", material: "Plastic", colour: "10 colours, including glitter shades", tip: "0.8 mm", ink: "Gel", includes: "10 pens, clear barrel with grip", pack: "Pack of 10", use: "Project work and greeting cards" },
    "a4-copier-paper-ream": { type: "Paper", material: "Paper", colour: "High white", size: "A4, 210 x 297 mm", paper: { v: { "70": "70 gsm", "75": "75 gsm" } }, pack: "500 sheets per ream, 5 reams per box", use: "Office printers and photocopiers" },
    "stapler-with-pins": { type: "Desk tool", material: "Metal", size: "Small, fits in a pencil box", includes: "Stapler with plastic cover, box of 1,000 No. 10 pins", use: "Staples up to 15 sheets" },
    "box-file-foolscap": { type: "File", material: "Board", colour: { v: { black: "Black", yellow: "Yellow", red: "Red" } }, size: "Foolscap", includes: "Spring lever clip, spine label", use: "Holds about 400 sheets" },
    "sticky-notes-3x3": { type: "Paper", material: "Paper", colour: { v: { pink: "Pink", blue: "Blue", mix: "Mixed pastel" } }, size: "76 x 76 mm (3 x 3 in)", pack: "100 sheets per pad", use: "Notes and reminders, peels off clean" },
    "long-register-khata": { type: "Register", material: "Paper", size: "Long, 33 x 20 cm", pages: { v: { "100": "100, numbered", "200": "200, numbered", "300": "300, numbered" } }, paper: "Ruled", binding: "Hardbound, thread sewn", use: "Accounts, stock and attendance" },
    "highlighter-set-5": { type: "Marker", material: "Plastic", colour: "Yellow, green, pink, orange, purple", tip: "Chisel, 1 to 5 mm", ink: "Fluorescent, quick dry, does not bleed through", pack: "Set of 5", use: "Marking thick and thin lines" },
    "whiteboard-markers": { type: "Marker", material: "Plastic", colour: "Black, blue, red, green", ink: "Dry erase, wipes clean, does not stain", pack: "Set of 4", use: "Whiteboards" },
    "attendance-register": { type: "Register", material: "Paper", size: "Foolscap", pages: "200", paper: "Ruled, with month headings", use: "Attendance for 60 students, one full session" },
    "custom-rubber-stamp": { type: "Desk tool", material: "Rubber", size: { v: { s: "38 x 14 mm", l: "47 x 18 mm" } }, ink: "Blue, self-inking, refillable", use: "Your school, shop or office name and address; ready in 2 days" },
    "printed-envelopes": { type: "Printed stationery", material: "Paper", colour: { v: { dl: "White", a4: "Brown" } }, size: { v: { dl: "DL", a4: "A4" } }, paper: "Plain or cloth-lined", use: "Printed with your letterhead" },
    "visiting-cards": { type: "Printed stationery", material: "Paper", size: "90 x 54 mm", paper: { v: { matt: "350 gsm card, matt", gloss: "350 gsm card, gloss" } }, pack: "Box of 100", use: "Printed both sides, proof on WhatsApp first" },
    "cash-book-voucher-pad": { type: "Register", material: "Paper", pages: { v: { cash: "150", voucher: "100 vouchers" } }, paper: { v: { cash: "Ruled columns", voucher: "With carbon" } }, use: "Cash accounts and vouchers" },
    "tape-and-rubber-bands": { type: "Desk tool", material: { v: { tape: "Plastic", band: "Rubber" } }, pack: { v: { tape: "6 clear rolls, each 24 mm x 50 m", band: "100 g pack" } }, use: "Office and shop counter" },

    // school
    "hb-pencils": { type: "Pencil", length: "17.5 cm", ruling: "Not ruled", includes: "Eraser on top", pack: "Sold from 5; boxes of 10, cartons of 500", use: "HB grade, writing and drawing" },
    "ruled-notebook-172": { type: "Notebook", material: "Paper", pages: { v: { single: "172", four: "172", long: "160, long size" } }, paper: "58 gsm, ink does not show through", ruling: { v: { single: "Single line", four: "Four line", long: "Single line" } }, cover: "Laminated board; school name and crest on order" },
    "eraser-sharpener-combo": { type: "Pencil", colour: "White eraser", ruling: "Not ruled", includes: "Dust-free eraser, single-hole sharpener with steel blade", use: "Return gift for small children" },
    "geometry-box": { type: "Geometry", colour: { v: { blue: "Blue box", pink: "Pink box" } }, ruling: "Not ruled", includes: "9 pieces in a snap-shut box: metal compass with lead holder, divider, protractor, set squares, scale, pencil, eraser", use: "Class 5 to 10 maths" },
    "wooden-scale-30cm": { type: "Geometry", material: "Wood", length: "30 cm / 12 in", ruling: "Not ruled", use: "Marked in cm and inches" },
    "exam-clip-board": { type: "Exam supplies", material: "3 mm hardboard, metal clip with wide grip", size: "Foolscap, 35 x 23 cm", ruling: "Not ruled", use: "Exams; school name and crest can be printed" },
    "chart-paper": { type: "Paper", material: "Paper", colour: { v: { white: "White", yellow: "Yellow", pink: "Pink", green: "Green" } }, size: "50 x 70 cm", paper: "120 gsm", ruling: "Plain", pack: "Sold by the sheet", use: "Projects, notice boards, classroom displays" },
    "brown-cover-roll": { type: "Paper", material: "Kraft paper", colour: "Brown", size: "50 cm wide", length: "10 m", ruling: "Plain", pack: "One roll", use: "Covers about 40 notebooks" },
    "slate-with-chalk": { type: "Classroom", material: "Board slate, wooden frame", size: "About A4", ruling: "Not ruled", includes: "Box of 10 chalks", use: "First writing board" },
    "classroom-whiteboard": { type: "Classroom", material: "Magnetic board, aluminium frame", colour: "White", size: { v: { "2x3": "2 x 3 ft", "3x4": "3 x 4 ft", "4x6": "4 x 6 ft" } }, ruling: "Not ruled", includes: "Tray and duster" },
    "school-globe": { type: "Classroom", material: "Metal stand", size: "30 cm diameter", ruling: "Not ruled", use: "Political globe, country names in English" },
    "wall-map-india-world": { type: "Classroom", material: "Laminated", size: "100 x 70 cm", ruling: "Not ruled", includes: "Wooden rollers", use: { v: { india: "India map, in English", world: "World map, in English" } } },
    "report-cards-printed": { type: "Printed forms", material: "Paper", size: "A4, folded", paper: "250 gsm", ruling: "Not ruled", use: "Printed with your school name, crest and subjects; send your format on WhatsApp" },
    "admission-forms-printed": { type: "Printed forms", material: "Paper", size: "A4", paper: "90 gsm", ruling: "Not ruled", use: "Printed with your school name and fields" },
    "answer-sheet-paper": { type: "Exam supplies", material: "Paper", size: "Foolscap", paper: "Ruled, with margin", ruling: "Single line", pack: "500 sheets per ream", use: "Exam answer sheets" },
    "bengali-practice-copy": { type: "Notebook", material: "Paper", pages: "48", paper: "Dotted lines to trace over", ruling: "Not ruled", use: "Bengali letters, Barnaparichay style" },

    // art
    "wax-crayons": { type: "Colours", shades: { v: { "12": "12", "24": "24" } }, material: "Wax", size: "9 cm long", safety: "Non-toxic", washable: "No", pack: { v: { "12": "Box of 12", "24": "Box of 24" } }, age: "Play school and up" },
    "watercolour-cakes-12": { type: "Colours", shades: "12", material: "Watercolour cakes in a flat tin", washable: "Yes", includes: "One round brush", pack: "Tin of 12, fits a school bag" },
    "paint-brush-set-6": { type: "Brushes", material: "Synthetic hair", size: "0, 2, 4, 6, 8 and flat 10", washable: "Yes", pack: "Set of 6" },
    "colour-craft-paper-a4": { type: "Paper", shades: "10", material: "Paper", size: "A4", paper: "80 gsm", washable: "No", pack: "50 sheets" },
    "glitter-glue-set-6": { type: "Glue and glitter", washable: "Yes", pack: "6 tubes x 10 ml" },
    "sketch-pens-12": { type: "Pens", shades: "12", size: "Fat, safe tip", washable: "Yes", includes: "Snap-on caps", pack: "Pack of 12" },
    "drawing-book-36": { type: "Paper", paper: "120 gsm, white", pages: "36", binding: "Spiral, lies flat", washable: "No" },
    "kids-craft-kit": { type: "Craft kit", washable: "No", includes: "About 40 pieces: scissors, colour pencils, pom-poms, paints, paper", pack: "One kit", age: "4 years and up" },
    "bengali-calligraphy-pens": { type: "Pens", size: "Flat nibs, 1.5 to 3.8 mm", washable: "No", includes: "3 ink cartridges", pack: "Set of 5" },

    // play
    "flash-card-set": { type: "Flash cards", material: "Thick card", pieces: { v: { abc: "26 cards", "123": "20 cards", fruit: "26 cards", animal: "26 cards" } }, size: "15 x 10 cm", finish: "Laminated, wipe clean, rounded corners", age: "3+", use: "Circle time and games" },
    "wooden-alphabet-puzzle": { type: "Puzzle", material: "Wood", pieces: "26 letters, A to Z", safety: "Non-toxic paint, smooth edges", age: "3+" },
    "wooden-building-blocks": { type: "Blocks", material: "Pine wood", pieces: "50: arches, pillars and cubes", finish: { v: { natural: "Natural wood", colour: "Coloured" } }, age: "3+" },
    "bead-counting-frame": { type: "Counting", material: "Wooden beads on a stand", pieces: "100 beads, 10 rows of 10", height: "30 cm", age: "3+", use: "Tens and ones" },
    "play-dough-6": { type: "Modelling", material: "Wheat based dough", pieces: "6 colours x 50 g", safety: "Non-toxic", age: "3+" },
    "alphabet-wall-chart": { type: "Wall chart", size: "50 x 75 cm", language: { v: { en: "English, A to Z", bn: "Bengali, Swarabarna and Byanjanbarna", hi: "Hindi, Varnamala" } }, finish: "Laminated, with eyelets", age: "3+", use: "Classroom walls" },
    "bengali-alphabet-flash-cards": { type: "Flash cards", pieces: "50 cards", language: "Bengali", finish: "Laminated, rounded corners", age: "3+", use: "Swarabarna and Byanjanbarna, a picture for each letter" },

    // toys
    "puzzle-cube-3x3": { type: "Puzzle", size: "3 x 3, 5.6 cm; smooth, adjustable turning", age: "8+" },
    "ludo-snakes-ladders": { type: "Board game", size: "Folding board, 40 x 40 cm", includes: "Ludo on one side, snakes and ladders on the other; 2 dice, 16 counters", age: "6+" },
    "pull-back-toy-car": { type: "Toy car", length: "7 cm", includes: "One car, assorted colours and shapes", age: "3+" },
    "teddy-bear": { type: "Soft toy", material: "Polyester fibre filling", size: { v: { s: "8 in", m: "12 in" } }, includes: "Cotton scarf", safety: "Hypoallergenic filling; hand wash", age: "3+" },
    "soft-play-balls-25": { type: "Balls", material: "Soft PE", pieces: "25", size: "7 cm each", safety: "BPA free, crush proof", age: "1+" },
    "jigsaw-puzzle-100": { type: "Puzzle", material: "Thick board", pieces: "100", size: "33 x 23 cm when finished", age: "6+" },

    // gifts
    "gift-wrap-sheets": { type: "Wrap", material: "Paper", size: "50 x 70 cm", finish: "Glossy, festive prints", occasion: "Any time", pack: "10 sheets, assorted designs" },
    "metal-pen-gift-box": { type: "Pen", material: "Metal, chrome trim", finish: "Name can be engraved on the barrel", includes: "Hard box with velvet lining", occasion: "Office" },
    "white-ceramic-mug": { type: "Mug", material: "Ceramic", colour: "White", capacity: "330 ml", finish: "Sublimation print, both sides", occasion: "Any time", care: "Dishwasher and microwave safe" },
    "wooden-doll-keychain": { type: "Keychain", material: "Wood, steel split ring", colour: "Assorted", height: "5 cm", finish: "Hand painted", occasion: "Return gift" },
    "photo-frame-5x7": { type: "Frame", colour: "Black", size: "Takes a 5 x 7 in photo", includes: "Glass, table stand and wall hook", occasion: "Any time" },
    "bijoya-greeting-cards": { type: "Cards", size: "5 x 7 in", finish: { v: { bijoya: "Shubho Bijoya design, printed with your name", baisakh: "Poila Baisakh design, printed with your name" } }, includes: "Envelope", occasion: "Bijoya and Poila Baisakh" },
    "wedding-card-printing": { type: "Cards", size: "7 x 9 in", finish: "Chitpur style, Bengali and English; proof on WhatsApp", includes: "Envelope", occasion: "Wedding" },
    "terracotta-return-gift": { type: "Handicraft", material: "Terracotta", colour: "Assorted", height: "3 to 4 in", finish: "Hand painted, by Bengal's potters", occasion: "Return gift" },
    "sholapith-return-gift": { type: "Handicraft", material: "Sholapith", colour: "White", size: "Box 4 x 4 in", finish: "Made by Bengal's shola artisans", occasion: "Return gift", pack: "Boxed" },
    "kalighat-pat-print": { type: "Handicraft", material: "Thick paper", size: { v: { a4: "A4, 210 x 297 mm", a3: "A3, 297 x 420 mm" } }, finish: "Print of a Kalighat pat style painting", occasion: "Any time" },
    "gamchha-gift-set": { type: "Textile", material: "Handloom cotton", size: "150 x 75 cm each", occasion: "Any time", pack: "Set of 2 in a jute pouch" },

    // prizes
    "sports-medal-50mm": { type: "Medal", material: "Metal", colour: { v: { gold: "Gold finish", silver: "Silver finish", bronze: "Bronze finish" } }, size: "50 mm", engraving: "Face, up to 3 lines", includes: "22 mm ribbon with clip" },
    "trophy-cup": { type: "Trophy cup", material: "Metal", colour: "Gold", height: { v: { "8": "8 in", "10": "10 in", "12": "12 in", "16": "16 in" } }, finish: "Gold metallic, marble-look base", engraving: "On the cup, up to 4 lines; included from 5 pieces", includes: "Side handles" },
    "wooden-award-shield": { type: "Shield", material: "Wood", size: { v: { s: "8 x 10 in", l: "10 x 12 in" } }, finish: "Polished MDF, walnut finish", engraving: "On the plate", includes: "Black anodised metal plate" },
    "star-award-memento": { type: "Memento", material: "Metal", colour: "Gold star, black base", height: "10 in", engraving: "Plate on the base" },
    "certificate-sheets-a4": { type: "Certificate", material: "Paper", colour: "Ivory, gold border", size: "A4", finish: "250 gsm, printed border", includes: "Blank, or printed with each name at no extra setup" },
    "pin-badge-58mm": { type: "Badge", material: "Metal", size: "58 mm, round", includes: "Safety pin back" },
    "prize-rosette-ribbon": { type: "Ribbon", material: "Paper", colour: { v: { "1": "Gold, 1st", "2": "Silver, 2nd", "3": "Bronze, 3rd" } }, size: "12 cm across", finish: "Pleated, event name printed in the centre", includes: "Tails, safety pin back" },
    "club-shield-sarbojanin": { type: "Shield", material: "Wood", height: "14 in", engraving: "Engraved plate" },
    "puja-committee-memento": { type: "Memento", material: "Metal", colour: "Gold", height: "10 in" },
    "sarbojanin-trophy-cup": { type: "Trophy cup", material: "Metal", colour: "Gold and blue", height: { v: { "18": "18 in", "24": "24 in", "30": "30 in" } } },

    // bags
    "school-backpack": { type: "Backpack", material: "Polyester", colour: { v: { pink: "Pink", red: "Red", navy: "Navy", black: "Black" } }, capacity: "24 litres", size: "43 x 30 x 15 cm", includes: "2 main pockets, 1 front, 1 bottle pocket; padded straps", care: "Water resistant", age: "Class 3 to 10" },
    "steel-water-bottle-750": { type: "Bottle", material: "Steel", colour: { v: { blue: "Blue", red: "Red", teal: "Teal" } }, capacity: "750 ml", includes: "Leak-proof steel cap", care: "Food grade steel, single wall, does not hold smells" },
    "lunch-box-3-compartment": { type: "Lunch box", material: "Plastic", colour: "Green", capacity: "900 ml total", includes: "3 compartments, snap lid", care: "BPA-free, leak resistant" },
    "zip-pencil-pouch": { type: "Pouch", material: "Polyester", colour: "Striped", capacity: "30 pencils and a scale", size: "21 x 9 cm" },
    "school-umbrella": { type: "Umbrella", material: "Steel", colour: { v: { black: "Black", navy: "Navy" } }, size: "3 fold, fits the bag pocket", includes: "8 steel ribs" },
    "jute-bag-printed": { type: "Tote bag", material: "Jute", colour: "Natural", size: "14 x 12 x 5 in", includes: "Cotton rope handles" },

    // uniform
    "cotton-cap-printed": { type: "Cap", fabric: "Cotton twill", colour: { v: { yellow: "Yellow and navy", red: "Red", white: "White", navy: "Navy" } }, fit: "Adjustable strap, adult and child", includes: "Print area on front panel, 10 x 5 cm" },
    "id-card-holder-lanyard": { type: "ID card", material: "Clear holder, PVC card", colour: { v: { blue: "Blue lanyard", black: "Black lanyard" } }, size: "Holds an 86 x 54 mm card", includes: "12 mm lanyard with hook; card printed with each name" },
    "school-tie-striped": { type: "Tie", fabric: "Polyester", colour: "Striped; your school colours on bigger orders", fit: { v: { elastic: "Elastic ready-knot, junior", full: "Full tie, senior" } } },
    "school-belt": { type: "Belt", colour: { v: { brown: "Brown", black: "Black" } }, size: "30 mm wide", includes: "Steel buckle; school crest on 100 or more" },

    // calendars
    "wall-calendar-2027": { type: "Wall calendar", year: "2027", size: "30 x 45 cm", pages: "12 + cover", language: "English and Bengali", finish: "Holidays marked" },
    "custom-photo-calendar": { type: "Wall calendar", year: "2027", size: "30 x 45 cm", pages: "12, one photo per month", language: "English", finish: "Full colour, matt; your name and logo on every page" },
    "desk-calendar-2027": { type: "Desk calendar", year: "2027", size: "21 x 15 cm", pages: "12 + cover", binding: "Spiral top, tent style", language: "English", finish: "Your logo on each page" },
    "diary-2027-a5": { type: "Diary", year: "2027", size: "A5, 148 x 210 mm", pages: "384, a day per page", binding: "Hardbound", cover: { v: { pink: "Pink, fabric look", blue: "Blue and yellow, fabric look" } }, language: "English", finish: "Logo printed on the cover on order" },
    "bengali-wall-calendar": { type: "Wall calendar", year: "1433 (Bengali year)", pages: "12 + cover", language: "English and Bengali", finish: "Tithi and festival dates; shop name printed at the top" },

    // schoolwear
    "white-school-shirt-half": { type: "Shirt", fabric: "Poly-cotton", colour: "White", fit: "Regular, half sleeve, one pocket", chest: { v: { s22: "56 cm", s24: "61 cm", s26: "66 cm", s28: "71 cm", s30: "76 cm", s32: "81 cm", s34: "86 cm", s36: "92 cm" } }, length: { v: { s22: "42 cm", s24: "45 cm", s26: "49 cm", s28: "53 cm", s30: "57 cm", s32: "61 cm", s34: "65 cm", s36: "69 cm" } }, sizes: "22 to 34 (age 3 to 16), 36 (teacher S)", care: "65:35 poly-cotton, easy iron; machine wash, warm iron" },
    "white-school-shirt-full": { type: "Shirt", fabric: "Poly-cotton", colour: "White", fit: "Regular, full sleeve, double-stitched cuffs", chest: { v: { s22: "56 cm", s24: "61 cm", s26: "66 cm", s28: "71 cm", s30: "76 cm", s32: "81 cm", s34: "86 cm", s36: "92 cm" } }, length: { v: { s22: "42 cm", s24: "45 cm", s26: "49 cm", s28: "53 cm", s30: "57 cm", s32: "61 cm", s34: "65 cm", s36: "69 cm" } }, sizes: "22 to 34 (age 3 to 16), 36 (teacher S)", care: "65:35 poly-cotton; machine wash, warm iron" },
    "light-blue-school-shirt": { type: "Shirt", fabric: "Terry-cot", colour: "Light blue", fit: "Regular, half sleeve", chest: { v: { s22: "56 cm", s24: "61 cm", s26: "66 cm", s28: "71 cm", s30: "76 cm", s32: "81 cm", s34: "86 cm", s36: "92 cm" } }, length: { v: { s22: "42 cm", s24: "45 cm", s26: "49 cm", s28: "53 cm", s30: "57 cm", s32: "61 cm", s34: "65 cm", s36: "69 cm" } }, sizes: "22 to 34 (age 3 to 16), 36 (teacher S)", care: "Machine wash" },
    "house-polo-tshirt": { type: "T-shirt", fabric: "Polyester", colour: { v: { red: "Red house", blue: "Blue house", green: "Green house", yellow: "Yellow house" } }, fit: "Slightly loose, with collar; pique knit, 180 gsm" },
    "school-trousers-navy": { type: "Trousers", fabric: "Wool blend", colour: "Navy", fit: "Regular, adjustable inner waist band", sizes: "20 to 32 (age 4 to 17)" },
    "school-half-pant-grey": { type: "Trousers", fabric: "Terry-cot", colour: "Grey", fit: "Regular, elastic back", sizes: "20 to 28 (age 4 to 13)" },
    "pleated-skirt-navy": { type: "Skirt and frock", fabric: "Wool blend", colour: "Navy", fit: "Box pleats, side zip, adjustable button band", length: "Knee length", sizes: "20 to 32 (age 4 to 17)" },
    "salwar-kameez-uniform-set": { type: "Skirt and frock", fabric: "Poly-cotton", colour: "Matching shades", chest: { v: { s26: "66 cm", s28: "71 cm", s30: "76 cm", s32: "81 cm", s34: "86 cm", s36: "92 cm" } }, sizes: "26 to 34 (age 7 to 16), 36 (teacher S)", pack: "Set of 3: kameez, salwar, dupatta" },
    "primary-frock-check": { type: "Skirt and frock", fabric: "Poly-cotton", colour: "Check; your school's pattern on bulk orders", fit: "Slightly loose, sash at the back", chest: { v: { s22: "56 cm", s24: "61 cm", s26: "66 cm", s28: "71 cm", s30: "76 cm" } }, sizes: "22 to 30 (age 3 to 12)" },
    "school-sweater-v-neck": { type: "Sweater and blazer", fabric: "Acrylic", colour: { v: { navy: "Navy", maroon: "Maroon", grey: "Grey" } }, fit: "Regular, V-neck" },
    "school-blazer-navy": { type: "Sweater and blazer", fabric: "Polyester", colour: "Navy", fit: "Regular, poly-viscose, lined", chest: { v: { s28: "71 cm", s30: "76 cm", s32: "81 cm", s34: "86 cm", s36: "92 cm" } }, length: { v: { s28: "53 cm", s30: "57 cm", s32: "61 cm", s34: "65 cm", s36: "69 cm" } }, sizes: "28 to 34 (age 9 to 16), 36 (teacher S)" },
    "school-track-suit": { type: "Track suit", fabric: "Polyester", fit: "Slightly loose, brushed inside", chest: { v: { s22: "56 cm", s24: "61 cm", s26: "66 cm", s28: "71 cm", s30: "76 cm", s32: "81 cm", s34: "86 cm", s36: "92 cm" } }, sizes: "22 to 34 (age 3 to 16), 36 (teacher S)", pack: "Jacket and track pants" },
    "school-socks": { type: "Socks", fabric: "Cotton", colour: { v: { "w-s": "White", "w-l": "White", "n-s": "Navy", "n-l": "Navy", "g-l": "Grey" } }, fit: "Ribbed top that stays up; 80% cotton, with nylon", sizes: { v: { "w-s": "Small, age 3 to 7", "w-l": "Large, age 8 to 16", "n-s": "Small, age 3 to 7", "n-l": "Large, age 8 to 16", "g-l": "Large, age 8 to 16" } }, pack: "3 pairs" },
    "black-school-shoes": { type: "Shoes", fabric: "Synthetic leather", colour: "Black", fit: "Velcro strap for juniors, laces for seniors", feet: { v: { s10C: "17.5 cm", s12C: "19 cm", s1: "20.5 cm", s3: "22 cm", s5: "24 cm", s7: "25.5 cm", s8: "26.5 cm" } }, sizes: "UK 10C to 8 (age 4 to adult)", care: "Polishable; PVC non-marking sole" },
    "white-canvas-pt-shoes": { type: "Shoes", fabric: "Canvas", colour: "White", feet: { v: { s10C: "17.5 cm", s12C: "19 cm", s1: "20.5 cm", s3: "22 cm", s5: "24 cm", s7: "25.5 cm", s8: "26.5 cm" } }, sizes: "UK 10C to 8 (age 4 to adult)", care: "Washable, whiten with chalk; rubber sole" },
    "school-raincoat": { type: "Rainwear", fabric: "PVC-coated", fit: "Full length, hood, room for the school bag", chest: { v: { s22: "56 cm", s24: "61 cm", s26: "66 cm", s28: "71 cm", s30: "76 cm", s32: "81 cm" } }, sizes: "22 to 32 (age 3 to 14)", pack: "With pouch" },
    "hair-ribbons-bands": { type: "Accessories", fabric: "Polyester", colour: { v: { white: "White", navy: "Navy", red: "Red" } }, pack: "6 pieces, satin ribbons and soft bands; colours white, navy, red, maroon" },
    "lab-coat": { type: "Lab coat", fabric: "Cotton", colour: "White", fit: "Cotton twill, 3 pockets", chest: { v: { s28: "71 cm", s30: "76 cm", s32: "81 cm", s34: "86 cm", s36: "92 cm" } }, length: { v: { s28: "53 cm", s30: "57 cm", s32: "61 cm", s34: "65 cm", s36: "69 cm" } }, sizes: "28 to 34 (age 9 to 16), 36 (teacher S)" },

    // sports
    "school-football": { type: "Ball", material: "PU cover, hand stitched", size: { v: { "5": "Size 5", "4": "Size 4, for juniors" } }, age: { v: { "5": "12+", "4": "8+" } }, use: "School grounds and para matches" },
    "cricket-set": { type: "Bat and racket", material: "Wooden bat", size: { v: { jr: "Bat size 5, junior", full: "Full size bat" } }, includes: "Bat, tennis ball, 3 stumps, bails, bag", age: { v: { jr: "8+", full: "12+" } }, use: "School and para cricket" },
    "badminton-set": { type: "Bat and racket", includes: "2 rackets, 3 shuttlecocks, cover", age: "8+" },
    "skipping-rope": { type: "Training", material: "Plastic handles", length: "2.7 m, adjustable", age: "All ages" },
    "carrom-board": { type: "Indoor game", size: { v: { "32": "32 in", "26": "26 in, junior" } }, includes: "Coins, striker, powder", age: "All ages", use: "Clubs and homes" },
    "chess-set": { type: "Indoor game", size: "Folding board, 40 x 40 cm", includes: "Full-size pieces, stored inside the board", age: "All ages" },
    "training-cones": { type: "Training", size: "23 cm high", includes: "10 cones", age: "All ages", use: "Drills, races and sports day lanes" },
    "whistle-stopwatch": { type: "Training", material: { v: { watch: "Digital", whistle: "Metal" } }, includes: { v: { watch: "Stopwatch with lap times", whistle: "Whistle on a cord" } }, age: "All ages", use: "PT teachers and race days" },
    "house-flags-sashes": { type: "Event", material: "Satin", size: { v: { flag: "60 x 90 cm, on a pole", sash: "10 cm wide" } }, includes: "House name printed; four house colours", age: "All ages" },
    "sports-day-bibs": { type: "Event", material: "Polyester mesh", includes: "10 bibs, numbered 1 to 10", age: "All ages", use: { v: { red: "Red house", blue: "Blue house" } } },
    "balloons-pack": { type: "Event", size: "10 in", includes: "100 balloons, mixed colours", age: "All ages", use: "Annual day, birthdays, club functions" },

    // festive
    "haal-khata-lal-khata": { type: "Khata and panjika", material: "Red cloth cover", colour: "Red", pages: { v: { "200": "200", "400": "400" } }, binding: "Thread sewn", includes: "Swastik on the cover", occasion: "Poila Baisakh" },
    "bengali-panjika-1433": { type: "Khata and panjika", size: { v: { full: "Full edition", pocket: "Pocket edition" } }, language: "Bengali", includes: "Tithi, puja dates and auspicious times for 1433", occasion: "Poila Baisakh" },
    "hate-khori-set": { type: "Puja items", includes: "Slate, chalk, reed pen, small clay inkpot", pack: "Full set", occasion: "Hate khori" },
    "saraswati-puja-decoration-kit": { type: "Puja items", colour: "White and yellow", includes: "About 40 pieces: shola flowers, paper chain, small banner, marigold strings", pack: "School kit", occasion: "Saraswati Puja" },
    "alpana-stencils-colour": { type: "Puja items", includes: "6 alpana stencils, 4 tubs of ready colour", pack: "Set", occasion: "Lakshmi Puja" },
    "kites-bundle": { type: "Kites", material: "Paper", colour: "Mixed", size: "Medium", pack: "10 kites", occasion: "Vishwakarma Puja" },
    "manja-reel": { type: "Kites", material: "Cotton thread, not glass coated", colour: "Coloured", size: "500 m", includes: "Wooden lattai", occasion: "Vishwakarma Puja" },
    "rakhi-wholesale-pack": { type: "Rakhi", material: "Thread", pack: "12 rakhis, mixed designs", occasion: "Rakhi" },
    "holi-gulal-pack": { type: "Colours", material: "Herbal gulal, skin friendly", colour: "5 colours", pack: "5 x 100 g", occasion: "Holi" },
    "clay-diyas-kali-puja": { type: "Diyas", material: "Clay, fired hard", colour: { v: { plain: "Plain", painted: "Painted" } }, size: "2.5 in", pack: "25 diyas", occasion: "Kali Puja and Diwali" }
  };
  window.KK_SPECS = { FIELDS: FIELDS, CATS: CATS, P: P };
})();
