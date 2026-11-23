import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { prEvents } from "../lib/lifting";
import { loadSeason, defaultSeason, isBeforeSeason, fmtFirstClass } from "../lib/season";

const GOLD = "#D4AF37", ORANGE = "#E8720C", GREEN = "#3FCB7F", BLUE = "#4DC8F5", PUR = "#9A8CF0", RED = "#E8635B", STEEL = "#8CA0B0";


// Count a number up from 0 → value on mount (respects reduced motion).
function CountUp({ value, dur = 950, suffix = "" }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") { setN(value); return; }
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !value) { setN(value); return; }
    let raf; const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, dur]);
  return <>{n.toLocaleString()}{suffix}</>;
}

function archetypeFor(s, earlyPct) {
  if (s.anvilWins > 0) return { name: "The Anvil", emoji: "🔨", tag: "Earned. Not given.", color: GOLD };
  if (s.bestStreak >= 10) return { name: "Iron Will", emoji: "⚡", tag: "Relentless consistency.", color: ORANGE };
  if (earlyPct >= 85 && s.sessions >= 8) return { name: "Dawn Patrol", emoji: "🌅", tag: "First one in, every time.", color: BLUE };
  if (s.prs >= 15) return { name: "PR Machine", emoji: "💪", tag: "Always chasing the next rep.", color: RED };
  if (s.late === 0 && s.sessions >= 10) return { name: "The Reliable", emoji: "✅", tag: "Never a no-show.", color: GREEN };
  if (s.sessions >= 25) return { name: "The Grinder", emoji: "🏋️", tag: "Shows up and does the work.", color: PUR };
  return { name: "The Builder", emoji: "🔩", tag: "Laying the foundation.", color: STEEL };
}

