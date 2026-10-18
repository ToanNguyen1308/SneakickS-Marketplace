import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import pool, { closePool, query } from "../config/db.js";
import { buildCatalog } from "./catalog.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCHEMA_FILE = path.join(__dirname, "schema.sql");
const SEED_FILE = path.join(__dirname, "seed.sql");

const SEED_USERS = [
  { username: "admin",   email: "admin@sneakicks.com",   password: "admin123",   role: "admin" },
  { username: "buyer1",  email: "buyer1@sneakicks.com",  password: "buyer123",   role: "user"  },
  { username: "buyer2",  email: "buyer2@sneakicks.com",  password: "buyer123",   role: "user"  },
  { username: "buyer3",  email: "buyer3@sneakicks.com",  password: "buyer123",   role: "user"  },
  { username: "seller1", email: "seller1@sneakicks.com", password: "seller123",  role: "user"  },
  { username: "seller2", email: "seller2@sneakicks.com", password: "seller123",  role: "user"  },
];

const SEED_BIDS = [
  // product_id, size, price, buyer_username
  [1, "42", 270.00, "buyer1"],
  [1, "42", 268.00, "buyer2"],
  [1, "41", 255.00, "buyer3"],
  [1, "44", 300.00, "buyer2"],
  [2, "43", 135.00, "buyer1"],
  [3, "42", 590.00, "buyer3"],
];

const SEED_ASKS = [
  // product_id, size, price, seller_username
  [1, "42", 280.00, "seller1"],
  [1, "43", 285.00, "seller1"],
  [1, "40", 262.00, "seller2"],
  [1, "41", 270.00, "seller2"],
  [1, "44", 325.00, "seller1"],
  [1, "45", 340.00, "seller2"],
  [2, "43", 140.00, "seller2"],
  [3, "42", 610.00, "seller2"],
];

/**
 * Sample transactions de Postman/Frontend co the test ngay 5 endpoint moi cua tuan 5
 * ma khong can chay matching engine truoc.
 *
 *   tx#1 — pending_shipment  (seller1 vua match) -> seller co the bam Ship
 *   tx#2 — shipped_to_verify (cho admin)         -> admin co the bam Start/Pass/Fail
 *   tx#3 — completed         (da co rating)      -> the hien trust score cho seller1
 */
const SEED_TRANSACTIONS = [
  {
    product_id: 6,
    size: "OS",
    price: 125.00,
    buyer: "buyer1",
    seller: "seller1",
    status: "pending_shipment",
    note: "Seed: pending_shipment",
    rating: null,
  },
  {
    product_id: 5,
    size: "M",
    price: 160.00,
    buyer: "buyer2",
    seller: "seller2",
    status: "shipped_to_verify",
    note: "Seed: shipped_to_verify",
    rating: null,
  },
  {
    product_id: 7,
    size: "OS",
    price: 45.00,
    buyer: "buyer3",
    seller: "seller1",
    status: "completed",
    note: "Seed: completed transaction with rating",
    rating: { stars: 5, comment: "Hang chuan, giao nhanh." },
  },
];

/**
 * Lich su gia cho product 1 (Air Jordan 4) trai deu ~30 ngay gan nhat,
 * de bieu do gia (Charts tuan 6) co du lieu demo.
 *   [so ngay truoc, gia]
 */
const SEED_PRICE_HISTORY = [
  [29, 250.0],
  [27, 255.0],
  [25, 248.0],
  [22, 262.0],
  [20, 270.0],
  [18, 265.0],
  [15, 280.0],
  [13, 275.0],
  [11, 290.0],
  [9, 285.0],
  [6, 295.0],
  [4, 288.0],
  [2, 300.0],
  [1, 296.0],
];

const log = (msg) => console.log(`[migrate] ${msg}`);

const runSqlFile = async (filePath) => {
  const sql = fs.readFileSync(filePath, "utf8");
  await query(sql);
};

const seedCatalog = async () => {
  const catalog = buildCatalog();
  log(`Seeding catalog (${catalog.length} products)...`);
  const cols = [
    "name", "brand", "description", "category_id", "release_date", "retail_price",
    "sku", "silhouette", "colorway", "colors", "gender", "size_type", "tags",
  ];
  const BATCH = 100;
  for (let i = 0; i < catalog.length; i += BATCH) {
    const chunk = catalog.slice(i, i + BATCH);
    const values = [];
    const tuples = chunk.map((p, r) => {
      cols.forEach((c) => values.push(p[c] ?? null));
      return `(${cols.map((_, c) => `$${r * cols.length + c + 1}`).join(", ")})`;
    });
    await query(
      `INSERT INTO products (${cols.join(", ")}) VALUES ${tuples.join(", ")}`,
      values
    );
  }
};

const seedUsers = async () => {
  log("Seeding users (with bcrypt hashed passwords)...");
  for (const user of SEED_USERS) {
    const hash = await bcrypt.hash(user.password, 10);
    await query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      [user.username, user.email, hash, user.role]
    );
  }
};

