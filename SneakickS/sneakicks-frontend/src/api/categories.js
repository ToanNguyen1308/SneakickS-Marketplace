import api from "./axios";

export const listCategories = () => api.get("/api/categories");
export const listProductsByCategory = (id) =>
  api.get(`/api/categories/${id}/products`);
