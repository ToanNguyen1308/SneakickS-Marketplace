import express from "express";
import {
  getMyTransactions,
  getTransactionById,
  shipTransaction,
  completeTransaction,
  rateTransaction,
} from "../controllers/transactionController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../middlewares/errorHandler.js";

const router = express.Router();

router.use(requireAuth);

router.get("/me", asyncHandler(getMyTransactions));
router.get("/:id", asyncHandler(getTransactionById));
router.post("/:id/ship", asyncHandler(shipTransaction));
router.post("/:id/complete", asyncHandler(completeTransaction));
router.post("/:id/rate", asyncHandler(rateTransaction));

export default router;
