/**
 * Chan dung nguoi dung (persona) cho bo mo phong hanh vi — GR2 lan 3.
 *
 *   share    : ti le persona trong tong so user ao
 *   brands   : trong so uu tien theo thuong hieu (brand khong liet ke = 0.25)
 *   styles   : trong so theo phong cach giay (lay tu tags), mac dinh 1
 *   cats     : trong so theo danh muc (1 Sneakers, 2 Apparel, 3 Accessories, 4 Collectibles)
 *   budget   : [min, max] USD cho gia thi truong cua 1 san pham
 *   cheap    : true -> cang re cang thich (nguoi mua tiet kiem)
 *   hype     : he so khuech dai do "hot" cua san pham (reseller, dan suu tam)
 *   p        : xac suat chuyen doi tren moi luot xem (da nhan voi muc phu hop)
 *   queries  : tu khoa tim kiem dien hinh
 */
export const PERSONAS = {
  jordan: {
    label: "Jordan collector",
    share: 0.25,
    brands: { Jordan: 6, Nike: 1.5 },
    styles: { basketball: 2.5 },
    cats: { 1: 1, 2: 0.15, 3: 0.15, 4: 0.1 },
    budget: [180, 650],
    hype: 1.4,
    p: { follow: 0.12, bid: 0.06, buy: 0.03, ask: 0.004 },
    queries: ["jordan 1", "jordan 4", "jordan 11", "bred", "chicago", "retro high"],
  },
  budget: {
    label: "Budget buyer",
    share: 0.25,
    brands: { Nike: 2, Adidas: 2.5, Vans: 2.5, Converse: 2.5, "New Balance": 1.5, Puma: 2 },
    styles: { lifestyle: 2, skate: 2, terrace: 2 },
    cats: { 1: 1, 2: 0.3, 3: 0.3, 4: 0.1 },
    budget: [50, 150],
    cheap: true,
    hype: 0.6,
    p: { follow: 0.07, bid: 0.09, buy: 0.02, ask: 0.002 },
    queries: ["samba", "dunk low", "old skool", "chuck 70", "panda", "air force 1"],
  },
  runner: {
    label: "Runner / lifestyle",
    share: 0.2,
    brands: { "New Balance": 4, ASICS: 4, Salomon: 3, "Onitsuka Tiger": 2.5, Nike: 1.2 },
    styles: { running: 3.5, trail: 3 },
    cats: { 1: 1, 2: 0.2, 3: 0.3, 4: 0.05 },
    budget: [90, 260],
    hype: 0.8,
    p: { follow: 0.09, bid: 0.05, buy: 0.03, ask: 0.002 },
    queries: ["gel-kayano 14", "9060", "2002r", "vomero 5", "xt-6", "mexico 66"],
  },
  street: {
    label: "Streetwear & collectibles",
    share: 0.15,
    brands: {
      Supreme: 3, "Fear of God": 3, BAPE: 2.5, Stussy: 2.5, Palace: 2, "Off-White": 2,
      "POP MART": 3, Pokemon: 2, "Medicom Toy": 2, LEGO: 1.5, Casio: 1.5, "New Era": 1.5,
    },
    styles: {},
    cats: { 1: 0.25, 2: 3, 3: 2, 4: 2.5 },
    budget: [25, 450],
    hype: 1.1,
    p: { follow: 0.11, bid: 0.05, buy: 0.03, ask: 0.004 },
    queries: ["box logo", "essentials hoodie", "labubu", "bearbrick", "pokemon card", "g-shock"],
  },
  reseller: {
    label: "Reseller",
    share: 0.15,
    brands: { Jordan: 3, Nike: 2.5, Adidas: 1.5, Supreme: 1.5, "POP MART": 1.5 },
    styles: {},
    cats: { 1: 1, 2: 0.5, 3: 0.3, 4: 0.6 },
    budget: [80, 1000],
    hype: 2.2,
    p: { follow: 0.15, bid: 0.07, buy: 0.025, ask: 0.09 },
    queries: ["jordan 4", "kobe 6", "yeezy", "dunk low", "labubu", "travis"],
  },
};

export const STYLE_WORDS = [
  "basketball", "lifestyle", "skate", "running", "terrace", "slide", "trail", "motorsport",
];

/** Dong san pham "hot" lam diem xuat phat cho do pho bien (popularity prior). */
export const HYPE_SILHOUETTES = {
  "Air Jordan 1 Retro High OG": 2.2,
  "Air Jordan 4 Retro": 2.4,
  "Air Jordan 1 Low": 1.6,
  "Dunk Low": 2.0,
  "Samba OG": 1.8,
  "9060": 1.6,
  "Gel-Kayano 14": 1.5,
  "Kobe 6 Protro": 2.0,
  "Labubu The Monsters": 2.2,
  "Box Logo Hooded Sweatshirt": 1.6,
  "Yeezy Boost 350 V2": 1.4,
};

export const SHOE_SIZES = ["40", "40.5", "41", "42", "42.5", "43", "44", "44.5", "45"];
export const APPAREL_SIZES = ["S", "M", "L", "XL"];
