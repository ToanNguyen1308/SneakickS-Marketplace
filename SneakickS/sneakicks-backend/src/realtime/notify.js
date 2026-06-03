import * as productModel from "../models/productModel.js";
import { emitProductUpdate } from "./io.js";

/**
 * notifyProduct — lay top-of-book moi nhat cua 1 san pham roi phat qua WebSocket.
 *
 * Goi sau khi co bat ky thay doi nao lien quan order book (place/match/cancel/buy/sell).
 * Best-effort: loi realtime KHONG duoc lam fail HTTP request chinh.
 */
export const notifyProduct = async (productId) => {
  try {
    const top = await productModel.getTopOfBook(productId);
    emitProductUpdate(productId, {
      lowestAsk: top.lowestAsk,
      highestBid: top.highestBid,
    });
  } catch (err) {
    console.error("[realtime] notifyProduct failed:", err.message);
  }
};
