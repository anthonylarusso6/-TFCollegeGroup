import { sessionFrom } from "./serverAuth";
// Opt-in shared-secret gate for action API endpoints.
//
// If APP_ACTION_SECRET is set on the server, callers must send a matching
// `x-app-secret` header or the request is rejected. If APP_ACTION_SECRET is
// NOT set, every request passes (behavior unchanged) — so turning this on is
// just a matter of setting two env vars in your host, no code change:
//   APP_ACTION_SECRET           = <a long random string>   (server only)
//   NEXT_PUBLIC_APP_ACTION_SECRET = <same string>          (sent by the app)
//
// Note: NEXT_PUBLIC_* is embedded in the client bundle, so this stops casual
// abuse (someone finding the raw endpoint) but is not a substitute for real
// server-side auth. It meaningfully raises the bar for the notification and
// AI endpoints without breaking the current client.
export function actionSecretOk(req) {
  const need = process.env.APP_ACTION_SECRET;
  if (!need) return true;
  return req.headers["x-app-secret"] === need;
}

// Signed-in check for action APIs (token from /api/auth, sent as Bearer).
// roles: which roles may call; athleteId: an athlete may only act on themselves.
export function requireSession(req, res, { roles = ["athlete", "coach"], athleteId } = {}) {
  const s = sessionFrom(req);
  if (!s) { res.status(401).json({ error: "signin_required" }); return null; }
  if (!roles.includes(s.role)) { res.status(403).json({ error: "forbidden" }); return null; }
  if (s.role === "athlete" && athleteId != null && String(athleteId) !== String(s.sub)) { res.status(403).json({ error: "forbidden" }); return null; }
  return s;
}
