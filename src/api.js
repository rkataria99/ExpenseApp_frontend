// frontend/src/api.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "auth:token";

// --- token helpers ---
export const getAuthToken = () => localStorage.getItem(TOKEN_KEY) || null;

export const setAuthToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  // Let the app know auth is gone (optional to listen in components)
  window.dispatchEvent(new CustomEvent("auth:logout"));
};

// --- axios instance ---
export const api = axios.create({ baseURL: API_BASE });

// Attach Authorization header if token exists
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 handler -> clear token and notify UI
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      clearAuth();
    }
    return Promise.reject(err);
  }
);

// --- Auth convenience methods (optional; use anywhere in UI) ---
export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  // expecting { token, user }
  if (data?.token) setAuthToken(data.token);
  window.dispatchEvent(new CustomEvent("auth:login", { detail: data?.user || null }));
  return data;
}

export async function register(name, email, password) {
  const { data } = await api.post("/auth/register", { name, email, password });
  // expecting { token, user }
  if (data?.token) setAuthToken(data.token);
  window.dispatchEvent(new CustomEvent("auth:login", { detail: data?.user || null }));
  return data;
}

export async function me() {
  // returns current user profile if token is valid
  const { data } = await api.get("/auth/me");
  return data;
}

export function logout() {
  clearAuth();
}
