// PIN sign-in for athletes and coaches, checked on the server.
//   POST { action: "health" }                                 → { ok, ready }
//   POST { action: "status", kind, id }                       → { hasPin }
//   POST { action: "login",  kind, id, pin }                  → { token } | { needsCreate } | { error }
//   POST { action: "create", kind, id, pin, approvePin? }     → { token } | { error }
//   POST { action: "change", newPin, athleteId? } + Bearer    → { ok } (athlete: own PIN; coach: reset an athlete's)
// Athlete PINs live in athletes.pin (hidden from the public key); coach PINs in
// the private app_pins table. 5 wrong PINs locks an account for 10 minutes.
import { admin, signToken, sessionFrom, pinHash, newSalt, validPin, sameStr, lockedFor, recordFail, clearFails } from "../../lib/serverAuth";

const COACHES = ["ant", "kevin", "mcastles"];
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function coachRow(db, id) {
  const { data } = await db.from("app_pins").select("salt,pin_hash").eq("who", "coach:" + id).maybeSingle();
  return data || null;
}
async function coachPinOk(db, id, pin) {
  const row = await coachRow(db, id);
  return !!row && sameStr(pinHash(row.salt, pin), row.pin_hash);
}
async function athleteRow(db, id) {
  const { data } = await db.from("athletes").select("id,pin,status").eq("id", id).maybeSingle();
  return data || null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const db = admin();
  const { action, kind, id } = req.body || {};
  if (action === "health") return res.status(200).json({ ok: true, ready: !!db });
  if (!db) return res.status(503).json({ error: "not_configured" });

  try {
    if (action === "status") {
      if (kind === "coach") { if (!COACHES.includes(id)) return res.status(400).json({ error: "bad_request" }); return res.json({ hasPin: !!(await coachRow(db, id)) }); }
      if (kind === "athlete") { const a = await athleteRow(db, id); if (!a) return res.status(404).json({ error: "not_found" }); return res.json({ hasPin: !!a.pin }); }
      return res.status(400).json({ error: "bad_request" });
    }

    if (action === "login" || action === "create") {
      const { pin } = req.body;
      if (!validPin(pin)) return res.status(400).json({ error: "bad_pin" });
      if (kind !== "coach" && kind !== "athlete") return res.status(400).json({ error: "bad_request" });
      if (kind === "coach" && !COACHES.includes(id)) return res.status(400).json({ error: "bad_request" });
      const key = kind + ":" + id;
      const wait = await lockedFor(db, key);
      if (wait) return res.status(429).json({ error: "locked", retryInMin: Math.ceil(wait / 60000) });

      if (kind === "athlete") {
        const a = await athleteRow(db, id);
        if (!a || a.status === "archived") return res.status(404).json({ error: "not_found" });
        if (!a.pin) {
          if (action === "login") return res.json({ needsCreate: true });
          await db.from("athletes").update({ pin }).eq("id", id);
        } else if (action === "create") {
          return res.status(409).json({ error: "already_set" });
        } else if (!sameStr(pin, a.pin)) {
          await pause(350);
          const r = await recordFail(db, key);
          return res.status(401).json({ error: r.locked ? "locked" : "wrong", left: r.left, retryInMin: r.locked ? 10 : undefined });
        }
        await clearFails(db, key);
        return res.json({ token: signToken({ role: "athlete", sub: String(id) }) });
      }

      // Coach
      const row = await coachRow(db, id);
      if (!row) {
        if (action === "login") return res.json({ needsCreate: true });
        // A new coach PIN must be approved by Coach Ant's PIN, so nobody else can claim the account.
        if (id !== "ant") {
          const approvePin = req.body.approvePin;
          const akey = "approve:coach:ant";
          const await2 = await lockedFor(db, akey);
          if (await2) return res.status(429).json({ error: "locked", retryInMin: Math.ceil(await2 / 60000) });
          if (!validPin(approvePin) || !(await coachPinOk(db, "ant", approvePin))) {
            await pause(350);
            const r = await recordFail(db, akey);
            return res.status(401).json({ error: r.locked ? "locked" : "approval_wrong", left: r.left });
          }
        }
        const salt = newSalt();
        await db.from("app_pins").insert({ who: "coach:" + id, salt, pin_hash: pinHash(salt, pin) });
      } else if (action === "create") {
        return res.status(409).json({ error: "already_set" });
      } else if (!sameStr(pinHash(row.salt, pin), row.pin_hash)) {
        await pause(350);
        const r = await recordFail(db, key);
        return res.status(401).json({ error: r.locked ? "locked" : "wrong", left: r.left, retryInMin: r.locked ? 10 : undefined });
      }
      await clearFails(db, key);
      return res.json({ token: signToken({ role: "coach", sub: String(id) }) });
    }

    if (action === "change") {
      const s = sessionFrom(req);
      if (!s) return res.status(401).json({ error: "signin_required" });
      const { newPin } = req.body;
      const target = s.role === "coach" ? req.body.athleteId : s.sub;
      if (!target) return res.status(400).json({ error: "bad_request" });
      // A coach may clear an athlete's PIN (newPin "") so they create a new one at next sign-in.
      if (!(s.role === "coach" && newPin === "") && !validPin(newPin)) return res.status(400).json({ error: "bad_pin" });
      if (s.role !== "coach" && s.role !== "athlete") return res.status(403).json({ error: "forbidden" });
      const { error } = await db.from("athletes").update({ pin: newPin || null }).eq("id", target);
      if (error) throw error;
      await clearFails(db, "athlete:" + target);
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: "bad_request" });
  } catch (e) {
    return res.status(500).json({ error: "server_error" });
  }
}
