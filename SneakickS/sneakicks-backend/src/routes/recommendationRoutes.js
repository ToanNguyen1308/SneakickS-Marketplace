import express from "express";
import {
  getTrending,
  getSimilar,
  getRecentlyViewed,
} from "../controllers/recommendationController.js";
import { optionalAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../middlewares/errorHandler.js";

const router = express.Router();

router.get("/trending", asyncHandler(getTrending));
router.get("/similar/:id", asyncHandler(getSimilar));
router.get("/recently-viewed", optionalAuth, asyncHandler(getRecentlyViewed));

export default router;
