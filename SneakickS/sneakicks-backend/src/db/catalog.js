/**
 * Catalog generator (GR2).
 *
 * Sinh ~340 san pham co thuoc tinh day du (brand, silhouette, colorway, mau, gioi tinh,
 * nam phat hanh, gia retail, mo ta, tags) tu danh sach dong san pham & phoi mau co that
 * tren thi truong. Ket qua la tat dinh (seed co dinh) de moi lan migrate cho cung ID.
 *
 * 10 san pham dau giu nguyen thu tu cua GR1 (seed bids/asks/transactions tham chieu id 1..10).
 */

const CATEGORY = { Sneakers: 1, Apparel: 2, Accessories: 3, Collectibles: 4 };

const mulberry32 = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const PALETTE = {
  "Chicago": ["#c8102e", "#ffffff", "#111111"],
  "Bred": ["#111111", "#c8102e", "#ffffff"],
  "Panda": ["#ffffff", "#111111", "#111111"],
  "Royal": ["#1d4ed8", "#111111", "#ffffff"],
  "University Blue": ["#7bafd4", "#ffffff", "#111111"],
  "Shadow": ["#6b7280", "#111111", "#ffffff"],
  "Pine Green": ["#14532d", "#ffffff", "#111111"],
  "Mocha": ["#7c4a2d", "#f5f0e6", "#111111"],
  "Triple White": ["#ffffff", "#f1f5f9", "#e2e8f0"],
  "Triple Black": ["#111111", "#1f2937", "#374151"],
  "Sail": ["#f5f0e1", "#e7dcc3", "#7c6f57"],
  "Grey Fog": ["#d1d5db", "#ffffff", "#9ca3af"],
  "Medium Olive": ["#6b7f3a", "#f5f0e1", "#111111"],
  "Court Purple": ["#6d28d9", "#ffffff", "#111111"],
  "Military Black": ["#ffffff", "#111111", "#9ca3af"],
  "White Cement": ["#ffffff", "#9ca3af", "#c8102e"],
  "Lakers": ["#552583", "#fdb927", "#ffffff"],
  "Sea Salt": ["#f1efe7", "#d6d3c4", "#a8a29e"],
  "Rain Cloud": ["#9ca3af", "#d1d5db", "#6b7280"],
  "Onyx": ["#1f2937", "#111111", "#374151"],
  "Zebra": ["#ffffff", "#111111", "#c8102e"],
  "Bone": ["#e7e2d3", "#d6cfba", "#a39e8b"],
  "Wheat": ["#d4a35a", "#7c4a2d", "#f5f0e6"],
  "Volt": ["#d9f99d", "#111111", "#a3e635"],
  "Infrared": ["#ffffff", "#ef4444", "#111111"],
  "Sunset": ["#f97316", "#fde68a", "#ffffff"],
  "Lilac": ["#c4b5fd", "#ffffff", "#a78bfa"],
  "Navy": ["#1e3a8a", "#ffffff", "#111111"],
  "Black Cat": ["#111111", "#111111", "#4b5563"],
  "Fire Red": ["#ffffff", "#dc2626", "#111111"],
  "Green Glow": ["#bbf7d0", "#ffffff", "#22c55e"],
  "Pink Foam": ["#fbcfe8", "#ffffff", "#f472b6"],
  "Cream": ["#fef3c7", "#fde68a", "#78716c"],
  "Desert Sand": ["#d6c3a1", "#b49a6f", "#7c6f57"],
  "Mint": ["#a7f3d0", "#ffffff", "#10b981"],
  "Orange Blaze": ["#fb923c", "#ffffff", "#111111"],
  "Smoke Grey": ["#9ca3af", "#ffffff", "#4b5563"],
  "Blue Tint": ["#bfdbfe", "#ffffff", "#3b82f6"],
  "Burgundy Crush": ["#7f1d1d", "#ffffff", "#111111"],
  "Olive": ["#4d5b2a", "#a3a380", "#111111"],
  "Reverse Grinch": ["#ef4444", "#22c55e", "#111111"],
  "Black": ["#111111", "#1f2937", "#ffffff"],
  "White": ["#ffffff", "#f1f5f9", "#111111"],
  "Heather Grey": ["#9ca3af", "#d1d5db", "#111111"],
  "Dark Oatmeal": ["#a8957a", "#c8b89a", "#111111"],
  "Red": ["#dc2626", "#ffffff", "#111111"],
  "Pink": ["#f9a8d4", "#ffffff", "#111111"],
  "Woodland Camo": ["#4d7c0f", "#78350f", "#111111"],
  "Blue": ["#2563eb", "#ffffff", "#111111"],
};

