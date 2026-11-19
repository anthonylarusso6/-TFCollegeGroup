import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Icon from "./Icon";
import { isFemale } from "../lib/teams";
import { epley, isVert, prEvents, todayET, fmtD } from "../lib/lifting";
import { smoothPath } from "../lib/chart";

const getCatIR = (name) => {
  const n = (name || "").toLowerCase();
  if (n.includes("deadlift") || n.includes(" clean") || n.includes("snatch") || n.includes("swing") || n.includes("rdl") || n.includes("hinge")) return "hinge";
  if (n.includes("squat") || n.includes("lunge") || n.includes("step up")) return "lower";
  if (n.includes("bench") || n.includes("press") || n.includes("push") || n.includes("dip") || n.includes("jerk")) return "push";
  if (n.includes("pull") || n.includes("row") || n.includes("curl")) return "pull";
  return null;
};
const CATS = [
  { id: "lower", label: "Lower body" },
  { id: "push", label: "Push" },
  { id: "pull", label: "Pull" },
  { id: "hinge", label: "Hinge" },
];
const medal = (r) => (r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : null);

// Tiny trend: one point per session (that day's best set)
function Spark({ vals }) {
  if (vals.length < 2) return <span className="cir-spark is-empty" />;
  const W = 56, H = 20, lo = Math.min(...vals), hi = Math.max(...vals);
  const pts = vals.map((v, i) => ({ x: 2 + (i / (vals.length - 1)) * (W - 4), y: 2 + (1 - (v - lo) / Math.max(1, hi - lo)) * (H - 4) }));
  const up = vals[vals.length - 1] > vals[0], down = vals[vals.length - 1] < vals[0];
  return (
    <svg className={"cir-spark" + (up ? " is-up" : down ? " is-down" : "")} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <path d={smoothPath(pts)} />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.4" />
    </svg>
  );
}

