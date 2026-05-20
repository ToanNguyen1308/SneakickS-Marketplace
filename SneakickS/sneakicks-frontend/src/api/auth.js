import api from "./axios";

export const register = (payload) => api.post("/api/auth/register", payload);
export const login = (payload) => api.post("/api/auth/login", payload);
export const me = () => api.get("/api/auth/me");
