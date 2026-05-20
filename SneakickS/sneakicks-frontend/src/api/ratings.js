import api from "./axios";

export const getSellerRatings = (sellerId, params = {}) =>
  api.get(`/api/sellers/${sellerId}/ratings`, { params });
