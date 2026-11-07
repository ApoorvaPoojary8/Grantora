import axios from "axios";

const API_URL = "http://localhost:8080/api/beneficiaries";

export const getBeneficiaries = () => axios.get(API_URL);

export const getBeneficiaryById = (id) =>
  axios.get(`${API_URL}/${id}`);

export const createBeneficiary = (userId, data) =>
  axios.post(`${API_URL}?userId=${userId}`, data);

export const updateBeneficiary = (id, data) =>
  axios.put(`${API_URL}/${id}`, data);

export const deleteBeneficiary = (id) =>
  axios.delete(`${API_URL}/${id}`);