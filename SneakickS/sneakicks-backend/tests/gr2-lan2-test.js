/**
 * Kiem thu GR2 lan 2: sua ton dong GR1 + du lieu san pham + ghi nhan hanh vi.
 * Chay sau `npm run db:migrate` va khi server dang chay:
 *   node tests/gr2-lan2-test.js
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

const api = async (method, path, { token, body } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
};

const login = async (email, password) =>
  (await api("POST", "/api/auth/login", { body: { email, password } })).data.token;

const main = async () => {
  const seller1 = await login("seller1@sneakicks.com", "seller123");
  const buyer1 = await login("buyer1@sneakicks.com", "buyer123");
  const admin = await login("admin@sneakicks.com", "admin123");

  console.log("\n== 1. Ton dong GR1 ==");

  // seller1 dang co Ask $280 size 42 cho san pham 1. Truoc day Bid $300 cua chinh seller1 se tu khop.
  let r = await api("POST", "/api/bids", {
    token: seller1,
    body: { product_id: 1, size: "42", price: 300 },
  });
  check("Self-trade: Place Bid khong khop voi Ask cua chinh minh", r.status === 201 && r.data.matched === false, r.data.message);

  // buyer1 dang co Bid $270 size 42. Ask $260 cua chinh buyer1 khong duoc khop voi Bid do.
  r = await api("POST", "/api/asks", {
    token: buyer1,
    body: { product_id: 1, size: "42", price: 260 },
  });
  const selfAskMatchedOwnBid =
    r.data.matched === true && r.data.data?.bid?.buyer_id === r.data.data?.ask?.seller_id;
  check("Self-trade: Place Ask khong khop voi Bid cua chinh minh", r.status === 201 && !selfAskMatchedOwnBid,
    r.data.matched ? `khop voi Bid #${r.data.data.bid.id} cua user #${r.data.data.bid.buyer_id}` : r.data.message);

  r = await api("POST", "/api/bids", { token: admin, body: { product_id: 1, size: "42", price: 200 } });
  check("Admin bi chan dat Bid (403)", r.status === 403, r.data.message);
  r = await api("POST", "/api/bids/buy-now", { token: admin, body: { product_id: 1, size: "42" } });
  check("Admin bi chan Buy Now (403)", r.status === 403, r.data.message);
  r = await api("POST", "/api/asks", { token: admin, body: { product_id: 1, size: "42", price: 500 } });
  check("Admin bi chan dat Ask (403)", r.status === 403, r.data.message);

  r = await api("GET", "/api/products/1/market");
  const s41 = r.data.data?.find((m) => m.size === "41");
  const s44 = r.data.data?.find((m) => m.size === "44");
  check("Gia theo size: Lowest Ask size 41 khac size 44", s41 && s44 && s41.lowestAsk !== s44.lowestAsk,
    `41: ${s41?.lowestAsk}, 44: ${s44?.lowestAsk}`);

  const buyer3 = await login("buyer3@sneakicks.com", "buyer123");
  r = await api("GET", "/api/transactions/me?role=buyer", { token: buyer3 });
  const completed = r.data.data?.find((t) => t.status === "completed");
  check("Giao dich da danh gia tra ve co rated=true", completed?.rated === true, `tx #${completed?.id}`);

  console.log("\n== 2. Du lieu san pham ==");
  r = await api("GET", "/api/products?limit=1&page=1");
  check("Catalog co 300-500 san pham", r.data.pagination?.total >= 300 && r.data.pagination?.total <= 500,
    `${r.data.pagination?.total} san pham`);
  const p = (await api("GET", "/api/products/12")).data.data;
  check("San pham co du thuoc tinh Content-based",
    Boolean(p?.silhouette && p?.colorway && p?.gender && p?.sku && p?.tags),
    `${p?.name} | ${p?.silhouette} | ${p?.colorway} | ${p?.gender} | ${p?.sku}`);
  r = await api("GET", "/api/products?brand=Jordan&silhouette=Air%20Jordan%201%20Low&gender=women&page=1");
  const ok = r.data.data?.length > 0 && r.data.data.every(
    (x) => x.brand === "Jordan" && x.silhouette === "Air Jordan 1 Low" && x.gender === "women");
  check("Loc theo brand + dong giay + gioi tinh", ok, `${r.data.pagination?.total} ket qua`);
  r = await api("GET", "/api/products/facets");
  check("API facets tra ve brand va dong giay",
    r.data.data?.brands?.length > 10 && r.data.data?.silhouettes?.length > 40,
    `${r.data.data?.brands?.length} brand, ${r.data.data?.silhouettes?.length} dong giay`);
  r = await api("GET", "/api/products/1/sales?limit=5");
  check("API giao dich gan nhat", r.data.count === 5, `${r.data.count} giao dich`);

  console.log("\n== 3. Ghi nhan hanh vi ==");
  const session = `test-${Date.now()}`;
  r = await api("POST", "/api/events", {
    body: {
      session_id: session,
      events: [
        { type: "view", product_id: 1, dwell_ms: 12000, source: "browse" },
        { type: "view", product_id: 12, dwell_ms: 4300, source: "browse" },
        { type: "search", query: "jordan 1 low" },
        { type: "view", product_id: 999999, dwell_ms: 1000 },
        { type: "like", product_id: 1 },
      ],
    },
  });
  check("Khach gui lo su kien: nhan 3, loai 2 su kien khong hop le",
    r.status === 202 && r.data.accepted === 3 && r.data.rejected === 2, JSON.stringify(r.data));

  r = await api("POST", "/api/events", { body: { events: [{ type: "view", product_id: 1 }] } });
  check("Khach khong co session_id bi tu choi (400)", r.status === 400, r.data.message);

  r = await api("POST", "/api/events", {
    token: buyer1,
    body: { session_id: session, events: [{ type: "view", product_id: 5, dwell_ms: 8000 }] },
  });
  const { rows } = await query(
    `SELECT COUNT(*)::int AS n, COUNT(user_id)::int AS with_user FROM user_events WHERE session_id = $1`,
    [session]
  );
  check("Dang nhap: lich su xem cua session khach duoc gan vao tai khoan",
    rows[0].n === 4 && rows[0].with_user === 4, `${rows[0].with_user}/${rows[0].n} su kien co user_id`);

  console.log(`\nTong ket: ${passed} PASS, ${failed} FAIL`);
  process.exitCode = failed ? 1 : 0;
};

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => closePool());
