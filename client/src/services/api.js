const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
let csrfToken = "";

async function request(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = { Accept: "application/json", ...options.headers };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    if (!csrfToken) {
      const csrf = await fetch(`${API_URL}/auth/csrf`, { credentials: "include" });
      const csrfBody = await csrf.json().catch(() => ({}));
      if (!csrf.ok) throw new Error(csrfBody?.error?.message || "Could not start a secure session.");
      csrfToken = csrfBody.data.token;
    }
    headers["X-CSRF-Token"] = csrfToken;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      method,
      headers,
      credentials: "include"
    });
  } catch {
    throw new Error("Unable to reach CampusCart. Check that the API is running and try again.");
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error?.message || "Something went wrong. Please try again.");
    error.status = response.status;
    error.details = payload?.error?.details;
    if (response.status === 403 && /csrf/i.test(error.message)) csrfToken = "";
    throw error;
  }
  return payload?.data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" })
};

export function clearCsrfToken() {
  csrfToken = "";
}
