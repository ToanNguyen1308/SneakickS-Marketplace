import * as notificationModel from "../models/notificationModel.js";
import { parsePagination, buildMeta } from "../utils/pagination.js";

export const getMyNotifications = async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const [data, total, unread] = await Promise.all([
    notificationModel.listByUser(req.user.id, { limit, offset }),
    notificationModel.countByUser(req.user.id),
    notificationModel.countUnread(req.user.id),
  ]);

  res.json({
    success: true,
    unread,
    count: data.length,
    pagination: buildMeta(page, limit, total),
    data,
  });
};

export const getUnreadCount = async (req, res) => {
  const unread = await notificationModel.countUnread(req.user.id);
  res.json({ success: true, unread });
};

export const markRead = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid notification id" });
  }
  const updated = await notificationModel.markRead(id, req.user.id);
  if (!updated) {
    return res
      .status(404)
      .json({ success: false, message: "Notification not found" });
  }
  res.json({ success: true, message: "Marked as read" });
};

export const markAllRead = async (req, res) => {
  const count = await notificationModel.markAllRead(req.user.id);
  res.json({ success: true, message: "All marked as read", count });
};