const SNEAKER_MODELS = [
  { brand: "Jordan", silhouette: "Air Jordan 1 Retro High OG", display: "Air Jordan 1 Retro High OG", retail: 180, years: [2016, 2026], style: "basketball", code: "DZ",
    colorways: ["Chicago", "Bred", "Royal", "University Blue", "Shadow", "Pine Green", "Mocha", "Court Purple", "Black Cat", "Triple White", "Lilac", "Sail"], women: ["Lilac", "Sail"] },
  { brand: "Jordan", silhouette: "Air Jordan 1 Low", display: "Air Jordan 1 Low", retail: 120, years: [2018, 2026], style: "basketball", code: "553",
    colorways: ["Panda", "Bred", "Mocha", "Shadow", "University Blue", "Triple White", "Pink Foam", "Wheat", "Mint", "Court Purple"], women: ["Pink Foam", "Mint"] },
  { brand: "Jordan", silhouette: "Air Jordan 3 Retro", display: "Air Jordan 3 Retro", retail: 210, years: [2017, 2026], style: "basketball", code: "CT",
    colorways: ["White Cement", "Black Cat", "Fire Red", "Wheat", "Desert Sand", "Pine Green", "Lilac", "Sail"], women: ["Lilac"] },
  { brand: "Jordan", silhouette: "Air Jordan 4 Retro", display: "Air Jordan 4 Retro", retail: 215, years: [2017, 2026], style: "basketball", code: "DH",
    colorways: ["Military Black", "Bred", "Fire Red", "Black Cat", "Sail", "Infrared", "Pine Green", "University Blue", "White Cement", "Desert Sand", "Triple White"], women: ["Sail"] },
  { brand: "Jordan", silhouette: "Air Jordan 5 Retro", display: "Air Jordan 5 Retro", retail: 210, years: [2018, 2026], style: "basketball", code: "DD",
    colorways: ["Fire Red", "Black Cat", "Infrared", "Volt", "Olive", "Navy", "Triple White"], women: [] },
  { brand: "Jordan", silhouette: "Air Jordan 6 Retro", display: "Air Jordan 6 Retro", retail: 200, years: [2019, 2026], style: "basketball", code: "CT85",
    colorways: ["Infrared", "Black Cat", "Olive", "Smoke Grey", "Navy", "Triple White"], women: [] },
  { brand: "Jordan", silhouette: "Air Jordan 11 Retro", display: "Air Jordan 11 Retro", retail: 230, years: [2016, 2026], style: "basketball", code: "CT8",
    colorways: ["Bred", "Smoke Grey", "Navy", "Triple White", "Triple Black", "Court Purple"], women: [] },
  { brand: "Nike", silhouette: "Dunk Low", display: "Nike Dunk Low Retro", retail: 115, years: [2020, 2026], style: "lifestyle", code: "DD1",
    colorways: ["Panda", "Grey Fog", "University Blue", "Medium Olive", "Court Purple", "Pink Foam", "Mint", "Sail", "Royal", "Bone", "Navy", "Orange Blaze", "Lilac", "Black Cat"], women: ["Pink Foam", "Lilac", "Mint"] },
  { brand: "Nike", silhouette: "Dunk High", display: "Nike Dunk High Retro", retail: 125, years: [2020, 2026], style: "lifestyle", code: "DD3",
    colorways: ["Panda", "Pine Green", "Royal", "Shadow", "Volt", "Triple White"], women: [] },
  { brand: "Nike", silhouette: "SB Dunk Low", display: "Nike SB Dunk Low Pro", retail: 125, years: [2019, 2026], style: "skate", code: "BQ6",
    colorways: ["Sunset", "Wheat", "Bone", "Pink Foam", "Court Purple", "Blue Tint", "Orange Blaze", "Desert Sand"], women: [] },
  { brand: "Nike", silhouette: "Air Force 1 Low", display: "Nike Air Force 1 Low '07", retail: 115, years: [2016, 2026], style: "lifestyle", code: "CW2",
    colorways: ["Triple White", "Triple Black", "Sail", "Wheat", "Royal", "Fire Red", "Lilac", "Bone"], women: ["Lilac", "Sail"] },
  { brand: "Nike", silhouette: "Air Max 1", display: "Nike Air Max 1", retail: 150, years: [2017, 2026], style: "running", code: "FD9",
    colorways: ["Infrared", "Royal", "Sail", "Volt", "Smoke Grey", "Burgundy Crush"], women: ["Sail"] },
  { brand: "Nike", silhouette: "Air Max 90", display: "Nike Air Max 90", retail: 140, years: [2017, 2026], style: "running", code: "CN8",
    colorways: ["Infrared", "Triple Black", "Triple White", "Volt", "Smoke Grey", "Pink Foam"], women: ["Pink Foam"] },
  { brand: "Nike", silhouette: "Air Max Plus", display: "Nike Air Max Plus", retail: 185, years: [2018, 2026], style: "running", code: "604",
    colorways: ["Sunset", "Triple Black", "Volt", "Blue Tint", "Triple White", "Fire Red"], women: [] },
  { brand: "Nike", silhouette: "Kobe 6 Protro", display: "Nike Kobe 6 Protro", retail: 190, years: [2020, 2026], style: "basketball", code: "CW2190",
    colorways: ["Bred", "Triple White", "Volt", "Court Purple", "Lakers"], women: [] },
  { brand: "Nike", silhouette: "Zoom Vomero 5", display: "Nike Zoom Vomero 5", retail: 160, years: [2022, 2026], style: "running", code: "HF1",
    colorways: ["Smoke Grey", "Sail", "Triple Black", "Blue Tint", "Pink Foam", "Desert Sand"], women: ["Pink Foam"] },
  { brand: "Nike", silhouette: "Cortez", display: "Nike Cortez", retail: 90, years: [2019, 2026], style: "lifestyle", code: "DM4",
    colorways: ["Fire Red", "Sail", "Triple Black", "Navy", "Pink Foam"], women: ["Pink Foam"] },
  { brand: "Nike", silhouette: "P-6000", display: "Nike P-6000", retail: 115, years: [2021, 2026], style: "running", code: "CD6",
    colorways: ["Smoke Grey", "Sail", "Triple Black", "Desert Sand", "Mint"], women: [] },
  { brand: "Adidas", silhouette: "Yeezy Boost 350 V2", display: "adidas Yeezy Boost 350 V2", retail: 230, years: [2016, 2023], style: "lifestyle", code: "HQ",
    colorways: ["Zebra", "Onyx", "Bone", "Triple White", "Triple Black", "Desert Sand", "Mint", "Sea Salt"], women: [] },
  { brand: "Adidas", silhouette: "Yeezy Slide", display: "adidas Yeezy Slide", retail: 70, years: [2019, 2023], style: "slide", code: "GW",
    colorways: ["Bone", "Desert Sand", "Triple Black", "Sea Salt", "Pink Foam"], women: [] },
  { brand: "Adidas", silhouette: "Samba OG", display: "adidas Samba OG", retail: 100, years: [2021, 2026], style: "terrace", code: "B75",
    colorways: ["Triple White", "Triple Black", "Navy", "Fire Red", "Mint", "Pink Foam", "Wheat"], women: ["Pink Foam"] },
  { brand: "Adidas", silhouette: "Gazelle Indoor", display: "adidas Gazelle Indoor", retail: 120, years: [2022, 2026], style: "terrace", code: "IG",
    colorways: ["Blue Tint", "Fire Red", "Medium Olive", "Pink Foam", "Burgundy Crush"], women: ["Pink Foam"] },
  { brand: "Adidas", silhouette: "Campus 00s", display: "adidas Campus 00s", retail: 110, years: [2023, 2026], style: "skate", code: "HQ8",
    colorways: ["Triple Black", "Smoke Grey", "Mint", "Navy", "Lilac"], women: ["Lilac"] },
  { brand: "Adidas", silhouette: "Handball Spezial", display: "adidas Handball Spezial", retail: 110, years: [2022, 2026], style: "terrace", code: "DB3",
    colorways: ["Navy", "Wheat", "Mint", "Fire Red", "Lilac", "Medium Olive"], women: ["Lilac"] },
  { brand: "Adidas", silhouette: "Superstar", display: "adidas Superstar", retail: 100, years: [2017, 2026], style: "lifestyle", code: "EG4",
    colorways: ["Triple White", "Triple Black", "Zebra", "Navy", "Sail"], women: [] },
  { brand: "New Balance", silhouette: "550", display: "New Balance 550", retail: 110, years: [2020, 2026], style: "lifestyle", code: "BB550",
    colorways: ["Pine Green", "Navy", "Sea Salt", "Burgundy Crush", "University Blue", "Grey Fog"], women: [] },
  { brand: "New Balance", silhouette: "530", display: "New Balance 530", retail: 100, years: [2021, 2026], style: "running", code: "MR530",
    colorways: ["Triple White", "Smoke Grey", "Navy", "Sea Salt", "Pink Foam", "Desert Sand"], women: ["Pink Foam"] },
  { brand: "New Balance", silhouette: "574", display: "New Balance 574", retail: 90, years: [2017, 2026], style: "lifestyle", code: "ML574",
    colorways: ["Smoke Grey", "Navy", "Burgundy Crush", "Medium Olive", "Cream"], women: [] },
  { brand: "New Balance", silhouette: "990v6", display: "New Balance 990v6", retail: 200, years: [2022, 2026], style: "running", code: "M990",
    colorways: ["Smoke Grey", "Navy", "Triple Black", "Sea Salt"], women: [] },
  { brand: "New Balance", silhouette: "2002R", display: "New Balance 2002R", retail: 150, years: [2020, 2026], style: "running", code: "M2002",
    colorways: ["Rain Cloud", "Sea Salt", "Navy", "Desert Sand", "Medium Olive"], women: [] },
  { brand: "New Balance", silhouette: "9060", display: "New Balance 9060", retail: 150, years: [2022, 2026], style: "running", code: "U9060",
    colorways: ["Sea Salt", "Triple Black", "Blue Tint", "Mint", "Pink Foam"], women: ["Pink Foam"] },
  { brand: "New Balance", silhouette: "1906R", display: "New Balance 1906R", retail: 160, years: [2022, 2026], style: "running", code: "M1906",
    colorways: ["Smoke Grey", "Triple White", "Desert Sand", "Navy"], women: [] },
  { brand: "ASICS", silhouette: "Gel-Kayano 14", display: "ASICS Gel-Kayano 14", retail: 150, years: [2021, 2026], style: "running", code: "1201A",
    colorways: ["Smoke Grey", "Cream", "Triple Black", "Blue Tint", "Pink Foam"], women: ["Pink Foam"] },
  { brand: "ASICS", silhouette: "Gel-1130", display: "ASICS Gel-1130", retail: 110, years: [2022, 2026], style: "running", code: "1201B",
    colorways: ["Triple White", "Smoke Grey", "Cream", "Mint"], women: [] },
  { brand: "ASICS", silhouette: "Gel-NYC", display: "ASICS Gel-NYC", retail: 140, years: [2023, 2026], style: "running", code: "1203A",
    colorways: ["Cream", "Smoke Grey", "Triple Black", "Desert Sand", "Blue Tint"], women: [] },
  { brand: "Onitsuka Tiger", silhouette: "Mexico 66", display: "Onitsuka Tiger Mexico 66", retail: 110, years: [2018, 2026], style: "lifestyle", code: "1183A",
    colorways: ["Wheat", "Triple Black", "Sail", "Fire Red", "Mint"], women: [] },
  { brand: "Salomon", silhouette: "XT-6", display: "Salomon XT-6", retail: 200, years: [2019, 2026], style: "trail", code: "L41",
    colorways: ["Triple Black", "Desert Sand", "Medium Olive", "Smoke Grey"], women: [] },
  { brand: "Converse", silhouette: "Chuck 70 Hi", display: "Converse Chuck 70 Hi", retail: 90, years: [2017, 2026], style: "lifestyle", code: "162",
    colorways: ["Triple Black", "Sail", "Fire Red", "Navy", "Volt"], women: [] },
  { brand: "Puma", silhouette: "Speedcat OG", display: "Puma Speedcat OG", retail: 100, years: [2024, 2026], style: "motorsport", code: "398",
    colorways: ["Fire Red", "Triple Black", "Pink Foam", "Navy", "Sail"], women: ["Pink Foam"] },
  { brand: "Vans", silhouette: "Old Skool", display: "Vans Old Skool", retail: 70, years: [2016, 2026], style: "skate", code: "VN0A",
    colorways: ["Triple Black", "Navy", "Fire Red", "Medium Olive", "Cream"], women: [] },
];

