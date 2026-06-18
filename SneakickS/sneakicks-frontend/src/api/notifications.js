import api from "./axios";

// Notifications — Week 7
export const listNotifications = (params = {}) =>
  api.get("/api/notifications", { params });

export const getUnreadCount = () => api.get("/api/notifications/unread-count");

export const markRead = (id) => api.post(`/api/notifications/${id}/read`);

export const markAllRead = () => api.post("/api/notifications/read-all");
