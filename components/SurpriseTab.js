import { useState } from "react";

// Google Drive video, shared "Anyone with the link". /preview streams it in an iframe.
const VIDEO_ID = "1r7hhIqaLcfIBFyUW9uXgHmme171QmU1z";

// Thank-you note shown after the video. Coach can ask to change this wording.
const THANK_YOU = "Thank you for showing up, working hard, and being part of this family. Watching you grow this season has meant everything to me. This one's for you.";
const SIGNOFF = "— Coach Ant";

export default function SurpriseTab({ athleteName }) {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const first = (athleteName || "").split(" ")[0];

  if (!open) {
    return (
      <div className="tfx ae ae-gift ae-gold">
        <div className="tfx-eyebrow">A gift for you</div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Tap to unwrap your gift"
          className="ae-gift-box"
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onTouchStart={(e) => { e.currentTarget.style.transform = "scale(0.94)"; }}
          onTouchEnd={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >🎁</button>
        <h2>{first ? "Open it, " + first : "Open your gift"}</h2>
        <p>Coach left something just for you. Tap to unwrap it.</p>
        <button type="button" className="tfx-btn tfx-press ae-btn" onClick={() => setOpen(true)}>Tap to unwrap →</button>
      </div>
    );
  }

  return (
    <div className="tfx ae ae-gold tf-fade-up">
      <header className="ae-head is-center">
        <div>
          <div className="tfx-eyebrow">For the team</div>
          <h2>A message from Coach</h2>
        </div>
      </header>

      <div className="ae-video">
        {playing ? (
          <iframe
            title="A message from Coach"
            src={"https://drive.google.com/file/d/" + VIDEO_ID + "/preview"}
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        ) : (
          <button type="button" className="ae-poster" onClick={() => setPlaying(true)} aria-label="Play the thank-you video">
            <span className="ae-poster-logo"><img src="/icon.png" alt="" /></span>
            <span className="ae-poster-brand">TF College Group</span>
            <span className="ae-poster-title">THANK YOU</span>
            <span className="ae-poster-for">{first ? first + ", this one’s for you" : "This one’s for you"}</span>
            <span className="ae-poster-play"><span>▶</span></span>
            <span className="ae-poster-hint">Tap to play</span>
          </button>
        )}
      </div>
      {playing && <p className="ae-hint">Tap ▶ in the player if it doesn’t start on its own · turn your sound up</p>}
      {playing && (
        <a
          className="tfx-btn-ghost tfx-press ae-wide"
          href={"https://drive.google.com/file/d/" + VIDEO_ID + "/view"}
          target="_blank" rel="noopener noreferrer"
        >▶ Not playing? Watch it here</a>
      )}

      <section className="tfx-card ae-thanks">
        <div className="tfx-eyebrow">Thank you{first ? ", " + first : ""}</div>
        <p className="ae-quote">{THANK_YOU}</p>
        <div className="ae-thanks-sign">{SIGNOFF}</div>
      </section>

      <button type="button" className="tfx-btn-ghost tfx-press ae-btn-ghost ae-rewrap" onClick={() => setOpen(false)}>↩ Wrap it back up</button>
    </div>
  );
}