const APPAREL_MODELS = [
  { brand: "Supreme", silhouette: "Box Logo Hooded Sweatshirt", retail: 168, years: [2016, 2026], colorways: ["Black", "Heather Grey", "Red", "Navy", "Olive"], tags: "streetwear hoodie box-logo" },
  { brand: "Supreme", silhouette: "Box Logo Tee", retail: 44, years: [2016, 2026], colorways: ["Black", "Red", "Navy"], tags: "streetwear tee box-logo" },
  { brand: "Fear of God", silhouette: "Essentials Hoodie", retail: 100, years: [2019, 2026], colorways: ["Black", "Heather Grey", "Cream", "Desert Sand"], tags: "essentials hoodie basics" },
  { brand: "Fear of God", silhouette: "Essentials Sweatpants", retail: 95, years: [2019, 2026], colorways: ["Black", "Dark Oatmeal", "Heather Grey", "Cream"], tags: "essentials sweatpants basics" },
  { brand: "Fear of God", silhouette: "Essentials Tee", retail: 50, years: [2019, 2026], colorways: ["Black", "White", "Dark Oatmeal"], tags: "essentials tee basics" },
  { brand: "BAPE", silhouette: "Shark Full Zip Hoodie", retail: 400, years: [2017, 2026], colorways: ["Woodland Camo", "Black", "Pink", "Blue"], tags: "streetwear hoodie shark camo" },
  { brand: "BAPE", silhouette: "1st Camo Ape Head Tee", retail: 120, years: [2017, 2026], colorways: ["Woodland Camo", "Pink", "Blue"], tags: "streetwear tee camo" },
  { brand: "Stussy", silhouette: "8 Ball Tee", retail: 50, years: [2019, 2026], colorways: ["Black", "White", "Pink"], tags: "streetwear tee 8-ball" },
  { brand: "Stussy", silhouette: "Basic Stussy Hoodie", retail: 120, years: [2019, 2026], colorways: ["Black", "Heather Grey", "Navy"], tags: "streetwear hoodie" },
  { brand: "Palace", silhouette: "Tri-Ferg Tee", retail: 60, years: [2018, 2026], colorways: ["Black", "White", "Red"], tags: "streetwear tee skate tri-ferg" },
  { brand: "Nike", silhouette: "Tech Fleece Full-Zip Hoodie", retail: 130, years: [2020, 2026], colorways: ["Black", "Heather Grey", "Olive", "Navy"], tags: "tech-fleece hoodie sportswear" },
  { brand: "Off-White", silhouette: "Arrows Tee", retail: 410, years: [2018, 2026], colorways: ["Black", "White"], tags: "luxury streetwear tee arrows" },
];

