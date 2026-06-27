const DEFAULT_API_BASE_URL = "https://lionfish-app-7u257.ondigitalocean.app";
const ENV_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const REQUEST_TIMEOUT_MS = 15_000;
const TOKEN_KEY = "token";
const USER_NAME_KEY = "user_name";
const USER_IS_ADMIN_KEY = "user_is_admin";
const opportunityCache = new Map();
const registrationCache = new Map();
const inFlightRequests = new Map();
const OPPORTUNITIES_TTL = 60_000;
const REGISTRATIONS_TTL = 30_000;

function getBaseUrl() {
  if (typeof window === "undefined") {
    return ENV_API_BASE_URL || DEFAULT_API_BASE_URL;
  }

  const hostname = window.location.hostname;
  const isDeployedHost = hostname !== "localhost" && hostname !== "127.0.0.1";
  const envPointsToLocalhost =
    ENV_API_BASE_URL.includes("localhost") || ENV_API_BASE_URL.includes("127.0.0.1");

  if (isDeployedHost && envPointsToLocalhost) {
    return DEFAULT_API_BASE_URL;
  }

  return ENV_API_BASE_URL || DEFAULT_API_BASE_URL;
}

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
}

function getCacheKey(prefix, value) {
  return `${prefix}:${value}`;
}

function readCachedValue(cache, key) {
  const cached = cache.get(key);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

function writeCachedValue(cache, key, data, ttl) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });
}

function readPersistedCache(key, ttl) {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(key);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed.timestamp || Date.now() - parsed.timestamp > ttl) {
      storage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

function writePersistedCache(key, data) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(
      key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      }),
    );
  } catch {}
}

function clearPersistedCache(key) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(key);
}

