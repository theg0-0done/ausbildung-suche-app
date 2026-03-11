/**
 * API client for communicating with our new Node.js/Express backend.
 * Handles authentication, profile, favorites, and history.
 */

import { isNativePlatform } from "./utils/platform";

const getBackendBase = () => {
  // If explicitly set, use it. But in a production build, ignore a localhost URL.
  if (
    import.meta.env.VITE_BACKEND_URL &&
    !(
      import.meta.env.PROD &&
      import.meta.env.VITE_BACKEND_URL.includes("localhost")
    )
  ) {
    return import.meta.env.VITE_BACKEND_URL;
  }

  if (isNativePlatform() || import.meta.env.PROD) {
    return "https://ausbildung-suche-backend.onrender.com";
  }

  // Use current dev server hostname so testing on local network works.
  return `http://${window.location.hostname}:3001`;
};

export const BACKEND_URL = getBackendBase();

/**
 * Helper to make authenticated requests.
 */
async function authFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("auth_token");
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem("auth_token");
    window.location.href = "/auth";
    throw new Error("Nicht autorisiert. Bitte melde dich erneut an.");
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ── Auth ───────────────────────────────────────────────

export const authApi = {
  login: (data: Record<string, string>) =>
    authFetch("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  register: (data: Record<string, string>) =>
    authFetch("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  getMe: () => authFetch("/auth/me"),
  sendOtp: (email: string, purpose: "register" | "reset") =>
    authFetch("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email, purpose }),
    }),
  verifyOtp: (email: string, code: string, purpose: "register" | "reset") =>
    authFetch("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, code, purpose }),
    }),
  resetPassword: (email: string, newPassword: string) =>
    authFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, newPassword }),
    }),
  googleLogin: (credential: string) =>
    authFetch("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    }),
  updateProfile: (data: Record<string, string>, token?: string) =>
    authFetch("/auth/update-profile", {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    }),
};

// ── User Profile ───────────────────────────────────────

export const userApi = {
  getProfile: () => authFetch("/user/profile"),
  updateProfile: (data: Record<string, any>) =>
    authFetch("/user/profile", { method: "PUT", body: JSON.stringify(data) }),
};

// ── Favorites ──────────────────────────────────────────

export const favoritesApi = {
  getFavorites: () => authFetch("/user/favorites"),
  addFavorite: (data: Record<string, string>) =>
    authFetch("/user/favorites", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  removeFavorite: (refnr: string) =>
    authFetch(`/user/favorites/${encodeURIComponent(refnr)}`, {
      method: "DELETE",
    }),
  checkFavorite: (refnr: string) =>
    authFetch(`/user/favorites/check/${encodeURIComponent(refnr)}`),
};

// ── History ────────────────────────────────────────────

export const historyApi = {
  getHistory: () => authFetch("/user/history"),
  addHistoryObject: (data: Record<string, string>) =>
    authFetch("/user/history", { method: "POST", body: JSON.stringify(data) }),
  clearHistory: () => authFetch("/user/history", { method: "DELETE" }),

  saveSearch: (data: Record<string, any>) =>
    authFetch("/user/history/searches", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getSearches: () => authFetch("/user/history/searches"),
};
