import api from "./api";

const API_URL = "/applications";

export const getApplications = () => api.get(API_URL);

export const getMyApplications = () => api.get(`${API_URL}/me`);

export const getApplicationById = (id) => api.get(`${API_URL}/${id}`);

export const createApplication = (data) => api.post(API_URL, data);

export const updateApplication = (id, data) =>
  api.put(`${API_URL}/${id}`, data);

export const submitApplication = (id) =>
  api.post(`${API_URL}/${id}/submit`);

export const updateApplicationStatus = (id, status) =>
  api.patch(`${API_URL}/${id}/status`, { status });

export const getVerificationQueue = () =>
  api.get(`${API_URL}/verification/assigned`);

export const getVerificationHistory = () =>
  api.get(`${API_URL}/verification/history`);

export const submitVerificationDecision = (id, data) =>
  api.post(`${API_URL}/${id}/decision`, data);

export const escalateApplication = (id) =>
  api.post(`${API_URL}/${id}/escalate`);

export const uploadApplicationDocument = (id, file) => {
  const body = new FormData();
  body.append("file", file);
  return api.post(`${API_URL}/${id}/documents`, body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const downloadApplicationDocument = (applicationId, documentId) =>
  api.get(`${API_URL}/${applicationId}/documents/${documentId}`, {
    responseType: "blob",
  });
