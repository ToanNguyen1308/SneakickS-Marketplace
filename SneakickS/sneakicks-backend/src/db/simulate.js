/**
 * Bo mo phong hanh vi nguoi dung theo persona — GR2 lan 3.
 *
 * Sinh ~1.500 user ao trai deu 120 ngay, moi user thuoc 1 persona (personas.js).
 * Moi phien: (tim kiem) -> xem chuoi san pham (dwell time) -> co the theo doi / dat Bid /
 * mua / dat Ask. Ghi vao dung cac bang that: users, user_events, follows, bids, asks,
 * transactions — nen he goi y doc du lieu mo phong y het du lieu that.
 *
 * San pham id 1..10 (demo GR1) khong bi them lenh/giao dich de giu nguyen
 * so lenh va bieu do gia cua kich ban kiem thu GR1.
 *
 * Chay sau `npm run db:migrate`:  npm run db:simulate
 * Chay lai se xoa user ao cu (email @sim.sneakicks.local) roi sinh lai, ket qua tat dinh.
 */
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import { query, closePool } from "../config/db.js";
import {
  PERSONAS, STYLE_WORDS, HYPE_SILHOUETTES, SHOE_SIZES, APPAREL_SIZES,
} from "./personas.js";

dotenv.config();

const N_USERS = Number(process.env.SIM_USERS) || 1500;
const DAYS = 120;
const SEED = 20261102;
const SIM_DOMAIN = "sim.sneakicks.local";
const SIM_PASSWORD = "sim12345";
const PROTECTED_MAX_ID = 10;
const OPEN_ORDER_DAYS = 21;
const DAY_MS = 86400000;
const BATCH = 1000;

const log = (msg) => console.log(`[simulate] ${msg}`);

// ---------------------------------------------------------------- RNG
const mulberry32 = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rand = mulberry32(SEED);
const uniform = (a, b) => a + rand() * (b - a);
const randint = (a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const normal = () => {
  let u = 0;
  while (!u) u = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
};
/** So lan that bai truoc lan thanh cong — trung binh = mean. */
const geometric = (mean) => Math.floor(Math.log(1 - rand()) / Math.log(1 - 1 / (mean + 1)));
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const money = (x) => Math.round(x * 100) / 100;

const weightedPick = (indices, weights) => {
  let total = 0;
  for (const i of indices) total += weights[i];
  if (total <= 0) return pick(indices);
  let r = rand() * total;
  for (const i of indices) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return indices[indices.length - 1];
};

// ---------------------------------------------------------------- DB helpers
const insertRows = async (table, cols, rows, { returning = false } = {}) => {
  const ids = [];
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const values = [];
    const tuples = chunk.map((row, r) => {
      cols.forEach((c) => values.push(row[c] ?? null));
      return `(${cols.map((_, c) => `$${r * cols.length + c + 1}`).join(", ")})`;
    });
    const res = await query(
      `INSERT INTO ${table} (${cols.join(", ")}) VALUES ${tuples.join(", ")}` +
        (returning ? " RETURNING id" : ""),
      values
    );
    if (returning) ids.push(...res.rows.map((x) => x.id));
  }
  return ids;
};

// ---------------------------------------------------------------- catalog model
const loadItems = async () => {
  const { rows } = await query(
    `SELECT id, name, brand, category_id, silhouette, gender, size_type, retail_price, tags
       FROM products ORDER BY id`
  );
  return rows.map((p) => {
    const tags = (p.tags || "").toLowerCase().split(/\s+/);
    const pop = Math.exp(0.7 * normal()) * (HYPE_SILHOUETTES[p.silhouette] || 1);
    const premium = clamp(Math.exp(0.05 + 0.2 * normal()) * (0.85 + 0.25 * Math.log(1 + pop)), 0.7, 3.5);
    const retail = Number(p.retail_price) || 100;
    return {
      id: p.id,
      name: p.name.toLowerCase(),
      brand: p.brand,
      cat: p.category_id,
      silhouette: p.silhouette,
      gender: p.gender,
      style: STYLE_WORDS.find((s) => tags.includes(s)) || null,
      sizes: p.size_type === "shoe" ? SHOE_SIZES : p.size_type === "apparel" ? APPAREL_SIZES : ["OS"],
      sizeType: p.size_type,
      pop,
      market: money(retail * premium),
      dropDay: null,
    };
  });
};