export default function IronRoomTab({ athletes = [] }) {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState("M");
  const [loadErr, setLoadErr] = useState("");

  const load = async () => {
    setLoading(true); setLoadErr("");
    try {
      const { data, error } = await supabase.from("pr_log").select("id,athlete_id,lift,weight,reps,date,created_at,set_num");
      if (error) throw error;
      setRows(data || []);
    } catch (e) { setRows([]); setLoadErr("Couldn't load lifts. Check your connection and refresh."); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const today = todayET();
  const athMap = {};
  athletes.forEach((a) => { athMap[a.id] = a; });
  const filtered = athletes.filter((a) => a.status === "active" && (gender === "M" ? !isFemale(a.gender) : isFemale(a.gender)));
  const inFilter = {};
  filtered.forEach((a) => { inFilter[a.id] = a; });

  // Today at the racks (everyone, both genders)
  const todayRows = (rows || []).filter((r) => String(r.date || "").slice(0, 10) === today);
  const todayAthletes = [...new Set(todayRows.map((r) => r.athlete_id))].map((id) => athMap[id]).filter(Boolean);
  const todayPRs = prEvents(rows || []).filter((e) => String(e.date || "").slice(0, 10) === today);

  // Best est. 1RM per athlete per category
  const catBests = {};
  CATS.forEach((c) => { catBests[c.id] = {}; });
  (rows || []).forEach((row) => {
    if (!inFilter[row.athlete_id] || isVert(row.lift)) return;
    const cat = getCatIR(row.lift);
    if (!cat) return;
    const e1rm = epley(Number(row.weight) || 0, Number(row.reps) || 1);
    const cur = catBests[cat][row.athlete_id];
    if (!cur || e1rm > cur.e1rm) catBests[cat][row.athlete_id] = { e1rm, lift: row.lift, date: row.date, w: row.weight, r: row.reps };
  });
  const sessionBests = (aid, lift) => {
    const best = {};
    (rows || []).forEach((r) => {
      if (r.athlete_id !== aid || r.lift !== lift) return;
      const d = String(r.date || "").slice(0, 10), v = epley(Number(r.weight) || 0, Number(r.reps) || 1);
      if (best[d] == null || v > best[d]) best[d] = v;
    });
    return Object.keys(best).sort().map((d) => best[d]);
  };

  return (
    <div className="tfx cir">
      <section className="tfx-card cir-head">
        <div className="cir-head-top">
          <div>
            <div className="tfx-eyebrow">Leaderboard</div>
            <h2>Iron Room</h2>
            <p>Best estimated 1RM in each movement group</p>
          </div>
          <button className="ir-mini tfx-press" onClick={load} disabled={loading} aria-label="Refresh">{loading ? "…" : "↻ Refresh"}</button>
        </div>
        <div className="ir-seg" role="tablist" aria-label="Team">
          {[["M", "Men"], ["F", "Women"]].map(([g, l]) => (
            <button key={g} role="tab" aria-selected={gender === g} className={"tfx-press" + (gender === g ? " is-on" : "")} onClick={() => setGender(g)}>{l}</button>
          ))}
        </div>
      </section>

      <section className="tfx-card cir-rack">
        <div className="cir-rack-txt">
          <div className="tfx-eyebrow">Rack station</div>
          <b>Log every set at the rack</b>
          <p>Open this on the rack tablet, in split view next to Vitruve. Athletes pick their team, tap their name and log each set. It all syncs to their phones.</p>
        </div>
        <a className="tfx-btn tfx-press cir-rack-go" href="/rack" target="_blank" rel="noopener noreferrer">Open rack screen ↗</a>
      </section>

      <section className="tfx-card cir-today">
        <div className="tfx-eyebrow">Today at the racks</div>
        <div className="cir-stats">
          <div><b className="tfx-num">{todayRows.length}</b><span>sets logged</span></div>
          <div><b className="tfx-num">{todayAthletes.length}</b><span>athletes lifting</span></div>
          <div><b className="tfx-num">{todayPRs.length}</b><span>PRs</span></div>
        </div>
        {todayPRs.length > 0 && (
          <ul className="cir-prs">
            {todayPRs.slice(-5).reverse().map((e) => (
              <li key={e.id}>🏆 <b>{athMap[e.athlete_id]?.name || "Athlete"}</b> · {e.lift} <span className="tfx-num">{e.metric} {e.unit}</span><em>+{e.delta}</em></li>
            ))}
          </ul>
        )}
      </section>

      {loadErr && <div className="ir-err">{loadErr}</div>}
      {loading && rows === null && <p className="ir-hint ir-center">Loading…</p>}

      {rows !== null && CATS.map((cat) => {
        const entries = Object.entries(catBests[cat.id])
          .map(([aid, v]) => ({ athlete: inFilter[aid], ...v }))
          .filter((e) => e.athlete && e.e1rm > 0)
          .sort((a, b) => b.e1rm - a.e1rm);
        return (
          <section key={cat.id} className="tfx-card cir-cat">
            <header className="cir-cat-head">
              <Icon name={cat.id} size={16} />
              <h3>{cat.label}</h3>
              <span>{entries.length} athlete{entries.length !== 1 ? "s" : ""}</span>
            </header>
            {entries.length === 0 ? (
              <p className="ir-hint cir-empty">No lifts logged in this group yet.</p>
            ) : (
              <ol className="cir-list">
                {entries.map((e, i) => {
                  const rank = i + 1;
                  return (
                    <li key={e.athlete.id} className={rank === 1 ? "is-first" : ""}>
                      <span className="cir-rank">{medal(rank) || rank}</span>
                      <span className="rk-av" style={{ "--c": e.athlete.role === "forge" ? "#C0392B" : "#708090" }}>
                        {e.athlete.photo_url ? <img src={e.athlete.photo_url} alt="" /> : (e.athlete.name || "?")[0]}
                      </span>
                      <span className="cir-who"><b>{e.athlete.name}</b><small>{e.lift} · {e.w}×{e.r || 1}</small></span>
                      <Spark vals={sessionBests(e.athlete.id, e.lift)} />
                      <span className="cir-val"><b className="tfx-num">{e.e1rm}<small>lb</small></b><small>{e.date ? fmtD(e.date) : "—"}</small></span>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        );
      })}
      {rows !== null && filtered.length === 0 && <p className="ir-hint ir-center">No active {gender === "M" ? "men" : "women"} on the roster yet.</p>}
    </div>
  );
}
