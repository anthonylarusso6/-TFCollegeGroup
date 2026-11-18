import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { pulseMood } from "../lib/ambient";
import { hSuccess, hTap } from "../lib/haptics";

// Ring colors (SVG attributes, not inline styles — unaffected by legacy light-mode rules)
const WATER = "#6e9cc6"; // dusty blue
const FOOD = "#82a47c";  // sage
const SLEEP = "#9a92c6"; // soft lavender
const SLEEP_GOAL = 8;

function estDate(offsetDays = 0) {
  const est = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  est.setDate(est.getDate() - offsetDays);
  return est;
}
const ymd = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const isComplete = (r) => !!r && r.water === true && r.nutrition === true && typeof r.sleep === "number" && r.sleep > 0;

function computeStreak(logMap) {
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    if (!isComplete(logMap[ymd(estDate(i))])) break;
    streak++;
  }
  return streak;
}

function parseRow(row) {
  try {
    const d = JSON.parse(row.message || "{}");
    return { water: d.water === true, nutrition: d.nutrition === true, sleep: typeof d.sleep === "number" ? d.sleep : null };
  } catch (e) {
    return { water: false, nutrition: false, sleep: null };
  }
}

function Rings({ water, food, sleep, size = 172, stroke = 12, gap = 4 }) {
  const rings = [
    { v: water ? 1 : 0, c: WATER },
    { v: food ? 1 : 0, c: FOOD },
    { v: Math.min(1, (sleep || 0) / SLEEP_GOAL), c: SLEEP },
  ];
  const mid = size / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" aria-hidden="true">
      {rings.map((r, i) => {
        const rad = mid - stroke / 2 - i * (stroke + gap);
        const C = 2 * Math.PI * rad;
        return (
          <g key={i}>
            <circle cx={mid} cy={mid} r={rad} fill="none" stroke={r.c} strokeOpacity="0.17" strokeWidth={stroke} />
            <circle className="tfx-hb-arc" cx={mid} cy={mid} r={rad} fill="none" stroke={r.c} strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - r.v)} transform={`rotate(-90 ${mid} ${mid})`} />
          </g>
        );
      })}
    </svg>
  );
}

