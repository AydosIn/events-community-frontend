export const ADMIN_LOGIN_PATH = "/login";
export const ADMIN_UNAUTHORIZED_PATH = "/";

export function isSessionAuthError(message) {
  return message === "Not authenticated" || message === "Invalid token" || message === "User not found";
}

export function isAdminAuthError(message) {
  return isSessionAuthError(message) || message === "Admin access required";
}

export function formatDateTime(value) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getNextOffset(offset, limit, direction) {
  if (direction === "prev") {
    return Math.max(0, offset - limit);
  }

  return offset + limit;
}

export function normalizeTelegramUsername(value) {
  return String(value || "").trim().replace(/^@+/, "");
}
