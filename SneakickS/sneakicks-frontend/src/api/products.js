import api from "./axios";

export const listProducts = (params = {}) =>
  api.get("/api/products", { params });

export const getProduct = (id) => api.get(`/api/products/${id}`);

export const getOrderBook = (id, size) =>
  api.get(`/api/products/${id}/orderbook`, { params: { size } });

export const getPriceHistory = (id, days = 30) =>
  api.get(`/api/products/${id}/price-history`, { params: { days } });
