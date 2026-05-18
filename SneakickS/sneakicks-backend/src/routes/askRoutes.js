import express from "express";
import {
  placeAsk,
  sellNowAsk,
  getMyAsks,
  cancelAsk,
} from "../controllers/askController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../middlewares/errorHandler.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", asyncHandler(placeAsk));
router.post("/sell-now", asyncHandler(sellNowAsk));
router.get("/me", asyncHandler(getMyAsks));
router.delete("/:id", asyncHandler(cancelAsk));

export default router;
