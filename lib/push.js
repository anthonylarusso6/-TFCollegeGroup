// Client-side Web Push helpers. The public key must match the private key the
// server signs with (lib/webpush.js) or the push service rejects every send.
export const VAPID_PUBLIC_KEY =
  "BJH-bvrd9uoxQC76SpcJLkipflZHMbuN6ky8htrZ9Itd2-9o_2fqyEDb6WqglLStoE26XIT05CYI2KZ00eHL_XE";

export function urlB64ToUint8(b) {
  const p = "=".repeat((4 - (b.length % 4)) % 4);
  const s = (b + p).replace(/-/g, "+").replace(/_/g, "/");
  const r = atob(s);
  return Uint8Array.from([...r].map((c) => c.charCodeAt(0)));
}

function bufToB64url(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function saveSubscription(athleteId, sub) {
  const r = await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ athleteId, subscription: sub }),
  });
  if (!r.ok) throw new Error("Subscription save failed");
}

// Make sure this device's subscription uses our signing key and is on file with
// the server. Only runs when notification permission is already granted, so it
// never prompts. Returns the subscription, or null if push isn't set up here.
//
// Why: a subscription can exist on the phone while the server has lost it (the
// database moved projects), or it can have been made with an old key that the
// server can't sign for. Either way the athlete silently gets nothing.
export async function ensurePushSync(athleteId) {
  if (typeof window === "undefined" || !athleteId) return null;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return null;
  if (Notification.permission !== "granted") return null;

  const existing = await navigator.serviceWorker.getRegistration();
  if (!existing) return null;
  const reg = await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (sub) {
    const k = sub.options && sub.options.applicationServerKey;
    if (k && bufToB64url(k) !== VAPID_PUBLIC_KEY) {
      try { await sub.unsubscribe(); } catch (e) {}
      sub = null;
    }
  }
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(VAPID_PUBLIC_KEY) });
  }

  // Re-save at most once a day per device + athlete.
  const key = "tf_push_sync_" + athleteId;
  const stamp = sub.endpoint + "|" + new Date().toISOString().slice(0, 10);
  let last = null;
  try { last = localStorage.getItem(key); } catch (e) {}
  if (last !== stamp) {
    await saveSubscription(athleteId, sub);
    try { localStorage.setItem(key, stamp); } catch (e) {}
  }
  return sub;
}
