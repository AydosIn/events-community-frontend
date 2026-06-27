const TYPE_PATHS = {
  club: "/clubs",
  project: "/projects",
  workshop: "/workshops",
};

const ALLOWED_NEXT_PATHS = new Set(["/", "/clubs", "/projects", "/workshops", "/faq"]);

export function getOpportunityListPath(type) {
  return TYPE_PATHS[type] || "/";
}

export function isSafeInternalPath(path) {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) {
    return false;
  }

  const basePath = path.split("?")[0];
  return ALLOWED_NEXT_PATHS.has(basePath);
}

export function buildLoginUrl({ nextPath, joinId } = {}) {
  const params = new URLSearchParams();

  if (nextPath && isSafeInternalPath(nextPath)) {
    params.set("next", nextPath);
  }

  if (joinId) {
    params.set("join", String(joinId));
  }

  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}

export function getPostAuthRedirect(query, isAdmin) {
  if (isAdmin) {
    return "/admin";
  }

  const next = typeof query.next === "string" ? query.next : "/";
  const safeNext = isSafeInternalPath(next) ? next : "/";
  const join = typeof query.join === "string" && /^\d+$/.test(query.join) ? query.join : "";

  if (join) {
    const separator = safeNext.includes("?") ? "&" : "?";
    return `${safeNext}${separator}join=${join}`;
  }

  return safeNext;
}
