import api from "./axios";

export const placeAsk = (payload) => api.post("/api/asks", payload);
export const sellNow = (payload) => api.post("/api/asks/sell-now", payload);
export const myAsks = (params = {}) => api.get("/api/asks/me", { params });
export const cancelAsk = (id) => api.delete(`/api/asks/${id}`);
