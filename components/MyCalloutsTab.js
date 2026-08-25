import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { RED, GOLD, GREEN } from "../lib/constants";
import { Skeleton, SkeletonList } from "./Skeleton";

function relDate(iso) {
  if (!iso) return "";
  const base = new Date(iso);
  if (isNaN(base)) return "";
  const d = Math.floor((Date.now() - base.getTime()) / 86400000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 7) return d + "d ago";
  return base.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function MyCalloutsTab({ athleteId, athleteName }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase
          .from("callouts")
          .select("*")
          .eq("athlete_id", athleteId)
          .order("logged_at", { ascending: false })
          .limit(200);
        if (alive) setRows(data || []);
      } catch (e) { if (alive) setRows([]); }
    })();
    return () => { alive = false; };
  }, [athleteId]);

  const Header = () => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>📢</span>Callouts
      </div>
      <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>Your crunches and what earned them.</div>
    </div>
  );

  if (rows === null) {
    return (<div><Header /><Skeleton height={92} radius={16} style={{ marginBottom: 12 }} /><SkeletonList rows={4} avatar={false} /></div>);
  }

  if (rows.length === 0) {
    return (
      <div>
        <Header />
        <div style={{ background: "linear-gradient(165deg,#0c140c,#0a0f0a)", borderRadius: 18, padding: "2.5rem 1.5rem", textAlign: "center", border: "0.5px solid " + GREEN + "33" }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
          <div style={{ fontSize: 15, color: "#fdf6ec", fontWeight: 700 }}>All clear — no callouts.</div>
          <div style={{ fontSize: 12.5, color: "#7fae90", marginTop: 5, lineHeight: 1.5 }}>Keep showing up early and holding the standard. Nothing owed. ⚒</div>
        </div>
      </div>
    );
  }

  const total = rows.reduce((s, r) => s + (r.crunches || 0), 0);
  const weekAgo = Date.now() - 7 * 86400000;
  const weekTotal = rows.filter(r => new Date(r.logged_at).getTime() >= weekAgo).reduce((s, r) => s + (r.crunches || 0), 0);

  return (
    <div>
      <Header />

      {/* Hero — crunches owed */}
      <div style={{ position: "relative", borderRadius: 20, padding: "20px 20px 18px", marginBottom: 16, overflow: "hidden", background: "linear-gradient(155deg,#1e0a0a,#120606 74%)", border: "1px solid " + RED + "44" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,transparent," + RED + ",#ff7a5a," + RED + ",transparent)" }} />
        <div style={{ position: "absolute", right: -12, bottom: -20, fontSize: 96, opacity: 0.07, lineHeight: 1, pointerEvents: "none" }}>💥</div>
        <div style={{ position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#ff8a6a", fontWeight: 800 }}>Total crunches</div>
            <div style={{ fontSize: 52, fontWeight: 900, color: "#fdf6ec", letterSpacing: "-0.03em", lineHeight: 1, marginTop: 4 }}>{total}</div>
            <div style={{ fontSize: 12, color: "#c9a79a", marginTop: 6 }}>across {rows.length} callout{rows.length !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: weekTotal > 0 ? "#ff8a6a" : "#7fae90", lineHeight: 1 }}>{weekTotal}</div>
            <div style={{ fontSize: 9.5, color: "#c9a79a", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 3 }}>this week</div>
          </div>
        </div>
      </div>

      {/* Log */}
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {rows.map((r, i) => {
          const self = r.type === "selfreport";
          return (
            <div key={r.id || i} className="tf-fade-up" style={{ display: "flex", alignItems: "center", gap: 12, background: "#111", borderRadius: 14, padding: "13px 15px", border: "0.5px solid #1e1e1e", borderLeft: "3px solid " + (self ? GOLD : RED), animationDelay: (i * 0.03) + "s" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.violation || "Callout"}{r.count > 1 ? " · ×" + r.count : ""}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 7px", borderRadius: 5, color: self ? GOLD : RED, background: (self ? GOLD : RED) + "1a", border: "0.5px solid " + (self ? GOLD : RED) + "44" }}>{self ? "Self-report" : "Called out"}</span>
                  <span style={{ fontSize: 11, color: "#666" }}>{relDate(r.logged_at)}</span>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: RED, lineHeight: 1 }}>{r.crunches}</div>
                <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>crunches</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: "center", fontSize: 11, color: "#555", marginTop: 16, lineHeight: 1.6 }}>
        Knock them out and hold the standard. Iron sharpens iron. ⚒
      </div>
    </div>
  );
}
