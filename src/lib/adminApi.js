import { ApiError } from "./api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
const SESSION_KEY = "uos-admin-session";
export const SIGNED_OUT_EVENT = "uos-admin-signed-out";

/*
 * The admin token lives in sessionStorage: it disappears when the tab is closed, is never
 * cached by the service worker, and expires on the server after 30 minutes anyway.
 * (A cookie isn't used because the API is on a different site, where browsers like Safari
 * block cookies.)
 */
export function getSession() {
  try {
    const session = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) || "null");
    if (!session || Date.now() >= session.expiresAt) return null;
    return session;
  } catch {
    return null;
  }
}

export function saveSession({ token, expiresIn, admin }) {
  const session = { token, expiresAt: Date.now() + expiresIn * 1000, admin };
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage blocked: the session still works until the page is reloaded
  }
  return session;
}

export function clearSession() {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(SIGNED_OUT_EVENT));
}

async function adminRequest(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (auth) {
    const session = getSession();
    if (!session) {
      clearSession();
      throw new ApiError("Your admin session has ended. Please sign in again.", 401);
    }
    headers.Authorization = `Bearer ${session.token}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      credentials: "omit",
    });
  } catch {
    throw new ApiError(navigator.onLine ? "Couldn't reach the server. Please try again." : "You're offline.");
  }

  if (res.status === 204) return null;
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && auth) clearSession();
    const detail = typeof json?.detail === "string" ? json.detail : json?.error;
    const fallback = res.status === 429 ? "Too many attempts. Please wait a few minutes and try again." : "Something went wrong.";
    throw new ApiError(detail || fallback, res.status);
  }
  return json?.data ?? json;
}

export const adminLogin = (email, password, code) =>
  adminRequest("/admin/auth/login", { method: "POST", body: { email, password, code }, auth: false });

export const adminEnrol = (setupToken, code) =>
  adminRequest("/admin/auth/mfa/enrol", { method: "POST", body: { setup_token: setupToken, code }, auth: false });

export const adminLogout = () => adminRequest("/admin/auth/logout", { method: "POST" });

export const changeAdminPassword = (currentPassword, newPassword, code) =>
  adminRequest("/admin/auth/password", {
    method: "POST",
    body: { current_password: currentPassword, new_password: newPassword, code },
  });

export const getAdminStats = () => adminRequest("/admin/stats");

export function listMessages({ status = "new", q = "", page = 1 } = {}) {
  const params = new URLSearchParams({ status, page: String(page) });
  if (q.trim()) params.set("q", q.trim());
  return adminRequest(`/admin/messages?${params}`);
}

export const getMessage = (id) => adminRequest(`/admin/messages/${encodeURIComponent(id)}`);

export const updateMessage = (id, changes) =>
  adminRequest(`/admin/messages/${encodeURIComponent(id)}`, { method: "PATCH", body: changes });

export const deleteMessage = (id) => adminRequest(`/admin/messages/${encodeURIComponent(id)}`, { method: "DELETE" });

export const eraseMessagesFrom = (email) => adminRequest("/admin/messages/erase", { method: "POST", body: { email } });

export const syncFaresNow = () => adminRequest("/admin/fares/sync", { method: "POST" });

export const getAuditLog = (page = 1) => adminRequest(`/admin/audit?page=${page}`);

export const sendTestAlert = () => adminRequest("/admin/alerts/test", { method: "POST" });

// ── Admin accounts and invites ──
export const listAdmins = () => adminRequest("/admin/admins");
export const adminAction = (id, action) => adminRequest(`/admin/admins/${encodeURIComponent(id)}/${action}`, { method: "POST" });
export const deleteAdmin = (id) => adminRequest(`/admin/admins/${encodeURIComponent(id)}`, { method: "DELETE" });
export const inviteAdmin = (email, name) => adminRequest("/admin/invites", { method: "POST", body: { email, name } });
export const revokeInvite = (id) => adminRequest(`/admin/invites/${encodeURIComponent(id)}`, { method: "DELETE" });
export const acceptInvite = (token, password) =>
  adminRequest("/admin/auth/accept-invite", { method: "POST", body: { token, password }, auth: false });

// ── Content editing ──
export const listContentTickets = () => adminRequest("/admin/content/tickets");
export const createTicket = (ticket) => adminRequest("/admin/content/tickets", { method: "POST", body: ticket });
export const updateTicket = (id, changes) =>
  adminRequest(`/admin/content/tickets/${encodeURIComponent(id)}`, { method: "PATCH", body: changes });
export const deleteTicket = (id) => adminRequest(`/admin/content/tickets/${encodeURIComponent(id)}`, { method: "DELETE" });
export const updateZone = (id, changes) =>
  adminRequest(`/admin/content/zones/${encodeURIComponent(id)}`, { method: "PATCH", body: changes });
export const createLocation = (location) => adminRequest("/admin/content/locations", { method: "POST", body: location });
export const updateLocation = (id, changes) =>
  adminRequest(`/admin/content/locations/${encodeURIComponent(id)}`, { method: "PATCH", body: changes });
export const deleteLocation = (id) => adminRequest(`/admin/content/locations/${encodeURIComponent(id)}`, { method: "DELETE" });
export const getContentNotes = () => adminRequest("/admin/content/meta");
export const updateContentNote = (key, value) =>
  adminRequest(`/admin/content/meta/${encodeURIComponent(key)}`, { method: "PUT", body: { value } });
