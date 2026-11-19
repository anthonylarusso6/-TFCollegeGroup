import { useState } from "react";
import { supabase } from "../lib/supabase";
import { nowET, ymd, pd, fmtD } from "../lib/lifting";
import { CLASS_DAYS } from "../lib/season";

const LABEL = { early: "Early", late: "Late", excused: "Excused" };
const addDays = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return ymd(d); };
const stepClassDay = (s, dir) => { let d = addDays(s, dir); for (let i = 0; i < 7 && !CLASS_DAYS.includes(pd(d).getDay()); i++) d = addDays(d, dir); return d; };

export default function CoachAttendanceTab({ weekDays, mostMissed, estTodayStr, attendance, setAttendance, athletes, leaderboard }) {
  const today = estTodayStr || ymd(nowET());
  const [attDate, setAttDate] = useState(today);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

  const refresh = async () => {
    const { data, error } = await supabase.from("attendance").select("*,athletes(name)").order("date", { ascending: false }).limit(1000);
    if (error) throw error;
    if (data) setAttendance(data);
  };
  // One write at a time per tap — stops a double tap from inserting two rows
  const mark = async (a, rec, status) => {
    if (busy) return;
    setBusy(a.id); setErr("");
    try {
      if (status === null) {
        const { error } = await supabase.from("attendance").delete().eq("id", rec.id); if (error) throw error;
      } else {
        const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "America/New_York" });
        const day = pd(attDate).toLocaleDateString("en-US", { weekday: "short" });
        const { error } = rec
          ? await supabase.from("attendance").update({ status, time_logged: rec.time_logged || timeStr }).eq("id", rec.id)
          : await supabase.from("attendance").insert({ athlete_id: a.id, date: attDate, status, time_logged: timeStr, day });
        if (error) throw error;
      }
      await refresh();
    } catch (e) { setErr("Didn't save " + (a.name || "").split(" ")[0] + "'s attendance. Check your connection and tap again."); }
    setBusy(null);
  };

  const active = athletes.filter((a) => a.status === "active");
  const dayRecs = attendance.filter((r) => r.date === attDate);
  const recFor = (id) => dayRecs.find((r) => r.athlete_id === id);
  const counts = { early: 0, late: 0, excused: 0, none: 0 };
  active.forEach((a) => { const r = recFor(a.id); counts[r && LABEL[r.status] ? r.status : "none"]++; });
  const total = active.length || 1;
  const isToday = attDate === today;
  const classDay = CLASS_DAYS.includes(pd(attDate).getDay());

  let rows = active.map((a) => ({ a, rec: recFor(a.id) }));
  if (filter !== "all") rows = rows.filter(({ rec }) => (filter === "none" ? !rec : rec && rec.status === filter));
  rows.sort((x, y) => (isToday ? (!!x.rec - !!y.rec) : 0) || (x.a.name || "").localeCompare(y.a.name || ""));

  const FILTERS = [["all", "All", active.length], ["none", isToday ? "Not in yet" : "No record", counts.none], ["early", "Early", counts.early], ["late", "Late", counts.late], ["excused", "Excused", counts.excused]];

  return (
    <div className="tfx catt">
      <section className="tfx-card catt-head">
        <div className="catt-top">
          <div>
            <div className="tfx-eyebrow">Attendance</div>
            <h2>{isToday ? "Today" : fmtD(attDate, { weekday: "long" })}</h2>
            <p>{fmtD(attDate, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}{classDay ? "" : " · no class this day"}</p>
          </div>
          <div className="catt-nav">
            <button className="att-nav tfx-press" onClick={() => setAttDate((d) => stepClassDay(d, -1))} aria-label="Previous class day">‹</button>
            <input type="date" className="tfx-field catt-date" value={attDate} onChange={(e) => e.target.value && setAttDate(e.target.value)} aria-label="Pick a date" />
            <button className="att-nav tfx-press" onClick={() => setAttDate((d) => stepClassDay(d, 1))} aria-label="Next class day">›</button>
          </div>
        </div>
        <div className="catt-week" role="tablist" aria-label="This week">
          {weekDays.map((d) => (
            <button key={d.ds} role="tab" aria-selected={attDate === d.ds} className={"catt-wd tfx-press" + (attDate === d.ds ? " is-on" : "") + (d.ds === today ? " is-today" : "")} onClick={() => setAttDate(d.ds)}>
              <span>{d.dn}</span>
              <b className="tfx-num">{d.early}</b>
              <small>{d.late ? `${d.late} late` : "early"}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="tfx-card catt-sum">
        <div className="catt-stats">
          {[["early", "Early"], ["late", "Late"], ["excused", "Excused"], ["none", isToday ? "Not in yet" : "No record"]].map(([k, l]) => (
            <div key={k} className={"is-" + k}><b className="tfx-num">{counts[k]}</b><span>{l}</span></div>
          ))}
        </div>
        <div className="catt-bar" aria-hidden="true">
          {["early", "late", "excused"].map((k) => <i key={k} className={"is-" + k} style={{ "--p": counts[k] / total }} />)}
        </div>
      </section>

      {err && <div className="ir-err" role="alert">{err}</div>}

      <section className="tfx-card catt-list">
        <div className="catt-filters" role="tablist" aria-label="Filter">
          {FILTERS.map(([k, l, n]) => (
            <button key={k} role="tab" aria-selected={filter === k} className={"tfx-chipbtn tfx-press" + (filter === k ? " is-on" : "")} onClick={() => setFilter(k)}>{l} <span className="tfx-num">{n}</span></button>
          ))}
        </div>
        {rows.length === 0 && <p className="att-empty">{active.length ? "Nobody in this group." : "No active athletes yet."}</p>}
        <ul>
          {rows.map(({ a, rec }) => {
            const lb = leaderboard.find((r) => r.athlete_id === a.id);
            const streak = lb?.current_streak || 0;
            const st = rec && LABEL[rec.status] ? rec.status : null;
            const waiting = !rec && isToday && classDay;
            return (
              <li key={a.id} className={(waiting ? "is-waiting" : "") + (busy === a.id ? " is-busy" : "")}>
                <span className="rk-av" style={{ "--c": a.role === "forge" ? "#C0392B" : "#708090" }}>
                  {a.photo_url ? <img src={a.photo_url} alt="" /> : (a.name || "?")[0]}
                </span>
                <span className="catt-who">
                  <b>{a.name}{streak > 0 && <em>🔥 {streak}</em>}</b>
                  <small>{rec ? (rec.time_logged || "Checked in") : waiting ? "Not checked in yet" : "No record"}</small>
                </span>
                <span className="catt-seg" role="group" aria-label={"Attendance for " + a.name}>
                  {["early", "late", "excused"].map((k) => (
                    <button key={k} className={"is-" + k + (st === k ? " is-on" : "")} aria-pressed={st === k} disabled={busy === a.id} onClick={() => mark(a, rec, k)}>{k === "excused" ? "Exc." : LABEL[k]}</button>
                  ))}
                  {rec && <button className="catt-clear" disabled={busy === a.id} onClick={() => mark(a, rec, null)} aria-label={"Clear " + a.name + "'s record"}>✕</button>}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {mostMissed.length > 0 && (
        <section className="tfx-card catt-missed">
          <div className="att-hist-head"><div className="tfx-eyebrow">Most missed this month</div><span>Worth a check-in</span></div>
          <ul>
            {mostMissed.map((m) => <li key={m.name}><span>{m.name}</span><b className="tfx-num">{m.missed} missed</b></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
