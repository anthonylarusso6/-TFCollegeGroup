import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Skeleton } from "./Skeleton";

const GOLD = "#D4AF37";
const ORANGE = "#E8720C";

export default function MCastlesTab() {
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("announcements")
          .select("*")
          .eq("type", "mcastles")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) setPhoto(data);
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

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
      ) : !photo ? (
        <div style={{ background: "#111", borderRadius: 14, padding: "2.5rem 1.5rem", textAlign: "center", border: "0.5px solid #252525" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🍑🚀</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#ddd", marginBottom: 8 }}>No photo this week yet</div>
          <div style={{ fontSize: 13, color: "#555" }}>MCASTLES drops a new motivational photo every week. Check back soon.</div>
        </div>
      ) : (
        <div>
          {/* Week label */}
          {photo.week_label && (
            <div style={{ fontSize: 10, color: ORANGE, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700, marginBottom: 10 }}>{photo.week_label}</div>
          )}

          {/* Photo — full image, no cropping */}
          {photo.day && (
            <div style={{ borderRadius: 16, marginBottom: 14, border: "1px solid #1e1e1e", boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}>
              <img
                src={photo.day}
                alt="MCastles Photo of the Week"
                style={{ width: "100%", height: "auto", display: "block", borderRadius: 16 }}
              />
            </div>
          )}

          {/* Caption */}
          {photo.message && (
            <div style={{ background: "linear-gradient(135deg,#130800,#0d0500)", borderRadius: 14, padding: "18px 18px", border: "1px solid " + ORANGE + "22", marginBottom: 12, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent," + ORANGE + "44,transparent)" }} />
              <div style={{ fontSize: 9, color: ORANGE, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 900, marginBottom: 10 }}>MCASTLES SAYS</div>
              <div style={{ fontSize: 16, color: "#ddd", lineHeight: 1.7, fontStyle: "italic" }}>&ldquo;{photo.message}&rdquo;</div>
            </div>
          )}

          {/* Attribution */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#0f0f0f", borderRadius: 10, border: "0.5px solid #1e1e1e" }}>
            <span style={{ fontSize: 18 }}>🍑🚀</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: ORANGE }}>MCASTLES</div>
              <div style={{ fontSize: 10, color: "#555" }}>Iron sharpens iron · Proverbs 27:17</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
