import api from "./axios";

export const listProducts = (params = {}) =>
  api.get("/api/products", { params });

export const getProduct = (id) => api.get(`/api/products/${id}`);

export const getOrderBook = (id, size) =>
  api.get(`/api/products/${id}/orderbook`, { params: { size } });

export const getPriceHistory = (id, days = 30) =>
  api.get(`/api/products/${id}/price-history`, { params: { days } });

export const getMarket = (id) => api.get(`/api/products/${id}/market`);

export const getRecentSales = (id, limit = 10) =>
  api.get(`/api/products/${id}/sales`, { params: { limit } });

export const getFacets = () => api.get("/api/products/facets");