const ACCESSORY_MODELS = [
  { brand: "Casio", silhouette: "G-Shock GA-2100", retail: 99, years: [2019, 2026], colorways: ["Triple Black", "Triple White", "Navy", "Olive", "Volt"], tags: "watch casioak g-shock" },
  { brand: "New Era", silhouette: "59FIFTY Fitted Cap", retail: 40, years: [2016, 2026], colorways: ["Navy", "Black", "Red", "Royal"], tags: "cap hat fitted mlb" },
  { brand: "Supreme", silhouette: "Shoulder Bag", retail: 58, years: [2018, 2026], colorways: ["Black", "Red", "Woodland Camo"], tags: "bag shoulder-bag streetwear" },
  { brand: "Stanley", silhouette: "Quencher H2.0 40oz", retail: 45, years: [2022, 2026], colorways: ["Pink", "Cream", "Black", "Mint"], tags: "tumbler drinkware" },
  { brand: "Ray-Ban", silhouette: "Wayfarer Sunglasses", retail: 171, years: [2016, 2026], colorways: ["Black", "Smoke Grey"], tags: "sunglasses eyewear" },
  { brand: "Nike", silhouette: "Everyday Plus Crew Socks (3 Pack)", retail: 22, years: [2018, 2026], colorways: ["White", "Black"], tags: "socks basics" },
];

