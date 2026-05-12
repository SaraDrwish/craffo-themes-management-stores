import axios from 'axios';

const API_BASE_URL = '/api';

// ============== الثيمات ==============
export const getAllThemes = async (platform = null, plan = null, category = null) => {
  const params = new URLSearchParams();
  if (platform) params.append('platform', platform);
  if (plan) params.append('plan', plan);
  if (category) params.append('category', category);
  const res = await axios.get(`${API_BASE_URL}/themes?${params.toString()}`);
  return res.data;
};

export const getThemeById = async (id) => {
  const res = await axios.get(`${API_BASE_URL}/themes/${id}`);
  return res.data;
};

export const createTheme = async (data, token) => {
  const res = await axios.post(`${API_BASE_URL}/themes`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateTheme = async (id, data, token) => {
  const res = await axios.put(`${API_BASE_URL}/themes/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const deleteTheme = async (id, token) => {
  const res = await axios.delete(`${API_BASE_URL}/themes/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const resetThemeApi = async (id, token) => {
  const res = await axios.post(`${API_BASE_URL}/themes/${id}/reset-api`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const reorderTheme = async (id, direction, token) => {
  const res = await axios.post(`${API_BASE_URL}/themes/${id}/reorder`, { direction }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

// ============== الفئات ==============
export const getAllCategories = async (themeId = null) => {
  const url = themeId ? `${API_BASE_URL}/categories?theme_id=${themeId}` : `${API_BASE_URL}/categories`;
  const res = await axios.get(url);
  return res.data;
};

export const createCategory = async (data, token) => {
  const res = await axios.post(`${API_BASE_URL}/categories`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateCategory = async (id, data, token) => {
  const res = await axios.put(`${API_BASE_URL}/categories/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const deleteCategory = async (id, token) => {
  const res = await axios.delete(`${API_BASE_URL}/categories/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

// ============== المتاجر (مع دعم الباقات ومنع التكرار) ==============
export const getAllStoreLinks = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const res = await axios.get(`${API_BASE_URL}/store-links?${params.toString()}`);
  return res.data;
};

export const createStoreLink = async (data, token) => {
  const res = await axios.post(`${API_BASE_URL}/store-links`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateStoreLink = async (id, data, token) => {
  const res = await axios.put(`${API_BASE_URL}/store-links/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const deleteStoreLink = async (id, token) => {
  const res = await axios.delete(`${API_BASE_URL}/store-links/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

// ============== المصادقة والإدارة ==============
export const adminLogin = async (username, password) => {
  const res = await axios.post(`${API_BASE_URL}/auth/login`, { username, password });
  return res.data;
};

export const getAdminStats = async (token) => {
  const res = await axios.get(`${API_BASE_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const syncNow = async (token) => {
  const res = await axios.post(`${API_BASE_URL}/admin/sync-now`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const importDiscordNow = async (token) => {
  const res = await axios.post(`${API_BASE_URL}/discord/import`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const triggerBackup = async (token) => {
  const res = await axios.post(`${API_BASE_URL}/admin/backup`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};