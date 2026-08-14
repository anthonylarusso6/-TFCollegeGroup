import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const GOLD = "#D4AF37", ORANGE = "#E8720C", GREEN = "#3FCB7F", BLUE = "#4DC8F5", PUR = "#9A8CF0", RED = "#E8635B", STEEL = "#8CA0B0";
const INK = "#fdf6ec"; // warm white, collision-safe against the light-mode text flip

const SEASON_LABEL = "Summer 2026";
const SEASON_START = "2026-05-19";

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

  useEffect(() => {
    if (!athleteId) return;
    let alive = true;
    (async () => {
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
        const { data } = await supabase.from("pr_log").select("weight,reps").eq("athlete_id", athleteId);
        if (data) { out.prs = data.length; out.totalLbs = data.reduce((sum, r) => sum + (Number(r.weight) || 0) * (Number(r.reps) || 1), 0); }
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

  if (!s) return <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#888", fontFamily: "Georgia,serif" }}>Building your season…</div>;

  const earlyPct = s.sessions ? Math.round((s.early / s.sessions) * 100) : 0;
  const first = (athleteName || "").split(" ")[0];
  const type = archetypeFor(s, earlyPct);

  const tiles = [
    { label: "Sessions",   num: s.sessions,  color: GOLD },
    { label: "Early %",    num: earlyPct, suffix: "%", color: GREEN },
    { label: "Best Streak",num: s.bestStreak, sub: "days", color: ORANGE },
    { label: "PRs Set",    num: s.prs,     color: BLUE },
    { label: "Anvil Wins", num: s.anvilWins, color: GOLD },
    { label: "Early Reps", num: s.early,   color: PUR },
  ];

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "My TF College Group Season", text: (first ? first + " — " : "") + type.name + " " + type.emoji + " | " + SEASON_LABEL + ": " + s.sessions + " sessions, " + earlyPct + "% early, " + s.bestStreak + "-day best streak, " + s.totalLbs.toLocaleString() + " lbs moved. Iron sharpens iron. 💪" });
    } catch (e) {}
  };

  return (
    <div className="tf-fade-up" style={{ fontFamily: "Georgia,serif" }}>
      <div style={{
        borderRadius: 22, overflow: "hidden", position: "relative", padding: "26px 20px 22px",
        background: "radial-gradient(130% 80% at 50% 0%, rgba(232,114,12,0.32) 0%, rgba(212,175,55,0.14) 32%, rgba(14,9,2,0.99) 74%)",
        border: "1px solid " + GOLD + "44", boxShadow: "0 0 60px rgba(232,114,12,0.18), 0 20px 50px rgba(0,0,0,0.55)",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,transparent," + ORANGE + "," + GOLD + ",transparent)" }} />
        {["10%,14%,0.9s", "82%,20%,1.4s", "20%,72%,1.1s", "88%,64%,1.7s"].map((p, i) => {
          const [l, t, d] = p.split(",");
          return <span key={i} style={{ position: "absolute", left: l, top: t, fontSize: 12, opacity: 0.6, animation: "tfSpark 3.2s ease-in-out " + d + " infinite" }}>✨</span>;
        })}

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 14, position: "relative" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.34em", textTransform: "uppercase", color: GOLD, fontWeight: 700, marginBottom: 12 }}>My Season</div>
          <div style={{ width: 76, height: 76, borderRadius: "50%", margin: "0 auto 10px", overflow: "hidden", border: "2px solid " + GOLD + "88", boxShadow: "0 0 26px " + GOLD + "55", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, color: GOLD, fontWeight: 800 }}>
            {photoUrl ? <img src={photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (first ? first[0] : "?")}
          </div>
          <div style={{ fontSize: 23, fontWeight: 900, color: INK, letterSpacing: "-0.01em", textShadow: "0 2px 18px rgba(0,0,0,0.5)" }}>{athleteName || "Athlete"}</div>
          <div style={{ fontSize: 12, color: GOLD, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 2 }}>{SEASON_LABEL}</div>
        </div>

        {/* Archetype reveal */}
        <div className="tf-pop" style={{ textAlign: "center", borderRadius: 16, padding: "14px 12px", margin: "0 auto 16px", maxWidth: 320, background: "linear-gradient(145deg," + type.color + "26," + type.color + "0a)", border: "1px solid " + type.color + "55", boxShadow: "0 0 24px " + type.color + "26" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.24em", textTransform: "uppercase", color: type.color, fontWeight: 700, marginBottom: 4 }}>Your Season Type</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: INK, lineHeight: 1.05 }}>{type.emoji} {type.name}</div>
          <div style={{ fontSize: 12, color: type.color, marginTop: 3, fontWeight: 600 }}>{type.tag}</div>
        </div>

        {/* Total weight moved — hero */}
        {s.totalLbs > 0 && (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 34, fontWeight: 900, color: GOLD, lineHeight: 1, letterSpacing: "-0.02em", textShadow: "0 2px 20px " + GOLD + "44" }}><CountUp value={s.totalLbs} /> </div>
            <div style={{ fontSize: 10, color: INK, opacity: 0.7, letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 4 }}>Total pounds moved 🏋️</div>
          </div>
        )}

        {/* Stat grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, marginBottom: 14 }}>
          {tiles.map(t => (
            <div key={t.label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: "13px 6px", textAlign: "center", border: "1px solid rgba(212,175,55,0.22)" }}>
              <div style={{ fontSize: 23, fontWeight: 900, color: t.color, lineHeight: 1 }}><CountUp value={t.num} suffix={t.suffix || ""} /></div>
              {t.sub && <div style={{ fontSize: 8, color: INK, opacity: 0.5, marginTop: 1 }}>{t.sub}</div>}
              <div style={{ fontSize: 9, color: INK, opacity: 0.72, marginTop: 5, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{t.label}</div>
            </div>
          ))}
        </div>

        {/* Season at a glance — one cell per session */}
        {s.cells && s.cells.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, color: INK, opacity: 0.6, letterSpacing: "0.14em", textTransform: "uppercase", textAlign: "center", marginBottom: 7 }}>Your season, session by session</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
              {s.cells.map((st, i) => (
                <span key={i} title={st} style={{ width: 12, height: 12, borderRadius: 3, background: st === "early" ? GOLD : st === "late" ? ORANGE : "rgba(255,255,255,0.18)", boxShadow: st === "early" ? "0 0 6px " + GOLD + "66" : "none" }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 8, fontSize: 9, color: INK, opacity: 0.6 }}>
              <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: GOLD, marginRight: 4, verticalAlign: "middle" }} />Early</span>
              <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: ORANGE, marginRight: 4, verticalAlign: "middle" }} />Late</span>
            </div>
          </div>
        )}

        {/* Rank line */}
        {s.rankPct != null && s.rankPct > 0 && (
          <div style={{ textAlign: "center", fontSize: 12, color: INK, opacity: 0.9, marginBottom: 14, fontWeight: 600 }}>
            🏆 You showed up early more than <span style={{ color: GOLD, fontWeight: 800 }}>{s.rankPct}%</span> of the team.
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", borderTop: "1px solid rgba(212,175,55,0.2)", paddingTop: 13 }}>
          <div style={{ fontSize: 12, color: INK, opacity: 0.85, fontStyle: "italic", lineHeight: 1.6, marginBottom: 8 }}>“As iron sharpens iron, so one person sharpens another.”</div>
          <div style={{ fontSize: 9, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase" }}>Faith · Family · Fitness · TF College Group</div>
        </div>
      </div>

      <button onClick={share} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginTop: 14, padding: "13px", borderRadius: 14, border: "none", background: "linear-gradient(135deg," + ORANGE + "," + GOLD + ")", color: "#1a1200", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "Georgia,serif", letterSpacing: "0.02em", boxShadow: "0 6px 24px " + ORANGE + "44" }}>Share my season →</button>
      <div style={{ textAlign: "center", fontSize: 11, color: "#666", marginTop: 10, lineHeight: 1.5 }}>Screenshot the card above to post it, or tap Share.</div>
    </div>
  );
}
