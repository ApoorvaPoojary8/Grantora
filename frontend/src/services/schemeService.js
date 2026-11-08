import api from "./api";

const API_URL = "/schemes";

export const getSchemes = () => api.get(API_URL);

export const getSchemeById = (id) => api.get(`${API_URL}/${id}`);

export const createScheme = (data) => api.post(API_URL, data);

export const updateScheme = (id, data) =>
  api.put(`${API_URL}/${id}`, data);

export const deleteScheme = (id) => api.delete(`${API_URL}/${id}`);