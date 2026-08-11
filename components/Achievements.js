import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const GOLD = "#D4AF37", ORANGE = "#E8720C", GREEN = "#2FA869", PUR = "#8C82E8", STEEL = "#8CA0B0", BLUE = "#4DC8F5", RED = "#C0392B";

// Each badge: current progress `cur` vs `goal`. Earned when cur >= goal.
function buildBadges(s) {
  return [
    { id: "first",   emoji: "🎯", name: "First Rep",       desc: "Check in for the first time", color: GREEN,  cur: s.sessions,   goal: 1 },
    { id: "early5",  emoji: "⏰", name: "Early Bird",       desc: "5 early check-ins",           color: BLUE,   cur: s.early,      goal: 5 },
    { id: "early15", emoji: "🌅", name: "Dawn Patrol",      desc: "15 early check-ins",          color: BLUE,   cur: s.early,      goal: 15 },
    { id: "early30", emoji: "🦅", name: "Rise & Grind",     desc: "30 early check-ins",          color: BLUE,   cur: s.early,      goal: 30 },
    { id: "streak3", emoji: "✨", name: "Warming Up",       desc: "3-day early streak",          color: ORANGE, cur: s.bestStreak, goal: 3 },
    { id: "streak7", emoji: "🔥", name: "On Fire",          desc: "7-day early streak",          color: ORANGE, cur: s.bestStreak, goal: 7 },
    { id: "streak14",emoji: "⚡", name: "Unstoppable",      desc: "14-day early streak",         color: GOLD,   cur: s.bestStreak, goal: 14 },
    { id: "reg20",   emoji: "📅", name: "Regular",          desc: "20 total sessions",           color: PUR,    cur: s.sessions,   goal: 20 },
    { id: "reg50",   emoji: "🏛️", name: "Iron Committed",   desc: "50 total sessions",           color: STEEL,  cur: s.sessions,   goal: 50 },
    { id: "reliable",emoji: "✅", name: "Reliable",         desc: "10 sessions, never late",     color: GREEN,  cur: (s.late === 0 ? s.sessions : 0), goal: 10 },
    { id: "anvil1",  emoji: "⚒️", name: "Anvil Winner",     desc: "Win the Anvil",               color: GOLD,   cur: s.anvilWins,  goal: 1 },
    { id: "anvil3",  emoji: "👑", name: "Anvil Legend",     desc: "Win the Anvil 3 times",       color: GOLD,   cur: s.anvilWins,  goal: 3 },
  ];
}

export default function Achievements({ athleteId, athleteName }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!athleteId) return;
    let alive = true;
    (async () => {
      const out = { sessions: 0, early: 0, late: 0, bestStreak: 0, curStreak: 0, anvilWins: 0 };
      try {
        const { data } = await supabase.from("attendance").select("status").eq("athlete_id", athleteId);
        if (data) { out.sessions = data.length; out.early = data.filter(r => r.status === "early").length; out.late = data.filter(r => r.status === "late").length; }
      } catch (e) {}
      try {
        const { data } = await supabase.from("leaderboard").select("best_streak,current_streak,early_count,late_count").eq("athlete_id", athleteId).maybeSingle();
        if (data) { out.bestStreak = data.best_streak || 0; out.curStreak = data.current_streak || 0; if (!out.early) out.early = data.early_count || 0; if (!out.late) out.late = data.late_count || 0; }
      } catch (e) {}
      try {
        if (athleteName) { const { data } = await supabase.from("anvil").select("id").eq("athlete_name", athleteName); if (data) out.anvilWins = data.length; }
      } catch (e) {}
      if (alive) setStats(out);
    })();
    return () => { alive = false; };
  }, [athleteId, athleteName]);

  if (!stats) return <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#888", fontFamily: "Georgia,serif" }}>Loading your achievements…</div>;

  const badges = buildBadges(stats);
  const earned = badges.filter(b => b.cur >= b.goal);
  const pct = Math.round((earned.length / badges.length) * 100);

  return (
    <div style={{ fontFamily: "Georgia,serif" }}>
      {/* Header + overall progress */}
      <div style={{ background: "linear-gradient(140deg," + GOLD + "22," + GOLD + "0a,#0d0d0d)", borderRadius: 16, padding: "18px 18px 16px", marginBottom: 14, border: "1px solid " + GOLD + "33", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent," + GOLD + "," + ORANGE + ",transparent)" }} />
        <div style={{ fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: "0.16em", fontWeight: 700, marginBottom: 4 }}>Achievements</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{earned.length}</div>
          <div style={{ fontSize: 14, color: "#888" }}>of {badges.length} earned</div>
        </div>
        <div style={{ height: 8, borderRadius: 5, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: pct + "%", borderRadius: 5, background: "linear-gradient(90deg," + ORANGE + "," + GOLD + ")", boxShadow: "0 0 12px " + GOLD + "88", transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)" }} />
        </div>
      </div>

      {/* Badge grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {badges.map(b => {
          const done = b.cur >= b.goal;
          const progress = Math.min(b.cur, b.goal);
          return (
            <div key={b.id} style={{
              background: done ? "linear-gradient(145deg," + b.color + "26," + b.color + "0c,#0d0d0d)" : "#111",
              borderRadius: 14, padding: "16px 12px 14px", textAlign: "center", position: "relative", overflow: "hidden",
              border: "1px solid " + (done ? b.color + "66" : "#1e1e1e"),
              boxShadow: done ? "0 0 20px " + b.color + "22" : "none",
              opacity: done ? 1 : 0.92,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%", margin: "0 auto 8px",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, lineHeight: 1,
                background: done ? b.color + "1e" : "rgba(255,255,255,0.04)",
                border: "1px solid " + (done ? b.color + "77" : "rgba(255,255,255,0.08)"),
                filter: done ? "none" : "grayscale(1)", boxShadow: done ? "0 0 16px " + b.color + "44" : "none",
              }}>{done ? b.emoji : "🔒"}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: done ? "#fff" : "#888", letterSpacing: "-0.01em", marginBottom: 2 }}>{b.name}</div>
              <div style={{ fontSize: 10.5, color: done ? b.color : "#666", lineHeight: 1.4, marginBottom: done ? 0 : 8, minHeight: done ? 0 : 26 }}>{b.desc}</div>
              {!done && (
                <div>
                  <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 4 }}>
                    <div style={{ height: "100%", width: Math.round((progress / b.goal) * 100) + "%", borderRadius: 3, background: b.color, opacity: 0.85 }} />
                  </div>
                  <div style={{ fontSize: 9.5, color: "#777", fontWeight: 600 }}>{progress} / {b.goal}</div>
                </div>
              )}
              {done && <div style={{ fontSize: 9, color: b.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 6 }}>✓ Earned</div>}
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: "center", fontSize: 11, color: "#555", marginTop: 16, lineHeight: 1.6 }}>
        Badges update as you check in early, build streaks, and win the Anvil.<br />Earned. Not given.
      </div>
    </div>
  );
}