/** San pham "drop" moi: do hot tang vot quanh ngay ra mat roi giam dan (cho Trending khac Popular). */
const assignDrops = (items) => {
  const ranked = [...items].sort((a, b) => b.pop - a.pop).slice(0, Math.floor(items.length / 2));
  for (let k = 0; k < 18; k += 1) {
    const it = pick(ranked);
    if (it.dropDay === null) it.dropDay = uniform(DAYS - 60, DAYS - 3);
  }
};

const hypeAt = (it, day) => {
  if (it.dropDay === null) return 1;
  if (day < it.dropDay) return day > it.dropDay - 7 ? 1.5 : 0.7;
  return 1 + 4 * Math.exp(-(day - it.dropDay) / 10);
};

// ---------------------------------------------------------------- users
const buildUsers = () => {
  const users = [];
  const keys = Object.keys(PERSONAS);
  keys.forEach((key) => {
    const n = Math.round(PERSONAS[key].share * N_USERS);
    for (let k = 1; k <= n; k += 1) {
      const P = PERSONAS[key];
      const handle = `sim_${key}_${String(k).padStart(4, "0")}`;
      users.push({
        persona: key,
        username: handle,
        email: `${handle}@${SIM_DOMAIN}`,
        female: rand() < (key === "jordan" || key === "reseller" ? 0.15 : 0.3),
        joinDay: uniform(0, DAYS - 7),
        sessions: Math.min(60, 1 + geometric(Math.exp(Math.log(5) + 0.8 * normal()))),
        budgetMax: uniform(P.budget[0] * 1.3, P.budget[1]),
        shoe: SHOE_SIZES[clamp(Math.round(4 + 1.6 * normal()), 0, SHOE_SIZES.length - 1)],
        apparel: pick(APPAREL_SIZES),
        brandNoise: new Map(),
      });
    }
  });
  return users;
};

const affinity = (u, items) => {
  const P = PERSONAS[u.persona];
  return items.map((it) => {
    if (!u.brandNoise.has(it.brand)) u.brandNoise.set(it.brand, Math.exp(0.35 * normal()));
    let a = (P.brands[it.brand] ?? 0.25) * u.brandNoise.get(it.brand);
    a *= it.style ? P.styles[it.style] ?? 1 : 1;
    a *= P.cats[it.cat] ?? 0.2;
    a *= it.market <= u.budgetMax ? 1 : Math.exp(-(it.market - u.budgetMax) / (0.35 * u.budgetMax));
    if (P.cheap) a *= Math.pow(80 / Math.max(it.market, 40), 0.7);
    if (it.gender === "women") a *= u.female ? 2.5 : 0.3;
    else if (it.gender === "men" && u.female) a *= 0.6;
    return a * Math.pow(it.pop, 0.5 * P.hype);
  });
};

const sizeFor = (u, it) => (it.sizeType === "shoe" ? u.shoe : it.sizeType === "apparel" ? u.apparel : "OS");

