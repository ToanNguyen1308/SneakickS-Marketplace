import { io } from "socket.io-client";

/**
 * socket.js — Week 6 (order book) + Week 7 (per-user notifications)
 *
 * Singleton Socket.IO client. Khi VITE_API_BASE_URL rong, ket noi cung origin
 * (Vite dev server) va duoc proxy `/socket.io` (ws:true) chuyen tiep sang backend.
 *
 * `auth` la 1 ham -> moi lan (re)connect socket.io tu lay token moi nhat tu
 * localStorage de server join dung room `user:<id>`.
 */
const URL = import.meta.env.VITE_API_BASE_URL || "";

const socket = io(URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
  auth: (cb) => cb({ token: localStorage.getItem("token") || null }),
});

/**
 * Goi sau khi login/logout giua chung phien de cap nhat room user ngay lap tuc
 * ma khong can reconnect.
 */
export const authenticateSocket = (token) => {
  socket.emit("auth", token || null);
};

export default socket;
