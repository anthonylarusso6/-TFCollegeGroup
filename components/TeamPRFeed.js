import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { GOLD, GREEN, RED, STEEL } from "../lib/constants";
import { Skeleton, SkeletonList } from "./Skeleton";

// Same PR math as the Iron Room so the feed agrees with the celebration.
const epley = (w, r) => (r === 1 ? w : Math.round(w * (1 + r / 30)));
const VERT = new Set(["pvc max vert"]);
const isVert = (n) => VERT.has((n || "").toLowerCase());

function relTime(dateStr, createdAt) {
  const base = createdAt ? new Date(createdAt) : new Date((dateStr || "") + "T12:00:00");
  if (isNaN(base)) return "";
  const diff = Date.now() - base.getTime();
  const day = 86400000;
  const d = Math.floor(diff / day);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 7) return d + "d ago";
  if (d < 30) return Math.floor(d / 7) + "w ago";
  return base.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function TeamPRFeed({ athletes = [], currentAthleteId = null, compact = false, onSeeAll = null }) {
  const [events, setEvents] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("pr_log")
          .select("id,athlete_id,lift,weight,reps,date,created_at")
          .order("date", { ascending: true })
          .order("created_at", { ascending: true });
        if (!alive) return;
        if (error) { setEvents([]); return; }
        // Walk chronologically, tracking each athlete+lift running best.
        // An entry that beats the prior best is a PR event (matches the celebration rule).
        const best = {};
        const ev = [];
        for (const row of (data || [])) {
          const w = parseFloat(row.weight) || 0;
          const r = parseInt(row.reps) || 1;
          if (!w) continue;
          const vert = isVert(row.lift);
          const metric = vert ? w : epley(w, r);
          const key = row.athlete_id + "|" + (row.lift || "").toLowerCase();
          const prev = best[key];
          if (prev != null && metric > prev) {
            ev.push({ id: row.id, athlete_id: row.athlete_id, lift: row.lift, metric, unit: vert ? "in" : "lbs", delta: Math.round(metric - prev), date: row.date, created_at: row.created_at });
          }
          if (prev == null || metric > prev) best[key] = metric;
        }
        ev.reverse(); // most recent first
        setEvents(ev);
      } catch (e) { if (alive) setEvents([]); }
    })();
    return () => { alive = false; };
  }, []);

  const aMap = {};
  athletes.forEach(a => { aMap[a.id] = a; });
  const all = (events || []).filter(e => aMap[e.athlete_id]);
  const shown = compact ? all.slice(0, 4) : all.slice(0, 50);

  const Header = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: compact ? 11 : 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: compact ? 15 : 20 }}>🏆</span>{compact ? "Recent Team PRs" : "Team PR Feed"}
        </div>
        {!compact && <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>Every new record, as it happens.</div>}
      </div>
      {compact && onSeeAll && all.length > 0 && (
        <button onClick={onSeeAll} style={{ fontSize: 11, fontWeight: 700, color: GOLD, background: "transparent", border: "1px solid " + GOLD + "44", borderRadius: 8, padding: "5px 11px", cursor: "pointer", fontFamily: "Georgia,serif" }}>See all →</button>
      )}
    </div>
  );

  if (events === null) {
    return (
      <div>
        <Header />
        {!compact && <Skeleton height={54} radius={14} style={{ marginBottom: 10 }} />}
        <SkeletonList rows={compact ? 2 : 5} avatar />
      </div>
    );
  }

  if (all.length === 0) {
    if (compact) return null; // don't clutter the home when there's nothing yet
    return (
      <div>
        <Header />
        <div style={{ background: "#111", borderRadius: 16, padding: "2.5rem 1.5rem", textAlign: "center", border: "0.5px solid #1e1e1e" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🏋️</div>
          <div style={{ fontSize: 14, color: "#888", fontWeight: 600 }}>No PRs yet — be the first.</div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>Beat one of your records in the Iron Room and it shows up here for the whole team.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {shown.map((e, i) => {
          const a = aMap[e.athlete_id];
          const isMe = String(e.athlete_id) === String(currentAthleteId);
          const forge = a.role === "forge";
          const ring = forge ? RED : STEEL;
          return (
            <div key={e.id} className="tf-fade-up" style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, background: isMe ? "linear-gradient(135deg,#141207,#111)" : "#111", borderRadius: 14, padding: "12px 14px", border: "0.5px solid " + (isMe ? GOLD + "55" : "#1e1e1e"), borderLeft: "3px solid " + (isMe ? GOLD : ring), overflow: "hidden", animationDelay: (i * 0.03) + "s" }}>
              {/* Avatar */}
              <div style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0, background: forge ? "linear-gradient(145deg,#E8720C," + RED + ")" : "linear-gradient(145deg,#8a9aa4," + STEEL + ")", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", overflow: "hidden" }}>
                {a.photo_url ? <img src={a.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={ev => { ev.target.style.display = "none"; }} alt="" /> : (a.name || "?")[0]}
              </div>
              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{isMe ? "You" : (a.name || "").split(" ")[0]}</span>
                  {isMe && <span style={{ fontSize: 8.5, fontWeight: 800, color: GOLD, background: GOLD + "1f", padding: "1px 6px", borderRadius: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>You</span>}
                </div>
                <div style={{ fontSize: 11.5, color: "#888", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  new PR · {e.lift}
                </div>
              </div>
              {/* Value */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 19, fontWeight: 900, color: GOLD, lineHeight: 1, letterSpacing: "-0.02em" }}>{e.metric}<span style={{ fontSize: 10, fontWeight: 700, marginLeft: 2 }}>{e.unit}</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end", marginTop: 3 }}>
                  {e.delta > 0 && <span style={{ fontSize: 10, fontWeight: 800, color: GREEN }}>+{e.delta}</span>}
                  <span style={{ fontSize: 10, color: "#555" }}>{relTime(e.date, e.created_at)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
