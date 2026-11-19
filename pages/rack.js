import { useState, useEffect, useRef, useMemo } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";
import { setMood, pulseMood } from "../lib/ambient";
import { hSuccess, hTap, hError } from "../lib/haptics";
import { GROUP_COLORS } from "../lib/teams";
import { DAYS, DAY_LABELS, TIERS, KB_COLORS, MB_WEIGHTS, epley, isVert, loadProgram, parseSets, todayET, weekdayET } from "../lib/lifting";

// ─────────────────────────────────────────────────────────────────────
// RACK STATION — a shared screen at the rack (built to sit in split view
// next to Vitruve). Pick your team → tap your name → log each set.
// Every set is a pr_log row with set_num, so it shows up on the athlete's
// phone in the Iron Room too.
// ─────────────────────────────────────────────────────────────────────

const IDLE_MS = 10 * 60 * 1000; // back to team picker after 10 quiet minutes
const POLL_MS = 20000;          // pick up sets logged from phones
const byName = (a, b) => (a.name || "").localeCompare(b.name || "");
const firstName = (n) => (n || "").split(" ")[0];
const bySet = (a, b) => (a.set_num || 0) - (b.set_num || 0) || String(a.created_at || "").localeCompare(String(b.created_at || ""));
const setsOf = (lift) => { const p = parseSets(lift.sets); return p.length ? p : [{ target: null, label: "Set" }]; };
const isLocalOnly = (lift) => lift.inputType === "bodyweight" || lift.inputType === "band";
const higherIsBetter = (lift) => lift.inputType === "rsi" || lift.inputType === "vert_lr" || isVert(lift.name);
const metricOf = (lift, w, r) => (higherIsBetter(lift) ? w : epley(w, r || 1));
const rowText = (lift, h) => {
  const it = lift.inputType;
  if (it === "rsi") return "RSI " + h.weight;
  if (it === "vert_lr") return "L " + h.weight + "″ · R " + (h.reps || 0) + "″";
  if (isVert(lift.name)) return h.weight + " in";
  return h.weight + " × " + (h.reps || 1) + (it === "kb2_yards" || it === "weight_yards" ? " yds" : "");
};

function Avatar({ a, big }) {
  return (
    <span className={"rk-av" + (big ? " is-big" : "")} style={{ "--c": a.role === "forge" ? "#C0392B" : "#708090" }}>
      {a.photo_url ? <img src={a.photo_url} alt="" onError={(e) => { e.target.style.display = "none"; }} /> : (a.name || "?")[0]}
    </span>
  );
}

function MiniRing({ done, total }) {
  const R = 9, C = 2 * Math.PI * R, p = total ? Math.min(1, done / total) : 0;
  return (
    <svg className={"rk-mring" + (p >= 1 ? " is-full" : "")} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r={R} className="track" />
      <circle cx="12" cy="12" r={R} className="arc" strokeDasharray={C} strokeDashoffset={C * (1 - p)} transform="rotate(-90 12 12)" />
    </svg>
  );
}

// Big touch stepper. Typing works too (tap the number).
function Big({ label, value, onChange, steps = [5], decimal, unit, placeholder }) {
  const adj = (d) => {
    hTap();
    const cur = parseFloat(value === "" ? placeholder || 0 : value) || 0;
    onChange(String(Math.max(0, Math.round((cur + d) * 100) / 100)));
  };
  return (
    <div className="rk-big">
      <div className="rk-big-label">{label}</div>
      <div className="rk-big-row">
        <button type="button" className="rk-big-btn tfx-press" onClick={() => adj(-steps[0])} aria-label={"Minus " + steps[0]}>−{steps[0] !== 1 ? steps[0] : ""}</button>
        <label className="rk-big-val">
          <input type="text" inputMode={decimal ? "decimal" : "numeric"} value={value} placeholder={placeholder || "0"} aria-label={label}
            onChange={(e) => onChange(e.target.value.replace(decimal ? /[^0-9.]/g : /[^0-9]/g, ""))} />
          {unit && <small>{unit}</small>}
        </label>
        <button type="button" className="rk-big-btn tfx-press" onClick={() => adj(steps[0])} aria-label={"Plus " + steps[0]}>+{steps[0] !== 1 ? steps[0] : ""}</button>
      </div>
      {steps.length > 1 && (
        <div className="rk-fine">
          {steps.slice(1).map((s) => (
            <span key={s}><button type="button" className="tfx-press" onClick={() => adj(-s)}>−{s}</button><button type="button" className="tfx-press" onClick={() => adj(s)}>+{s}</button></span>
          ))}
        </div>
      )}
    </div>
  );
}

