import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const GOLD = "#D4AF37", ORANGE = "#E8720C", GREEN = "#3FCB7F", BLUE = "#4DC8F5", PUR = "#9A8CF0";
const INK = "#fdf6ec"; // warm white, collision-safe against the light-mode text flip

// Season window — Summer 2026 program (12 weeks from May 19).
const SEASON_LABEL = "Summer 2026";
const SEASON_START = "2026-05-19";

export default function SeasonRecap({ athleteId, athleteName, photoUrl }) {
  const [s, setS] = useState(null);

  useEffect(() => {
    if (!athleteId) return;
    let alive = true;
    (async () => {
      const out = { sessions: 0, early: 0, late: 0, bestStreak: 0, prs: 0, anvilWins: 0 };
      try {
        const { data } = await supabase.from("attendance").select("status,date").eq("athlete_id", athleteId).gte("date", SEASON_START);
        if (data) { out.sessions = data.length; out.early = data.filter(r => r.status === "early").length; out.late = data.filter(r => r.status === "late").length; }
      } catch (e) {}
      try {
        const { data } = await supabase.from("leaderboard").select("best_streak").eq("athlete_id", athleteId).maybeSingle();
        if (data) out.bestStreak = data.best_streak || 0;
      } catch (e) {}
      try {
        const { data } = await supabase.from("pr_log").select("id").eq("athlete_id", athleteId);
        if (data) out.prs = data.length;
      } catch (e) {}
      try {
        if (athleteName) { const { data } = await supabase.from("anvil").select("id").eq("athlete_name", athleteName); if (data) out.anvilWins = data.length; }
      } catch (e) {}
      if (alive) setS(out);
    })();
    return () => { alive = false; };
  }, [athleteId, athleteName]);

  if (!s) return <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#888", fontFamily: "Georgia,serif" }}>Building your season…</div>;

  const earlyPct = s.sessions ? Math.round((s.early / s.sessions) * 100) : 0;
  const first = (athleteName || "").split(" ")[0];

  // Pick a standout headline from the strongest stat.
  let headline = "You showed up and did the work.";
  if (s.anvilWins > 0) headline = s.anvilWins === 1 ? "You earned the Anvil this season. 🔨" : "You earned the Anvil " + s.anvilWins + " times. Legendary. 👑";
  else if (s.bestStreak >= 7) headline = "You strung together a " + s.bestStreak + "-day early streak.";
  else if (earlyPct >= 80 && s.sessions >= 5) headline = "You were early " + earlyPct + "% of the time. Elite.";
  else if (s.prs >= 5) headline = "You set " + s.prs + " personal records.";
  else if (s.sessions >= 20) headline = s.sessions + " sessions in. That's showing up.";

  const tiles = [
    { label: "Sessions", val: s.sessions, color: GOLD },
    { label: "Early %", val: earlyPct + "%", color: GREEN },
    { label: "Best Streak", val: s.bestStreak, sub: "days", color: ORANGE },
    { label: "PRs Set", val: s.prs, color: BLUE },
    { label: "Anvil Wins", val: s.anvilWins, color: GOLD },
    { label: "Early Reps", val: s.early, color: PUR },
  ];

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "My TF College Group Season", text: (first ? first + "'s " : "My ") + SEASON_LABEL + " season: " + s.sessions + " sessions, " + earlyPct + "% early, " + s.bestStreak + "-day best streak, " + s.prs + " PRs. Iron sharpens iron. 💪" });
    } catch (e) {}
  };

  return (
    <div className="tf-fade-up" style={{ fontFamily: "Georgia,serif" }}>
      <div style={{
        borderRadius: 22, overflow: "hidden", position: "relative", padding: "28px 20px 24px",
        background: "radial-gradient(130% 80% at 50% 0%, rgba(232,114,12,0.32) 0%, rgba(212,175,55,0.14) 32%, rgba(14,9,2,0.99) 74%)",
        border: "1px solid " + GOLD + "44", boxShadow: "0 0 60px rgba(232,114,12,0.18), 0 20px 50px rgba(0,0,0,0.55)",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,transparent," + ORANGE + "," + GOLD + ",transparent)" }} />
        <div style={{ position: "absolute", top: 14, right: 16, fontSize: 15, opacity: 0.5 }}>✨</div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.34em", textTransform: "uppercase", color: GOLD, fontWeight: 700, marginBottom: 12 }}>My Season</div>
          <div style={{ width: 78, height: 78, borderRadius: "50%", margin: "0 auto 12px", overflow: "hidden", border: "2px solid " + GOLD + "88", boxShadow: "0 0 26px " + GOLD + "55", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, color: GOLD, fontWeight: 800 }}>
            {photoUrl ? <img src={photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (first ? first[0] : "?")}
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: INK, letterSpacing: "-0.01em", textShadow: "0 2px 18px rgba(0,0,0,0.5)" }}>{athleteName || "Athlete"}</div>
          <div style={{ fontSize: 12, color: GOLD, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 3 }}>{SEASON_LABEL}</div>
        </div>

        {/* Headline */}
        <div style={{ textAlign: "center", fontSize: 16, color: INK, lineHeight: 1.5, fontWeight: 700, margin: "0 auto 20px", maxWidth: 320, textShadow: "0 1px 10px rgba(0,0,0,0.5)" }}>{headline}</div>

        {/* Stat grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, marginBottom: 18 }}>
          {tiles.map(t => (
            <div key={t.label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: "13px 6px", textAlign: "center", border: "1px solid rgba(212,175,55,0.22)" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: t.color, lineHeight: 1 }}>{t.val}</div>
              {t.sub && <div style={{ fontSize: 8, color: INK, opacity: 0.5, marginTop: 1 }}>{t.sub}</div>}
              <div style={{ fontSize: 9, color: INK, opacity: 0.72, marginTop: 5, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{t.label}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", borderTop: "1px solid rgba(212,175,55,0.2)", paddingTop: 14 }}>
          <div style={{ fontSize: 12, color: INK, opacity: 0.85, fontStyle: "italic", lineHeight: 1.6, marginBottom: 8 }}>“As iron sharpens iron, so one person sharpens another.”</div>
          <div style={{ fontSize: 9, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase" }}>Faith · Family · Fitness · TF College Group</div>
        </div>
      </div>

      <button onClick={share} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginTop: 14, padding: "13px", borderRadius: 14, border: "none", background: "linear-gradient(135deg," + ORANGE + "," + GOLD + ")", color: "#1a1200", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "Georgia,serif", letterSpacing: "0.02em", boxShadow: "0 6px 24px " + ORANGE + "44" }}>Share my season →</button>
      <div style={{ textAlign: "center", fontSize: 11, color: "#666", marginTop: 10, lineHeight: 1.5 }}>Screenshot the card above to post it, or tap Share.</div>
    </div>
  );
}
