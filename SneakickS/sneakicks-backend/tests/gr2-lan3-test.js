/**
 * Kiem thu GR2 lan 3: du lieu mo phong persona + API goi y (co du phong).
 * Chay sau `npm run db:migrate && npm run db:simulate`, khi backend dang chay:
 *   node tests/gr2-lan3-test.js
 * Dich vu goi y Python bat hay tat deu phai PASS (source = recommender | fallback).
 */
import { query, closePool } from "../src/config/db.js";

const BASE = process.env.API_BASE || "http://localhost:3000";
let passed = 0;
let failed = 0;

const check = (name, cond, detail = "") => {
  if (cond) passed += 1;
  else failed += 1;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? `  -> ${detail}` : ""}`);
};

const api = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
};

const main = async () => {
  console.log("\n== 1. Du lieu mo phong ==");
  const { rows: [sim] } = await query(
    `SELECT COUNT(*)::int AS users,
            COUNT(DISTINCT split_part(username, '_', 2))::int AS personas
       FROM users WHERE email LIKE '%@sim.sneakicks.local'`
  );
  check("Co >= 1000 user ao thuoc 5 persona", sim.users >= 1000 && sim.personas === 5,
    `${sim.users} user, ${sim.personas} persona`);
  const { rows: [ev] } = await query(
    `SELECT COUNT(*)::int AS n,
            EXTRACT(DAY FROM MAX(created_at) - MIN(created_at))::int AS span
       FROM user_events WHERE session_id LIKE 'sim-%'`
  );
  check("Su kien mo phong trai >= 90 ngay", ev.n > 10000 && ev.span >= 90, `${ev.n} su kien, ${ev.span} ngay`);
  const { rows: [demo] } = await query(
    `SELECT COUNT(*)::int AS n FROM asks a JOIN users u ON u.id = a.seller_id
      WHERE a.product_id <= 10 AND u.email LIKE '%@sim.sneakicks.local'`
  );
  check("Khong them lenh mo phong vao 10 san pham demo GR1", demo.n === 0, `${demo.n} lenh`);

  console.log("\n== 2. API goi y ==");
  let r = await api("GET", "/api/recommendations/trending?limit=12");
  check("Trending tra 12 san pham kem rec_request_id",
    r.status === 200 && r.data.count === 12 && typeof r.data.rec_request_id === "string",
    `source=${r.data.source}, model=${r.data.model}`);
  check("Trending co du thong tin the san pham (Lowest Ask)",
    r.data.data?.every((p) => p.name && "lowestAsk" in p));

  r = await api("GET", "/api/recommendations/similar/12?limit=8");
  const base = (await api("GET", "/api/products/12")).data.data;
  check("Similar khong chua chinh san pham va co loi giai thich",
    r.status === 200 && r.data.count === 8 && r.data.data.every((p) => p.id !== 12 && p.reason),
    `source=${r.data.source}`);
  check("Similar dung dau la cung dong giay", r.data.data[0]?.silhouette === base.silhouette,
    `${base.silhouette} -> ${r.data.data[0]?.name} (${r.data.data[0]?.reason})`);
  r = await api("GET", "/api/recommendations/similar/999999");
  check("Similar san pham khong ton tai -> 404", r.status === 404);

  console.log("\n== 3. Recently Viewed + rec_click ==");
  const session = `lan3-${Date.now()}`;
  await api("POST", "/api/events", {
    session_id: session,
    events: [
      { type: "view", product_id: 20, dwell_ms: 5000, source: "browse" },
      { type: "view", product_id: 33, dwell_ms: 7000, source: "browse" },
    ],
  });
  r = await api("GET", `/api/recommendations/recently-viewed?session_id=${session}&limit=5`);
  check("Recently Viewed cua khach theo session (moi nhat truoc)",
    r.data.data?.map((p) => p.id).join(",") === "33,20", r.data.data?.map((p) => p.id).join(","));
  r = await api("GET", `/api/recommendations/recently-viewed?session_id=${session}&exclude=33`);
  check("Recently Viewed loai san pham dang xem", r.data.data?.map((p) => p.id).join(",") === "20");

  const recId = (await api("GET", "/api/recommendations/trending?limit=3")).data.rec_request_id;
  r = await api("POST", "/api/events", {
    session_id: session,
    events: [{ type: "rec_click", product_id: 50, source: "rec_trending", rec_request_id: recId }],
  });
  const { rows: [click] } = await query(
    `SELECT COUNT(*)::int AS n FROM user_events WHERE session_id = $1 AND event_type = 'rec_click'
        AND rec_request_id = $2 AND source = 'rec_trending'`,
    [session, recId]
  );
  check("rec_click luu kem rec_request_id va vi tri goi y", r.status === 202 && click.n === 1);

  console.log(`\nTong ket: ${passed} PASS, ${failed} FAIL`);
  process.exitCode = failed ? 1 : 0;
};

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => closePool());