const seedOrderBook = async () => {
  log("Seeding sample bids and asks...");
  const usersRes = await query("SELECT id, username FROM users");
  const userByName = Object.fromEntries(
    usersRes.rows.map((u) => [u.username, u.id])
  );

  for (const [productId, size, price, username] of SEED_BIDS) {
    await query(
      `INSERT INTO bids (buyer_id, product_id, size, price, status)
       VALUES ($1, $2, $3, $4, 'active')`,
      [userByName[username], productId, size, price]
    );
  }

  for (const [productId, size, price, username] of SEED_ASKS) {
    await query(
      `INSERT INTO asks (seller_id, product_id, size, price, status)
       VALUES ($1, $2, $3, $4, 'active')`,
      [userByName[username], productId, size, price]
    );
  }
};

const seedTransactions = async () => {
  log("Seeding sample transactions (Week 5 verification + rating)...");
  const usersRes = await query("SELECT id, username FROM users");
  const userByName = Object.fromEntries(
    usersRes.rows.map((u) => [u.username, u.id])
  );
  const adminId = userByName.admin;

  for (const tx of SEED_TRANSACTIONS) {
    const buyerId = userByName[tx.buyer];
    const sellerId = userByName[tx.seller];

    const { rows: txRows } = await query(
      `INSERT INTO transactions
         (ask_id, bid_id, buyer_id, seller_id, product_id, size, price, status)
       VALUES (NULL, NULL, $1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [buyerId, sellerId, tx.product_id, tx.size, tx.price, tx.status]
    );
    const txId = txRows[0].id;

    await query(
      `INSERT INTO order_status_logs (transaction_id, old_status, new_status, changed_by, note)
       VALUES ($1, NULL, $2, $3, $4)`,
      [txId, tx.status, null, tx.note]
    );

    if (tx.status === "shipped_to_verify") {
      await query(
        `INSERT INTO verifications (transaction_id, admin_id, result)
         VALUES ($1, NULL, 'pending')`,
        [txId]
      );
    }

    if (tx.status === "completed") {
      // Audit trail giong nhu da di qua tat ca cac state
      const trail = [
        ["pending_shipment", "shipped_to_verify", sellerId, "Seller shipped"],
        ["shipped_to_verify", "verifying", adminId, "Admin started verifying"],
        ["verifying", "verified_passed", adminId, "Authentic"],
        ["verified_passed", "shipped_to_buyer", adminId, "Shipped to buyer"],
        ["shipped_to_buyer", "completed", buyerId, "Buyer confirmed receipt"],
      ];
      for (const [oldStatus, newStatus, changedBy, note] of trail) {
        await query(
          `INSERT INTO order_status_logs
            (transaction_id, old_status, new_status, changed_by, note)
           VALUES ($1, $2, $3, $4, $5)`,
          [txId, oldStatus, newStatus, changedBy, note]
        );
      }
      await query(
        `INSERT INTO verifications (transaction_id, admin_id, result, notes, verified_at)
         VALUES ($1, $2, 'passed', 'Seed: authenticated', NOW())`,
        [txId, adminId]
      );

      if (tx.rating) {
        await query(
          `INSERT INTO seller_ratings (transaction_id, buyer_id, seller_id, rating, comment)
           VALUES ($1, $2, $3, $4, $5)`,
          [txId, buyerId, sellerId, tx.rating.stars, tx.rating.comment]
        );
      }
    }
  }
};

const seedPriceHistory = async () => {
  log("Seeding historical transactions for price chart (product 1)...");
  const usersRes = await query("SELECT id, username FROM users");
  const userByName = Object.fromEntries(
    usersRes.rows.map((u) => [u.username, u.id])
  );
  const buyerId = userByName.buyer1;
  const sellerId = userByName.seller1;

  for (const [daysAgo, price] of SEED_PRICE_HISTORY) {
    await query(
      `INSERT INTO transactions
         (ask_id, bid_id, buyer_id, seller_id, product_id, size, price, status, created_at, updated_at)
       VALUES (NULL, NULL, $1, $2, 1, '42', $3, 'completed',
               NOW() - ($4 || ' days')::interval,
               NOW() - ($4 || ' days')::interval)`,
      [buyerId, sellerId, price, daysAgo]
    );
  }
};

const main = async () => {
  const args = process.argv.slice(2);
  const seedOnly = args.includes("--seed-only");

  try {
    if (!seedOnly) {
      log(`Running schema: ${SCHEMA_FILE}`);
      await runSqlFile(SCHEMA_FILE);
      log("Schema applied successfully.");
    }

    log(`Running seed: ${SEED_FILE}`);
    await runSqlFile(SEED_FILE);
    await seedCatalog();
    await seedUsers();
    await seedOrderBook();
    await seedTransactions();
    await seedPriceHistory();
    log("Seed completed successfully.");

    log("All migrations done. Ready to run `npm run dev`.");
  } catch (err) {
    console.error("[migrate] ERROR:", err.message);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
};

main();
