import { withTransaction } from "../config/db.js";
import * as transactionModel from "../models/transactionModel.js";
import * as verificationModel from "../models/verificationModel.js";
import * as ratingModel from "../models/ratingModel.js";
import { parsePagination, buildMeta } from "../utils/pagination.js";

/**
 * transactionController — Week 5
 *
 * Quan ly vong doi transaction tu pending_shipment -> completed,
 * dam bao moi state transition deu atomic (withTransaction)
 * va ghi du order_status_logs.
 */

const VALID_ROLES = ["all", "buyer", "seller"];

const canViewTransaction = (transaction, user) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return transaction.buyer_id === user.id || transaction.seller_id === user.id;
};

export const getMyTransactions = async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const role = VALID_ROLES.includes(req.query.role) ? req.query.role : "all";
  const status = req.query.status || null;

  const [data, total] = await Promise.all([
    transactionModel.findByUserPaged(req.user.id, {
      role,
      status,
      limit,
      offset,
    }),
    transactionModel.countByUser(req.user.id, { role, status }),
  ]);

  res.json({
    success: true,
    role,
    status,
    count: data.length,
    pagination: buildMeta(page, limit, total),
    data,
  });
};

export const getTransactionById = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid transaction id" });
  }

  const tx = await transactionModel.findById(id);
  if (!tx) {
    return res
      .status(404)
      .json({ success: false, message: "Transaction not found" });
  }
  if (!canViewTransaction(tx, req.user)) {
    return res
      .status(403)
      .json({ success: false, message: "Forbidden" });
  }
  res.json({ success: true, data: tx });
};

/**
 * POST /api/transactions/:id/ship
 *
 * Seller xac nhan da gui hang den trung tam xac thuc.
 * pending_shipment -> shipped_to_verify.
 * Dong thoi tao 1 row verifications voi result='pending'.
 */
export const shipTransaction = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid transaction id" });
  }

  const tx = await transactionModel.findById(id);
  if (!tx) {
    return res
      .status(404)
      .json({ success: false, message: "Transaction not found" });
  }
  if (tx.seller_id !== req.user.id) {
    return res
      .status(403)
      .json({ success: false, message: "Only the seller can mark as shipped" });
  }
  if (tx.status !== "pending_shipment") {
    return res.status(400).json({
      success: false,
      message: `Cannot ship transaction with status='${tx.status}'`,
    });
  }

  const result = await withTransaction(async (client) => {
    const updated = await transactionModel.updateStatus(client, {
      id,
      expectedStatus: "pending_shipment",
      newStatus: "shipped_to_verify",
    });
    if (!updated) {
      const err = new Error("Transaction state changed, please retry");
      err.status = 409;
      throw err;
    }
    await transactionModel.insertStatusLog(client, {
      transactionId: id,
      oldStatus: "pending_shipment",
      newStatus: "shipped_to_verify",
      changedBy: req.user.id,
      note: "Seller marked shipped to verification center",
    });
    const verification = await verificationModel.insertPending(client, {
      transactionId: id,
      adminId: null,
    });
    return { transaction: updated, verification };
  });

  res.json({
    success: true,
    message: "Transaction marked as shipped_to_verify",
    data: result,
  });
};

/**
 * POST /api/transactions/:id/complete
 *
 * Buyer xac nhan da nhan hang.
 * shipped_to_buyer -> completed.
 */
export const completeTransaction = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid transaction id" });
  }

  const tx = await transactionModel.findById(id);
  if (!tx) {
    return res
      .status(404)
      .json({ success: false, message: "Transaction not found" });
  }
  if (tx.buyer_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Only the buyer can confirm receipt",
    });
  }
  if (tx.status !== "shipped_to_buyer") {
    return res.status(400).json({
      success: false,
      message: `Cannot complete transaction with status='${tx.status}'`,
    });
  }

  const updated = await withTransaction(async (client) => {
    const row = await transactionModel.updateStatus(client, {
      id,
      expectedStatus: "shipped_to_buyer",
      newStatus: "completed",
    });
    if (!row) {
      const err = new Error("Transaction state changed, please retry");
      err.status = 409;
      throw err;
    }
    await transactionModel.insertStatusLog(client, {
      transactionId: id,
      oldStatus: "shipped_to_buyer",
      newStatus: "completed",
      changedBy: req.user.id,
      note: "Buyer confirmed receipt",
    });
    return row;
  });

  res.json({
    success: true,
    message: "Transaction completed",
    data: updated,
  });
};

/**
 * POST /api/transactions/:id/rate  {rating: 1..5, comment?}
 *
 * Buyer cham sao seller sau khi completed.
 * UNIQUE(transaction_id) o tang DB -> chi rate duoc 1 lan.
 */
export const rateTransaction = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid transaction id" });
  }

  const { rating, comment } = req.body || {};
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({
      success: false,
      message: "rating must be an integer between 1 and 5",
    });
  }
  if (comment && String(comment).length > 1000) {
    return res
      .status(400)
      .json({ success: false, message: "comment too long (max 1000 chars)" });
  }

  const tx = await transactionModel.findById(id);
  if (!tx) {
    return res
      .status(404)
      .json({ success: false, message: "Transaction not found" });
  }
  if (tx.buyer_id !== req.user.id) {
    return res
      .status(403)
      .json({ success: false, message: "Only the buyer can rate the seller" });
  }
  if (tx.status !== "completed") {
    return res.status(400).json({
      success: false,
      message: "You can only rate completed transactions",
    });
  }

  const existing = await ratingModel.findByTransactionId(id);
  if (existing) {
    return res.status(409).json({
      success: false,
      message: "This transaction has already been rated",
    });
  }

  const created = await withTransaction(async (client) => {
    return ratingModel.insert(client, {
      transactionId: id,
      buyerId: tx.buyer_id,
      sellerId: tx.seller_id,
      rating: ratingNum,
      comment,
    });
  });

  res.status(201).json({
    success: true,
    message: "Seller rated successfully",
    data: created,
  });
};
