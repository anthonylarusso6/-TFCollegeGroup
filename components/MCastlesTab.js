import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Skeleton } from "./Skeleton";
import EmptyState from "./EmptyState";

const GOLD = "#D4AF37";
const ORANGE = "#E8720C";

export default function MCastlesTab() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("announcements")
          .select("*")
          .eq("type", "mcastles")
          .order("created_at", { ascending: false });
        if (data) setPosts(data);
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const current = posts[0] || null;
  const previous = posts.slice(1);

  return (
    <div>
      {/* Hero banner */}
      <div style={{ borderRadius: 16, marginBottom: 14, overflow: "hidden", border: "1px solid " + ORANGE + "44", position: "relative" }}>
        <div style={{ background: "linear-gradient(140deg,#1a0800,#0f0600)", padding: "18px 18px 14px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg," + ORANGE + "," + GOLD + ",transparent)" }} />
          <div style={{ position: "absolute", bottom: -10, right: -8, fontSize: 72, opacity: 0.07, lineHeight: 1, userSelect: "none" }}>🍑</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(145deg," + ORANGE + "44," + ORANGE + "22)", border: "1px solid " + ORANGE + "44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, boxShadow: "0 0 20px " + ORANGE + "33" }}>🍑🚀</div>
            <div>
              <div style={{ fontSize: 9, color: ORANGE, textTransform: "uppercase", letterSpacing: "0.22em", fontWeight: 900, marginBottom: 2 }}>MCASTLES</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>Photo of the Week</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>Motivation · Faith · Excellence</div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div>
          <Skeleton height={220} radius={14} style={{ marginBottom: 12 }} />
          <Skeleton width="40%" height={14} style={{ marginBottom: 10 }} />
          <Skeleton width="90%" height={11} style={{ marginBottom: 6 }} />
          <Skeleton width="70%" height={11} />
        </div>
      ) : !current ? (
        <EmptyState icon="camera" color={ORANGE} title="No photo this week yet" hint="MCASTLES drops a new motivational photo every week. Check back soon." />
      ) : (
        <div>
          {/* Week label */}
          {current.week_label && (
            <div style={{ fontSize: 10, color: ORANGE, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700, marginBottom: 10 }}>{current.week_label}</div>
          )}

          {/* Photo */}
          {current.day && (
            <div style={{ borderRadius: 16, marginBottom: 14, border: "1px solid #1e1e1e", boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}>
              <img src={current.day} alt="MCastles Photo of the Week" style={{ width: "100%", height: "auto", display: "block", borderRadius: 16 }} />
            </div>
          )}

          {/* Caption */}
          {current.message && (
            <div style={{ background: "linear-gradient(135deg,#130800,#0d0500)", borderRadius: 14, padding: "18px", border: "1px solid " + ORANGE + "22", marginBottom: 12, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent," + ORANGE + "44,transparent)" }} />
              <div style={{ fontSize: 9, color: ORANGE, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 900, marginBottom: 10 }}>MCASTLES SAYS</div>
              <div style={{ fontSize: 16, color: "#ddd", lineHeight: 1.7, fontStyle: "italic" }}>&ldquo;{current.message}&rdquo;</div>
            </div>
          )}

          {/* Attribution */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#0f0f0f", borderRadius: 10, border: "0.5px solid #1e1e1e", marginBottom: previous.length > 0 ? 24 : 0 }}>
            <span style={{ fontSize: 18 }}>🍑🚀</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: ORANGE }}>MCASTLES</div>
              <div style={{ fontSize: 10, color: "#555" }}>Iron sharpens iron · Proverbs 27:17</div>
            </div>
          </div>

          {/* Previous posts */}
          {previous.length > 0 && (
            <div>
              <div style={{ fontSize: 9, color: "#333", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 12 }}>Previous</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {previous.map((p, i) => (
                  <div key={p.id || i} onClick={() => setExpanded(expanded === (p.id || i) ? null : (p.id || i))} style={{ cursor: "pointer", borderRadius: 10, overflow: "hidden", position: "relative", border: "1px solid #1a1a1a" }}>
                    {p.day ? (
                      <img src={p.day} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ width: "100%", aspectRatio: "1", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🍑</div>
                    )}
                    {p.week_label && (
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.7)", padding: "4px 6px", fontSize: 8, color: ORANGE, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {p.week_label}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Expanded previous post */}
              {expanded !== null && (()=>{
                const p = previous.find((x, i) => (x.id || i) === expanded);
                if (!p) return null;
                return (
                  <div style={{ marginTop: 14, background: "linear-gradient(135deg,#130800,#0d0500)", borderRadius: 14, padding: "16px", border: "1px solid " + ORANGE + "22", position: "relative" }}>
                    <button onClick={() => setExpanded(null)} style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.08)", border: "none", color: "#888", fontSize: 14, width: 28, height: 28, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                    {p.week_label && <div style={{ fontSize: 9, color: ORANGE, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 900, marginBottom: 10 }}>{p.week_label}</div>}
                    {p.day && <img src={p.day} alt="" style={{ width: "100%", height: "auto", borderRadius: 10, marginBottom: 12, display: "block" }} />}
                    {p.message && <div style={{ fontSize: 14, color: "#ddd", lineHeight: 1.7, fontStyle: "italic" }}>&ldquo;{p.message}&rdquo;</div>}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
