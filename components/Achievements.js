import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";

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

  const Header = () => (
    <header className="tfx-hb-head">
      <div>
        <div className="tfx-eyebrow">Achievements</div>
        <h2>Badges</h2>
      </div>
    </header>
  );

  if (!stats) return <div className="tfx af af-bd-wrap"><Header /><div className="tfx-card att-loading">Loading your achievements…</div></div>;

  const badges = buildBadges(stats);
  const earned = badges.filter(b => b.cur >= b.goal);
  const pct = Math.round((earned.length / badges.length) * 100);

  return (
    <div className="tfx af af-bd-wrap">
      <Header />

      {/* Overall progress */}
      <section className="tfx-card af-bd-hero">
        <div className="af-bd-count">
          <b className="tfx-num">{earned.length}</b>
          <span>of {badges.length} earned</span>
        </div>
        <div className="af-meter" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Badges earned">
          <i style={{ width: pct + "%" }} />
        </div>
      </section>

      {/* Badge grid */}
      <div className="af-bd-grid">
        {badges.map(b => {
          const done = b.cur >= b.goal;
          const progress = Math.min(b.cur, b.goal);
          return (
            <div key={b.id} className={"tfx-card af-bd" + (done ? " is-done" : "")} style={{ "--c": b.color }}>
              <span className="af-bd-ic" aria-hidden="true">{done ? b.emoji : <Icon name="lock" size={20} />}</span>
              <b>{b.name}</b>
              <p>{b.desc}</p>
              {!done && (
                <div className="af-bd-prog">
                  <div className="af-meter"><i style={{ width: Math.round((progress / b.goal) * 100) + "%" }} /></div>
                  <small>{progress} / {b.goal}</small>
                </div>
              )}
              {done && <div className="af-bd-earned"><span className="af-pill">✓ Earned</span></div>}
            </div>
          );
        })}
      </div>

      <p className="af-foot">
        Badges update as you check in early, build streaks, and win the Anvil.<br />Earned. Not given.
      </p>
    </div>
  );
}
