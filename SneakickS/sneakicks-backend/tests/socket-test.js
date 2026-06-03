/**
 * socket-test.js — Week 6
 *
 * Chung minh real-time order book: 1 client subscribe room product:1, sau do
 * dat 1 Ask moi qua HTTP -> client phai nhan duoc su kien `product:update`.
 *
 * Yeu cau:
 *   1. npm install            (da co socket.io-client trong devDependencies)
 *   2. npm run db:migrate      (seed sach)
 *   3. npm run dev             (server :3000 + Socket.IO)
 *   4. node tests/socket-test.js
 *
 * Dung global fetch (Node >= 18).
 */
import { io } from "socket.io-client";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const PRODUCT_ID = 1;
const SIZE = "47"; // size la de tranh khop voi order book seed san

const login = async (email, password) => {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!json.token) throw new Error(`Login failed: ${JSON.stringify(json)}`);
  return json.token;
};

const placeAsk = async (token, price) => {
  const res = await fetch(`${BASE}/api/asks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ product_id: PRODUCT_ID, size: SIZE, price }),
  });
  return res.json();
};

const main = async () => {
  console.log("[socket-test] Connecting socket...");
  const socket = io(BASE, { transports: ["websocket"] });

  const received = new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Timeout: khong nhan duoc product:update sau 5s")),
      5000
    );
    socket.on("product:update", (payload) => {
      if (Number(payload.productId) === PRODUCT_ID) {
        clearTimeout(timer);
        resolve(payload);
      }
    });
  });

  await new Promise((resolve) => socket.on("connect", resolve));
  console.log("[socket-test] Connected:", socket.id);

  socket.emit("join:product", PRODUCT_ID);
  console.log(`[socket-test] Joined room product:${PRODUCT_ID}`);

  const token = await login("seller1@sneakicks.com", "seller123");
  console.log("[socket-test] Logged in seller1, placing Ask...");
  const ask = await placeAsk(token, 999.0);
  console.log("[socket-test] Ask placed:", ask.matched ? "matched" : "waiting");

  try {
    const payload = await received;
    console.log("[socket-test] RECEIVED product:update ->", payload);
    console.log("[socket-test] PASS — real-time push works.");
    process.exitCode = 0;
  } catch (err) {
    console.error("[socket-test] FAIL —", err.message);
    process.exitCode = 1;
  } finally {
    socket.close();
  }
};

main();