function fetchWithCache({ key, ttl, cache, request, persist = false }) {
  const memoryValue = readCachedValue(cache, key);
  if (memoryValue) {
    return Promise.resolve(memoryValue);
  }

  if (persist) {
    const persistedValue = readPersistedCache(key, ttl);
    if (persistedValue) {
      writeCachedValue(cache, key, persistedValue, ttl);
      return Promise.resolve(persistedValue);
    }
  }

  const activeRequest = inFlightRequests.get(key);
  if (activeRequest) {
    return activeRequest;
  }

  const pendingRequest = request()
    .then((data) => {
      writeCachedValue(cache, key, data, ttl);
      if (persist) {
        writePersistedCache(key, data);
      }
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, pendingRequest);
  return pendingRequest;
}

function invalidateRegistrationCache(token) {
  const key = getCacheKey("registrations", token || "guest");
  registrationCache.delete(key);
  clearPersistedCache(key);
}

function createAuthHeaders(token, headers = {}) {
  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
}

function createAdminQuery(params) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    query.append(key, String(value));
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

function assertApiBaseUrl() {
  if (typeof window === "undefined") {
    return;
  }

  const isProduction = process.env.NODE_ENV === "production";
  const hostname = window.location.hostname;
  const isDeployedHost = hostname !== "localhost" && hostname !== "127.0.0.1";
  const baseUrl = getBaseUrl();
  const isLocalApi =
    baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");

  if (isProduction && isDeployedHost && isLocalApi) {
    throw new Error(
      "Frontend API is still set to localhost. Set NEXT_PUBLIC_API_BASE_URL in Vercel to your deployed backend URL.",
    );
  }
}

async function fetchJson(path, options = {}) {
  assertApiBaseUrl();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${getBaseUrl()}${path}`, {
      ...options,
      signal: controller.signal,
    });

    return await toJson(response);
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Request timed out. The backend may be offline or unreachable.");
    }

    if (error instanceof TypeError) {
      throw new Error("Could not reach the backend. Check the deployed API URL and CORS settings.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function toJson(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Request failed");
  }

  return data;
}

export const api = {
  checkHealth: () => fetchJson("/health"),

  register: (data) =>
    fetchJson("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  login: (data) =>
    fetchJson("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  getMe: (token) =>
    fetchJson("/auth/me", {
      headers: createAuthHeaders(token),
    }),

  googleAuth: (credential) =>
    fetchJson("/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    }),

  getOpportunities: (region_name, type) => {
    const params = new URLSearchParams();

    if (region_name) params.append("region_name", region_name);
    if (type && type !== "all") params.append("type", type);

    const query = params.toString();
    const key = getCacheKey("opportunities", query || "all");

    return fetchWithCache({
      key,
      ttl: OPPORTUNITIES_TTL,
      cache: opportunityCache,
      persist: true,
      request: () => fetchJson(`/opportunities${query ? `?${query}` : ""}`),
    });
  },

  registerForOpportunity: (payload, token) =>
    fetchJson("/registrations", {
      method: "POST",
      headers: {
        ...createAuthHeaders(token, { "Content-Type": "application/json" }),
      },
      body: JSON.stringify(payload),
    }).then((data) => {
      invalidateRegistrationCache(token);
      return data;
    }),

  getMyRegistrations: (token) => {
    const key = getCacheKey("registrations", token || "guest");

    return fetchWithCache({
      key,
      ttl: REGISTRATIONS_TTL,
      cache: registrationCache,
      persist: true,
      request: () =>
        fetchJson("/registrations/me", {
          headers: createAuthHeaders(token),
        }),
    });
  },

  getAdminOverview: (token) =>
    fetchJson("/admin/overview", {
      headers: createAuthHeaders(token),
    }),

  getAdminAnalytics: (token) =>
    fetchJson("/admin/analytics", {
      headers: createAuthHeaders(token),
    }),

  getAdminRegistrations: (token, params = {}) =>
    fetchJson(`/admin/registrations${createAdminQuery(params)}`, {
      headers: createAuthHeaders(token),
    }),

  getAdminRegistration: (token, registrationId) =>
    fetchJson(`/admin/registrations/${registrationId}`, {
      headers: createAuthHeaders(token),
    }),

  updateAdminRegistration: (token, registrationId, data) =>
    fetchJson(`/admin/registrations/${registrationId}`, {
      method: "PUT",
      headers: createAuthHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    }),

  deleteAdminRegistration: (token, registrationId) =>
    fetchJson(`/admin/registrations/${registrationId}`, {
      method: "DELETE",
      headers: createAuthHeaders(token),
    }),

  getAdminOpportunities: (token, params = {}) =>
    fetchJson(`/admin/opportunities${createAdminQuery(params)}`, {
      headers: createAuthHeaders(token),
    }),

  createAdminOpportunity: (token, data) =>
    fetchJson("/admin/opportunities", {
      method: "POST",
      headers: createAuthHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    }),

  updateAdminOpportunity: (token, opportunityId, data) =>
    fetchJson(`/admin/opportunities/${opportunityId}`, {
      method: "PUT",
      headers: createAuthHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    }),

  deleteAdminOpportunity: (token, opportunityId) =>
    fetchJson(`/admin/opportunities/${opportunityId}`, {
      method: "DELETE",
      headers: createAuthHeaders(token),
    }),

  getAdminUsers: (token, params = {}) =>
    fetchJson(`/admin/users${createAdminQuery(params)}`, {
      headers: createAuthHeaders(token),
    }),

  getAdminUser: (token, userId) =>
    fetchJson(`/admin/users/${userId}`, {
      headers: createAuthHeaders(token),
    }),

  getAdminAdmins: (token) =>
    fetchJson("/admin/admins", {
      headers: createAuthHeaders(token),
    }),

  createAdminAdmin: (token, data) =>
    fetchJson("/admin/admins", {
      method: "POST",
      headers: createAuthHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify(data),
    }),

  deleteAdminAdmin: (token, email) =>
    fetchJson(`/admin/admins/${encodeURIComponent(email)}`, {
      method: "DELETE",
      headers: createAuthHeaders(token),
    }),
};

function emitAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("authChange"));
  }
}

export function getStoredSession() {
  if (typeof window === "undefined") {
    return { token: null, user: null };
  }

  const token = window.localStorage.getItem(TOKEN_KEY);
  const userName = window.localStorage.getItem(USER_NAME_KEY);
  const userIsAdmin = window.localStorage.getItem(USER_IS_ADMIN_KEY) === "true";

  return {
    token,
    user: userName ? { full_name: userName, is_admin: userIsAdmin } : null,
  };
}

export function clearSession() {
  if (typeof window === "undefined") {
    return;
  }

  const token = window.localStorage.getItem(TOKEN_KEY);
  invalidateRegistrationCache(token);
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_NAME_KEY);
  window.localStorage.removeItem(USER_IS_ADMIN_KEY);
  emitAuthChange();
}

export function setSession(token, userOrName, isAdmin = false) {
  if (typeof window === "undefined") {
    return;
  }

  const user =
    typeof userOrName === "object" && userOrName !== null
      ? userOrName
      : { full_name: userOrName, is_admin: isAdmin };

  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_NAME_KEY, user?.full_name || "Community Member");
  window.localStorage.setItem(USER_IS_ADMIN_KEY, user?.is_admin ? "true" : "false");
  emitAuthChange();
}
