import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import pool, { closePool, query } from "../config/db.js";

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
  [2, "43", 135.00, "buyer1"],
  [3, "42", 590.00, "buyer3"],
];

const SEED_ASKS = [
  // product_id, size, price, seller_username
  [1, "42", 280.00, "seller1"],
  [1, "43", 285.00, "seller1"],
  [2, "43", 140.00, "seller2"],
  [3, "42", 610.00, "seller2"],
];

const log = (msg) => console.log(`[migrate] ${msg}`);

const runSqlFile = async (filePath) => {
  const sql = fs.readFileSync(filePath, "utf8");
  await query(sql);
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

const main = async () => {
  const args = process.argv.slice(2);
  const seedOnly = args.includes("--seed-only");
  const reset = args.includes("--reset");

  try {
    if (!seedOnly) {
      log(`Running schema: ${SCHEMA_FILE}`);
      await runSqlFile(SCHEMA_FILE);
      log("Schema applied successfully.");
    }

    if (reset || !seedOnly) {
      log(`Running seed: ${SEED_FILE}`);
      await runSqlFile(SEED_FILE);
      await seedUsers();
      await seedOrderBook();
      log("Seed completed successfully.");
    } else if (seedOnly) {
      log(`Running seed only: ${SEED_FILE}`);
      await runSqlFile(SEED_FILE);
      await seedUsers();
      await seedOrderBook();
      log("Seed completed successfully.");
    }

    log("All migrations done. Ready to run `npm run dev`.");
  } catch (err) {
    console.error("[migrate] ERROR:", err.message);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
};

main();
