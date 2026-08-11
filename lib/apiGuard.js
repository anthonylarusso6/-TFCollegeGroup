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
