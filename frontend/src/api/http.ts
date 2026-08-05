/**
 * Real HTTP client for ResQ Hub backend.
 * All requests go through Kong API Gateway on port 3000.
 */
import axios from "axios";

const BASE_URL = import.meta.env['VITE_API_URL'] ?? "";
const TOKEN_KEY = "crp_token";
const ORG_KEY = "crp_org_id";

export const http = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// Attach JWT and org context on every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const orgId = localStorage.getItem(ORG_KEY);
  if (orgId) config.headers["x-organization-id"] = orgId;

  return config;
});

// On 401, wipe token and redirect to login
http.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(ORG_KEY);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ORG_KEY);
};
export const getStoredOrgId = () => localStorage.getItem(ORG_KEY);
export const setStoredOrgId = (id: string) => localStorage.setItem(ORG_KEY, id);