export default function HabitsTab({ athleteId, onComplete }) {
  const today = ymd(estDate());
  const [logMap, setLogMap] = useState({});
  const [water, setWater] = useState(false);
  const [food, setFood] = useState(false);
  const [sleep, setSleep] = useState(null); // number | null
  const [status, setStatus] = useState("idle"); // idle | pending | saving | saved | error
  const [loadError, setLoadError] = useState("");

  const dirty = useRef(false);
  const timer = useRef(null);
  const savingRef = useRef(false);
  const queued = useRef(false);
  const latest = useRef({ water: false, food: false, sleep: null });
  const wasComplete = useRef(false);

  useEffect(() => { load(); }, [athleteId]);

  async function load() {
    setLoadError("");
    try {
      const oldest = ymd(estDate(60));
      const { data, error } = await supabase.from("announcements").select("week_label,message")
        .eq("type", "habit_log").eq("day", String(athleteId)).gte("week_label", oldest).order("week_label", { ascending: true });
      if (error) { setLoadError("Couldn't load your habits. Pull to refresh or try again."); return; }
      const map = {};
      (data || []).forEach((row) => { map[row.week_label] = parseRow(row); });
      setLogMap(map);
      const t = map[today];
      if (t) { setWater(t.water); setFood(t.nutrition); setSleep(t.sleep); }
      wasComplete.current = isComplete(t);
    } catch (e) {
      setLoadError("Couldn't load your habits.");
    }
  }

  async function flush() {
    if (savingRef.current) { queued.current = true; return; }
    savingRef.current = true;
    setStatus("saving");
    const v = latest.current;
    const payload = { water: v.water === true, nutrition: v.food === true, sleep: typeof v.sleep === "number" ? v.sleep : null };
    try {
      // Same storage as before: one habit_log row per athlete per day
      await supabase.from("announcements").delete().eq("type", "habit_log").eq("day", String(athleteId)).eq("week_label", today);
      const { error } = await supabase.from("announcements").insert({ type: "habit_log", day: String(athleteId), week_label: today, message: JSON.stringify(payload), active: true });
      if (error) throw error;
      setLogMap((p) => ({ ...p, [today]: payload }));
      setStatus("saved");
    } catch (e) {
      setStatus("error");
    }
    savingRef.current = false;
    if (queued.current) { queued.current = false; flush(); }
  }

  // Auto-save shortly after any change the athlete makes
  useEffect(() => {
    latest.current = { water, food, sleep };
    if (!dirty.current) return;
    setStatus("pending");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { timer.current = null; flush(); }, 650);
    const complete = water && food && typeof sleep === "number" && sleep > 0;
    if (complete && !wasComplete.current) {
      pulseMood("celebrate", 2400);
      hSuccess();
      onComplete && onComplete();
    }
    wasComplete.current = complete;
  }, [water, food, sleep]);

  // Never lose the last tap when leaving the tab
  useEffect(() => () => { if (timer.current) { clearTimeout(timer.current); flush(); } }, []);

  const touch = () => { dirty.current = true; };
  const toggleWater = () => { touch(); hTap(); setWater((w) => !w); };
  const toggleFood = () => { touch(); hTap(); setFood((f) => !f); };
  const setSleepVal = (v) => { touch(); setSleep(v); };

  const doneCount = (water ? 1 : 0) + (food ? 1 : 0) + (typeof sleep === "number" && sleep > 0 ? 1 : 0);
  const shown = { ...logMap, [today]: { water, nutrition: food, sleep } };
  const streak = computeStreak(shown);
  const dateLabel = estDate().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const statusText = { pending: "Saving…", saving: "Saving…", saved: "Saved ✓", error: "Didn't save — tap again to retry" }[status] || "Saves automatically";

  return (
    <div className="tfx tfx-hb">
      <header className="tfx-hb-head">
        <div>
          <div className="tfx-eyebrow">Daily habits</div>
          <h2>{dateLabel}</h2>
        </div>
        {streak > 0 && <span className="tfx-hb-streak">🔥 <b className="tfx-num">{streak}</b> day{streak === 1 ? "" : "s"}</span>}
      </header>

      {loadError && <div className="tfx-card tfx-hb-err">{loadError}</div>}

      <div className={"tfx-card tfx-hb-hero" + (doneCount === 3 ? " is-complete" : "")}>
        <div className="tfx-hb-dial">
          <Rings water={water} food={food} sleep={sleep} />
          <div className="tfx-hb-center">
            <b className="tfx-num">{doneCount}<i>/3</i></b>
            <span>{doneCount === 3 ? "All in" : "today"}</span>
          </div>
        </div>
        <ul className="tfx-hb-legend">
          <li style={{ "--c": WATER }}><i />Water<b>{water ? "Done" : "—"}</b></li>
          <li style={{ "--c": FOOD }}><i />Nutrition<b>{food ? "Done" : "—"}</b></li>
          <li style={{ "--c": SLEEP }}><i />Sleep<b className="tfx-num">{typeof sleep === "number" ? sleep + "h" : "—"}</b></li>
          <li className="tfx-hb-hint">{doneCount === 3 ? (streak > 1 ? streak + " days straight. Keep it alive." : "Streak started. Come back tomorrow.") : "Hit all three to grow your streak."}</li>
        </ul>
      </div>

      <div className="tfx-hb-list">
        <button className={"tfx-card tfx-hb-tile tfx-press" + (water ? " is-done" : "")} style={{ "--c": WATER }} onClick={toggleWater} aria-pressed={water}>
          <span className="tfx-hb-ico" aria-hidden="true">💧</span>
          <span className="tfx-hb-txt"><b>Water</b><small>{water ? "Hydrated. Nice." : "Tap when you've hit your water"}</small></span>
          <span className="tfx-hb-check" aria-hidden="true">{water ? "✓" : ""}</span>
        </button>
        <button className={"tfx-card tfx-hb-tile tfx-press" + (food ? " is-done" : "")} style={{ "--c": FOOD }} onClick={toggleFood} aria-pressed={food}>
          <span className="tfx-hb-ico" aria-hidden="true">🥗</span>
          <span className="tfx-hb-txt"><b>Nutrition</b><small>{food ? "Fueled right." : "Tap when you've eaten well today"}</small></span>
          <span className="tfx-hb-check" aria-hidden="true">{food ? "✓" : ""}</span>
        </button>

        <div className={"tfx-card tfx-hb-sleep" + (typeof sleep === "number" && sleep > 0 ? " is-done" : "")} style={{ "--c": SLEEP }}>
          <div className="tfx-hb-sleep-top">
            <span className="tfx-hb-ico" aria-hidden="true">😴</span>
            <span className="tfx-hb-txt"><b>Sleep</b><small>Hours last night · goal {SLEEP_GOAL}h</small></span>
            <span className="tfx-hb-sleepval tfx-num">{typeof sleep === "number" ? <>{sleep}<small>h</small></> : <small className="is-unset">not set</small>}</span>
          </div>
          <input type="range" min="0" max="12" step="0.5" className={"tfx-range" + (typeof sleep === "number" ? "" : " is-unset")}
            value={typeof sleep === "number" ? sleep : 7} style={{ "--p": (typeof sleep === "number" ? sleep : 7) / 12 }}
            onChange={(e) => setSleepVal(parseFloat(e.target.value))} aria-label="Hours of sleep last night" />
          <div className="tfx-hb-quick">
            {[6, 7, 8, 9].map((h) => (
              <button key={h} className={"tfx-chipbtn tfx-press" + (sleep === h ? " is-on" : "")} onClick={() => { hTap(); setSleepVal(h); }}>{h}h</button>
            ))}
          </div>
        </div>
      </div>

      <div className={"tfx-hb-status is-" + status} aria-live="polite">{statusText}</div>

      <section className="tfx-card tfx-hb-week">
        <div className="tfx-eyebrow">Last 7 days</div>
        <div className="tfx-hb-days">
          {Array.from({ length: 7 }).map((_, k) => {
            const d = estDate(6 - k);
            const key = ymd(d);
            const r = shown[key];
            return (
              <div key={key} className={"tfx-hb-day" + (key === today ? " is-today" : "") + (isComplete(r) ? " is-full" : "")}>
                <div className="tfx-hb-mini"><Rings water={r?.water} food={r?.nutrition} sleep={r?.sleep} size={44} stroke={5} gap={2} /></div>
                <span>{d.toLocaleDateString("en-US", { weekday: "narrow" })}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