// ---------------------------------------------------------------- simulation
const simulate = (users, items) => {
  const now = Date.now();
  const start = now - DAYS * DAY_MS;
  const at = (day) => new Date(Math.min(now - 60000, start + day * DAY_MS));

  const bySilhouette = new Map();
  items.forEach((it, i) => {
    if (!bySilhouette.has(it.silhouette)) bySilhouette.set(it.silhouette, []);
    bySilhouette.get(it.silhouette).push(i);
  });
  const resellers = users.filter((u) => u.persona === "reseller");
  const otherThan = (pool, u) => {
    let x = pick(pool);
    while (x === u) x = pick(pool);
    return x;
  };
  const allIdx = items.map((_, i) => i);

  const events = [];
  const follows = [];
  const bids = [];
  const asks = [];
  const trades = [];

  for (const u of users) {
    const P = PERSONAS[u.persona];
    const aff = affinity(u, items);
    const aMax = Math.max(...aff);
    const followed = new Set();

    for (let s = 0; s < u.sessions; s += 1) {
      let day = u.joinDay + (DAYS - u.joinDay) * Math.pow(rand(), 0.8);
      const sessionId = `sim-${u.username}-${s}`;
      const w = aff.map((a, i) => a * Math.pow(hypeAt(items[i], day), P.hype));
      const views = 1 + geometric(3.5);

      let searchHits = null;
      if (rand() < 0.25) {
        const q = pick(P.queries);
        events.push({ user: u, session_id: sessionId, event_type: "search", query: q, created_at: at(day) });
        const tokens = q.split(" ");
        searchHits = allIdx.filter((i) => tokens.every((t) => items[i].name.includes(t)));
        day += uniform(4, 12) / 86400;
      }

      let current = null;
      for (let v = 0; v < views; v += 1) {
        let i;
        if (v === 0 && searchHits?.length) i = weightedPick(searchHits, w);
        else if (current !== null && rand() < 0.45) {
          const sib = bySilhouette.get(items[current].silhouette).filter((x) => x !== current);
          i = sib.length ? weightedPick(sib, w) : weightedPick(allIdx, w);
        } else if (rand() < 0.08) i = randint(0, items.length - 1);
        else i = weightedPick(allIdx, w);
        current = i;

        const it = items[i];
        const fit = aff[i] / aMax;
        let dwell = Math.round(Math.exp(Math.log(11000) + 0.85 * normal() + 0.5 * Math.log(fit + 0.1)));
        if (rand() < 0.07) dwell = randint(600, 2900);
        dwell = clamp(dwell, 500, 600000);
        day += dwell / DAY_MS;
        events.push({
          user: u, session_id: sessionId, product: it, event_type: "view", dwell_ms: dwell,
          source: v === 0 && searchHits?.length ? "search" : "browse", created_at: at(day),
        });

        const strength = Math.sqrt(fit) * (dwell >= 3000 ? 1 : 0.2);
        const tradable = it.id > PROTECTED_MAX_ID;
        const open = day > DAYS - OPEN_ORDER_DAYS;

        if (!followed.has(i) && rand() < P.p.follow * strength) {
          followed.add(i);
          follows.push({ user: u, product: it, created_at: at(day) });
        }
        if (tradable && rand() < P.p.bid * strength) {
          const matched = !open && rand() < 0.45;
          const price = open ? it.market * uniform(0.75, 0.95)
            : matched ? it.market * uniform(0.92, 1.0) : it.market * uniform(0.7, 0.92);
          const bid = {
            user: u, product: it, size: sizeFor(u, it), price: money(price),
            status: open ? "active" : matched ? "matched" : "cancelled", created_at: at(day),
          };
          bids.push(bid);
          if (matched) {
            trades.push({ buyer: u, seller: otherThan(resellers, u), product: it, size: bid.size,
              price: bid.price, bid, created_at: at(day + uniform(0.1, 5)) });
          }
        }
        if (tradable && rand() < P.p.buy * strength * (it.market <= u.budgetMax * 1.1 ? 1 : 0.3)) {
          trades.push({ buyer: u, seller: otherThan(resellers, u), product: it, size: sizeFor(u, it),
            price: money(it.market * uniform(0.97, 1.08)), created_at: at(day) });
        }
        if (tradable && rand() < P.p.ask * strength) {
          const matched = !open && rand() < 0.5;
          const size = pick(it.sizes);
          const price = open ? it.market * uniform(1.03, 1.3) : it.market * uniform(1.0, 1.1);
          const ask = {
            user: u, product: it, size, price: money(price),
            status: open ? "active" : matched ? "matched" : "cancelled", created_at: at(day),
          };
          asks.push(ask);
          if (matched) {
            trades.push({ buyer: otherThan(users, u), seller: u, product: it, size, price: ask.price,
              ask, created_at: at(day + uniform(0.1, 5)) });
          }
        }
        day += uniform(2, 15) / 86400;
      }
    }
  }

  // Hang ton cua reseller: phan lon san pham co it nhat 1 Ask dang mo (trang Browse co gia).
  for (const it of items) {
    if (it.id <= PROTECTED_MAX_ID || rand() > 0.85) continue;
    const k = randint(1, 4);
    for (let j = 0; j < k; j += 1) {
      asks.push({
        user: pick(resellers), product: it, size: pick(it.sizes),
        price: money(it.market * uniform(1.03, 1.35)), status: "active",
        created_at: at(DAYS - uniform(0.2, OPEN_ORDER_DAYS)),
      });
    }
  }

  return { events, follows, bids, asks, trades };
};

