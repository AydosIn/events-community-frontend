const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const TOKEN_KEY = "token";
const USER_NAME_KEY = "user_name";
const opportunityCache = new Map();
const registrationCache = new Map();
const inFlightRequests = new Map();
const OPPORTUNITIES_TTL = 60_000;
const REGISTRATIONS_TTL = 30_000;

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

async function toJson(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Request failed");
  }

  return data;
}

export const api = {
  register: (data) =>
    fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(toJson),

  login: (data) =>
    fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(toJson),

  googleAuth: (credential) =>
    fetch(`${BASE_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    }).then(toJson),

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
      request: () => fetch(`${BASE_URL}/opportunities${query ? `?${query}` : ""}`).then(toJson),
    });
  },

  registerForOpportunity: (opportunity_id, token) =>
    fetch(`${BASE_URL}/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ opportunity_id }),
    }).then((response) =>
      toJson(response).then((data) => {
        invalidateRegistrationCache(token);
        return data;
      }),
    ),

  getMyRegistrations: (token) => {
    const key = getCacheKey("registrations", token || "guest");

    return fetchWithCache({
      key,
      ttl: REGISTRATIONS_TTL,
      cache: registrationCache,
      persist: true,
      request: () =>
        fetch(`${BASE_URL}/registrations/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(toJson),
    });
  },
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

  return {
    token,
    user: userName ? { full_name: userName } : null,
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
  emitAuthChange();
}

export function setSession(token, userName) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_NAME_KEY, userName);
  emitAuthChange();
}
