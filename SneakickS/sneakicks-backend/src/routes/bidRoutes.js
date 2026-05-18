import express from "express";
import {
  placeBid,
  buyNowBid,
  getMyBids,
  cancelBid,
} from "../controllers/bidController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../middlewares/errorHandler.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", asyncHandler(placeBid));
router.post("/buy-now", asyncHandler(buyNowBid));
router.get("/me", asyncHandler(getMyBids));
router.delete("/:id", asyncHandler(cancelBid));

export default router;
