import express from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import {
  followProduct,
  unfollowProduct,
  getFollowStatus,
  getMyFollows,
} from "../controllers/followController.js";

const router = express.Router();

// Tat ca endpoint follow deu yeu cau dang nhap.
router.use(requireAuth);

router.post("/", asyncHandler(followProduct));
router.get("/me", asyncHandler(getMyFollows));
router.get("/:productId/status", asyncHandler(getFollowStatus));
router.delete("/:productId", asyncHandler(unfollowProduct));

export default router;
