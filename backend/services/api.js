import axios from 'axios';

const API_BASE_URL = '/api';

// تعديل getAllThemes لاستقبال search
export const getAllThemes = async (platform = null, plan = null, search = null) => {
  const params = new URLSearchParams();
  if (platform) params.append('platform', platform);
  if (plan) params.append('plan', plan);
  if (search && search.trim() !== '') params.append('search', search);
  const res = await axios.get(`${API_BASE_URL}/themes?${params.toString()}`);
  return res.data;
};

// باقي الدوال كما هي (لن نكررها كلها، لكن تأكد من وجود createStoreLink, updateStoreLink ...)
export const getThemeById = async (id) => {
  const res = await axios.get(`${API_BASE_URL}/themes/${id}`);
  return res.data;
};

export const createTheme = async (data, token) => {
  const res = await axios.post(`${API_BASE_URL}/themes`, data, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const updateTheme = async (id, data, token) => {
  const res = await axios.put(`${API_BASE_URL}/themes/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const deleteTheme = async (id, token) => {
  const res = await axios.delete(`${API_BASE_URL}/themes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const resetThemeApi = async (id, token) => {
  const res = await axios.post(`${API_BASE_URL}/themes/${id}/reset-api`, {}, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const reorderTheme = async (id, direction, token) => {
  const res = await axios.post(`${API_BASE_URL}/themes/${id}/reorder`, { direction }, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const getAllStoreLinks = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const res = await axios.get(`${API_BASE_URL}/store-links?${params.toString()}`);
  return res.data;
};

export const createStoreLink = async (formData, token) => {
  const res = await axios.post(`${API_BASE_URL}/store-links`, formData, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const updateStoreLink = async (id, formData, token) => {
  const res = await axios.put(`${API_BASE_URL}/store-links/${id}`, formData, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const deleteStoreLink = async (id, token) => {
  const res = await axios.delete(`${API_BASE_URL}/store-links/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const adminLogin = async (username, password) => {
  const res = await axios.post(`${API_BASE_URL}/auth/login`, { username, password });
  return res.data;
};

export const getAdminStats = async (token) => {
  const res = await axios.get(`${API_BASE_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};

export const syncNow = async (token) => {
  const res = await axios.post(`${API_BASE_URL}/admin/sync-now`, {}, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
};