const COLLECTIBLE_MODELS = [
  { brand: "POP MART", silhouette: "Labubu The Monsters", retail: 28, years: [2023, 2026], colorways: ["Exciting Macaron", "Have a Seat", "Big into Energy", "Lazy Yoga"], tags: "blind-box labubu designer-toy", colors: ["#f9a8d4", "#fde68a", "#a7f3d0"] },
  { brand: "POP MART", silhouette: "Skullpanda", retail: 22, years: [2022, 2026], colorways: ["The Sound", "Warmth", "Image of Reality"], tags: "blind-box skullpanda designer-toy", colors: ["#c4b5fd", "#111111", "#ffffff"] },
  { brand: "POP MART", silhouette: "Crybaby", retail: 22, years: [2023, 2026], colorways: ["Crying Again", "Sad Club"], tags: "blind-box crybaby designer-toy", colors: ["#fbcfe8", "#bfdbfe", "#ffffff"] },
  { brand: "Medicom Toy", silhouette: "Bearbrick 400%", retail: 150, years: [2018, 2026], colorways: ["Chrome", "Andy Warhol", "Basquiat", "Kaws Companion"], tags: "bearbrick art-toy figure", colors: ["#9ca3af", "#fde68a", "#111111"] },
  { brand: "Pokemon", silhouette: "Trading Card", retail: 120, years: [2020, 2026], colorways: ["Pikachu VMAX", "Umbreon VMAX Alt Art", "Mew ex SAR", "Charizard ex SAR"], tags: "tcg trading-card graded", colors: ["#fde047", "#ef4444", "#1d4ed8"] },
  { brand: "LEGO", silhouette: "Icons Set", retail: 200, years: [2021, 2026], colorways: ["Botanical Bouquet", "Titanic", "Lamborghini Countach"], tags: "lego building-set collectible", colors: ["#facc15", "#dc2626", "#111111"] },
];

