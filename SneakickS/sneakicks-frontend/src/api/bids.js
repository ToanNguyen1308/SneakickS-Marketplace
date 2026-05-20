import api from "./axios";

export const placeBid = (payload) => api.post("/api/bids", payload);
export const buyNow = (payload) => api.post("/api/bids/buy-now", payload);
export const myBids = (params = {}) => api.get("/api/bids/me", { params });
export const cancelBid = (id) => api.delete(`/api/bids/${id}`);
