import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { loadSeason, isBeforeSeason, fmtFirstClass, firstClassAt, CLASS_DAYS } from "../lib/season";
import { nowET, ymd, pd, fmtD } from "../lib/lifting";

const LABEL = { early: "Early", late: "Late", excused: "Excused", missed: "Missed" };
const DOW = ["S", "M", "T", "W", "T", "F", "S"];
const addDays = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return ymd(d); };
const isClassDay = (s) => CLASS_DAYS.includes(pd(s).getDay());

function Ring({ pct }) {
  const R = 52, C = 2 * Math.PI * R;
  return (
    <svg viewBox="0 0 124 124" aria-hidden="true">
      <circle cx="62" cy="62" r={R} className="track" />
      <circle cx="62" cy="62" r={R} className="arc" strokeDasharray={C} strokeDashoffset={C * (1 - Math.max(0, Math.min(1, pct)))} transform="rotate(-90 62 62)" />
    </svg>
  );
}

export default function AttendanceTab({ athleteId }) {
  const [records, setRecords] = useState(null);
  const [season, setSeason] = useState(null);
  const [monthOff, setMonthOff] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [err, setErr] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); loadSeason().then(setSeason); }, []);
  useEffect(() => {
    if (!athleteId) return;
    (async () => {
      try {
        const { data, error } = await supabase.from("attendance").select("id,date,day,status,time_logged").eq("athlete_id", athleteId).order("date", { ascending: false });
        if (error) throw error;
        setRecords(data || []);
      } catch (e) { setRecords([]); setErr("Couldn't load your attendance. Check your connection and reopen this tab."); }
    })();
  }, [athleteId]);

  if (!mounted || !season || records === null) return <div className="tfx att"><div className="tfx-card att-loading">Loading your attendance…</div></div>;

  const today = ymd(nowET());
  const byDate = {};
  records.forEach((r) => { const k = String(r.date).slice(0, 10); if (!byDate[k]) byDate[k] = r; });

  // ── This season so far (only class days inside the season count) ──
  const sStart = season.start, sEnd = season.end < today ? season.end : today;
  const pre = isBeforeSeason(season, new Date());
  const tally = { early: 0, late: 0, excused: 0, missed: 0 };
  let classDays = 0;
  if (!pre) {
    for (let d = sStart; d <= sEnd; d = addDays(d, 1)) {
      if (!isClassDay(d)) continue;
      const r = byDate[d];
      if (r && LABEL[r.status]) { tally[r.status]++; classDays++; }
      else if (d < today) { tally.missed++; classDays++; }
    }
  }
  const showedUp = tally.early + tally.late + tally.excused;
  const rate = classDays ? showedUp / classDays : 0;
  const onTimeRate = tally.early + tally.late ? tally.early / (tally.early + tally.late) : 0;

  // On-time streak: consecutive class days checked in early (excused doesn't break it)
  let streak = 0;
  {
    let d = today;
    if (!byDate[d]) d = addDays(d, -1); // today isn't over yet
    for (let i = 0; i < 400; i++, d = addDays(d, -1)) {
      if (!isClassDay(d)) continue;
      const r = byDate[d];
      if (r && r.status === "early") { streak++; continue; }
      if (r && r.status === "excused") continue;
      break;
    }
  }

  // ── Calendar month ──
  const base = nowET();
  const m0 = new Date(base.getFullYear(), base.getMonth() + monthOff, 1);
  const monthName = m0.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const daysInMonth = new Date(m0.getFullYear(), m0.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < m0.getDay(); i++) cells.push(null);
  const mTally = { early: 0, late: 0, excused: 0 };
  for (let n = 1; n <= daysInMonth; n++) {
    const ds = ymd(new Date(m0.getFullYear(), m0.getMonth(), n));
    const r = byDate[ds];
    const cls = isClassDay(ds);
    const inSeason = ds >= season.start && ds <= season.end;
    let state = "off";
    if (r && LABEL[r.status]) { state = r.status; mTally[r.status] = (mTally[r.status] || 0) + 1; }
    else if (cls && inSeason && ds < today && !pre) state = "missed";
    else if (cls && inSeason && ds >= today) state = "upcoming";
    else if (cls) state = "class";
    cells.push({ ds, n, state, today: ds === today, r });
  }
  const firstRecMonth = records.length ? pd(records[records.length - 1].date) : base;
  const minOff = Math.min(0, (firstRecMonth.getFullYear() - base.getFullYear()) * 12 + (firstRecMonth.getMonth() - base.getMonth()));
  const endD = pd(season.end);
  const maxOff = Math.max(0, (endD.getFullYear() - base.getFullYear()) * 12 + (endD.getMonth() - base.getMonth()));

  const shown = showAll ? records : records.slice(0, 12);
  const daysToFirst = pre ? Math.max(0, Math.ceil((firstClassAt(season) - new Date()) / 86400000)) : 0;

  return (
    <div className="tfx att">
      <header className="tfx-hb-head">
        <div>
          <div className="tfx-eyebrow">Attendance</div>
          <h2>Your record</h2>
        </div>
        {streak > 0 && <span className="tfx-hb-streak">🔥 <b className="tfx-num">{streak}</b> early in a row</span>}
      </header>

      {err && <div className="ir-err">{err}</div>}

      <section className="tfx-card att-hero">
        {pre ? (
          <div className="att-pre">
            <div className="att-pre-num tfx-num">{daysToFirst}<small>{daysToFirst === 1 ? "day" : "days"}</small></div>
            <div className="att-pre-txt">
              <div className="tfx-eyebrow">{season.label}</div>
              <b>First class {fmtFirstClass(season)}</b>
              <p>Check in at the station before class starts to get marked early.</p>
            </div>
          </div>
        ) : (
          <div className="att-hero-row">
            <div className="att-dial">
              <Ring pct={rate} />
              <div className="att-dial-num"><b className="tfx-num">{Math.round(rate * 100)}<i>%</i></b><small>showed up</small></div>
            </div>
            <ul className="att-legend">
              {["early", "late", "excused", "missed"].map((k) => (
                <li key={k} className={"is-" + k}><i />{LABEL[k]}<b className="tfx-num">{tally[k]}</b></li>
              ))}
              <li className="att-legend-note">{classDays ? `${classDays} class${classDays !== 1 ? "es" : ""} so far · ${Math.round(onTimeRate * 100)}% on time` : "No classes yet this season."}</li>
            </ul>
          </div>
        )}
      </section>

      <section className="tfx-card att-cal">
        <div className="att-cal-head">
          <button className="att-nav tfx-press" onClick={() => setMonthOff((o) => Math.max(minOff, o - 1))} disabled={monthOff <= minOff} aria-label="Previous month">‹</button>
          <div>
            <b>{monthName}</b>
            <span>{mTally.early || mTally.late || mTally.excused ? [mTally.early && `${mTally.early} early`, mTally.late && `${mTally.late} late`, mTally.excused && `${mTally.excused} excused`].filter(Boolean).join(" · ") : "No check-ins"}</span>
          </div>
          <button className="att-nav tfx-press" onClick={() => setMonthOff((o) => Math.min(maxOff, o + 1))} disabled={monthOff >= maxOff} aria-label="Next month">›</button>
        </div>
        <div className="att-grid att-dow" aria-hidden="true">{DOW.map((d, i) => <span key={i}>{d}</span>)}</div>
        <div className="att-grid">
          {cells.map((c, i) => c ? (
            <span key={c.ds} className={"att-day is-" + c.state + (c.today ? " is-today" : "")} title={fmtD(c.ds, { weekday: "short", month: "short", day: "numeric" }) + (c.r ? " · " + LABEL[c.r.status] + (c.r.time_logged ? " " + c.r.time_logged : "") : c.state === "missed" ? " · Missed" : "")}>
              {c.n}
            </span>
          ) : <span key={"b" + i} />)}
        </div>
        <div className="att-keys">
          <span className="is-early"><i />Early</span>
          <span className="is-late"><i />Late</span>
          <span className="is-excused"><i />Excused</span>
          <span className="is-missed"><i />Missed</span>
          <span className="is-upcoming"><i />Upcoming</span>
        </div>
      </section>

      <section className="tfx-card att-hist">
        <div className="att-hist-head"><div className="tfx-eyebrow">Check-in history</div><span>{records.length} total</span></div>
        {records.length === 0 ? (
          <p className="att-empty">No check-ins yet. Tap your name at the check-in station before class.</p>
        ) : (
          <ul>
            {shown.map((r) => (
              <li key={r.id || r.date}>
                <span className="att-h-date">{fmtD(r.date, { weekday: "short", month: "short", day: "numeric" })}</span>
                <span className="att-h-time tfx-num">{r.time_logged || ""}</span>
                <span className={"att-pill is-" + (LABEL[r.status] ? r.status : "missed")}>{LABEL[r.status] || r.status}</span>
              </li>
            ))}
          </ul>
        )}
        {records.length > 12 && <button className="wt-more tfx-press" onClick={() => setShowAll((s) => !s)}>{showAll ? "Show less" : `Show all ${records.length}`}</button>}
      </section>
    </div>
  );
}
