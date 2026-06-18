import * as productModel from "../models/productModel.js";
import * as followModel from "../models/followModel.js";
import * as notificationModel from "../models/notificationModel.js";
import { emitProductUpdate, emitToUser } from "./io.js";

/**
 * notifyProduct — lay top-of-book moi nhat cua 1 san pham roi phat qua WebSocket.
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

/**
 * notifyFollowersOnNewAsk — Week 7.
 * Khi 1 Ask moi tro thanh Lowest Ask cua san pham, gui thong bao (luu DB + push
 * real-time) cho moi user dang follow san pham do (tru chinh seller).
 */
export const notifyFollowersOnNewAsk = async ({ productId, sellerId, price, size }) => {
  try {
    const top = await productModel.getTopOfBook(productId);
    // Chi thong bao khi Ask nay dang la gia thap nhat (price drop / best price).
    if (top.lowestAsk == null || Number(price) > Number(top.lowestAsk)) return;

    const followers = await followModel.listFollowersByProduct(productId);
    const targets = followers.filter((uid) => uid !== sellerId);
    if (targets.length === 0) return;

    const product = await productModel.findById(productId);
    const name = product?.name || `#${productId}`;
    const message = `New lowest ask $${Number(price).toFixed(2)} for "${name}" (size ${size}) you follow.`;

    for (const uid of targets) {
      const notification = await notificationModel.create(null, {
        userId: uid,
        type: "new_ask",
        productId,
        message,
      });
      emitToUser(uid, "notification:new", { notification });
    }
  } catch (err) {
    console.error("[realtime] notifyFollowersOnNewAsk failed:", err.message);
  }
};
