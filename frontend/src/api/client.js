import axios from "axios";

// On Vercel the frontend and backend are separate deployments, so the API
// can't be reached at a relative "/api" path — it needs the backend's full
// URL. Set VITE_API_URL in the frontend's environment variables (e.g.
// https://your-backend.onrender.com). Locally this stays empty and vite's
// dev proxy handles "/api" as before.
const API_BASE = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fb_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("fb_token");
      localStorage.removeItem("fb_user");
    }
    return Promise.reject(error);
  }
);

export default api;