const MATERIALS = [
  "a premium leather upper",
  "tumbled leather overlays",
  "a suede and mesh upper",
  "a nubuck construction",
  "breathable engineered mesh",
  "a Primeknit upper",
  "a canvas upper",
];

const STYLE_PHRASE = {
  basketball: "returns with its classic basketball heritage",
  lifestyle: "is a lifestyle staple",
  skate: "brings skate-ready durability",
  running: "delivers retro running comfort",
  terrace: "carries its terrace-culture roots",
  slide: "offers a minimal foam silhouette",
  trail: "is built for trail and city",
  motorsport: "channels low-profile motorsport heritage",
};

const ORIGINAL_GR1 = [
  { name: "Air Jordan 4 Retro Lakers", brand: "Jordan", silhouette: "Air Jordan 4 Retro", colorway: "Lakers", category: "Sneakers", retail: 285, release: "2024-03-09", style: "basketball", gender: "men", description: "Lakers-inspired colorway of the Air Jordan 4 with purple suede and gold accents." },
  { name: "Yeezy Slide Onyx", brand: "Adidas", silhouette: "Yeezy Slide", colorway: "Onyx", category: "Sneakers", retail: 145, release: "2022-03-07", style: "slide", gender: "unisex", description: "Yeezy Slide in the Onyx colorway, a single-piece EVA foam slide." },
  { name: "Nike Kobe 6 Protro Reverse Grinch", brand: "Nike", silhouette: "Kobe 6 Protro", colorway: "Reverse Grinch", category: "Sneakers", retail: 620, release: "2023-12-15", style: "basketball", gender: "men", description: "Kobe 6 Protro Reverse Grinch edition with a red scaled upper and green accents." },
  { name: "Supreme Box Logo Tee White", brand: "Supreme", silhouette: "Box Logo Tee", colorway: "White", category: "Apparel", retail: 110, release: "2023-12-01", gender: "unisex", description: "Supreme Box Logo Tee in white cotton jersey.", tags: "streetwear tee box-logo" },
  { name: "Essentials Hoodie Dark Oatmeal", brand: "Fear of God", silhouette: "Essentials Hoodie", colorway: "Dark Oatmeal", category: "Apparel", retail: 150, release: "2023-09-15", gender: "unisex", description: "Fear of God Essentials Hoodie in Dark Oatmeal fleece.", tags: "essentials hoodie basics" },
  { name: "Casio G-Shock GA-2100", brand: "Casio", silhouette: "G-Shock GA-2100", colorway: "Triple Black", category: "Accessories", retail: 120, release: "2019-08-01", gender: "unisex", description: "CasiOak GA-2100 standard model with carbon core guard.", tags: "watch casioak g-shock" },
  { name: "New Era NY Yankees Cap", brand: "New Era", silhouette: "59FIFTY Fitted Cap", colorway: "Navy", category: "Accessories", retail: 40, release: "2020-04-01", gender: "unisex", description: "New Era 59FIFTY NY Yankees fitted cap.", tags: "cap hat fitted mlb" },
  { name: "POP MART Skullpanda The Warmth", brand: "POP MART", silhouette: "Skullpanda", colorway: "Warmth", category: "Collectibles", retail: 55, release: "2023-10-20", gender: "unisex", description: "Skullpanda The Warmth series blind box figure.", tags: "blind-box skullpanda designer-toy", colors: ["#fde68a", "#f97316", "#ffffff"] },
  { name: "Pokemon Charizard EX Card", brand: "Pokemon", silhouette: "Trading Card", colorway: "Charizard ex SAR", category: "Collectibles", retail: 320, release: "2023-08-11", gender: "unisex", description: "Charizard ex special art rare trading card.", tags: "tcg trading-card graded", colors: ["#f97316", "#111111", "#fde047"] },
  { name: "New Balance 9060 Rain Cloud", brand: "New Balance", silhouette: "9060", colorway: "Rain Cloud", category: "Sneakers", retail: 230, release: "2023-02-01", style: "running", gender: "unisex", description: "New Balance 9060 Rain Cloud with layered suede and mesh." },
];

