import express from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import {
  getMyNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", asyncHandler(getMyNotifications));
router.get("/unread-count", asyncHandler(getUnreadCount));
router.post("/read-all", asyncHandler(markAllRead));
router.post("/:id/read", asyncHandler(markRead));

export default router;
