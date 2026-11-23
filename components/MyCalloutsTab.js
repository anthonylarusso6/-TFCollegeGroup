import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";
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
    <header className="tfx-hb-head">
      <div>
        <div className="tfx-eyebrow">Accountability</div>
        <h2>Callouts</h2>
        <p className="af-sub">Your crunches and what earned them.</p>
      </div>
    </header>
  );

  if (rows === null) {
    return (<div className="tfx af af-co"><Header /><Skeleton height={92} radius={22} /><SkeletonList rows={4} avatar={false} /></div>);
  }

  if (rows.length === 0) {
    return (
      <div className="tfx af af-co">
        <Header />
        <section className="tfx-card af-empty" style={{ "--c": "var(--green)" }}>
          <span className="af-empty-ic"><Icon name="checkSquare" size={24} /></span>
          <b>All clear — no callouts.</b>
          <p>Keep showing up early and holding the standard. Nothing owed.</p>
        </section>
      </div>
    );
  }

  const total = rows.reduce((s, r) => s + (r.crunches || 0), 0);
  const weekAgo = Date.now() - 7 * 86400000;
  const weekTotal = rows.filter(r => new Date(r.logged_at).getTime() >= weekAgo).reduce((s, r) => s + (r.crunches || 0), 0);

  return (
    <div className="tfx af af-co">
      <Header />

      {/* Hero — crunches owed */}
      <section className="tfx-card af-co-hero">
        <div className="af-co-total">
          <div className="tfx-eyebrow">Total crunches</div>
          <b className="tfx-num">{total}</b>
          <p>across {rows.length} callout{rows.length !== 1 ? "s" : ""}</p>
        </div>
        <div className={"af-co-week " + (weekTotal > 0 ? "is-owed" : "is-clear")}>
          <b className="tfx-num">{weekTotal}</b>
          <small>This week</small>
        </div>
      </section>

      {/* Log */}
      <section className="tfx-card af-co-list">
        <div className="af-sec-head"><div className="tfx-eyebrow">History</div><span>{rows.length} total</span></div>
        <ul>
          {rows.map((r, i) => {
            const self = r.type === "selfreport";
            return (
              <li key={r.id || i} className={"af-co-row tf-fade-up " + (self ? "is-self" : "is-called")} style={{ animationDelay: (i * 0.03) + "s" }}>
                <i aria-hidden="true" />
                <div className="af-co-txt">
                  <b>{r.violation || "Callout"}{r.count > 1 ? " · ×" + r.count : ""}</b>
                  <div className="af-co-meta">
                    <span className="af-pill">{self ? "Self-report" : "Called out"}</span>
                    <span>{relDate(r.logged_at)}</span>
                  </div>
                </div>
                <div className="af-co-n">
                  <b className="tfx-num">{r.crunches}</b>
                  <small>crunches</small>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="af-foot">Knock them out and hold the standard. Iron sharpens iron.</p>
    </div>
  );
}
