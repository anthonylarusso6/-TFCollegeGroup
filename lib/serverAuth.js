// Server-only auth helpers: PIN checks against private tables and signed
// session tokens. Never import this from a page or component.
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

let _admin = null;
export function admin() {
  if (!process.env.SUPABASE_SERVICE_KEY) return null;
  if (!_admin) _admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
  return _admin;
}

// Signing key: SESSION_SECRET if set, otherwise derived from the service key
// (server-only), so no new environment variable is required.
function signingKey() {
  if (process.env.SESSION_SECRET) return Buffer.from(process.env.SESSION_SECRET);
  if (!process.env.SUPABASE_SERVICE_KEY) return null;
  return crypto.createHash("sha256").update("tf-session|" + process.env.SUPABASE_SERVICE_KEY).digest();
}
const b64u = (buf) => Buffer.from(buf).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
const unb64u = (s) => Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64");

export const SESSION_DAYS = 30;
export function signToken(payload, days = SESSION_DAYS) {
  const key = signingKey(); if (!key) return null;
  const body = b64u(JSON.stringify({ ...payload, exp: Date.now() + days * 86400000 }));
  const sig = b64u(crypto.createHmac("sha256", key).update(body).digest());
  return body + "." + sig;
}
export function verifyToken(token) {
  try {
    const key = signingKey(); if (!key || !token) return null;
    const [body, sig] = String(token).split(".");
    if (!body || !sig) return null;
    const want = crypto.createHmac("sha256", key).update(body).digest();
    const got = unb64u(sig);
    if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null;
    const p = JSON.parse(unb64u(body).toString());
    if (!p.exp || p.exp < Date.now()) return null;
    return p;
  } catch (e) { return null; }
}
export function sessionFrom(req) {
  const h = req.headers.authorization || "";
  return verifyToken(h.startsWith("Bearer ") ? h.slice(7) : null);
}

export const pinHash = (salt, pin) => crypto.createHash("sha256").update(salt + ":" + pin).digest("hex");
export const newSalt = () => crypto.randomBytes(16).toString("hex");
export const validPin = (p) => typeof p === "string" && /^\d{4}$/.test(p);
export function sameStr(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Attempt limiting: 5 wrong PINs locks that account for 10 minutes.
const MAX_FAILS = 5, LOCK_MS = 10 * 60 * 1000;
export async function lockedFor(db, key) {
  const { data } = await db.from("auth_attempts").select("fails,locked_until").eq("k", key).maybeSingle();
  if (data?.locked_until && new Date(data.locked_until).getTime() > Date.now()) return new Date(data.locked_until).getTime() - Date.now();
  return 0;
}
export async function recordFail(db, key) {
  const { data } = await db.from("auth_attempts").select("fails,locked_until").eq("k", key).maybeSingle();
  const expired = data?.locked_until && new Date(data.locked_until).getTime() <= Date.now();
  const fails = (expired ? 0 : data?.fails || 0) + 1;
  const locked_until = fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MS).toISOString() : null;
  await db.from("auth_attempts").upsert({ k: key, fails: locked_until ? 0 : fails, locked_until, updated_at: new Date().toISOString() });
  return { fails, locked: !!locked_until, left: Math.max(0, MAX_FAILS - fails) };
}
export async function clearFails(db, key) {
  await db.from("auth_attempts").delete().eq("k", key);
}
