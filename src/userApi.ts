/**
 * API client for communicating with our new Node.js/Express backend.
 * Handles authentication, profile, favorites, and history.
 */

// In development, the Vite dev server runs on 5173 and backend on 3001.
// In production/native, we'll need a way to know the backend URL.
// For now, we assume the backend is hosted at a specific URL or same origin.
const getBackendBase = () => {
  const isNative =
    typeof window !== 'undefined' &&
    (window as unknown as Record<string, unknown>).Capacitor &&
    ((window as unknown as Record<string, { isNativePlatform?: () => boolean }>).Capacitor
      ?.isNativePlatform?.() ?? false);

  if (isNative) {
    // Replace with your actual backend URL when deployed
    return (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_BACKEND_URL || 'https://ausbildung-suche-backend.onrender.com';
  }

  // If in browser dev mode, use the current host so local network mobile testing works.
  return import.meta.env.DEV ? `http://${window.location.hostname}:3001` : '/backend';
};

export const BACKEND_URL = getBackendBase();

/**
 * Helper to make authenticated requests.
 */
async function authFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ── Auth ───────────────────────────────────────────────

export const authApi = {
  login: (data: Record<string, string>) => authFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: Record<string, string>) => authFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => authFetch('/auth/me'),
  sendOtp: (email: string, purpose: 'register' | 'reset') =>
    authFetch('/auth/send-otp', { method: 'POST', body: JSON.stringify({ email, purpose }) }),
  verifyOtp: (email: string, code: string, purpose: 'register' | 'reset') =>
    authFetch('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, code, purpose }) }),
  resetPassword: (email: string, newPassword: string) =>
    authFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, newPassword }) }),
  googleLogin: (credential: string) =>
    authFetch('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
};

// ── User Profile ───────────────────────────────────────

export const userApi = {
  getProfile: () => authFetch('/user/profile'),
  updateProfile: (data: Record<string, string>) => authFetch('/user/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

// ── Favorites ──────────────────────────────────────────

export const favoritesApi = {
  getFavorites: () => authFetch('/user/favorites'),
  addFavorite: (data: Record<string, string>) => authFetch('/user/favorites', { method: 'POST', body: JSON.stringify(data) }),
  removeFavorite: (refnr: string) => authFetch(`/user/favorites/${encodeURIComponent(refnr)}`, { method: 'DELETE' }),
  checkFavorite: (refnr: string) => authFetch(`/user/favorites/check/${encodeURIComponent(refnr)}`),
};

// ── History ────────────────────────────────────────────

export const historyApi = {
  getHistory: () => authFetch('/user/history'),
  addHistoryObject: (data: Record<string, string>) => authFetch('/user/history', { method: 'POST', body: JSON.stringify(data) }),
  clearHistory: () => authFetch('/user/history', { method: 'DELETE' }),
  
  saveSearch: (data: Record<string, any>) => authFetch('/user/history/searches', { method: 'POST', body: JSON.stringify(data) }),
  getSearches: () => authFetch('/user/history/searches'),
};
