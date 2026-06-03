import express from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { getMyFollows } from "../controllers/followController.js";

const router = express.Router();

// GET /api/users/me/follows  -> danh sach wishlist cua user hien tai
router.get("/me/follows", requireAuth, asyncHandler(getMyFollows));

export default router;
