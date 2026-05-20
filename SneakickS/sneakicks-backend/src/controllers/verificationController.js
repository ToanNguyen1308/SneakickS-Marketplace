import { withTransaction } from "../config/db.js";
import * as transactionModel from "../models/transactionModel.js";
import * as verificationModel from "../models/verificationModel.js";
import { parsePagination, buildMeta } from "../utils/pagination.js";

/**
 * verificationController — Week 5 (Admin only)
 *
 * 3 state transitions chinh:
 *   shipped_to_verify -> verifying          (start)
 *   verifying        -> verified_passed -> shipped_to_buyer  (pass)
 *   verifying        -> verified_failed -> cancelled        (fail)
 *
 * Moi action ghi 1 hoac 2 row order_status_logs trong cung 1 transaction.
 */

const VALID_RESULTS = ["pending", "passed", "failed"];

export const listVerifications = async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const result = VALID_RESULTS.includes(req.query.result)
    ? req.query.result
    : "pending";

  const [data, total] = await Promise.all([
    verificationModel.listByResult({ result, limit, offset }),
    verificationModel.countByResult(result),
  ]);

  res.json({
    success: true,
    filter: { result },
    count: data.length,
    pagination: buildMeta(page, limit, total),
    data,
  });
};

const ensureTransaction = async (id) => {
  const tx = await transactionModel.findById(id);
  if (!tx) {
    const err = new Error("Transaction not found");
    err.status = 404;
    throw err;
  }
  return tx;
};

/**
 * POST /api/admin/verifications/:tid/start
 *
 * Admin nhan transaction o trang thai shipped_to_verify de bat dau kiem hang.
 * shipped_to_verify -> verifying.
 */
export const startVerification = async (req, res) => {
  const tid = Number(req.params.tid);
  if (!Number.isInteger(tid) || tid <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid transaction id" });
  }

  const tx = await ensureTransaction(tid);
  if (tx.status !== "shipped_to_verify") {
    return res.status(400).json({
      success: false,
      message: `Cannot start verifying transaction with status='${tx.status}'`,
    });
  }

  const result = await withTransaction(async (client) => {
    const updated = await transactionModel.updateStatus(client, {
      id: tid,
      expectedStatus: "shipped_to_verify",
      newStatus: "verifying",
    });
    if (!updated) {
      const err = new Error("Transaction state changed, please retry");
      err.status = 409;
      throw err;
    }
    await transactionModel.insertStatusLog(client, {
      transactionId: tid,
      oldStatus: "shipped_to_verify",
      newStatus: "verifying",
      changedBy: req.user.id,
      note: "Admin started verifying",
    });
    const verification = await verificationModel.setStarted(client, {
      transactionId: tid,
      adminId: req.user.id,
    });
    return { transaction: updated, verification };
  });

  res.json({
    success: true,
    message: "Verification started",
    data: result,
  });
};

/**
 * POST /api/admin/verifications/:tid/pass {notes?}
 *
 * Kiem hang dat -> verified_passed -> shipped_to_buyer (2 state log).
 */
export const passVerification = async (req, res) => {
  const tid = Number(req.params.tid);
  if (!Number.isInteger(tid) || tid <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid transaction id" });
  }
  const notes = req.body?.notes ? String(req.body.notes) : null;

  const tx = await ensureTransaction(tid);
  if (tx.status !== "verifying") {
    return res.status(400).json({
      success: false,
      message: `Cannot pass transaction with status='${tx.status}'`,
    });
  }

  const result = await withTransaction(async (client) => {
    // verifying -> verified_passed
    const passed = await transactionModel.updateStatus(client, {
      id: tid,
      expectedStatus: "verifying",
      newStatus: "verified_passed",
    });
    if (!passed) {
      const err = new Error("Transaction state changed, please retry");
      err.status = 409;
      throw err;
    }
    await transactionModel.insertStatusLog(client, {
      transactionId: tid,
      oldStatus: "verifying",
      newStatus: "verified_passed",
      changedBy: req.user.id,
      note: notes || "Authenticator passed",
    });

    // verified_passed -> shipped_to_buyer (admin/center gui hang ngay)
    const shipped = await transactionModel.updateStatus(client, {
      id: tid,
      expectedStatus: "verified_passed",
      newStatus: "shipped_to_buyer",
    });
    if (!shipped) {
      const err = new Error("Transaction state changed, please retry");
      err.status = 409;
      throw err;
    }
    await transactionModel.insertStatusLog(client, {
      transactionId: tid,
      oldStatus: "verified_passed",
      newStatus: "shipped_to_buyer",
      changedBy: req.user.id,
      note: "Verification center shipped to buyer",
    });

    const verification = await verificationModel.setResult(client, {
      transactionId: tid,
      adminId: req.user.id,
      result: "passed",
      notes,
    });
    return { transaction: shipped, verification };
  });

  res.json({
    success: true,
    message: "Verification passed; transaction shipped to buyer",
    data: result,
  });
};

/**
 * POST /api/admin/verifications/:tid/fail {notes}
 *
 * Kiem hang khong dat -> verified_failed -> cancelled.
 */
export const failVerification = async (req, res) => {
  const tid = Number(req.params.tid);
  if (!Number.isInteger(tid) || tid <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid transaction id" });
  }
  const notes = req.body?.notes ? String(req.body.notes) : null;
  if (!notes) {
    return res
      .status(400)
      .json({ success: false, message: "notes is required when failing" });
  }

  const tx = await ensureTransaction(tid);
  if (tx.status !== "verifying") {
    return res.status(400).json({
      success: false,
      message: `Cannot fail transaction with status='${tx.status}'`,
    });
  }

  const result = await withTransaction(async (client) => {
    // verifying -> verified_failed
    const failed = await transactionModel.updateStatus(client, {
      id: tid,
      expectedStatus: "verifying",
      newStatus: "verified_failed",
    });
    if (!failed) {
      const err = new Error("Transaction state changed, please retry");
      err.status = 409;
      throw err;
    }
    await transactionModel.insertStatusLog(client, {
      transactionId: tid,
      oldStatus: "verifying",
      newStatus: "verified_failed",
      changedBy: req.user.id,
      note: notes,
    });

    // verified_failed -> cancelled
    const cancelled = await transactionModel.updateStatus(client, {
      id: tid,
      expectedStatus: "verified_failed",
      newStatus: "cancelled",
    });
    if (!cancelled) {
      const err = new Error("Transaction state changed, please retry");
      err.status = 409;
      throw err;
    }
    await transactionModel.insertStatusLog(client, {
      transactionId: tid,
      oldStatus: "verified_failed",
      newStatus: "cancelled",
      changedBy: req.user.id,
      note: "Cancelled after failed verification",
    });

    const verification = await verificationModel.setResult(client, {
      transactionId: tid,
      adminId: req.user.id,
      result: "failed",
      notes,
    });
    return { transaction: cancelled, verification };
  });

  res.json({
    success: true,
    message: "Verification failed; transaction cancelled",
    data: result,
  });
};
