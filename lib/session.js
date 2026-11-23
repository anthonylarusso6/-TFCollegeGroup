// Client session: the signed token /api/auth returns after a PIN check.
// Stored per person ("athlete_<id>", "coach_<id>", "station") for 30 days so
// Face ID can unlock it on this device. Same-origin /api/* calls get it as a
// Bearer header automatically (installFetchAuth), so components don't change.
let current = null;
const KEY = (who) => "tf_session_" + who;

function decodeExp(token) {
  try { return JSON.parse(atob(token.split(".")[0].replace(/-/g, "+").replace(/_/g, "/"))).exp || 0; } catch (e) { return 0; }
}
export function setSession(who, token) {
  current = token || null;
  try { if (token) localStorage.setItem(KEY(who), token); } catch (e) {}
}
// Returns the saved token for this person if it hasn't expired, and makes it current.
export function loadSavedSession(who) {
  try {
    const t = localStorage.getItem(KEY(who));
    if (t && decodeExp(t) > Date.now() + 60000) { current = t; return t; }
    if (t) localStorage.removeItem(KEY(who));
  } catch (e) {}
  return null;
}
export function hasSavedSession(who) {
  try { const t = localStorage.getItem(KEY(who)); return !!t && decodeExp(t) > Date.now() + 60000; } catch (e) { return false; }
}
export function clearCurrent() { current = null; }
export function currentToken() { return current; }

export async function authApi(body) {
  try {
    const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    return { status: r.status, ...j };
  } catch (e) {
    return { status: 0, error: "network" };
  }
}

// Plain-English message for a failed sign-in.
export function authErrorText(r, who = "your") {
  if (!r) return "Something went wrong. Try again.";
  if (r.error === "network" || r.status === 0) return "Can't reach the server. Check your connection and try again.";
  if (r.error === "locked") return `Too many wrong tries. Wait ${r.retryInMin || 10} minutes${who === "athlete" ? " or ask Coach Ant to reset your PIN" : ""}.`;
  if (r.error === "approval_wrong") return "That isn't Coach Ant's PIN.";
  if (r.error === "wrong") return r.left != null && r.left <= 2 ? `Wrong PIN. ${r.left} ${r.left === 1 ? "try" : "tries"} left.` : "Wrong PIN. Try again.";
  if (r.error === "already_set") return "A PIN is already set. Enter it to sign in.";
  if (r.error === "not_configured") return "Sign-in is down right now. Tell Coach Ant.";
  return "Something went wrong. Try again.";
}

export function installFetchAuth() {
  if (typeof window === "undefined" || window.__tfFetchAuth) return;
  const orig = window.fetch.bind(window);
  window.fetch = (input, init) => {
    try {
      const url = typeof input === "string" ? input : input && input.url;
      if (current && typeof url === "string" && url.startsWith("/api/") && !url.startsWith("/api/auth")) {
        const headers = { ...((init && init.headers) || {}) };
        if (!headers.Authorization && !headers.authorization) headers.Authorization = "Bearer " + current;
        init = { ...(init || {}), headers };
      }
    } catch (e) {}
    return orig(input, init);
  };
  window.__tfFetchAuth = true;
}
