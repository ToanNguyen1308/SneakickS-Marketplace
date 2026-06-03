import api from "./axios";

// Wishlist / Follow — Week 6
export const follow = (productId) =>
  api.post("/api/follows", { product_id: productId });

export const unfollow = (productId) => api.delete(`/api/follows/${productId}`);

export const getStatus = (productId) =>
  api.get(`/api/follows/${productId}/status`);

export const myFollows = (params = {}) =>
  api.get("/api/users/me/follows", { params });
