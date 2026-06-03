import { Server } from "socket.io";

/**
 * realtime/io.js — Week 6 (Real-time order book)
 *
 * Khoi tao 1 Socket.IO server gan vao HTTP server cua Express.
 * Client subscribe theo "room" `product:<id>` de chi nhan update cua dung
 * san pham dang xem (khong broadcast toan he thong -> tiet kiem bang thong).
 */

let io = null;

export const initIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
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

export const getIO = () => io;

/**
 * Phat su kien `product:update` toi tat ca client dang xem san pham do.
 * Best-effort: neu io chua init (vd chay test khong qua server) thi bo qua.
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