const SIZE_TYPE_BY_CATEGORY = {
  Sneakers: "shoe",
  Apparel: "apparel",
  Accessories: "os",
  Collectibles: "os",
};

const colorsFor = (colorway, fallback) =>
  (PALETTE[colorway] || fallback || ["#e2e8f0", "#ffffff", "#111111"]).join(",");

export const buildCatalog = () => {
  const rand = mulberry32(20261005);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const between = (a, b) => a + Math.floor(rand() * (b - a + 1));
  const dateIn = ([y0, y1]) => {
    const y = between(y0, y1);
    const m = between(1, y === 2026 ? 9 : 12);
    const d = between(1, 28);
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };

  const products = [];
  const names = new Set();
  let skuSeq = 1000;
  const sku = (code) => `${code}-${String(skuSeq++).padStart(4, "0")}`;

  for (const p of ORIGINAL_GR1) {
    names.add(p.name);
    products.push({
      name: p.name,
      brand: p.brand,
      description: p.description,
      category_id: CATEGORY[p.category],
      release_date: p.release,
      retail_price: p.retail,
      sku: sku("GR1"),
      silhouette: p.silhouette,
      colorway: p.colorway,
      colors: colorsFor(p.colorway, p.colors),
      gender: p.gender,
      size_type: SIZE_TYPE_BY_CATEGORY[p.category],
      tags: [p.brand.toLowerCase(), p.style || "", p.tags || ""].join(" ").trim(),
    });
  }

  for (const m of SNEAKER_MODELS) {
    for (const cw of m.colorways) {
      const isWomen = m.women.includes(cw);
      const name = `${m.display}${isWomen ? " (W)" : ""} ${cw}`;
      if (names.has(name)) continue;
      names.add(name);
      products.push({
        name,
        brand: m.brand,
        description:
          `The ${m.silhouette} ${STYLE_PHRASE[m.style]} in the ${cw} colorway, ` +
          `featuring ${pick(MATERIALS)} and signature ${m.brand} details.`,
        category_id: CATEGORY.Sneakers,
        release_date: dateIn(m.years),
        retail_price: m.retail + pick([0, 0, 0, 10, 20, -10]),
        sku: sku(m.code),
        silhouette: m.silhouette,
        colorway: cw,
        colors: colorsFor(cw),
        gender: isWomen ? "women" : "men",
        size_type: "shoe",
        tags: `${m.brand.toLowerCase()} ${m.style} ${cw.toLowerCase()}`,
      });
    }
  }

  const addSimple = (models, category, sentence) => {
    for (const m of models) {
      for (const cw of m.colorways) {
        const name = `${m.brand} ${m.silhouette} ${cw}`;
        if (names.has(name)) continue;
        names.add(name);
        products.push({
          name,
          brand: m.brand,
          description: `${m.brand} ${m.silhouette} in ${cw}. ${sentence}`,
          category_id: CATEGORY[category],
          release_date: dateIn(m.years),
          retail_price: m.retail,
          sku: sku(m.brand.slice(0, 3).toUpperCase()),
          silhouette: m.silhouette,
          colorway: cw,
          colors: colorsFor(cw, m.colors),
          gender: "unisex",
          size_type: SIZE_TYPE_BY_CATEGORY[category],
          tags: `${m.brand.toLowerCase()} ${m.tags}`,
        });
      }
    }
  };

  addSimple(APPAREL_MODELS, "Apparel", "A streetwear essential with a relaxed fit and premium fabric.");
  addSimple(ACCESSORY_MODELS, "Accessories", "An everyday accessory favored by collectors.");
  addSimple(COLLECTIBLE_MODELS, "Collectibles", "A collectible piece sealed and authenticated.");

  return products;
};
