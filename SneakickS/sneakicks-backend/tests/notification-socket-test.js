/**
 * notification-socket-test.js — Week 7
 *
 * Chung minh thong bao real-time: buyer1 (follower) ket noi socket co JWT ->
 * join room user:<id>. Khi seller dat Ask thap nhat moi tren san pham buyer1
 * dang follow, buyer1 phai nhan su kien `notification:new`.
 *
 * Yeu cau: npm run db:migrate; npm run dev; node tests/notification-socket-test.js
 * Dung global fetch (Node >= 18).
 */
import { io } from "socket.io-client";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const PRODUCT_ID = 2;

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

const main = async () => {
  const buyerToken = await login("buyer1@sneakicks.com", "buyer123");
  const sellerToken = await login("seller1@sneakicks.com", "seller123");

  // buyer1 follows product 2 (idempotent).
  await fetch(`${BASE}/api/follows`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${buyerToken}`,
    },
    body: JSON.stringify({ product_id: PRODUCT_ID }),
  });

  console.log("[notif-test] Connecting buyer1 socket with JWT...");
  const socket = io(BASE, {
    transports: ["websocket"],
    auth: { token: buyerToken },
  });

  const received = new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Timeout: no notification:new in 5s")),
      5000
    );
    socket.on("notification:new", (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });

  await new Promise((resolve) => socket.on("connect", resolve));
  console.log("[notif-test] Connected:", socket.id);

  // seller1 places a new lowest ask on product 2 -> should notify follower buyer1.
  const price = 70 + Math.floor(Math.random() * 10); // ensure a fresh low ask
  console.log(`[notif-test] seller1 placing ask $${price} on product ${PRODUCT_ID}...`);
  await fetch(`${BASE}/api/asks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({ product_id: PRODUCT_ID, size: "51", price }),
  });

  try {
    const payload = await received;
    console.log("[notif-test] RECEIVED notification:new ->", payload.notification?.message);
    console.log("[notif-test] PASS — real-time notification works.");
    process.exitCode = 0;
  } catch (err) {
    console.error("[notif-test] FAIL —", err.message);
    process.exitCode = 1;
  } finally {
    socket.close();
  }
};

main();