// ---------------------------------------------------------------- main
const main = async () => {
  try {
    const del = await query(`DELETE FROM users WHERE email LIKE $1`, [`%@${SIM_DOMAIN}`]);
    if (del.rowCount) log(`Removed ${del.rowCount} previous simulated users.`);

    const items = await loadItems();
    if (items.length < 50) throw new Error("Catalog too small — run `npm run db:migrate` first.");
    assignDrops(items);

    const users = buildUsers();
    const hash = await bcrypt.hash(SIM_PASSWORD, 10);
    const now = Date.now();
    const userIds = await insertRows(
      "users",
      ["username", "email", "password_hash", "role", "created_at"],
      users.map((u) => ({
        username: u.username, email: u.email, password_hash: hash, role: "user",
        created_at: new Date(now - (DAYS - u.joinDay) * DAY_MS),
      })),
      { returning: true }
    );
    users.forEach((u, k) => { u.id = userIds[k]; });
    log(`Inserted ${users.length} simulated users.`);

    const { events, follows, bids, asks, trades } = simulate(users, items);

    await insertRows(
      "user_events",
      ["user_id", "session_id", "product_id", "event_type", "query", "dwell_ms", "source", "created_at"],
      events.map((e) => ({
        user_id: e.user.id, session_id: e.session_id, product_id: e.product?.id, event_type: e.event_type,
        query: e.query, dwell_ms: e.dwell_ms, source: e.source, created_at: e.created_at,
      }))
    );
    await insertRows(
      "follows",
      ["user_id", "product_id", "created_at"],
      follows.map((f) => ({ user_id: f.user.id, product_id: f.product.id, created_at: f.created_at }))
    );
    const bidIds = await insertRows(
      "bids",
      ["buyer_id", "product_id", "size", "price", "status", "created_at"],
      bids.map((b) => ({ buyer_id: b.user.id, product_id: b.product.id, size: b.size, price: b.price,
        status: b.status, created_at: b.created_at })),
      { returning: true }
    );
    bids.forEach((b, k) => { b.id = bidIds[k]; });
    const askIds = await insertRows(
      "asks",
      ["seller_id", "product_id", "size", "price", "status", "created_at"],
      asks.map((a) => ({ seller_id: a.user.id, product_id: a.product.id, size: a.size, price: a.price,
        status: a.status, created_at: a.created_at })),
      { returning: true }
    );
    asks.forEach((a, k) => { a.id = askIds[k]; });
    const nowDate = new Date(now - 60000);
    await insertRows(
      "transactions",
      ["ask_id", "bid_id", "buyer_id", "seller_id", "product_id", "size", "price", "status",
        "created_at", "updated_at"],
      trades.map((t) => {
        const created = t.created_at > nowDate ? nowDate : t.created_at;
        return {
          ask_id: t.ask?.id, bid_id: t.bid?.id, buyer_id: t.buyer.id, seller_id: t.seller.id,
          product_id: t.product.id, size: t.size, price: t.price, status: "completed",
          created_at: created, updated_at: created,
        };
      })
    );

    const perPersona = {};
    for (const e of events) {
      if (e.event_type !== "view") continue;
      perPersona[e.user.persona] = (perPersona[e.user.persona] || 0) + 1;
    }
    log(`user_events: ${events.length} (views by persona: ${JSON.stringify(perPersona)})`);
    log(`follows: ${follows.length}, bids: ${bids.length}, asks: ${asks.length}, transactions: ${trades.length}`);
    log(`Done. Simulated users log in with password "${SIM_PASSWORD}".`);
  } catch (err) {
    console.error("[simulate] ERROR:", err.message);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
};

main();
