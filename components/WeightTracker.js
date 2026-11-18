import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { hSuccess, hError, hTap } from "../lib/haptics";
import { ensurePushSync } from "../lib/push";
import { pulseMood } from "../lib/ambient";

const DAY = 86400000;
const MAINTAIN_RANGE = 3;
const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const RANGES = [{ k: "1m", label: "1M", days: 31 }, { k: "3m", label: "3M", days: 92 }, { k: "all", label: "All", days: null }];

const ymd = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const estNow = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
// "2026-11-16" → local midnight. new Date("2026-11-16") is UTC midnight, which shows
// as the previous day on phones in Eastern time.
const pd = (s) => { const [y, m, d] = String(s).slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
const fmtDay = (s, opts = { weekday: "short", month: "short", day: "numeric" }) => pd(s).toLocaleDateString("en-US", opts);
const r1 = (v) => Math.round(v * 10) / 10;
const f1 = (v) => v.toFixed(1);

const predictGoalDate = (pts, goalWeight, goalMode) => {
  if (pts.length < 4) return null;
  const recent = pts.slice(-14);
  const xs = recent.map((p) => p.t / DAY);
  const ys = recent.map((p) => p.w);
  const n = xs.length;
  const sumX = xs.reduce((s, x) => s + x, 0);
  const sumY = ys.reduce((s, y) => s + y, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumX2 = xs.reduce((s, x) => s + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  if (!isFinite(slope) || Math.abs(slope) < 0.005) return null;
  if (goalMode === "lose" && slope >= 0) return null;
  if (goalMode === "gain" && slope <= 0) return null;
  const intercept = (sumY - slope * sumX) / n;
  const targetDate = new Date(((goalWeight - intercept) / slope) * DAY);
  const now = new Date();
  if (targetDate <= now || targetDate > new Date(now.getTime() + 365 * DAY)) return null;
  return targetDate;
};

// Monotone cubic path — smooth, but never overshoots a real weigh-in.
function smoothPath(P) {
  const n = P.length;
  if (n < 2) return "";
  if (n === 2) return `M${f1(P[0].x)},${f1(P[0].y)}L${f1(P[1].x)},${f1(P[1].y)}`;
  const dx = [], m = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = P[i + 1].x - P[i].x; m[i] = dx[i] ? (P[i + 1].y - P[i].y) / dx[i] : 0; }
  const t = [m[0]];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  t[n - 1] = m[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let d = `M${f1(P[0].x)},${f1(P[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${f1(P[i].x + h)},${f1(P[i].y + t[i] * h)} ${f1(P[i + 1].x - h)},${f1(P[i + 1].y - t[i + 1] * h)} ${f1(P[i + 1].x)},${f1(P[i + 1].y)}`;
  }
  return d;
}

function Switch({ on, disabled, onClick, label }) {
  return (
    <button className={"bm-switch wt-switch" + (on ? " is-on" : "")} role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={onClick}>
      <span className="bm-switch-track"><span className="bm-switch-knob" /></span>
    </button>
  );
}

export default function WeightTracker({ athleteId, onWeighed }) {
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [weight, setWeight] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [goalMode, setGoalMode] = useState("lose");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState("");
  const [modeDraft, setModeDraft] = useState("lose");
  const [goalErr, setGoalErr] = useState("");
  const [notes, setNotes] = useState({});
  const [noteInput, setNoteInput] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [savingNote, setSavingNote] = useState(false);
  const [notifState, setNotifState] = useState("idle"); // idle | enabled | denied | unsupported
  const [notifLoading, setNotifLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [range, setRange] = useState("3m");
  const [scrub, setScrub] = useState(null);
  const [showAllWeeks, setShowAllWeeks] = useState(false);
  const savingRef = useRef(false);
  const svgRef = useRef(null);

  const loadEntries = async () => {
    try {
      const { data, error: err } = await supabase.from("weight_log").select("*").eq("athlete_id", athleteId).order("date", { ascending: true });
      if (err) { setError("Couldn't load your weigh-ins. Check your connection and reopen this tab."); return; }
      setEntries(data || []);
    } catch (e) { setError("Couldn't load your weigh-ins. Check your connection and reopen this tab."); }
    finally { setLoaded(true); }
  };

  const loadGoal = async () => {
    const fromLocal = () => {
      try {
        const sg = localStorage.getItem("goal_weight_" + athleteId);
        const sm = localStorage.getItem("goal_mode_" + athleteId);
        if (sg) setGoalWeight(sg);
        if (sm) setGoalMode(sm);
      } catch (e) {}
    };
    try {
      const { data } = await supabase.from("announcements").select("message,week_label").eq("type", "weight_goal").eq("day", String(athleteId)).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (data) {
        if (data.message) setGoalWeight(data.message);
        if (data.week_label) setGoalMode(data.week_label);
      } else fromLocal();
    } catch (e) { fromLocal(); }
  };

  const loadNotes = async () => {
    try {
      const { data } = await supabase.from("announcements").select("week_label,message,created_at").eq("type", "weight_note").eq("day", String(athleteId)).order("created_at", { ascending: false });
      const map = {};
      (data || []).forEach((r) => { if (!map[r.week_label]) map[r.week_label] = r.message; });
      setNotes(map);
    } catch (e) {}
  };

  const checkNotifStatus = async () => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) { setNotifState("unsupported"); return; }
    const perm = Notification.permission;
    if (perm === "denied") { setNotifState("denied"); return; }
    if (perm === "granted") {
      // Repairs + re-saves this phone's subscription silently (no prompt).
      try { const sub = await ensurePushSync(athleteId); if (sub) { setNotifState("enabled"); return; } } catch (e) {}
    }
    setNotifState("idle");
  };

  useEffect(() => { loadEntries(); loadGoal(); loadNotes(); checkNotifStatus(); }, []);

  const persistGoal = async (val, mode) => {
    try { localStorage.setItem("goal_weight_" + athleteId, val); localStorage.setItem("goal_mode_" + athleteId, mode); } catch (e) {}
    try { await supabase.from("announcements").insert({ type: "weight_goal", day: String(athleteId), message: String(val), week_label: mode, active: true }); } catch (e) {}
  };

  const save = async (ev) => {
    if (ev) ev.preventDefault();
    if (!weight || savingRef.current) return;
    const w = parseFloat(weight);
    if (!isFinite(w) || w < 60 || w > 600) { setError("Enter your weight in pounds, like 182.4"); hError(); return; }
    savingRef.current = true;
    setSaving(true); setError("");
    try {
      const today = ymd(estNow());
      const { data: todayRow, error: selectErr } = await supabase.from("weight_log").select("id").eq("athlete_id", athleteId).eq("date", today).maybeSingle();
      if (selectErr) { setError("Didn't save. Check your connection and tap Log again."); hError(); return; }
      if (todayRow) {
        const { error: err } = await supabase.from("weight_log").update({ weight: w }).eq("id", todayRow.id);
        if (err) { setError("Didn't save. Check your connection and tap Log again."); hError(); return; }
      } else {
        const { error: err } = await supabase.from("weight_log").insert({ athlete_id: athleteId, date: today, weight: w });
        if (err) { setError("Didn't save. Check your connection and tap Log again."); hError(); return; }
      }
      await loadEntries();
      setWeight(""); setSaved(true); setTimeout(() => setSaved(false), 2600);
      hSuccess();
      pulseMood("celebrate", 1800);
      if (onWeighed) onWeighed();
    } catch (e) { setError("Didn't save. Check your connection and tap Log again."); hError(); }
    finally { setSaving(false); savingRef.current = false; }
  };

  const openGoalEditor = () => {
    setGoalDraft(goalWeight || ""); setModeDraft(goalMode || "lose"); setGoalErr(""); setEditingGoal(true);
  };
  const saveGoal = async () => {
    const v = parseFloat(goalDraft);
    if (!isFinite(v) || v < 60 || v > 600) { setGoalErr("Enter a target in pounds, like 175"); return; }
    const val = String(r1(v));
    setGoalWeight(val); setGoalMode(modeDraft); setEditingGoal(false); hTap();
    await persistGoal(val, modeDraft);
  };

  const saveNote = async (date) => {
    if (!noteInput.trim()) { setEditingNote(null); return; }
    setSavingNote(true);
    try {
      await supabase.from("announcements").insert({ type: "weight_note", day: String(athleteId), week_label: date, message: noteInput.trim(), active: true });
      setNotes((prev) => ({ ...prev, [date]: noteInput.trim() }));
    } catch (e) {}
    setSavingNote(false); setEditingNote(null); setNoteInput("");
  };

  const deleteEntry = async (id) => {
    setDeleting(id);
    try {
      await supabase.from("weight_log").delete().eq("id", id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {}
    setDeleting(null);
    setConfirmDelete(null);
  };

  const enableNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) { setNotifState("unsupported"); return; }
    setNotifLoading(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setNotifState("denied"); setNotifLoading(false); return; }
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await ensurePushSync(athleteId);
      if (!sub) throw new Error("Subscription failed");
      setNotifState("enabled");
    } catch (e) { setNotifState("denied"); }
    setNotifLoading(false);
  };

  const disableNotifications = async () => {
    setNotifLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) { const sub = await reg.pushManager.getSubscription(); if (sub) await sub.unsubscribe(); }
      await fetch("/api/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ athleteId }) });
      setNotifState("idle");
    } catch (e) {}
    setNotifLoading(false);
  };

  // ── Data ───────────────────────────────────────────────────────────
  const todayStr = ymd(estNow());
  const byDate = {};
  entries.forEach((e) => { const w = parseFloat(e.weight); if (e.date && isFinite(w)) byDate[String(e.date).slice(0, 10)] = { id: e.id, date: String(e.date).slice(0, 10), w }; });
  const pts = Object.values(byDate).sort((a, b) => (a.date < b.date ? -1 : 1)).map((p) => ({ ...p, t: pd(p.date).getTime() }));
  const first = pts.length ? pts[0].w : null;
  const latest = pts.length ? pts[pts.length - 1].w : null;
  const diff = first != null && latest != null ? r1(latest - first) : null;
  const goal = parseFloat(goalWeight) || null;
  const todayEntry = byDate[todayStr];

  // Streak — consecutive Mon/Fri weigh-ins (grace for today if not yet logged)
  const streak = (() => {
    if (!pts.length) return 0;
    const d = estNow();
    let s = 0, seen = 0;
    while (seen < 104) {
      const dow = d.getDay();
      if (dow === 1 || dow === 5) {
        seen++;
        const key = ymd(d);
        if (byDate[key]) s++;
        else if (key !== todayStr) break;
      }
      d.setDate(d.getDate() - 1);
    }
    return s;
  })();

  // Goal progress
  const progress = (() => {
    if (!goal || first == null || latest == null) return null;
    if (goalMode === "maintain") {
      const dev = r1(latest - goal);
      const recent = pts.slice(-14);
      const inN = recent.filter((p) => Math.abs(p.w - goal) <= MAINTAIN_RANGE).length;
      return { maintain: true, inRange: Math.abs(dev) <= MAINTAIN_RANGE, dev, stability: recent.length ? Math.round((inN / recent.length) * 100) : 0 };
    }
    const lose = goalMode === "lose";
    const span = lose ? first - goal : goal - first;
    const moved = lose ? first - latest : latest - first;
    const pct = span > 0 ? Math.max(0, Math.min(100, Math.round((moved / span) * 100))) : (lose ? (latest <= goal ? 100 : 0) : (latest >= goal ? 100 : 0));
    const reached = lose ? latest <= goal : latest >= goal;
    const onTrack = lose ? diff <= 0 : diff >= 0;
    return { pct, reached, onTrack, left: r1(Math.abs(latest - goal)) };
  })();
  const predictedDate = goal && progress && !progress.maintain && !progress.reached ? predictGoalDate(pts, goal, goalMode) : null;

  const tone = (d) => {
    if (d == null || Math.abs(d) < 0.1) return "is-flat";
    if (!goal) return "is-flat";
    if (goalMode === "maintain") return Math.abs(d) <= MAINTAIN_RANGE ? "is-good" : "is-bad";
    return (goalMode === "lose" ? d < 0 : d > 0) ? "is-good" : "is-bad";
  };

  // ── Chart ──────────────────────────────────────────────────────────
  const W = 320, H = 150, PT = 14, PB = 8, PL = 30, PR = 10;
  const spanDays = pts.length > 1 ? (pts[pts.length - 1].t - pts[0].t) / DAY : 0;
  const showRanges = spanDays > 35;
  const rDays = (RANGES.find((r) => r.k === range) || {}).days;
  let vis = showRanges && rDays ? pts.filter((p) => p.t >= pts[pts.length - 1].t - rDays * DAY) : pts;
  if (vis.length < 2 && pts.length >= 2) vis = pts.slice(-2);
  const trend = vis.map((p) => { const win = pts.filter((q) => q.t <= p.t && q.t > p.t - 14 * DAY); return win.reduce((s, q) => s + q.w, 0) / win.length; });
  let lo = Infinity, hi = -Infinity;
  vis.forEach((p, i) => { lo = Math.min(lo, p.w, trend[i]); hi = Math.max(hi, p.w, trend[i]); });
  const goalOnChart = goal && vis.length > 1 && goal >= lo - 12 && goal <= hi + 12;
  if (goalOnChart) {
    const g0 = goalMode === "maintain" ? goal - MAINTAIN_RANGE : goal, g1 = goalMode === "maintain" ? goal + MAINTAIN_RANGE : goal;
    lo = Math.min(lo, g0); hi = Math.max(hi, g1);
  }
  const pad = Math.max(1.2, (hi - lo) * 0.14);
  lo -= pad; hi += pad;
  if (hi - lo < 5) { const mid = (hi + lo) / 2; lo = mid - 2.5; hi = mid + 2.5; }
  const t0 = vis.length ? vis[0].t : 0, t1 = vis.length ? vis[vis.length - 1].t : 1;
  const X = (t) => PL + ((t - t0) / Math.max(1, t1 - t0)) * (W - PL - PR);
  const Y = (v) => PT + (1 - (v - lo) / (hi - lo)) * (H - PT - PB);
  const xy = vis.map((p) => ({ x: X(p.t), y: Y(p.w) }));
  const linePath = smoothPath(xy);
  const areaPath = xy.length > 1 ? linePath + `L${f1(xy[xy.length - 1].x)},${H}L${f1(xy[0].x)},${H}Z` : "";
  const trendPath = smoothPath(vis.map((p, i) => ({ x: X(p.t), y: Y(trend[i]) })));
  const gridStep = [1, 2, 5, 10, 20, 50].find((s) => s >= (hi - lo) / 3.2) || 50;
  const gridVals = [];
  for (let v = Math.ceil(lo / gridStep) * gridStep; v < hi && gridVals.length < 4; v += gridStep) if (Y(v) > PT + 8) gridVals.push(v);

  const onScrub = (ev) => {
    if (!svgRef.current || xy.length < 2) return;
    const rect = svgRef.current.getBoundingClientRect();
    const xv = ((ev.clientX - rect.left) / rect.width) * W;
    let best = 0;
    xy.forEach((p, i) => { if (Math.abs(p.x - xv) < Math.abs(xy[best].x - xv)) best = i; });
    if (best !== scrub) { setScrub(best); }
  };
  const sp = scrub != null && vis[scrub] ? vis[scrub] : null;
  const shownW = sp ? sp.w : latest;
  const shownLabel = sp ? (sp.date === todayStr ? "Today" : fmtDay(sp.date)) : todayEntry ? "Today" : latest != null ? "Latest · " + fmtDay(pts[pts.length - 1].date, { month: "short", day: "numeric" }) : "No weigh-ins yet";

  // ── Mon/Fri consistency (last 10 weeks) ───────────────────────────
  const cols = (() => {
    const out = [];
    const d = estNow();
    while (d.getDay() !== 1) d.setDate(d.getDate() - 1); // this week's Monday
    for (let w = 0; w < 10; w++) {
      const mon = new Date(d); mon.setDate(d.getDate() - 7 * w);
      const fri = new Date(mon); fri.setDate(mon.getDate() + 4);
      out.unshift([mon, fri].map((day) => {
        const key = ymd(day);
        const logged = !!byDate[key];
        const state = logged ? "hit" : key > todayStr ? "future" : key === todayStr ? "today" : pts.length && key < pts[0].date ? "pre" : "miss";
        return { key, state };
      }));
    }
    return out;
  })();
  const counted = cols.flat().filter((c) => c.state === "hit" || c.state === "miss");
  const hits = counted.filter((c) => c.state === "hit").length;

  // Day-of-week pattern → one plain-English insight
  const insight = (() => {
    const map = {};
    pts.forEach((p) => { const k = pd(p.date).getDay(); (map[k] = map[k] || []).push(p.w); });
    const avgs = Object.entries(map).filter(([, ws]) => ws.length >= 2).map(([k, ws]) => ({ day: DOW[k], avg: ws.reduce((s, w) => s + w, 0) / ws.length }));
    if (avgs.length < 2) return null;
    avgs.sort((a, b) => b.avg - a.avg);
    const gap = r1(avgs[0].avg - avgs[avgs.length - 1].avg);
    if (gap < 0.5) return "Rock steady between weigh-in days.";
    return `On average you weigh ${gap} lbs more on ${avgs[0].day}s than ${avgs[avgs.length - 1].day}s. That's normal water swing, so judge progress by the trend line.`;
  })();

  // ── Weekly history (Mon–Sun weeks) ────────────────────────────────
  const weeks = [];
  pts.forEach((p) => {
    const d = pd(p.date);
    const ws = new Date(d); ws.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = ymd(ws);
    let wk = weeks.find((x) => x.key === key);
    if (!wk) { wk = { key, label: "Week of " + ws.toLocaleDateString("en-US", { month: "short", day: "numeric" }), pts: [] }; weeks.push(wk); }
    wk.pts.push(p);
  });
  weeks.forEach((wk) => { wk.avg = r1(wk.pts.reduce((s, p) => s + p.w, 0) / wk.pts.length); });
  const weeksDesc = [...weeks].reverse();
  const shownWeeks = showAllWeeks ? weeksDesc : weeksDesc.slice(0, 3);

  const remindCard = notifState !== "unsupported" && (
    <section className="tfx-card wt-remind">
      <span className="wt-remind-ico" aria-hidden="true">🔔</span>
      <div className="wt-remind-txt">
        <b>Weigh-in reminders</b>
        <small>{notifState === "enabled" ? "On · Mon & Fri before class" : notifState === "denied" ? "Blocked. Allow notifications for this site in your phone's settings." : "A nudge Mon & Fri before class"}</small>
      </div>
      {notifState !== "denied" && (
        <Switch on={notifState === "enabled"} disabled={notifLoading} label="Weigh-in reminders"
          onClick={() => (notifState === "enabled" ? disableNotifications() : enableNotifications())} />
      )}
    </section>
  );

  return (
    <div className="tfx wt">
      <header className="tfx-hb-head">
        <div>
          <div className="tfx-eyebrow">Weight</div>
          <h2>Weigh-in</h2>
        </div>
        {streak > 0 && <span className="tfx-hb-streak">🔥 <b className="tfx-num">{streak}</b> in a row</span>}
      </header>

      {/* ── Hero: number, chart, log ── */}
      <section className="tfx-card wt-hero">
        <div className="wt-read">
          <div>
            <div className="tfx-eyebrow wt-read-label" suppressHydrationWarning>{shownLabel}</div>
            <div className="wt-big tfx-num">{shownW != null ? f1(shownW) : "—"}<small>lbs</small></div>
          </div>
          {!sp && diff != null && pts.length > 1 && (
            <div className={"wt-delta " + tone(diff)}>
              <b className="tfx-num">{diff > 0 ? "▲ " : diff < 0 ? "▼ " : ""}{f1(Math.abs(diff))}</b>
              <span>since {fmtDay(pts[0].date, { month: "short", day: "numeric" })}</span>
            </div>
          )}
          {sp && scrub > 0 && (
            <div className={"wt-delta " + tone(sp.w - vis[scrub - 1].w)}>
              <b className="tfx-num">{sp.w - vis[scrub - 1].w > 0 ? "▲ " : sp.w - vis[scrub - 1].w < 0 ? "▼ " : ""}{f1(Math.abs(sp.w - vis[scrub - 1].w))}</b>
              <span>vs {fmtDay(vis[scrub - 1].date, { weekday: "short" })}</span>
            </div>
          )}
        </div>

        {xy.length > 1 ? (
          <div className="wt-chart">
            <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="wt-svg" aria-label={`Weight chart, ${vis.length} weigh-ins from ${f1(vis[0].w)} to ${f1(vis[vis.length - 1].w)} lbs`}
              onPointerDown={onScrub} onPointerMove={onScrub} onPointerUp={() => setScrub(null)} onPointerLeave={() => setScrub(null)} onPointerCancel={() => setScrub(null)}>
              <defs>
                <linearGradient id="wtArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" className="wt-stop-a" />
                  <stop offset="100%" className="wt-stop-b" />
                </linearGradient>
              </defs>
              {gridVals.map((v, i) => (
                <g key={i}>
                  <line x1={PL} x2={W - PR} y1={Y(v)} y2={Y(v)} className="wt-grid" />
                  <text x={PL - 7} y={Y(v) + 3.5} textAnchor="end" className="wt-axis">{v}</text>
                </g>
              ))}
              {goalOnChart && goalMode === "maintain" && (
                <rect x={PL} width={W - PL - PR} y={Y(goal + MAINTAIN_RANGE)} height={Math.max(1, Y(goal - MAINTAIN_RANGE) - Y(goal + MAINTAIN_RANGE))} className="wt-band" rx="6" />
              )}
              {goalOnChart && (
                <g>
                  <line x1={PL} x2={W - PR} y1={Y(goal)} y2={Y(goal)} className="wt-goal" />
                  <text x={W - PR} y={Y(goal) - 5} textAnchor="end" className="wt-goal-t">{goalMode === "maintain" ? "Target" : "Goal"} {goal}</text>
                </g>
              )}
              <path d={areaPath} fill="url(#wtArea)" className="wt-area" />
              <path d={trendPath} className="wt-trend" />
              <path key={"l" + range} d={linePath} className="wt-line" pathLength="1" />
              {xy.map((p, i) => <circle key={vis[i].date} cx={p.x} cy={p.y} r={i === xy.length - 1 ? 0 : 2.4} className="wt-dot" />)}
              <circle cx={xy[xy.length - 1].x} cy={xy[xy.length - 1].y} r="9" className="wt-end-halo" />
              <circle cx={xy[xy.length - 1].x} cy={xy[xy.length - 1].y} r="4.5" className="wt-end" />
              {sp && (
                <g>
                  <line x1={xy[scrub].x} x2={xy[scrub].x} y1={PT - 6} y2={H} className="wt-scrub" />
                  <circle cx={xy[scrub].x} cy={xy[scrub].y} r="5.5" className="wt-scrub-dot" />
                </g>
              )}
            </svg>
            <div className="wt-chart-foot">
              <span>{fmtDay(vis[0].date, { month: "short", day: "numeric" })}</span>
              <span className="wt-key"><i className="k-line" />Weigh-ins<i className="k-trend" />2-wk avg</span>
              <span>{vis[vis.length - 1].date === todayStr ? "Today" : fmtDay(vis[vis.length - 1].date, { month: "short", day: "numeric" })}</span>
            </div>
            {showRanges && (
              <div className="wt-ranges" role="tablist" aria-label="Chart range">
                {RANGES.map((r) => (
                  <button key={r.k} role="tab" aria-selected={range === r.k} className={"wt-range tfx-press" + (range === r.k ? " is-on" : "")} onClick={() => { setRange(r.k); setScrub(null); }}>{r.label}</button>
                ))}
              </div>
            )}
          </div>
        ) : loaded && pts.length < 2 ? (
          <p className="wt-empty">{pts.length === 0 ? "Step on the scale before class on Monday and Friday, then log it here. Your trend line starts after two weigh-ins." : "One more weigh-in and your trend line appears."}</p>
        ) : null}

        <form className="wt-log" onSubmit={save}>
          <label className="wt-input">
            <input type="text" inputMode="decimal" enterKeyHint="done" autoComplete="off" value={weight}
              onChange={(e) => { setWeight(e.target.value.replace(/[^0-9.]/g, "")); setError(""); }}
              placeholder={todayEntry ? f1(todayEntry.w) : latest != null ? f1(latest) : "0.0"} aria-label="Today's weight in pounds" />
            <span>lbs</span>
          </label>
          <button type="submit" className={"tfx-btn tfx-press wt-save" + (saved ? " is-saved" : "")} disabled={!weight || saving}>
            {saved ? "Logged ✓" : saving ? "Saving…" : todayEntry ? "Update" : "Log"}
          </button>
        </form>
        {error && <div className="wt-err" role="alert">{error}</div>}
        <div className="wt-fine">
          {todayEntry ? <>Logged today: <b className="tfx-num">{f1(todayEntry.w)}</b>. Logging again replaces it.</> : "Only you and Coach Ant see this."}
        </div>
      </section>

      {notifState === "idle" && remindCard}

      {/* ── Goal ── */}
      <section className="tfx-card wt-goalcard">
        <div className="wt-sec-head">
          <div className="tfx-eyebrow">Goal</div>
          {!editingGoal && <button className="wt-link tfx-press" onClick={openGoalEditor}>{goal ? "Edit" : "Set goal"}</button>}
        </div>

        {editingGoal ? (
          <div className="wt-goal-form">
            <div className="wt-seg" role="radiogroup" aria-label="Goal type">
              {[{ id: "lose", label: "Lose" }, { id: "maintain", label: "Maintain" }, { id: "gain", label: "Gain" }].map((m) => (
                <button key={m.id} role="radio" aria-checked={modeDraft === m.id} className={"tfx-press" + (modeDraft === m.id ? " is-on" : "")} onClick={() => setModeDraft(m.id)}>{m.label}</button>
              ))}
            </div>
            <label className="wt-input wt-input-sm">
              <input type="text" inputMode="decimal" value={goalDraft} onChange={(e) => { setGoalDraft(e.target.value.replace(/[^0-9.]/g, "")); setGoalErr(""); }}
                placeholder={modeDraft === "maintain" ? "Target weight" : modeDraft === "lose" ? "Get down to" : "Build up to"} aria-label="Goal weight in pounds" autoFocus />
              <span>lbs</span>
            </label>
            {goalErr && <div className="wt-err">{goalErr}</div>}
            <div className="wt-goal-actions">
              <button className="tfx-btn-ghost tfx-press" onClick={() => setEditingGoal(false)}>Cancel</button>
              <button className="tfx-btn tfx-press" onClick={saveGoal} disabled={!goalDraft}>Save goal</button>
            </div>
          </div>
        ) : !goal ? (
          <p className="wt-goal-empty">Pick a target (lose, maintain or gain) and this card tracks your pace toward it.</p>
        ) : !progress ? (
          <div className="wt-goal-line"><b className="tfx-num">{goal}</b><span>{goalMode === "maintain" ? "lbs target · log a weigh-in to start tracking" : goalMode === "lose" ? "lbs goal · log a weigh-in to start tracking" : "lbs goal · log a weigh-in to start tracking"}</span></div>
        ) : progress.maintain ? (
          <div className={"wt-goal-body " + (progress.inRange ? "is-good" : "is-bad")}>
            <div className="wt-goal-top">
              <div><b className="tfx-num">{f1(goal - MAINTAIN_RANGE)}–{f1(goal + MAINTAIN_RANGE)}</b><span>Maintain zone</span></div>
              <span className="wt-pill">{progress.inRange ? "In the zone" : `${f1(Math.abs(progress.dev))} lbs ${progress.dev > 0 ? "above" : "below"} target`}</span>
            </div>
            <div className="wt-bar"><i style={{ "--p": progress.stability / 100 }} /></div>
            <div className="wt-goal-foot"><span>In the zone on <b className="tfx-num">{progress.stability}%</b> of your last {Math.min(14, pts.length)} weigh-ins</span></div>
          </div>
        ) : (
          <div className={"wt-goal-body " + (progress.reached ? "is-good" : progress.onTrack ? "is-good" : "is-bad")}>
            <div className="wt-goal-top">
              <div><b className="tfx-num">{f1(latest)} <em>→</em> {goal}</b><span>{goalMode === "lose" ? "Cutting to" : "Building to"} {goal} lbs</span></div>
              <span className="wt-pill">{progress.reached ? "Goal reached" : progress.onTrack ? "On track" : "Off pace"}</span>
            </div>
            <div className="wt-bar"><i style={{ "--p": progress.pct / 100 }} /><b style={{ "--p": progress.pct / 100 }} /></div>
            <div className="wt-goal-foot">
              <span>{progress.reached ? "You hit it. Set the next one." : <><b className="tfx-num">{f1(progress.left)}</b> lbs to go · {progress.pct}% there</>}</span>
              {predictedDate && <span>At this pace: <b>{predictedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</b></span>}
            </div>
          </div>
        )}
      </section>

      {/* ── Consistency ── */}
      {pts.length > 0 && (
        <section className="tfx-card wt-consist">
          <div className="wt-sec-head">
            <div>
              <div className="tfx-eyebrow">Mon &amp; Fri weigh-ins</div>
              <p className="wt-sub">Last 10 weeks</p>
            </div>
            <div className="wt-score"><b className="tfx-num">{hits}</b><span>/{counted.length || 0}</span></div>
          </div>
          <div className="wt-grid-wrap">
            <div className="wt-grid-days" aria-hidden="true"><span>M</span><span>F</span></div>
            <div className="wt-cells">
              {cols.map((col, i) => (
                <div key={i} className="wt-col">
                  {col.map((c) => <i key={c.key} className={"is-" + c.state} title={fmtDay(c.key) + (c.state === "hit" ? " · logged" : c.state === "miss" ? " · missed" : "")} />)}
                </div>
              ))}
            </div>
          </div>
          {insight && <p className="wt-insight">{insight}</p>}
        </section>
      )}

      {/* ── History ── */}
      {weeksDesc.length > 0 && (
        <section className="tfx-card wt-history">
          <div className="wt-sec-head"><div className="tfx-eyebrow">History</div></div>
          {shownWeeks.map((wk) => {
            const idx = weeks.indexOf(wk);
            const prev = idx > 0 ? weeks[idx - 1] : null;
            const wd = prev ? r1(wk.avg - prev.avg) : null;
            return (
              <div key={wk.key} className="wt-week">
                <div className="wt-week-head">
                  <span>{wk.label}</span>
                  <span className="wt-week-avg">
                    <b className="tfx-num">{f1(wk.avg)}</b> avg
                    {wd != null && <em className={"wt-chg " + tone(wd)}>{wd > 0 ? "▲" : wd < 0 ? "▼" : "•"} {f1(Math.abs(wd))}</em>}
                  </span>
                </div>
                {[...wk.pts].reverse().map((p) => (
                  <div key={p.date} className="wt-row">
                    <div className="wt-row-main">
                      <span className="wt-row-day">{p.date === todayStr ? "Today" : fmtDay(p.date)}</span>
                      <b className="tfx-num">{f1(p.w)}</b>
                      <span className="wt-row-acts">
                        {confirmDelete === p.id ? (
                          <>
                            <button className="wt-act is-danger tfx-press" onClick={() => deleteEntry(p.id)} disabled={deleting === p.id}>{deleting === p.id ? "…" : "Delete"}</button>
                            <button className="wt-act tfx-press" onClick={() => setConfirmDelete(null)}>Keep</button>
                          </>
                        ) : (
                          <>
                            <button className="wt-act tfx-press" onClick={() => { setEditingNote(p.date); setNoteInput(notes[p.date] || ""); }}>{notes[p.date] ? "Edit note" : "+ Note"}</button>
                            <button className="wt-act wt-act-x tfx-press" onClick={() => setConfirmDelete(p.id)} aria-label={"Delete weigh-in on " + fmtDay(p.date)}>✕</button>
                          </>
                        )}
                      </span>
                    </div>
                    {notes[p.date] && editingNote !== p.date && <p className="wt-note">“{notes[p.date]}”</p>}
                    {editingNote === p.date && (
                      <form className="wt-note-form" onSubmit={(e) => { e.preventDefault(); saveNote(p.date); }}>
                        <input autoFocus className="tfx-field" value={noteInput} onChange={(ev) => setNoteInput(ev.target.value)} placeholder="Game day, post-travel, sick…" aria-label="Note" />
                        <button type="submit" className="wt-act is-on tfx-press" disabled={savingNote}>{savingNote ? "…" : "Save"}</button>
                        <button type="button" className="wt-act tfx-press" onClick={() => { setEditingNote(null); setNoteInput(""); }}>Cancel</button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
          {weeksDesc.length > 3 && (
            <button className="wt-more tfx-press" onClick={() => setShowAllWeeks((s) => !s)}>{showAllWeeks ? "Show less" : `Show all ${weeksDesc.length} weeks`}</button>
          )}
        </section>
      )}

      {notifState !== "idle" && remindCard}
    </div>
  );
}
