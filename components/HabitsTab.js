import { useState, useEffect } from "react";
import { GREEN, GOLD } from "../lib/constants";
import { supabase } from "../lib/supabase";

const BG = "#0f0f0f";
const CARD = "#111";

function getEstDate() {
  const est = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const y = est.getFullYear();
  const m = String(est.getMonth() + 1).padStart(2, "0");
  const d = String(est.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(dateStr) {
  // dateStr is YYYY-MM-DD, parse as local
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function getLast7Days() {
  const est = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(est);
    d.setDate(est.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    days.push(`${y}-${m}-${day}`);
  }
  return days;
}

function getLast14Days() {
  const est = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(est);
    d.setDate(est.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    days.push(`${y}-${m}-${day}`);
  }
  return days;
}

function computeStreak(logMap, todayStr) {
  let streak = 0;
  const est = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  let cursor = new Date(est);

  // Start from today and walk backwards
  while (true) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    const dateKey = `${y}-${m}-${d}`;
    const row = logMap[dateKey];
    const complete = row && row.water === true && row.nutrition === true && typeof row.sleep === "number" && row.sleep > 0;
    if (!complete) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function HabitsTab({ athleteId }) {
  const today = getEstDate();

  const [logMap, setLogMap] = useState({});
  const [water, setWater] = useState(null);
  const [nutrition, setNutrition] = useState(null);
  const [sleepHours, setSleepHours] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    loadHabits();
  }, [athleteId]);

  async function loadHabits() {
    setLoadError("");
    try {
      const last14 = getLast14Days();
      const oldest = last14[0];
      const { data, error: err } = await supabase
        .from("habit_log")
        .select("*")
        .eq("athlete_id", athleteId)
        .gte("date", oldest)
        .order("date", { ascending: true });

      if (err) {
        setLoadError("Could not load habits: " + err.message);
        return;
      }

      const map = {};
      (data || []).forEach(row => {
        map[row.date] = row;
      });
      setLogMap(map);

      // Populate today's fields if record exists
      const todayRow = map[today];
      if (todayRow) {
        setWater(todayRow.water === true ? true : todayRow.water === false ? false : null);
        setNutrition(todayRow.nutrition === true ? true : todayRow.nutrition === false ? false : null);
        setSleepHours(todayRow.sleep != null ? String(todayRow.sleep) : "");
      }
    } catch (e) {
      setLoadError("Could not load habits.");
    }
  }

  async function saveHabits() {
    if (saving) return;
    setSaving(true);
    setSavedMsg("");
    try {
      const payload = {
        athlete_id: athleteId,
        date: today,
        water: water === true,
        nutrition: nutrition === true,
        sleep: sleepHours !== "" ? parseFloat(sleepHours) : null,
      };
      const { error: err } = await supabase
        .from("habit_log")
        .upsert(payload, { onConflict: "athlete_id,date" });

      if (err) {
        setSavedMsg("Error saving: " + err.message);
      } else {
        setSavedMsg("Saved!");
        // Refresh local map
        setLogMap(prev => ({ ...prev, [today]: { ...prev[today], ...payload } }));
        setTimeout(() => setSavedMsg(""), 2500);
      }
    } catch (e) {
      setSavedMsg("Error saving.");
    } finally {
      setSaving(false);
    }
  }

  const streak = computeStreak(logMap, today);
  const last7 = getLast7Days();

  const toggleStyle = (active, color) => ({
    padding: "8px 20px",
    borderRadius: 20,
    border: "1px solid " + (active ? color : "#2a2a2a"),
    background: active ? color + "22" : "transparent",
    color: active ? color : "#444",
    fontSize: 13,
    fontWeight: active ? 800 : 500,
    cursor: "pointer",
    fontFamily: "Georgia,serif",
    transition: "all 0.15s",
  });

  return (
    <div style={{ background: BG, minHeight: "60vh", fontFamily: "Georgia,serif" }}>

      {/* Header: today's date + streak */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 9, color: GOLD, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 900, marginBottom: 2 }}>Daily Habits</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>{formatDisplayDate(today)}</div>
          </div>
          {streak > 0 && (
            <div style={{ background: GREEN + "18", border: "1px solid " + GREEN + "44", borderRadius: 20, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16 }}>🔥</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: GREEN }}>{streak}-day streak</span>
            </div>
          )}
        </div>
        {streak === 0 && (
          <div style={{ marginTop: 6, fontSize: 11, color: "#555" }}>Complete all three habits to start a streak.</div>
        )}
      </div>

      {loadError && (
        <div style={{ fontSize: 12, color: "#e05", background: "#1a0008", border: "1px solid #500", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>{loadError}</div>
      )}

      {/* Habit cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>

        {/* Water */}
        <div style={{ background: CARD, borderRadius: 14, padding: "14px 16px", border: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>💧</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Water</div>
                <div style={{ fontSize: 10, color: "#555" }}>Did you drink enough water today?</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => setWater(true)} style={toggleStyle(water === true, GREEN)}>Yes</button>
              <button onClick={() => setWater(false)} style={toggleStyle(water === false, "#c0392b")}>No</button>
            </div>
          </div>
        </div>

        {/* Nutrition */}
        <div style={{ background: CARD, borderRadius: 14, padding: "14px 16px", border: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>🥗</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Nutrition</div>
                <div style={{ fontSize: 10, color: "#555" }}>Did you eat well today?</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => setNutrition(true)} style={toggleStyle(nutrition === true, GREEN)}>Yes</button>
              <button onClick={() => setNutrition(false)} style={toggleStyle(nutrition === false, "#c0392b")}>No</button>
            </div>
          </div>
        </div>

        {/* Sleep */}
        <div style={{ background: CARD, borderRadius: 14, padding: "14px 16px", border: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 22 }}>😴</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Sleep</div>
                <div style={{ fontSize: 10, color: "#555" }}>Hours of sleep last night</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <input
                type="number"
                min="0"
                max="12"
                step="0.5"
                value={sleepHours}
                onChange={e => {
                  const v = e.target.value;
                  if (v === "" || (parseFloat(v) >= 0 && parseFloat(v) <= 12)) setSleepHours(v);
                }}
                placeholder="hrs"
                style={{
                  width: 70,
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid " + (sleepHours !== "" ? GOLD + "88" : "#2a2a2a"),
                  background: "#0a0a0a",
                  color: sleepHours !== "" ? GOLD : "#666",
                  fontSize: 15,
                  fontWeight: 800,
                  fontFamily: "Georgia,serif",
                  textAlign: "center",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: 11, color: "#555" }}>/ 12</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={saveHabits}
        disabled={saving}
        style={{
          width: "100%",
          padding: "13px",
          borderRadius: 12,
          border: "none",
          background: saving ? "#1a1a1a" : "linear-gradient(135deg," + GOLD + "," + GOLD + "aa)",
          color: saving ? "#444" : "#000",
          fontSize: 14,
          fontWeight: 900,
          cursor: saving ? "default" : "pointer",
          fontFamily: "Georgia,serif",
          letterSpacing: "0.04em",
          marginBottom: 8,
          transition: "all 0.15s",
          boxShadow: saving ? "none" : "0 0 20px " + GOLD + "44",
        }}
      >
        {saving ? "Saving…" : "Save Today's Habits"}
      </button>

      {savedMsg && (
        <div style={{
          textAlign: "center",
          fontSize: 13,
          fontWeight: 700,
          color: savedMsg.startsWith("Error") ? "#e05" : GREEN,
          marginBottom: 16,
          padding: "8px",
          background: (savedMsg.startsWith("Error") ? "#e05" : GREEN) + "18",
          borderRadius: 10,
          border: "0.5px solid " + (savedMsg.startsWith("Error") ? "#e05" : GREEN) + "44",
        }}>
          {savedMsg.startsWith("Error") ? savedMsg : "✓ " + savedMsg}
        </div>
      )}

      {/* Last 7 days history */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 9, color: GOLD, textTransform: "uppercase", letterSpacing: "0.2em", fontWeight: 900, marginBottom: 10 }}>Last 7 Days</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {last7.map(dateStr => {
            const row = logMap[dateStr];
            const isToday = dateStr === today;
            const [, , dd] = dateStr.split("-");
            const dayLabel = new Date(...dateStr.split("-").map((v, i) => i === 1 ? Number(v) - 1 : Number(v))).toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);

            const waterOk = row && row.water === true;
            const nutritionOk = row && row.nutrition === true;
            const sleepVal = row && row.sleep != null ? Number(row.sleep) : null;
            const allDone = waterOk && nutritionOk && sleepVal != null && sleepVal > 0;

            return (
              <div
                key={dateStr}
                style={{
                  background: allDone ? GREEN + "18" : "#111",
                  border: "1px solid " + (isToday ? GOLD + "66" : allDone ? GREEN + "44" : "#1e1e1e"),
                  borderRadius: 10,
                  padding: "8px 4px",
                  textAlign: "center",
                  boxShadow: isToday ? "0 0 8px " + GOLD + "33" : "none",
                }}
              >
                <div style={{ fontSize: 9, color: isToday ? GOLD : "#555", fontWeight: isToday ? 800 : 400, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{dayLabel}</div>
                <div style={{ fontSize: 11, color: isToday ? GOLD : "#666", fontWeight: 700, marginBottom: 5 }}>{parseInt(dd, 10)}</div>
                <div style={{ fontSize: 10, lineHeight: 1.6 }}>
                  <div style={{ color: waterOk ? GREEN : "#333" }}>{waterOk ? "✓" : "—"}</div>
                  <div style={{ color: nutritionOk ? GREEN : "#333" }}>{nutritionOk ? "✓" : "—"}</div>
                  <div style={{ color: sleepVal != null && sleepVal > 0 ? GOLD : "#333", fontSize: 9 }}>
                    {sleepVal != null && sleepVal > 0 ? sleepVal + "h" : "—"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 10, color: GREEN }}>✓</span>
            <span style={{ fontSize: 9, color: "#555" }}>💧 Water</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 10, color: GREEN }}>✓</span>
            <span style={{ fontSize: 9, color: "#555" }}>🥗 Nutrition</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 10, color: GOLD }}>8h</span>
            <span style={{ fontSize: 9, color: "#555" }}>😴 Sleep hours</span>
          </div>
        </div>
      </div>
    </div>
  );
}
