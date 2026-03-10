import axios from "axios";

// In production, use relative URL (same origin). In development, use localhost:5000
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "/api" : "http://localhost:5000/api");

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;

// Auth API
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  updatePassword: (data) => api.put("/auth/password", data),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data) => api.put("/users/profile", data),
  updateSettings: (data) => api.put("/users/settings", data),
  updateDevice: (data) => api.put("/users/device", data),
};

// Children API
export const childrenAPI = {
  getAll: () => api.get("/children"),
  linkChild: (linkCode) => api.post("/children/link", { linkCode }),
  createChild: (data) => api.post("/children/create", data),
  getChild: (childId) => api.get(`/children/${childId}`),
  updateSettings: (childId, data) =>
    api.put(`/children/${childId}/settings`, data),
  unlinkChild: (childId) => api.delete(`/children/${childId}/unlink`),
};

// Locations API
export const locationsAPI = {
  updateLocation: (data) => api.post("/locations", data),
  getCurrentLocation: (childId) => api.get(`/locations/current/${childId}`),
  getHistory: (childId, params) =>
    api.get(`/locations/history/${childId}`, { params }),
  getAllChildrenLocations: () => api.get("/locations/all-children"),
};

// Geofences API
export const geofencesAPI = {
  getAll: () => api.get("/geofences"),
  create: (data) => api.post("/geofences", data),
  get: (id) => api.get(`/geofences/${id}`),
  update: (id, data) => api.put(`/geofences/${id}`, data),
  delete: (id) => api.delete(`/geofences/${id}`),
  toggle: (id) => api.put(`/geofences/${id}/toggle`),
};

// Alerts API
export const alertsAPI = {
  getAll: (params) => api.get("/alerts", { params }),
  getUnreadCount: () => api.get("/alerts/unread-count"),
  triggerSOS: (data) => api.post("/alerts/sos", data),
  markAsRead: (id) => api.put(`/alerts/${id}/read`),
  acknowledge: (id) => api.put(`/alerts/${id}/acknowledge`),
  markAllAsRead: () => api.put("/alerts/read-all"),
  delete: (id) => api.delete(`/alerts/${id}`),
  deleteAll: () => api.delete("/alerts"),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get("/admin/stats"),
  getUsers: (params) => api.get("/admin/users", { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAlerts: (params) => api.get("/admin/alerts", { params }),
  createAdmin: (data) => api.post("/admin/create-admin", data),
  getActivityLog: (params) => api.get("/admin/activity-log", { params }),
};
