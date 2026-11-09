import api from "./axios";

export const getTrending = (params = {}) =>
  api.get("/api/recommendations/trending", { params });

export const getSimilar = (id, params = {}) =>
  api.get(`/api/recommendations/similar/${id}`, { params });

export const getRecentlyViewed = (params = {}) =>
  api.get("/api/recommendations/recently-viewed", { params });