function KbGrid({ value, onPick, label }) {
  return (
    <div className="ir-pick">
      <div className="ir-flabel"><span>{label}</span></div>
      <div className="ir-sw-grid is-kb">
        {KB_COLORS.map((k) => (
          <button key={k.id} type="button" className={"ir-sw tfx-press" + (value === k.id ? " is-on" : "") + (k.id === "white" ? " is-white" : "")} style={{ "--sw": k.hex }} aria-pressed={value === k.id} onClick={() => onPick(k)}>
            <i /><b>{k.label}</b><small>{k.weight}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

// One set's entry panel. Keyed by athlete + lift + set number, so it resets
// for each set — starting from the last set's weight (or last session's).
function Entry({ lift, sets, today, last, onLog, onMarkDone, busy }) {
  const it = lift.inputType || "weight";
  const nextIdx = today.length;
  const st = sets[Math.min(nextIdx, sets.length - 1)] || { target: null, label: "Set" };
  const prevToday = today[today.length - 1] || null;
  const lastSame = last.find((r) => r.set_num === nextIdx + 1) || last[Math.min(nextIdx, last.length - 1)] || null;
  // Start from what they did on this set last session (programs ramp set to set);
  // fall back to today's previous set.
  const startW = lastSame ? String(lastSame.weight) : prevToday ? String(prevToday.weight) : "";
  const kbMatch = (w) => (KB_COLORS.find((k) => String(k.weight) === String(w)) || {}).id || "";
  const [w, setW] = useState(it === "rsi" || it === "vert_lr" ? "" : startW);
  const [r, setR] = useState(st.timed ? "1" : st.target != null ? String(st.target) : "");
  const [kb, setKb] = useState(kbMatch(startW));
  const [kb2, setKb2] = useState("");
  const [kbMode, setKbMode] = useState(it === "kb" || it === "band_kb" || (it === "weight_kb" && !!kbMatch(startW)));
  const setNum = nextIdx + 1;
  const extra = nextIdx >= sets.length;
  const noun = it === "rsi" ? "trial" : "set";
  const yards = it === "kb2_yards" || it === "weight_yards" || st.yards;

  if (isLocalOnly(lift)) {
    return (
      <div className="rk-entry">
        <p className="rk-note">Bodyweight · nothing to load. Tap when all {sets.length} sets are done.</p>
        <button className="tfx-btn tfx-press rk-log" style={{ "--t": "var(--green)" }} onClick={onMarkDone}>✓ Mark {lift.name} done</button>
      </div>
    );
  }

  let fields, ready, summary;
  if (it === "rsi") {
    fields = <Big label="Average RSI" value={w} onChange={setW} steps={[0.05]} decimal placeholder={lastSame ? String(lastSame.weight) : "2.00"} />;
    ready = !!w; summary = w ? "RSI " + w : "";
  } else if (isVert(lift.name)) {
    fields = <Big label="Jump height" value={w} onChange={setW} steps={[0.5]} decimal unit="in" placeholder={lastSame ? String(lastSame.weight) : "0"} />;
    ready = !!w; summary = w ? w + " in" : "";
  } else if (it === "vert_lr") {
    fields = (<div className="rk-two">
      <Big label="Left leg" value={w} onChange={setW} steps={[0.5]} decimal unit="in" placeholder={lastSame ? String(lastSame.weight) : "0"} />
      <Big label="Right leg" value={r} onChange={setR} steps={[0.5]} decimal unit="in" placeholder={lastSame ? String(lastSame.reps || "") : "0"} />
    </div>);
    ready = !!w && !!r; summary = w && r ? `L ${w}″ · R ${r}″` : "";
  } else if (it === "kb2_yards") {
    const k1 = KB_COLORS.find((k) => k.id === kb), k2 = KB_COLORS.find((k) => k.id === kb2);
    const total = (k1 ? k1.weight : 0) + (k2 ? k2.weight : 0);
    fields = (<>
      <KbGrid label="Farmer hand" value={kb} onPick={(k) => { hTap(); setKb(k.id); }} />
      <KbGrid label="Waiter hand" value={kb2} onPick={(k) => { hTap(); setKb2(k.id); }} />
      <Big label="Yards" value={r} onChange={setR} steps={[5]} unit="yds" placeholder={st.target != null ? String(st.target) : "20"} />
    </>);
    ready = !!(k1 && k2 && (r || st.target)); summary = ready ? `${Math.round(total * 10) / 10} lbs × ${r || st.target} yds` : "";
  } else if (it === "mb") {
    fields = (<>
      <div className="ir-pick">
        <div className="ir-flabel"><span>Med ball</span></div>
        <div className="ir-chips">{MB_WEIGHTS.map((m) => <button key={m} type="button" className={"tfx-chipbtn tfx-press rk-chip" + (w === String(m) ? " is-on" : "")} onClick={() => { hTap(); setW(String(m)); }}>{m} lbs</button>)}</div>
      </div>
      <Big label="Reps" value={r} onChange={setR} steps={[1]} placeholder={st.target != null ? String(st.target) : "0"} />
    </>);
    ready = !!w && !!(r || st.target); summary = ready ? `${w} × ${r || st.target}` : "";
  } else {
    const showKbToggle = it === "weight_kb";
    fields = (<>
      {showKbToggle && (
        <div className="ir-seg rk-mode" role="radiogroup" aria-label="Load type">
          <button type="button" role="radio" aria-checked={!kbMode} className={"tfx-press" + (!kbMode ? " is-on" : "")} onClick={() => setKbMode(false)}>Weight</button>
          <button type="button" role="radio" aria-checked={kbMode} className={"tfx-press" + (kbMode ? " is-on" : "")} onClick={() => setKbMode(true)}>Kettlebell</button>
        </div>
      )}
      {kbMode
        ? <KbGrid label="Kettlebell" value={kb} onPick={(k) => { hTap(); setKb(k.id); setW(String(k.weight)); }} />
        : <Big label={it === "band_pallof" ? "Cable weight" : "Weight"} value={w} onChange={setW} steps={[5, 2.5, 10]} decimal unit="lbs" placeholder={startW || "0"} />}
      {!st.timed && <Big label={yards ? "Yards" : "Reps"} value={r} onChange={setR} steps={[yards ? 5 : 1]} unit={yards ? "yds" : ""} placeholder={st.target != null ? String(st.target) : "0"} />}
    </>);
    ready = !!w && !!(r || st.target || st.timed);
    summary = ready ? (st.timed ? `${w} lbs · ${st.label}` : `${w} × ${r || st.target}${yards ? " yds" : ""}`) : "";
  }

  const submit = () => {
    if (!ready || busy) return;
    if (it === "kb2_yards") {
      const k1 = KB_COLORS.find((k) => k.id === kb), k2 = KB_COLORS.find((k) => k.id === kb2);
      onLog({ weight: Math.round((k1.weight + k2.weight) * 10) / 10, reps: parseInt(r || st.target, 10) || 1, setNum });
    } else if (it === "rsi" || isVert(lift.name)) onLog({ weight: parseFloat(w), reps: 1, setNum });
    else if (it === "vert_lr") onLog({ weight: parseFloat(w), reps: parseFloat(r), setNum });
    else onLog({ weight: parseFloat(w), reps: st.timed ? 1 : parseInt(r || st.target, 10) || 1, setNum });
  };

  return (
    <div className="rk-entry">
      {(lastSame || prevToday) && (
        <div className="rk-hints">
          {prevToday && <span>Set {nextIdx}: <b className="tfx-num">{rowText(lift, prevToday)}</b></span>}
          {lastSame && <span>Last time{lastSame.set_num ? " set " + lastSame.set_num : ""}: <b className="tfx-num">{rowText(lift, lastSame)}</b></span>}
        </div>
      )}
      <div className="rk-fields">{fields}</div>
      <button className="tfx-btn tfx-press rk-log" disabled={!ready || busy} onClick={submit}>
        {busy ? "Saving…" : `Log ${extra ? "extra " + noun : noun + " " + setNum}${summary ? " · " + summary : ""}`}
      </button>
    </div>
  );
}

export default function Rack() {
  const [mounted, setMounted] = useState(false);
  const [athletes, setAthletes] = useState([]);
  const [program, setProgram] = useState(null);
  const [phase, setPhase] = useState("");
  const [teamKey, setTeamKey] = useState(null);
  const [who, setWho] = useState(null);
  const [day, setDay] = useState("Mon");
  const [rows, setRows] = useState([]);
  const [liftSel, setLiftSel] = useState({});
  const [bwDone, setBwDone] = useState({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [celebrate, setCelebrate] = useState(null);
  const [err, setErr] = useState("");
  const [loadErr, setLoadErr] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const lastTouch = useRef(Date.now());
  const toastTimer = useRef(null);

  useEffect(() => {
    setMounted(true);
    setMood("iron");
    const wd = weekdayET();
    setDay(DAYS.includes(wd) ? wd : "Mon");
    (async () => {
      const p = await loadProgram();
      setProgram(p.program); setPhase(p.phase);
      try {
        const { data, error } = await supabase.from("athletes").select("id,name,gender,role,photo_url,group_idx,status").neq("status", "archived");
        if (error) throw error;
        setAthletes(data || []);
      } catch (e) { setLoadErr("Couldn't load the roster. Check the Wi-Fi and refresh."); }
    })();
    const t = setInterval(() => {
      setNow(Date.now());
      if (Date.now() - lastTouch.current > IDLE_MS) { setTeamKey(null); setWho(null); lastTouch.current = Date.now(); }
    }, 15000);
    return () => clearInterval(t);
  }, []);

  const teams = useMemo(() => {
    const by = {};
    athletes.forEach((a) => { if (a.group_idx == null) return; (by[a.group_idx] = by[a.group_idx] || []).push(a); });
    const list = Object.keys(by).map(Number).sort((a, b) => a - b).map((i) => ({
      key: "g" + i, label: "Group " + (i + 1), color: GROUP_COLORS[i % GROUP_COLORS.length],
      members: by[i].slice().sort(byName), leader: by[i].find((a) => a.role === "forge") || null,
    }));
    const loose = athletes.filter((a) => a.group_idx == null && a.status === "active").sort(byName);
    if (loose.length) list.push({ key: "none", label: list.length ? "Not on a team yet" : "Everyone", color: "#708090", members: loose, leader: null });
    return list;
  }, [athletes]);
  const team = teams.find((t) => t.key === teamKey) || null;
  const memberIds = team ? team.members.map((m) => m.id) : [];

  // Team's lift history (for "last time", PRs and today's progress); refresh while open
  const loadRows = async (ids) => {
    if (!ids.length) { setRows([]); return; }
    try {
      const { data, error } = await supabase.from("pr_log").select("*").in("athlete_id", ids).order("date", { ascending: false });
      if (error) throw error;
      setRows(data || []);
    } catch (e) { setErr("Couldn't load sets. Check the Wi-Fi."); }
  };
  useEffect(() => {
    if (!team) return;
    loadRows(memberIds);
    const t = setInterval(() => loadRows(memberIds), POLL_MS);
    return () => clearInterval(t);
  }, [teamKey, athletes.length]);

  const today = todayET();
  const lifts = (program && program[day]) || [];
  const rowsFor = (aid, lift) => rows.filter((r) => r.athlete_id === aid && r.lift === lift);
  const todayFor = (aid, lift) => rowsFor(aid, lift).filter((r) => String(r.date).slice(0, 10) === today).sort(bySet);
  const lastFor = (aid, lift) => {
    const prior = rowsFor(aid, lift).filter((r) => String(r.date).slice(0, 10) < today);
    if (!prior.length) return [];
    const d = String(prior[0].date).slice(0, 10);
    return prior.filter((r) => String(r.date).slice(0, 10) === d).sort(bySet);
  };
  const liftDone = (aid, lift) => (isLocalOnly(lift) ? !!bwDone[aid + "|" + lift.name] : todayFor(aid, lift.name).length >= setsOf(lift).length);
  const progress = (aid) => {
    let done = 0, total = 0;
    lifts.forEach((l) => { const n = setsOf(l).length; total += n; done += liftDone(aid, l) ? n : Math.min(n, todayFor(aid, l.name).length); });
    return { done, total };
  };
  const currentLift = (aid) => {
    const chosen = lifts.find((l) => l.name === liftSel[aid]);
    return chosen || lifts.find((l) => !liftDone(aid, l)) || lifts[0] || null;
  };

  const touch = () => { lastTouch.current = Date.now(); };
  const showToast = (t) => { if (toastTimer.current) clearTimeout(toastTimer.current); setToast(t); toastTimer.current = setTimeout(() => setToast(null), 7000); };
  const nextLifter = (fromId) => {
    if (!team) return null;
    const m = team.members, i = m.findIndex((a) => a.id === fromId);
    for (let k = 1; k <= m.length; k++) {
      const c = m[(i + k) % m.length];
      if (c.id === fromId) continue;
      const pg = progress(c.id);
      if (pg.done < pg.total) return c;
    }
    return null;
  };

  const logSet = async (athlete, lift, { weight, reps, setNum }) => {
    setBusy(true); setErr("");
    const prior = rowsFor(athlete.id, lift.name);
    const prevBest = prior.length ? Math.max(...prior.map((r) => metricOf(lift, parseFloat(r.weight) || 0, parseFloat(r.reps) || 1))) : null;
    const entry = { athlete_id: athlete.id, lift: lift.name, weight, reps, date: today, day, tier: typeof lift.tier === "number" ? lift.tier : 3, set_num: setNum };
    try {
      const { data, error } = await supabase.from("pr_log").insert(entry).select().single();
      if (error) throw error;
      setRows((rs) => [data, ...rs]);
      hSuccess();
      const m = metricOf(lift, weight, reps);
      if (prevBest != null && m > prevBest) {
        setCelebrate({ name: firstName(athlete.name), lift: lift.name, value: m, unit: lift.inputType === "rsi" ? "RSI" : higherIsBetter(lift) ? "in" : "lbs", detail: higherIsBetter(lift) ? null : `Est. 1RM from ${weight} × ${reps}` });
        pulseMood("celebrate", 3000);
        setTimeout(() => setCelebrate(null), 3000);
      }
      const finishedLift = setNum >= setsOf(lift).length;
      const after = lifts.every((l) => (l.name === lift.name ? finishedLift : liftDone(athlete.id, l)));
      if (finishedLift) setLiftSel((s) => ({ ...s, [athlete.id]: undefined }));
      showToast({ text: after ? `${firstName(athlete.name)}'s session is done 🎉` : `${firstName(athlete.name)} · ${lift.name} set ${setNum} logged`, sub: rowText(lift, entry), undoId: data.id, from: athlete.id });
    } catch (e) {
      hError();
      setErr("Didn't save. Check the Wi-Fi and tap Log again.");
    }
    setBusy(false);
  };
  const undo = async (id) => {
    try { await supabase.from("pr_log").delete().eq("id", id); setRows((rs) => rs.filter((r) => r.id !== id)); setToast(null); } catch (e) { setErr("Couldn't undo. Try again."); }
  };

  const clock = mounted ? new Date(now).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
  const athlete = team && who ? team.members.find((a) => a.id === who) : null;

  return (
    <div className="tfx rk" onPointerDown={touch}>
      <Head>
        <title>Rack · TF College Group</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      {celebrate && (
        <div className="ir-pr" onClick={() => setCelebrate(null)} role="dialog" aria-label="New personal record">
          <div className="ir-pr-card">
            <div className="ir-pr-trophy" aria-hidden="true">🏆</div>
            <div className="ir-pr-eyebrow">{celebrate.name} · new PR</div>
            <div className="ir-pr-val tfx-num">{celebrate.value}<small>{celebrate.unit}</small></div>
            <div className="ir-pr-lift">{celebrate.lift}</div>
            {celebrate.detail && <div className="ir-pr-detail">{celebrate.detail}</div>}
          </div>
        </div>
      )}

      <header className="rk-bar tfx-glassbar">
        <div className="rk-brand"><b>TF</b> Rack</div>
        {team && (
          <button className="rk-teamchip tfx-press" style={{ "--c": team.color }} onClick={() => { setTeamKey(null); setWho(null); }}>
            <i />{team.label}<span>Change</span>
          </button>
        )}
        <div className="rk-clock tfx-num" suppressHydrationWarning>{clock}</div>
      </header>

      {!mounted ? null : !team ? (
        <main className="rk-main">
          <div className="rk-intro">
            <div className="tfx-eyebrow">{DAY_LABELS[day] || "Today"}{phase ? " · " + phase : ""}</div>
            <h1>Who are you lifting with?</h1>
          </div>
          {loadErr && <div className="ir-err">{loadErr}</div>}
          <div className="rk-teams">
            {teams.map((t) => (
              <button key={t.key} className="tfx-card rk-team tfx-press" style={{ "--c": t.color }} onClick={() => { hTap(); setTeamKey(t.key); setWho(null); }}>
                <span className="rk-team-bar" />
                <b>{t.label}</b>
                {t.leader ? <small>Led by {firstName(t.leader.name)}</small> : <small>{t.members.length} athlete{t.members.length !== 1 ? "s" : ""}</small>}
                <span className="rk-stack">{t.members.slice(0, 5).map((a) => <Avatar key={a.id} a={a} />)}{t.members.length > 5 && <span className="rk-av is-more">+{t.members.length - 5}</span>}</span>
              </button>
            ))}
            {!teams.length && !loadErr && <p className="rk-note">Loading the roster…</p>}
          </div>
        </main>
      ) : !athlete ? (
        <main className="rk-main">
          <div className="rk-intro">
            <div className="tfx-eyebrow">{team.label} · {DAY_LABELS[day]}</div>
            <h1>Tap your name</h1>
          </div>
          <div className="rk-names">
            {team.members.map((a) => {
              const pg = progress(a.id);
              return (
                <button key={a.id} className="tfx-card rk-name tfx-press" style={{ "--c": team.color }} onClick={() => { hTap(); setWho(a.id); }}>
                  <Avatar a={a} big />
                  <b>{a.name}</b>
                  <small className="tfx-num">{pg.done ? `${pg.done}/${pg.total} sets` : "Not started"}</small>
                </button>
              );
            })}
          </div>
        </main>
      ) : (
        <main className="rk-main rk-station" style={{ "--c": team.color }}>
          <nav className="rk-strip" aria-label="Teammates on this rack">
            {team.members.map((a) => {
              const pg = progress(a.id);
              return (
                <button key={a.id} className={"rk-mate tfx-press" + (a.id === who ? " is-on" : "")} onClick={() => { hTap(); setWho(a.id); setErr(""); }} aria-pressed={a.id === who}>
                  <Avatar a={a} />
                  <span>{firstName(a.name)}</span>
                  <MiniRing done={pg.done} total={pg.total} />
                </button>
              );
            })}
          </nav>

          <div className="rk-who">
            <div>
              <div className="tfx-eyebrow">Now lifting</div>
              <h1>{athlete.name}</h1>
            </div>
            <div className="ir-seg rk-days" role="tablist" aria-label="Training day">
              {DAYS.map((d) => <button key={d} role="tab" aria-selected={day === d} className={"tfx-press" + (day === d ? " is-on" : "")} onClick={() => setDay(d)}>{d}</button>)}
            </div>
          </div>

          {toast && (
            <div className="tfx-card rk-toast" role="status">
              <span className="rk-toast-check" aria-hidden="true">✓</span>
              <div className="rk-toast-txt"><b>{toast.text}</b><small className="tfx-num">{toast.sub}</small></div>
              {toast.undoId && <button className="ir-mini tfx-press" onClick={() => undo(toast.undoId)}>Undo</button>}
              {(() => { const n = nextLifter(toast.from); return n && n.id !== who ? <button className="tfx-btn tfx-press rk-next" onClick={() => { setWho(n.id); setToast(null); }}>Next: {firstName(n.name)} →</button> : null; })()}
            </div>
          )}
          {err && <div className="ir-err" role="alert">{err}</div>}

          {!lifts.length ? (
            <div className="tfx-card ir-empty"><b>No lifts programmed for {DAY_LABELS[day]}</b><p>Coach Ant posts the program in Coach → Program.</p></div>
          ) : (() => {
            const lift = currentLift(athlete.id);
            const tier = TIERS[lift.tier] || TIERS[1];
            const sets = setsOf(lift);
            const tdy = todayFor(athlete.id, lift.name);
            const done = liftDone(athlete.id, lift);
            return (
              <div className="rk-work">
                <section className={"tfx-card rk-lift" + (done ? " is-done" : "")} style={{ "--t": tier.c }}>
                  <header className="rk-lift-head">
                    <div>
                      <span className="ir-tier"><i />{tier.chip}</span>
                      <h2>{lift.name}</h2>
                      {lift.sets && <div className="ir-rx">{lift.sets}</div>}
                    </div>
                    {done && <span className="rk-donebadge">✓ Done</span>}
                  </header>
                  <div className="ir-sets">
                    {sets.map((st, si) => { const r = tdy[si]; return <span key={si} className={"ir-set" + (r ? " is-done" : si === tdy.length ? " is-next" : "")}><em>Set {si + 1}</em><b className="tfx-num">{r ? (lift.inputType === "rsi" ? r.weight : lift.inputType === "vert_lr" ? r.weight + "/" + r.reps : r.weight + "×" + r.reps) : st.label}</b></span>; })}
                    {tdy.slice(sets.length).map((r, xi) => <span key={"x" + xi} className="ir-set is-done"><em>Extra</em><b className="tfx-num">{r.weight}×{r.reps}</b></span>)}
                  </div>
                  <Entry key={athlete.id + "|" + lift.name + "|" + tdy.length} lift={lift} sets={sets} today={tdy} last={lastFor(athlete.id, lift.name)} busy={busy}
                    onLog={(p) => logSet(athlete, lift, p)}
                    onMarkDone={() => { hSuccess(); setBwDone((b) => ({ ...b, [athlete.id + "|" + lift.name]: true })); setLiftSel((s) => ({ ...s, [athlete.id]: undefined })); showToast({ text: `${firstName(athlete.name)} · ${lift.name} done`, sub: "Bodyweight", undoId: null, from: athlete.id }); }} />
                </section>

                <section className="tfx-card rk-list" aria-label="Today's lifts">
                  <div className="tfx-eyebrow rk-list-head">{DAY_LABELS[day]}'s lifts</div>
                  {lifts.map((l) => {
                    const t = TIERS[l.tier] || TIERS[1];
                    const n = setsOf(l).length, d = Math.min(n, todayFor(athlete.id, l.name).length), fin = liftDone(athlete.id, l);
                    const on = l.name === lift.name;
                    return (
                      <button key={l.name} className={"rk-row tfx-press" + (on ? " is-on" : "") + (fin ? " is-fin" : "")} style={{ "--t": t.c }} onClick={() => { hTap(); setLiftSel((s) => ({ ...s, [athlete.id]: l.name })); }}>
                        <span className="rk-row-name">{l.name}<small>{l.sets}</small></span>
                        <span className="rk-dots" aria-label={`${fin ? n : d} of ${n} sets`}>{Array.from({ length: n }).map((_, k) => <i key={k} className={fin || k < d ? "is-on" : ""} />)}</span>
                      </button>
                    );
                  })}
                </section>
              </div>
            );
          })()}
        </main>
      )}
    </div>
  );
}
