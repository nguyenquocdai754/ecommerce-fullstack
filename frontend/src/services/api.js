import axios from "axios";

const configuredApiUrl = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").trim().replace(/\/+$/, "");
const apiBaseUrl = /\/api$/i.test(configuredApiUrl) ? configuredApiUrl : `${configuredApiUrl}/api`;

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
