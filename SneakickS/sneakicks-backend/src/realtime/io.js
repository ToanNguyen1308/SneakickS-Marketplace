import { Server } from "socket.io";
import jwt from "jsonwebtoken";

/**
 * realtime/io.js — Week 6 (order book) + Week 7 (per-user notifications)
 *
 * - Room `product:<id>`  : cap nhat order book theo san pham (tuan 6).
 * - Room `user:<id>`     : thong bao rieng cho tung user (tuan 7).
 *
 * Xac thuc: client gui JWT qua handshake.auth.token. Neu hop le -> tu dong
 * join room `user:<id>`. Khach vang lai (khong token) van ket noi de nhan
 * cap nhat order book cong khai.
 */

const JWT_SECRET = process.env.JWT_SECRET || "sneakicks-dev-secret-change-me";

let io = null;

export const initIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    // Xac thuc tu handshake (neu co token) -> join room user.
    const token = socket.handshake.auth?.token;
    if (token) joinUserRoom(socket, token);

    // Cho phep dang nhap sau khi da ket noi (vd user login giua chung).
    socket.on("auth", (newToken) => joinUserRoom(socket, newToken));

    socket.on("join:product", (productId) => {
      const id = Number(productId);
      if (Number.isInteger(id) && id > 0) socket.join(`product:${id}`);
    });

    socket.on("leave:product", (productId) => {
      const id = Number(productId);
      if (Number.isInteger(id) && id > 0) socket.leave(`product:${id}`);
    });
  });

  return io;
};

const joinUserRoom = (socket, token) => {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload?.sub) {
      // Roi room user cu (neu doi tai khoan) roi join room moi.
      if (socket.data.userId && socket.data.userId !== payload.sub) {
        socket.leave(`user:${socket.data.userId}`);
      }
      socket.data.userId = payload.sub;
      socket.join(`user:${payload.sub}`);
    }
  } catch {
    // token sai/het han -> bo qua, van giu ket noi cong khai.
  }
};

export const getIO = () => io;

/**
 * Phat `product:update` toi room cua 1 san pham (order book real-time).
 */
export const emitProductUpdate = (productId, payload = {}) => {
  const id = Number(productId);
  if (!io || !Number.isInteger(id) || id <= 0) return;
  io.to(`product:${id}`).emit("product:update", {
    productId: id,
    ...payload,
    at: new Date().toISOString(),
  });
};

/**
 * Phat su kien rieng cho 1 user (vd thong bao moi).
 */
export const emitToUser = (userId, event, payload = {}) => {
  const id = Number(userId);
  if (!io || !Number.isInteger(id) || id <= 0) return;
  io.to(`user:${id}`).emit(event, { ...payload, at: new Date().toISOString() });
};
