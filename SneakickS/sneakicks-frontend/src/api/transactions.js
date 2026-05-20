import api from "./axios";

export const myTransactions = (params = {}) =>
  api.get("/api/transactions/me", { params });

export const getTransaction = (id) => api.get(`/api/transactions/${id}`);

export const shipTransaction = (id) =>
  api.post(`/api/transactions/${id}/ship`);

export const completeTransaction = (id) =>
  api.post(`/api/transactions/${id}/complete`);

export const rateTransaction = (id, payload) =>
  api.post(`/api/transactions/${id}/rate`, payload);
