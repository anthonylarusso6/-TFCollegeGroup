import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";
import { SkeletonList } from "./Skeleton";
import { prEvents } from "../lib/lifting";

// PR math lives in lib/lifting (prEvents) so the feed, My Season and the Iron Room agree.

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
        // One PR per athlete + lift + day (every set is logged now), shared with My Season.
        const ev = prEvents(data || []);
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

  const Header = () => compact ? (
    <div className="af-pr-mini">
      <div>
        <div className="tfx-eyebrow">Team</div>
        <b>Recent team PRs</b>
      </div>
      {onSeeAll && all.length > 0 && (
        <button className="tfx-btn-ghost tfx-press af-pr-all" onClick={onSeeAll}>See all →</button>
      )}
    </div>
  ) : (
    <header className="tfx-hb-head">
      <div>
        <div className="tfx-eyebrow">Team</div>
        <h2>Team PR feed</h2>
        <p className="af-sub">Every new record, as it happens.</p>
      </div>
    </header>
  );

  if (events === null) {
    return (
      <div className="tfx af af-pr">
        <Header />
        <SkeletonList rows={compact ? 2 : 5} avatar />
      </div>
    );
  }

  if (all.length === 0) {
    if (compact) return null; // don't clutter the home when there's nothing yet
    return (
      <div className="tfx af af-pr">
        <Header />
        <section className="tfx-card af-empty" style={{ "--c": "var(--gold)" }}>
          <span className="af-empty-ic"><Icon name="barbell" size={24} /></span>
          <b>No PRs yet — be the first.</b>
          <p>Beat one of your records in the Iron Room and it shows up here for the whole team.</p>
        </section>
      </div>
    );
  }

  return (
    <div className={"tfx af af-pr" + (compact ? " is-compact" : "")}>
      <Header />
      <ul className="af-pr-list">
        {shown.map((e, i) => {
          const a = aMap[e.athlete_id];
          const isMe = String(e.athlete_id) === String(currentAthleteId);
          const forge = a.role === "forge";
          return (
            <li key={e.id} className={"af-pr-row tf-fade-up" + (isMe ? " is-me" : "")} style={{ animationDelay: (i * 0.03) + "s" }}>
              {/* Avatar */}
              <span className={"af-av" + (forge ? " is-forge" : "")}>
                {a.photo_url ? <img src={a.photo_url} onError={ev => { ev.target.style.display = "none"; }} alt="" /> : (a.name || "?")[0]}
              </span>
              {/* Text */}
              <div className="af-pr-txt">
                <div className="af-pr-name">
                  <span>{isMe ? "You" : (a.name || "").split(" ")[0]}</span>
                </div>
                <div className="af-pr-lift">New PR · {e.lift}</div>
              </div>
              {/* Value */}
              <div className="af-pr-val">
                <b className="tfx-num">{e.metric}<small>{e.unit}</small></b>
                <div className="af-pr-when">
                  {e.delta > 0 && <em className="tfx-num">+{e.delta}</em>}
                  <span>{relTime(e.date, e.created_at)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
