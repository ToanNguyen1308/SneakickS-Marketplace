/**
 * concurrent-test.js — Week 5
 *
 * Stress test cho Matching Engine: 3 buyer cung dat Bid cho 1 Ask duy nhat.
 * Theo thiet ke `SELECT ... FOR UPDATE` cua tuan 4, chi 1 transaction duoc tao.
 *
 * Cach chay:
 *   1. Dam bao Postgres da chay va `npm run db:migrate` da done.
 *   2. Dam bao co Ask voi product_id=1, size=42, price=280 trong order book
 *      (mac dinh seller1 da co tu seed: SELECT * FROM asks WHERE id=1).
 *   3. node tests/concurrent-test.js
 */

const API = process.env.API_BASE_URL || "http://localhost:3000";

const log = (...args) => console.log("[stress]", ...args);

const post = async (path, body, token) => {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
};

const login = async (email, password) => {
  const { body } = await post("/api/auth/login", { email, password });
  if (!body.token) throw new Error(`Login failed for ${email}: ${JSON.stringify(body)}`);
  return body.token;
};

const main = async () => {
  log("Logging in 3 buyers...");
  const tokens = await Promise.all([
    login("buyer1@sneakicks.com", "buyer123"),
    login("buyer2@sneakicks.com", "buyer123"),
    login("buyer3@sneakicks.com", "buyer123"),
  ]);

  log("Firing 3 simultaneous Place Bid requests (product=1 size=42 price=285)...");
  const t0 = Date.now();
  const results = await Promise.all(
    tokens.map((token) =>
      post("/api/bids", { product_id: 1, size: "42", price: 285 }, token)
    )
  );
  const elapsed = Date.now() - t0;
  log(`Done in ${elapsed} ms.`);

  const matchedCount = results.filter((r) => r.body?.matched === true).length;
  const waitingCount = results.filter((r) => r.body?.matched === false).length;

  results.forEach((r, idx) => {
    log(
      `Buyer ${idx + 1} -> status=${r.status} matched=${r.body?.matched} bid=#${
        r.body?.data?.bid?.id ?? "?"
      }`
    );
  });

  log("---");
  log(`Matched count   : ${matchedCount}  (expect 1)`);
  log(`Waiting count   : ${waitingCount}  (expect 2)`);
  log("FOR UPDATE row-level lock prevents double-match.");

  if (matchedCount === 1 && waitingCount === 2) {
    log("PASS — race condition properly prevented.");
    process.exit(0);
  } else {
    log("FAIL — concurrency invariant violated.");
    process.exit(1);
  }
};

main().catch((err) => {
  console.error("[stress] ERROR:", err);
  process.exit(1);
});
