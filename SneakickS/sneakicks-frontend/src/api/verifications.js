import api from "./axios";

export const listVerifications = (params = {}) =>
  api.get("/api/admin/verifications", { params });

export const startVerification = (tid) =>
  api.post(`/api/admin/verifications/${tid}/start`);

export const passVerification = (tid, notes) =>
  api.post(`/api/admin/verifications/${tid}/pass`, { notes });

export const failVerification = (tid, notes) =>
  api.post(`/api/admin/verifications/${tid}/fail`, { notes });
