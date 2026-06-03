import { io } from "socket.io-client";

/**
 * socket.js — Week 6 (Real-time order book)
 *
 * Singleton Socket.IO client. Khi VITE_API_BASE_URL rong, ket noi cung origin
 * (Vite dev server) va duoc proxy `/socket.io` (ws:true) chuyen tiep sang backend.
 */
const URL = import.meta.env.VITE_API_BASE_URL || "";

const socket = io(URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
});

export default socket;
