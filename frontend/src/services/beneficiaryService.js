
import api from "./api";

const API_URL = "/beneficiaries";

// Admin: get all beneficiaries
export const getBeneficiaries = () =>
  api.get(API_URL);

// Admin: get beneficiary by ID
export const getBeneficiaryById = (id) =>
  api.get(`${API_URL}/${id}`);

// Logged-in beneficiary: get own profile
export const getMyBeneficiaryProfile = () =>
  api.get(`${API_URL}/me`);

// Logged-in beneficiary: create own profile
export const createBeneficiary = (data) =>
  api.post(API_URL, data);

// Logged-in beneficiary: update own profile
export const updateMyBeneficiaryProfile = (data) =>
  api.put(`${API_URL}/me`, data);

// Admin: delete beneficiary
export const deleteBeneficiary = (id) =>
  api.delete(`${API_URL}/${id}`);
