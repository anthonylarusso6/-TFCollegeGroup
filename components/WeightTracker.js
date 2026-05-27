import { useState, useEffect } from "react";
import { BG, PUR, RED, GREEN, GOLD, STEEL, ORANGE } from "../lib/constants";
import { supabase } from "../lib/supabase";
const VAPID_KEY = "BObWJUwxM9tPxbrXUhj4JW15F1ngheVLKhqlSiQklDc0LtlPMITMNB1D-jx8ywwEnZfPsYKGCI5EmgCMqfRt2IU";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

const epley = (entries) => {
  const n = entries.length;
  if (n < 2) return null;
  const xs = entries.map((e, i) => i);
  const ys = entries.map(e => parseFloat(e.weight));
  const sumX = xs.reduce((s, x) => s + x, 0);
  const sumY = ys.reduce((s, y) => s + y, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumX2 = xs.reduce((s, x) => s + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
};

const predictGoalDate = (entries, goalWeight, goalMode) => {
  if (entries.length < 4) return null;
  const recent = entries.slice(-14);
  const xs = recent.map(e => new Date(e.date).getTime() / 86400000);
  const ys = recent.map(e => parseFloat(e.weight));
  const n = xs.length;
  const sumX = xs.reduce((s, x) => s + x, 0);
  const sumY = ys.reduce((s, y) => s + y, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumX2 = xs.reduce((s, x) => s + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  if (Math.abs(slope) < 0.005) return null;
  if (goalMode === "lose" && slope >= 0) return null;
  if (goalMode === "gain" && slope <= 0) return null;
  const intercept = (sumY - slope * sumX) / n;
  const targetX = (goalWeight - intercept) / slope;
  const targetDate = new Date(targetX * 86400000);
  const now = new Date();
  if (targetDate <= now) return null;
  if (targetDate > new Date(now.getTime() + 365 * 86400000)) return null;
  return targetDate;
};

export default function WeightTracker({ athleteId }) {
  const[entries, setEntries] = useState([]);
  const[weight, setWeight] = useState("");
  const[goalWeight, setGoalWeight] = useState("");
  const[goalMode, setGoalMode] = useState("lose");
  const[saving, setSaving] = useState(false);
  const[saved, setSaved] = useState(false);
  const[error, setError] = useState("");
  const[showGoalInput, setShowGoalInput] = useState(false);
  const[notes, setNotes] = useState({});
  const[noteInput, setNoteInput] = useState("");
  const[editingNote, setEditingNote] = useState(null);
  const[savingNote, setSavingNote] = useState(false);
  const[notifState, setNotifState] = useState("idle"); // idle | requesting | enabled | denied | unsupported
  const[notifLoading, setNotifLoading] = useState(false);

  const loadEntries = async () => {
    try {
      const { data, error: err } = await supabase.from("weight_log").select("*").eq("athlete_id", athleteId).order("date", { ascending: true });
      if (err) { setError("Could not load entries: " + err.message); return; }
      setEntries(data || []);
    } catch (e) { setError("Could not load entries."); }
  };

  const loadGoal = async () => {
    try {
      const { data } = await supabase.from("announcements").select("message,week_label").eq("type", "weight_goal").eq("day", String(athleteId)).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (data) {
        if (data.message) setGoalWeight(data.message);
        if (data.week_label) setGoalMode(data.week_label);
      } else {
        const sg = localStorage.getItem("goal_weight_" + athleteId);
        const sm = localStorage.getItem("goal_mode_" + athleteId);
        if (sg) setGoalWeight(sg);
        if (sm) setGoalMode(sm);
      }
    } catch (e) {
      const sg = localStorage.getItem("goal_weight_" + athleteId);
      const sm = localStorage.getItem("goal_mode_" + athleteId);
      if (sg) setGoalWeight(sg);
      if (sm) setGoalMode(sm);
    }
  };

  const loadNotes = async () => {
    try {
      const { data } = await supabase.from("announcements").select("week_label,message,created_at").eq("type", "weight_note").eq("day", String(athleteId)).order("created_at", { ascending: false });
      const map = {};
      (data || []).forEach(r => { if (!map[r.week_label]) map[r.week_label] = r.message; });
      setNotes(map);
    } catch (e) {}
  };

  const checkNotifStatus = async () => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setNotifState("unsupported"); return;
    }
    const perm = Notification.permission;
    if (perm === "denied") { setNotifState("denied"); return; }
    if (perm === "granted") {
      try {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) { setNotifState("enabled"); return; }
        }
      } catch (e) {}
    }
    setNotifState("idle");
  };

  useEffect(() => { loadEntries(); loadGoal(); loadNotes(); checkNotifStatus(); }, []);

  const persistGoal = async (val, mode) => {
    try { localStorage.setItem("goal_weight_" + athleteId, val); localStorage.setItem("goal_mode_" + athleteId, mode); } catch (e) {}
    try { await supabase.from("announcements").insert({ type: "weight_goal", day: String(athleteId), message: String(val), week_label: mode, active: true }); } catch (e) {}
  };

  const save = async () => {
    if (!weight) return;
    setSaving(true); setError("");
    try {
      const estNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
      const today = estNow.getFullYear() + "-" + String(estNow.getMonth() + 1).padStart(2, "0") + "-" + String(estNow.getDate()).padStart(2, "0");
      const existing = entries.find(e => e.date === today);
      if (existing) {
        const { error: err } = await supabase.from("weight_log").update({ weight: parseFloat(weight) }).eq("id", existing.id);
        if (err) { setError("Save failed: " + err.message); return; }
      } else {
        const { error: err } = await supabase.from("weight_log").insert({ athlete_id: athleteId, date: today, weight: parseFloat(weight) });
        if (err) { setError("Save failed: " + err.message); return; }
      }
      await loadEntries();
      setWeight(""); setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e) { setError("Save failed. Please try again."); }
    finally { setSaving(false); }
  };

  const saveGoal = async (val, mode) => {
    setGoalWeight(val); setGoalMode(mode); setShowGoalInput(false);
    await persistGoal(val, mode);
  };

  const saveNote = async (date) => {
    if (!noteInput.trim()) { setEditingNote(null); return; }
    setSavingNote(true);
    try {
      await supabase.from("announcements").insert({ type: "weight_note", day: String(athleteId), week_label: date, message: noteInput.trim(), active: true });
      setNotes(prev => ({ ...prev, [date]: noteInput.trim() }));
    } catch (e) {}
    setSavingNote(false); setEditingNote(null); setNoteInput("");
  };

  const enableNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) { setNotifState("unsupported"); return; }
    setNotifLoading(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setNotifState("denied"); setNotifLoading(false); return; }
      let reg = await navigator.serviceWorker.getRegistration("/sw.js");
      if (!reg) reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
      });
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athleteId, subscription: sub }),
      });
      setNotifState("enabled");
    } catch (e) { setNotifState("denied"); }
    setNotifLoading(false);
  };

  const disableNotifications = async () => {
    setNotifLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      if (reg) { const sub = await reg.pushManager.getSubscription(); if (sub) await sub.unsubscribe(); }
      await fetch("/api/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ athleteId }) });
      setNotifState("idle");
    } catch (e) {}
    setNotifLoading(false);
  };

  // ── Computed analytics ────────────────────────────────────
  const first = entries[0]?.weight != null ? parseFloat(entries[0].weight) : null;
  const latest = entries[entries.length - 1]?.weight != null ? parseFloat(entries[entries.length - 1].weight) : null;
  const diff = first != null && latest != null ? parseFloat((latest - first).toFixed(1)) : null;
  const goal = parseFloat(goalWeight) || null;

  // Streak
  const streak = (() => {
    if (!entries.length) return 0;
    const estNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    const dateSet = new Set(entries.map(e => e.date));
    let s = 0;
    const d = new Date(estNow);
    while (true) {
      const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      if (dateSet.has(key)) { s++; d.setDate(d.getDate() - 1); } else break;
    }
    return s;
  })();

  // 7-day rolling average
  const rollingAvg = entries.map((_, i) => {
    const window = entries.slice(Math.max(0, i - 6), i + 1);
    return parseFloat((window.reduce((s, e) => s + parseFloat(e.weight), 0) / window.length).toFixed(1));
  });

  // Predicted goal date
  const predictedDate = goal ? predictGoalDate(entries, goal, goalMode) : null;

  // Calendar dots (last 35 days)
  const calDots = (() => {
    const estNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    const dateSet = new Set(entries.map(e => e.date));
    const dots = [];
    for (let i = 34; i >= 0; i--) {
      const d = new Date(estNow); d.setDate(d.getDate() - i);
      const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      dots.push({ date: key, logged: dateSet.has(key) });
    }
    return dots;
  })();

  // Day-of-week averages
  const DOW_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dowMap = {};
  entries.forEach(e => {
    const d = new Date(e.date).getDay();
    if (!dowMap[d]) dowMap[d] = [];
    dowMap[d].push(parseFloat(e.weight));
  });
  const dowAvgs = Object.entries(dowMap)
    .filter(([, ws]) => ws.length >= 2)
    .map(([d, ws]) => ({ day: DOW_NAMES[d], avg: parseFloat((ws.reduce((s, w) => s + w, 0) / ws.length).toFixed(1)), count: ws.length }))
    .sort((a, b) => b.avg - a.avg);

  // Weekly ranges (fluctuation bands)
  const weekRanges = {};
  entries.forEach(e => {
    const d = new Date(e.date);
    const ws = new Date(d); ws.setDate(d.getDate() - d.getDay());
    const key = ws.getFullYear() + "-" + String(ws.getMonth() + 1).padStart(2, "0") + "-" + String(ws.getDate()).padStart(2, "0");
    if (!weekRanges[key]) weekRanges[key] = { min: Infinity, max: -Infinity };
    const w = parseFloat(e.weight);
    weekRanges[key].min = Math.min(weekRanges[key].min, w);
    weekRanges[key].max = Math.max(weekRanges[key].max, w);
  });

  // Chart data (last 10 entries)
  const chartData = entries.slice(-10);
  const chartH = 80, chartW = 100;
  const weights = chartData.map(e => parseFloat(e.weight));
  const raWeights = rollingAvg.slice(-10);
  const allVals = [...weights, ...raWeights].filter(Boolean);
  const chartMin = allVals.length ? Math.min(...allVals) - 2 : 0;
  const chartMax = allVals.length ? Math.max(...allVals) + 2 : 100;
  const toY = v => chartH - ((v - chartMin) / (Math.max(chartMax - chartMin, 1))) * chartH;
  const pts = weights.map((w, i) => { const x = (i / (Math.max(weights.length - 1, 1))) * chartW; return `${x},${toY(w)}`; }).join(" ");
  const raPts = raWeights.map((w, i) => { const x = (i / (Math.max(raWeights.length - 1, 1))) * chartW; return `${x},${toY(w)}`; }).join(" ");

  // Maintenance: ±3 lb tolerance zone
  const MAINTAIN_RANGE = 3;

  // Goal progress
  const getProgress = () => {
    if (!goal || first == null || latest == null) return { pct: 0, onTrack: false, lbsLeft: null, msg: "" };
    if (goalMode === "maintain") {
      const inRange = Math.abs(latest - goal) <= MAINTAIN_RANGE;
      const deviation = parseFloat((latest - goal).toFixed(1));
      const recent = entries.slice(-14);
      const inRangeDays = recent.filter(e => Math.abs(parseFloat(e.weight) - goal) <= MAINTAIN_RANGE).length;
      const stabilityPct = recent.length > 0 ? Math.round((inRangeDays / recent.length) * 100) : 0;
      return { pct: stabilityPct, onTrack: inRange, lbsLeft: deviation, goalReached: false, isMaintain: true, inRange, deviation, stabilityPct, msg: inRange ? `✅ In range — ${Math.abs(deviation) < 0.1 ? "spot on!" : Math.abs(deviation).toFixed(1) + " lbs " + (deviation > 0 ? "above" : "below") + " target"}` : `⚠ ${Math.abs(deviation).toFixed(1)} lbs ${deviation > 0 ? "above" : "below"} your maintenance target` };
    }
    if (goalMode === "lose") {
      const pct = (first - goal) > 0 ? Math.min(100, Math.round(((first - latest) / (first - goal)) * 100)) : 0;
      const lbsLeft = parseFloat((latest - goal).toFixed(1));
      const onTrack = diff <= 0;
      const goalReached = latest <= goal;
      return { pct, onTrack, lbsLeft, goalReached, msg: goalReached ? "🎉 Goal reached! You did it!" : onTrack ? "↓ On track — keep going!" : "⚠ Weight went up — refocus!" };
    } else {
      const pct = (goal - first) > 0 ? Math.min(100, Math.round(((latest - first) / (goal - first)) * 100)) : 0;
      const lbsLeft = parseFloat((goal - latest).toFixed(1));
      const onTrack = diff >= 0;
      const goalReached = latest >= goal;
      return { pct, onTrack, lbsLeft, goalReached, msg: goalReached ? "🎉 Goal reached! You bulked up!" : onTrack ? "↑ On track — keep eating!" : "⚠ Weight dropped — refocus!" };
    }
  };
  const progress = getProgress();
  const progressColor = progress.isMaintain ? (progress.inRange ? GREEN : RED) : progress.goalReached ? GREEN : progress.onTrack ? ORANGE : RED;

  // Weekly log
  const byWeek = [];
  entries.forEach(e => {
    const d = new Date(e.date);
    const ws = new Date(d); ws.setDate(d.getDate() - d.getDay());
    const key = ws.getFullYear() + "-" + String(ws.getMonth() + 1).padStart(2, "0") + "-" + String(ws.getDate()).padStart(2, "0");
    const ex = byWeek.find(w => w.key === key);
    if (ex) { ex.entries.push(e); ex.avg = parseFloat((ex.entries.reduce((s, x) => s + parseFloat(x.weight), 0) / ex.entries.length).toFixed(1)); }
    else byWeek.push({ key, label: "Week of " + ws.toLocaleDateString("en-US", { month: "short", day: "numeric" }), entries: [e], avg: parseFloat(e.weight) });
  });

  return (
    <div>
      {/* ── Hero log card ── */}
      <div style={{ background: BG, borderRadius: 16, padding: "1.5rem", marginBottom: 12, border: "1px solid #222", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg," + GREEN + "," + ORANGE + ")" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>⚖️ Weight Tracker</div>
          {streak > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: streak >= 7 ? GOLD + "22" : "#1a1a1a", border: "1px solid " + (streak >= 7 ? GOLD + "44" : "#333"), borderRadius: 8, padding: "4px 10px" }}>
              <span style={{ fontSize: 14 }}>{streak >= 14 ? "🔥" : streak >= 7 ? "⚡" : "📅"}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: streak >= 7 ? GOLD : "#aaa" }}>{streak}</span>
              <span style={{ fontSize: 9, color: "#555" }}>day streak</span>
            </div>
          )}
        </div>

        {entries.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Start", val: first, color: "#555" },
              { label: "Now", val: latest, color: "#fff" },
              { label: "Change", val: diff === null ? "—" : (diff > 0 ? "+" : "") + diff, color: diff === null ? "#555" : diff < 0 ? GREEN : diff > 0 ? RED : "#fff" }
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Chart with rolling average */}
        {weights.length > 1 && (
          <div style={{ marginBottom: 16 }}>
            <svg viewBox={`-4 -4 ${chartW + 8} ${chartH + 8}`} style={{ width: "100%", height: 90, overflow: "visible" }}>
              <defs>
                <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ORANGE} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={ORANGE} stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={`0,${chartH} ${pts} ${chartW},${chartH}`} fill="url(#wg)" />
              <polyline points={pts} fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {/* Rolling average line */}
              {raWeights.length > 1 && (
                <polyline points={raPts} fill="none" stroke={GREEN} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3,3" />
              )}
              {weights.map((w, i) => {
                const x = (i / (Math.max(weights.length - 1, 1))) * chartW;
                const y = toY(w);
                const isLast = i === weights.length - 1;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r={isLast ? 4 : 2} fill={isLast ? "#fff" : ORANGE} stroke={isLast ? ORANGE : "none"} strokeWidth="2" />
                    {isLast && <text x={x} y={y - 8} textAnchor="middle" fontSize="9" fill="#fff" fontFamily="Georgia">{w}</text>}
                  </g>
                );
              })}
              {goal && goalMode !== "maintain" && goal >= chartMin && goal <= chartMax && (
                <>
                  <line x1="0" y1={toY(goal)} x2={chartW} y2={toY(goal)} stroke={GOLD} strokeWidth="1.5" strokeDasharray="5,4" />
                  <text x={chartW + 2} y={toY(goal) + 3} fontSize="8" fill={GOLD} fontFamily="Georgia">goal</text>
                </>
              )}
              {goal && goalMode === "maintain" && (
                <>
                  {(goal + MAINTAIN_RANGE) <= chartMax && (goal + MAINTAIN_RANGE) >= chartMin && (
                    <line x1="0" y1={toY(goal + MAINTAIN_RANGE)} x2={chartW} y2={toY(goal + MAINTAIN_RANGE)} stroke={GREEN} strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
                  )}
                  {(goal - MAINTAIN_RANGE) >= chartMin && (goal - MAINTAIN_RANGE) <= chartMax && (
                    <line x1="0" y1={toY(goal - MAINTAIN_RANGE)} x2={chartW} y2={toY(goal - MAINTAIN_RANGE)} stroke={GREEN} strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
                  )}
                  {goal >= chartMin && goal <= chartMax && (
                    <line x1="0" y1={toY(goal)} x2={chartW} y2={toY(goal)} stroke={GREEN} strokeWidth="1.5" strokeDasharray="5,4" />
                  )}
                  <text x={chartW + 2} y={toY(goal) + 3} fontSize="8" fill={GREEN} fontFamily="Georgia">±3</text>
                </>
              )}
            </svg>
            {raWeights.length > 1 && (
              <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: -4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 10, height: 2, background: ORANGE, borderRadius: 1 }} /><span style={{ fontSize: 9, color: "#444" }}>Daily</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 10, height: 2, background: GREEN, borderRadius: 1 }} /><span style={{ fontSize: 9, color: "#444" }}>7-day avg</span></div>
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
          <input type="text" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Enter lbs..."
            style={{ flex: 1, padding: "14px", borderRadius: 10, border: "1px solid #333", fontSize: 18, fontFamily: "Georgia,serif", background: "#1a1a1a", color: "#fff", textAlign: "center" }} />
          <button onClick={save} disabled={!weight || saving}
            style={{ padding: "14px 20px", borderRadius: 10, border: "none", background: weight ? "linear-gradient(135deg," + ORANGE + "," + RED + ")" : "#222", color: weight ? "#fff" : "#444", fontSize: 14, fontWeight: 600, cursor: weight ? "pointer" : "not-allowed", fontFamily: "Georgia,serif", minWidth: 80 }}>
            {saved ? "✓" : saving ? "..." : "Save"}
          </button>
        </div>
        {error && <div style={{ fontSize: 13, color: "#fff", background: RED, borderRadius: 8, padding: "10px 14px", marginBottom: 8, fontWeight: 500 }}>{error}</div>}
        <div style={{ fontSize: 10, color: "#444", textAlign: "center" }}>Private — only you can see this</div>
      </div>

      {/* ── Notification card ── */}
      {notifState !== "unsupported" && (
        <div style={{ background: BG, borderRadius: 12, padding: "12px 16px", marginBottom: 12, border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "#fff", fontWeight: 600, marginBottom: 2 }}>🔔 Weight Reminders</div>
            <div style={{ fontSize: 10, color: "#555" }}>
              {notifState === "enabled" ? "Reminders on — Mon & Fri before lift" : notifState === "denied" ? "Blocked — enable in browser settings" : "Get reminded Mon & Fri before lift + after sessions"}
            </div>
          </div>
          {notifState === "enabled" ? (
            <button onClick={disableNotifications} disabled={notifLoading}
              style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #333", background: "#111", color: "#888", fontSize: 11, cursor: "pointer", fontFamily: "Georgia,serif", flexShrink: 0 }}>
              {notifLoading ? "..." : "Turn off"}
            </button>
          ) : notifState === "denied" ? (
            <div style={{ fontSize: 10, color: "#555", flexShrink: 0 }}>Check browser</div>
          ) : (
            <button onClick={enableNotifications} disabled={notifLoading}
              style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg," + PUR + "," + PUR + "aa)", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "Georgia,serif", flexShrink: 0 }}>
              {notifLoading ? "..." : "Enable"}
            </button>
          )}
        </div>
      )}

      {/* ── Goal card ── */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", marginBottom: 12, border: "0.5px solid #e0e0e0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: goal ? 12 : 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>🎯 Goal weight</div>
          <button onClick={() => setShowGoalInput(!showGoalInput)} style={{ fontSize: 12, color: ORANGE, background: "none", border: "none", cursor: "pointer", fontFamily: "Georgia,serif", fontWeight: 500 }}>{goal ? "Edit" : "Set goal →"}</button>
        </div>
        {(showGoalInput || goal) && (
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {[{ id: "lose", label: "🔻 Lose" }, { id: "maintain", label: "⚖️ Maintain" }, { id: "gain", label: "📈 Gain" }].map(m => (
              <button key={m.id} onClick={() => { setGoalMode(m.id); if (goalWeight) persistGoal(goalWeight, m.id); }}
                style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid " + (goalMode === m.id ? ORANGE : "#e0e0e0"), background: goalMode === m.id ? ORANGE + "15" : "#fafafa", color: goalMode === m.id ? ORANGE : "#888", fontSize: 11, fontWeight: goalMode === m.id ? 700 : 400, cursor: "pointer", fontFamily: "Georgia,serif" }}>
                {m.label}
              </button>
            ))}
          </div>
        )}
        {showGoalInput && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input type="text" inputMode="decimal" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} placeholder={goalMode === "lose" ? "Target low (lbs)" : "Target high (lbs)"}
              style={{ flex: 1, padding: "10px", borderRadius: 8, border: "0.5px solid #e0e0e0", fontSize: 14, fontFamily: "Georgia,serif", background: "#fafafa", textAlign: "center" }} />
            <button onClick={() => saveGoal(goalWeight, goalMode)} style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: ORANGE, color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "Georgia,serif" }}>Save</button>
          </div>
        )}
        {goal && !showGoalInput && (
          <div>
            {progress.msg && (
              <div style={{ fontSize: 12, fontWeight: 600, color: progressColor, marginBottom: 10, padding: "8px 12px", background: progressColor + "11", borderRadius: 8, border: "1px solid " + progressColor + "33" }}>
                {progress.msg}
              </div>
            )}
            {/* Maintenance stability display */}
            {progress.isMaintain && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1, textAlign: "center", padding: "10px", background: "#f9f9f9", borderRadius: 10, border: "0.5px solid #eee" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#1a1a1a" }}>{goal}</div>
                    <div style={{ fontSize: 9, color: "#aaa" }}>target lbs</div>
                  </div>
                  <div style={{ flex: 1, textAlign: "center", padding: "10px", background: "#f9f9f9", borderRadius: 10, border: "0.5px solid #eee" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#aaa" }}>{goal - MAINTAIN_RANGE}–{goal + MAINTAIN_RANGE}</div>
                    <div style={{ fontSize: 9, color: "#aaa" }}>±3 lb zone</div>
                  </div>
                  <div style={{ flex: 1, textAlign: "center", padding: "10px", background: progress.stabilityPct >= 80 ? GREEN + "11" : "#f9f9f9", borderRadius: 10, border: "0.5px solid " + (progress.stabilityPct >= 80 ? GREEN + "33" : "#eee") }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: progress.stabilityPct >= 80 ? GREEN : "#1a1a1a" }}>{progress.stabilityPct}%</div>
                    <div style={{ fontSize: 9, color: "#aaa" }}>in range (14d)</div>
                  </div>
                </div>
                <div style={{ height: 6, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: progress.stabilityPct + "%", height: "100%", background: "linear-gradient(90deg," + GREEN + "," + GREEN + "88)", borderRadius: 3 }} />
                </div>
              </div>
            )}
            {/* Predicted date */}
            {predictedDate && !progress.goalReached && !progress.isMaintain && (
              <div style={{ fontSize: 11, color: "#1a1a1a", marginBottom: 10, padding: "7px 12px", background: "#f5f9ff", borderRadius: 8, border: "0.5px solid #d0e0ff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#888" }}>📅 At your current rate:</span>
                <span style={{ fontWeight: 700 }}>{predictedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </div>
            )}
            {/* Directional progress ring — lose/gain only */}
            {!progress.isMaintain && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
              <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                <svg viewBox="0 0 72 72" style={{ width: 72, height: 72, transform: "rotate(-90deg)" }}>
                  <circle cx="36" cy="36" r="30" fill="none" stroke="#f0f0f0" strokeWidth="7" />
                  <circle cx="36" cy="36" r="30" fill="none" stroke={progressColor} strokeWidth="7"
                    strokeDasharray={`${Math.min(progress.pct, 100) * 1.885} 188.5`} strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 4px ${progressColor}88)` }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: progressColor, lineHeight: 1 }}>{Math.min(progress.pct, 100)}</div>
                  <div style={{ fontSize: 9, color: "#aaa" }}>%</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a" }}>{latest || 0}</div><div style={{ fontSize: 9, color: "#aaa" }}>current</div></div>
                  <div style={{ color: "#ccc" }}>→</div>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 800, color: progressColor }}>{goal}</div><div style={{ fontSize: 9, color: "#aaa" }}>{goalMode === "lose" ? "goal (low)" : "goal (high)"}</div></div>
                </div>
                <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "visible", position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: Math.min(progress.pct, 100) + "%", background: `linear-gradient(90deg,${progressColor},${progressColor}99)`, borderRadius: 4, boxShadow: `0 0 8px ${progressColor}66` }} />
                  <div style={{ position: "absolute", top: "50%", left: Math.min(progress.pct, 100) + "%", transform: "translate(-50%,-50%)", width: 16, height: 16, borderRadius: "50%", background: progressColor, border: "2px solid #fff", boxShadow: `0 0 8px ${progressColor}` }} />
                </div>
                {!progress.goalReached && progress.lbsLeft != null && (
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 6, textAlign: "center" }}>{Math.abs(progress.lbsLeft)} lbs to go</div>
                )}
              </div>
            </div>
            )}
          </div>
        )}
        {!goal && !showGoalInput && <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>Set a target and track your progress.</div>}
      </div>

      {/* ── Calendar consistency grid ── */}
      {entries.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", marginBottom: 12, border: "0.5px solid #e0e0e0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>📆 Consistency</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>{calDots.filter(d => d.logged).length}/35 days</div>
          </div>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {calDots.map((dot, i) => (
              <div key={i} title={dot.date}
                style={{ width: 11, height: 11, borderRadius: 3, background: dot.logged ? GREEN : "#f0f0f0", flexShrink: 0 }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: GREEN }} /><span style={{ fontSize: 9, color: "#aaa" }}>Logged</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: "#f0f0f0" }} /><span style={{ fontSize: 9, color: "#aaa" }}>Missed</span></div>
            {streak > 0 && <div style={{ marginLeft: "auto", fontSize: 10, color: streak >= 7 ? GOLD : "#aaa", fontWeight: streak >= 7 ? 700 : 400 }}>🔥 {streak}-day streak</div>}
          </div>
        </div>
      )}

      {/* ── Day-of-week insight ── */}
      {dowAvgs.length >= 3 && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", marginBottom: 12, border: "0.5px solid #e0e0e0" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>📊 Day-of-week pattern</div>
          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 10 }}>Your average weight by day</div>
          {dowAvgs.map((d, i) => {
            const isHeaviest = i === 0;
            const isLightest = i === dowAvgs.length - 1;
            const range = dowAvgs[0].avg - dowAvgs[dowAvgs.length - 1].avg;
            const barPct = range > 0 ? ((d.avg - dowAvgs[dowAvgs.length - 1].avg) / range) * 100 : 50;
            return (
              <div key={d.day} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
                <div style={{ width: 30, fontSize: 11, color: isHeaviest ? RED : isLightest ? GREEN : "#888", fontWeight: isHeaviest || isLightest ? 700 : 400 }}>{d.day}</div>
                <div style={{ flex: 1, height: 6, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: barPct + "%", height: "100%", background: isHeaviest ? RED + "88" : isLightest ? GREEN : "#ddd", borderRadius: 3 }} />
                </div>
                <div style={{ width: 40, fontSize: 11, fontWeight: 600, color: isHeaviest ? RED : isLightest ? GREEN : "#1a1a1a", textAlign: "right" }}>{d.avg}</div>
                {(isHeaviest || isLightest) && <div style={{ fontSize: 9, color: isHeaviest ? RED : GREEN, width: 40 }}>{isHeaviest ? "heaviest" : "lightest"}</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Weekly log with fluctuation + notes ── */}
      {byWeek.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "1.25rem", border: "0.5px solid #e0e0e0" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 12 }}>Weekly log</div>
          {[...byWeek].reverse().map((week, wi) => {
            const prevWeek = [...byWeek].reverse()[wi + 1];
            const weekDiff = prevWeek ? parseFloat((week.avg - prevWeek.avg).toFixed(1)) : null;
            const isGoodDir = goalMode === "lose" ? (weekDiff !== null && weekDiff < 0) : (weekDiff !== null && weekDiff > 0);
            const range = weekRanges[week.key];
            const spread = range ? parseFloat((range.max - range.min).toFixed(1)) : null;
            return (
              <div key={wi} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: wi < byWeek.length - 1 ? "0.5px solid #f0f0f0" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>{week.label}</div>
                    {spread !== null && spread > 0 && (
                      <div style={{ fontSize: 9, color: "#bbb", marginTop: 1 }}>Range: {range.min}–{range.max} lbs ({spread} lb spread)</div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{week.avg} lbs</span>
                    {weekDiff !== null && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 6, background: isGoodDir ? "#EAF3DE" : weekDiff === 0 ? "#f5f5f5" : "#FCEBEB", color: isGoodDir ? GREEN : weekDiff === 0 ? "#888" : RED }}>
                        {weekDiff > 0 ? "↑ +" : weekDiff < 0 ? "↓ " : "→ "}{Math.abs(weekDiff)}
                      </span>
                    )}
                  </div>
                </div>
                {week.entries.map((e, ei) => (
                  <div key={ei} style={{ padding: "7px 10px", background: "#f9f9f9", borderRadius: 8, marginBottom: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 12, color: "#888" }}>{new Date(e.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{e.weight} lbs</div>
                      <button onClick={() => { setEditingNote(e.date); setNoteInput(notes[e.date] || ""); }}
                        style={{ fontSize: 11, color: notes[e.date] ? ORANGE : "#ccc", background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}>
                        {notes[e.date] ? "✏️" : "+ note"}
                      </button>
                    </div>
                    {notes[e.date] && editingNote !== e.date && (
                      <div style={{ fontSize: 11, color: "#888", marginTop: 4, fontStyle: "italic" }}>"{notes[e.date]}"</div>
                    )}
                    {editingNote === e.date && (
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <input autoFocus value={noteInput} onChange={ev => setNoteInput(ev.target.value)}
                          placeholder='e.g. "competition day", "post-travel"'
                          style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "0.5px solid #ddd", fontSize: 11, fontFamily: "Georgia,serif", background: "#fff" }} />
                        <button onClick={() => saveNote(e.date)} disabled={savingNote}
                          style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: ORANGE, color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: "Georgia,serif" }}>
                          {savingNote ? "..." : "Save"}
                        </button>
                        <button onClick={() => { setEditingNote(null); setNoteInput(""); }}
                          style={{ padding: "6px 10px", borderRadius: 6, border: "0.5px solid #ddd", background: "#fff", color: "#888", fontSize: 11, cursor: "pointer", fontFamily: "Georgia,serif" }}>
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {entries.length === 0 && !saving && (
        <div style={{ background: BG, borderRadius: 12, padding: "2.5rem", textAlign: "center", border: "1px solid #222" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚖️</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#fff", marginBottom: 6 }}>Start tracking your weight</div>
          <div style={{ fontSize: 12, color: "#555" }}>Log your first entry above and watch your progress build week by week.</div>
        </div>
      )}
    </div>
  );
}
