import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";

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
    <div className="tfx ae ae-ember">
      <header className="ae-head">
        <div>
          <div className="tfx-eyebrow">MCastles</div>
          <h2>Photo of the week</h2>
          <p>Motivation · Faith · Excellence</p>
        </div>
      </header>

      {loading ? (
        <div className="ae-skel-stack" aria-label="Loading">
          <div className="ae-skel" style={{ height: 260, borderRadius: 20 }} />
          <div className="ae-skel" style={{ width: "40%", height: 14 }} />
          <div className="ae-skel" style={{ width: "90%", height: 11 }} />
          <div className="ae-skel" style={{ width: "70%", height: 11 }} />
        </div>
      ) : !current ? (
        <section className="tfx-card ae-empty">
          <span className="ae-empty-ico"><Icon name="camera" size={24} /></span>
          <b>No photo this week yet</b>
          <p>MCASTLES drops a new motivational photo every week. Check back soon.</p>
        </section>
      ) : (
        <>
          {/* Week label */}
          {current.week_label && (
            <div className="tfx-eyebrow ae-mc-week">{current.week_label}</div>
          )}

          {/* Photo */}
          {current.day && (
            <div className="ae-mc-photo">
              <img src={current.day} alt="MCastles Photo of the Week" />
            </div>
          )}

          {/* Caption + attribution */}
          <section className="tfx-card ae-mc-says">
            {current.message && (
              <>
                <div className="tfx-eyebrow">MCastles says</div>
                <p className="ae-quote">&ldquo;{current.message}&rdquo;</p>
              </>
            )}
            <div className={"ae-by" + (current.message ? "" : " is-solo")}>
              <span className="ae-by-av" aria-hidden="true">🍑🚀</span>
              <div>
                <b>MCASTLES</b>
                <small>Iron sharpens iron · Proverbs 27:17</small>
              </div>
            </div>
          </section>

          {/* Previous posts */}
          {previous.length > 0 && (
            <section className="tfx-card ae-card">
              <div className="ae-sec">
                <div className="tfx-eyebrow">Previous</div>
                <span className="tfx-num">{previous.length}</span>
              </div>
              <div className="ae-mc-grid">
                {previous.map((p, i) => (
                  <button key={p.id || i} type="button" className={"ae-mc-th tfx-press" + (expanded === (p.id || i) ? " is-on" : "")} onClick={() => setExpanded(expanded === (p.id || i) ? null : (p.id || i))} aria-label={"Open " + (p.week_label || "previous post")} aria-pressed={expanded === (p.id || i)}>
                    {p.day ? (
                      <img src={p.day} alt="" />
                    ) : (
                      <span className="ae-mc-th-blank">🍑</span>
                    )}
                    {p.week_label && (
                      <span className="ae-mc-th-lbl">{p.week_label}</span>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Expanded previous post */}
          {previous.length > 0 && expanded !== null && (()=>{
            const p = previous.find((x, i) => (x.id || i) === expanded);
            if (!p) return null;
            return (
              <section className="tfx-card ae-mc-open">
                <div className="ae-mc-open-top">
                  {p.week_label && <div className="tfx-eyebrow">{p.week_label}</div>}
                  <button type="button" className="ae-x tfx-press" onClick={() => setExpanded(null)} aria-label="Close">✕</button>
                </div>
                {p.day && <img src={p.day} alt="" />}
                {p.message && <p className="ae-quote">&ldquo;{p.message}&rdquo;</p>}
              </section>
            );
          })()}
        </>
      )}
    </div>
  );
}