export default function SeasonRecap({ athleteId, athleteName, photoUrl }) {
  const [s, setS] = useState(null);
  // Season the coach set (Coach → Program), else the current academic term.
  const [season, setSeason] = useState(() => defaultSeason());
  const SEASON_LABEL = season.label;

  useEffect(() => {
    if (!athleteId) return;
    let alive = true;
    (async () => {
      const ssn = await loadSeason();
      // Before the new season's first class there's nothing to recap yet, so show
      // all-time numbers (and say what's coming) instead of a card full of zeros.
      const view = isBeforeSeason(ssn)
        ? { ...ssn, label: "All-time", start: "2000-01-01", upcoming: ssn.label + " starts " + fmtFirstClass(ssn) }
        : ssn;
      if (alive) setSeason(view);
      const SEASON_START = view.start;
      const out = { sessions: 0, early: 0, late: 0, bestStreak: 0, prs: 0, anvilWins: 0, totalLbs: 0, rankPct: null, cells: [] };
      try {
        const { data } = await supabase.from("attendance").select("status,date").eq("athlete_id", athleteId).gte("date", SEASON_START).order("date", { ascending: true });
        if (data) { out.sessions = data.length; out.early = data.filter(r => r.status === "early").length; out.late = data.filter(r => r.status === "late").length; out.cells = data.map(r => r.status); }
      } catch (e) {}
      try {
        const { data } = await supabase.from("leaderboard").select("best_streak").eq("athlete_id", athleteId).maybeSingle();
        if (data) out.bestStreak = data.best_streak || 0;
      } catch (e) {}
      try {
        // PRs = real records (a lift's best beating everything before it, once per day) —
        // all of this athlete's history is needed so the first season log isn't a "PR".
        const { data } = await supabase.from("pr_log").select("id,athlete_id,lift,weight,reps,date,created_at").eq("athlete_id", athleteId);
        if (data) {
          const season = data.filter(r => String(r.date || "") >= SEASON_START);
          out.prs = prEvents(data).filter(e => String(e.date || "") >= SEASON_START).length;
          out.totalLbs = season.reduce((sum, r) => sum + (Number(r.weight) || 0) * (Number(r.reps) || 1), 0);
        }
      } catch (e) {}
      try {
        if (athleteName) { const { data } = await supabase.from("anvil").select("id").eq("athlete_name", athleteName); if (data) out.anvilWins = data.length; }
      } catch (e) {}
      // Team rank by early check-ins (only meaningful with a few athletes)
      try {
        const { data } = await supabase.from("leaderboard").select("early_count");
        if (data && data.length >= 5) {
          const mine = out.early;
          const below = data.filter(r => (r.early_count || 0) < mine).length;
          out.rankPct = Math.round((below / data.length) * 100);
        }
      } catch (e) {}
      if (alive) setS(out);
    })();
    return () => { alive = false; };
  }, [athleteId, athleteName]);

  if (!s) return <div className="tfx af af-rc"><div className="tfx-card att-loading">Building your season…</div></div>;

  const earlyPct = s.sessions ? Math.round((s.early / s.sessions) * 100) : 0;
  const first = (athleteName || "").split(" ")[0];
  const type = archetypeFor(s, earlyPct);

  const tiles = [
    { label: "Sessions",   num: s.sessions,  color: GOLD },
    { label: "Early %",    num: earlyPct, suffix: "%", color: GREEN },
    { label: "Best streak",num: s.bestStreak, sub: "days", color: ORANGE },
    { label: "PRs set",    num: s.prs,     color: BLUE },
    { label: "Anvil wins", num: s.anvilWins, color: GOLD },
    { label: "Early reps", num: s.early,   color: PUR },
  ];

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "My TF College Group Season", text: (first ? first + " — " : "") + type.name + " " + type.emoji + " | " + SEASON_LABEL + ": " + s.sessions + " sessions, " + earlyPct + "% early, " + s.bestStreak + "-day best streak, " + s.totalLbs.toLocaleString() + " lbs moved. Iron sharpens iron. 💪" });
    } catch (e) {}
  };

  return (
    <div className="tfx af af-rc tf-fade-up">
      <section className="tfx-card af-rc-card">
        {/* Header */}
        <div className="af-rc-top">
          <div className="tfx-eyebrow">My season</div>
          <span className="af-av is-xl" style={{ "--c": "#4a4540" }}>
            {photoUrl ? <img src={photoUrl} alt="" /> : (first ? first[0] : "?")}
          </span>
          <h2>{athleteName || "Athlete"}</h2>
          <div className="af-rc-season">{SEASON_LABEL}</div>
          {season.upcoming && <div className="af-rc-upcoming">{season.upcoming} — this card resets then</div>}
        </div>

        {/* Archetype reveal */}
        <div className="af-rc-type tf-pop" style={{ "--c": type.color }}>
          <div className="tfx-eyebrow">Your season type</div>
          <b>{type.emoji} {type.name}</b>
          <small>{type.tag}</small>
        </div>

        {/* Total weight moved — hero */}
        {s.totalLbs > 0 && (
          <div className="af-rc-lbs">
            <b className="tfx-num"><CountUp value={s.totalLbs} /></b>
            <div className="tfx-eyebrow">Total pounds moved</div>
          </div>
        )}

        {/* Stat grid */}
        <div className="af-rc-tiles">
          {tiles.map(t => (
            <div key={t.label} className="af-rc-tile" style={{ "--c": t.color }}>
              <b className="tfx-num"><CountUp value={t.num} suffix={t.suffix || ""} />{t.sub && <small>{t.sub}</small>}</b>
              <span><i aria-hidden="true" />{t.label}</span>
            </div>
          ))}
        </div>

        {/* Season at a glance — one cell per session */}
        {s.cells && s.cells.length > 0 && (
          <div className="af-rc-strip">
            <div className="tfx-eyebrow">Your season, session by session</div>
            <div className="af-rc-cells">
              {s.cells.map((st, i) => (
                <span key={i} title={st} className={st === "early" ? "is-early" : st === "late" ? "is-late" : ""} />
              ))}
            </div>
            <div className="af-rc-key">
              <span className="is-early"><i />Early</span>
              <span className="is-late"><i />Late</span>
            </div>
          </div>
        )}

        {/* Rank line */}
        {s.rankPct != null && s.rankPct > 0 && (
          <p className="af-rc-rank">
            You showed up early more than <b>{s.rankPct}%</b> of the team.
          </p>
        )}

        {/* Footer */}
        <div className="af-rc-verse">
          <p>“As iron sharpens iron, so one person sharpens another.”</p>
          <div className="tfx-eyebrow">Faith · Family · Fitness · TF College Group</div>
        </div>
      </section>

      <button className="tfx-btn tfx-press af-rc-share" onClick={share}>Share my season →</button>
      <p className="af-foot">Screenshot the card above to post it, or tap Share.</p>
    </div>
  );
}
