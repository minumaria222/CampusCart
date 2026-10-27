const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
let csrfToken = "";

/**
 * Core HTTP Request Wrapper handling credentials, JSON formatting, and CSRF injection.
 */
async function request(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = { Accept: "application/json", ...options.headers };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // State-changing HTTP methods require CSRF Token
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    if (!csrfToken) {
      try {
        const csrfRes = await fetch(`${API_URL}/auth/csrf`, { credentials: "include" });
        const csrfData = await csrfRes.json().catch(() => ({}));
        if (!csrfRes.ok) {
          throw new Error(csrfData?.error?.message || "Could not establish secure session.");
        }
        csrfToken = csrfData?.data?.token || "";
      } catch (err) {
        throw new Error(err.message || "Failed to retrieve security token from server.");
      }
    }
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      method,
      headers,
      credentials: "include"
    });
  } catch (err) {
    const networkError = new Error("Unable to connect to the CampusCart API. Running in offline/fallback mode.");
    networkError.status = 503;
    throw networkError;
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.error?.message || "An unexpected error occurred.");
    error.status = response.status;
    error.details = payload?.error?.details || [];

    // If CSRF token is rejected, reset it for retry
    if (response.status === 403 && /csrf/i.test(error.message)) {
      csrfToken = "";
    }
    throw error;
  }

  return payload?.data;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body: JSON.stringify(body) }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body: JSON.stringify(body) }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" })
};

export function clearCsrfToken() {
  csrfToken = "";
}
