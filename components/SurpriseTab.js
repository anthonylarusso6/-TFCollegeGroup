import { useState } from "react";

const ORANGE = "#E8720C";
const GOLD = "#D4AF37";
const PINK = "#E8478C";

// Google Drive video, shared "Anyone with the link". /preview streams it in an iframe.
const VIDEO_ID = "1qB5FYEEDbMvGCUoKCaaN2ZngRtI6TqID";

// Thank-you note shown after the video. Coach can ask to change this wording.
const THANK_YOU = "Thank you for showing up, working hard, and being part of this family. Watching you grow this season has meant everything to me. This one's for you.";
const SIGNOFF = "— Coach Ant";

export default function SurpriseTab({ athleteName }) {
  const [open, setOpen] = useState(false);
  const first = (athleteName || "").split(" ")[0];

  if (!open) {
    return (
      <div style={{ minHeight: "62vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "1rem" }}>
        <div style={{ fontSize: 11, color: GOLD, textTransform: "uppercase", letterSpacing: "0.24em", fontWeight: 700, marginBottom: 22 }}>A gift for you</div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Tap to unwrap your gift"
          className="tf-pulse-glow"
          style={{
            width: 150, height: 150, borderRadius: 32, cursor: "pointer", border: "1px solid " + PINK + "55",
            background: "linear-gradient(145deg," + PINK + "," + ORANGE + ")",
            boxShadow: "0 0 60px " + PINK + "55, 0 20px 50px rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 74, lineHeight: 1,
            transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1)", marginBottom: 26,
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onTouchStart={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
          onTouchEnd={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >🎁</button>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em", marginBottom: 8 }}>
          {first ? "Open it, " + first : "Open your gift"}
        </div>
        <div style={{ fontSize: 13.5, color: "#888", lineHeight: 1.6, maxWidth: 280, marginBottom: 22 }}>
          Coach left something just for you. Tap to unwrap it.
        </div>
        <button
          onClick={() => setOpen(true)}
          style={{ padding: "13px 30px", borderRadius: 14, border: "none", background: "linear-gradient(135deg," + PINK + "," + ORANGE + ")", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "Georgia,serif", letterSpacing: "0.04em", boxShadow: "0 6px 24px " + PINK + "44" }}
        >Tap to unwrap →</button>
      </div>
    );
  }

  return (
    <div className="tf-fade-up">
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: GOLD, textTransform: "uppercase", letterSpacing: "0.24em", fontWeight: 700, marginBottom: 4 }}>🎁 For the team</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>A message from Coach</div>
      </div>

      <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 16, overflow: "hidden", border: "1px solid " + ORANGE + "33", background: "#000", boxShadow: "0 0 50px " + ORANGE + "22, 0 16px 40px rgba(0,0,0,0.5)", marginBottom: 16 }}>
        <iframe
          title="A message from Coach"
          src={"https://drive.google.com/file/d/" + VIDEO_ID + "/preview"}
          allow="autoplay; fullscreen"
          allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
        />
      </div>
      <div style={{ fontSize: 11, color: "#666", textAlign: "center", marginBottom: 18 }}>Tap ▶ in the player if it doesn’t start on its own · turn your sound up 🔊</div>

      <div style={{ background: "#111", borderRadius: 16, padding: "20px 20px 18px", border: "1px solid " + GOLD + "33", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent," + GOLD + "," + ORANGE + ",transparent)" }} />
        <div style={{ fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 700, marginBottom: 10 }}>Thank you{first ? ", " + first : ""}</div>
        <div style={{ fontSize: 15, color: "#ddd", lineHeight: 1.75, fontStyle: "italic" }}>{THANK_YOU}</div>
        <div style={{ fontSize: 13, color: "#fff", fontWeight: 700, marginTop: 14, textAlign: "right" }}>{SIGNOFF}</div>
      </div>

      <button
        onClick={() => setOpen(false)}
        style={{ display: "block", margin: "18px auto 0", padding: "9px 20px", borderRadius: 12, border: "1px solid #252525", background: "transparent", color: "#888", fontSize: 12, cursor: "pointer", fontFamily: "Georgia,serif" }}
      >↩ Wrap it back up</button>
    </div>
  );
}
