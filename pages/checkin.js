import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";
import Icon from "../components/Icon";
import { hSuccess, hError, hTap } from "../lib/haptics";
import { setMood } from "../lib/ambient";
import { loadSeason, isBeforeSeason, firstClassAt, fmtFirstClass, classTimeOn, CLASS_DAYS as CLASS_DOW } from "../lib/season";

const GREEN = "#30A46C";
const RED = "#E5484D";
const GOLD = "#D4AF37";
const VIOLET = "#8E7CF0";
const FORGE = "#C0392B";
const IRON = "#708090";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LONG = { Mon: "Monday", Tue: "Tuesday", Thu: "Thursday", Fri: "Friday" };
const CLASS_DAYS = ["Mon", "Tue", "Thu", "Fri"];
const CUTOFFS = { Mon: { h: 9, m: 0 }, Fri: { h: 9, m: 0 }, Tue: { h: 9, m: 30 }, Thu: { h: 9, m: 30 } };
const AUTO_RETURN_MS = 7000;

const estNowDate = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
const ymd = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

// Next class start (device time): the season's first class if it hasn't happened,
// otherwise the next Mon/Tue/Thu/Fri at class time.
function nextClassAt(season, now = new Date()) {
  if (isBeforeSeason(season, now)) return firstClassAt(season);
  const d = new Date(now);
  for (let i = 0; i < 8; i++) {
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
    if (CLASS_DOW.includes(day.getDay())) {
      const t = classTimeOn(day);
      if (t > now) return t;
    }
  }
  return null;
}

function Avatar({ a, cls }) {
  const col = a.role === "forge" ? FORGE : IRON;
  return (
    <div className={cls} style={{ "--c": col }}>
      {a.photo_url ? <img src={a.photo_url} alt="" onError={(e) => { e.target.style.display = "none"; }} /> : (a.name || "?")[0]}
    </div>
  );
}

export default function CheckIn() {
  const [athletes, setAthletes] = useState([]);
  const [todayIn, setTodayIn] = useState([]); // [{athlete_id,status,time_logged}]
  const [program, setProgram] = useState(null);
  const [season, setSeason] = useState(null);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [done, setDone] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(() => Date.now());
  const [mounted, setMounted] = useState(false);
  const returnTimer = useRef(null);

  // Live clock. The page is pre-rendered at build time, so everything that
  // depends on "now" (class day, late, the clock) renders only on the device.
  useEffect(() => { setMounted(true); const t = setInterval(() => setTick(Date.now()), 1000); return () => clearInterval(t); }, []);

  const estNow = estNowDate();
  const day = DAYS[estNow.getDay()];
  const isClassDay = CLASS_DAYS.includes(day);
  const today = ymd(estNow);
  const cut = CUTOFFS[day] || { h: 9, m: 30 };
  const cutDate = new Date(estNow.getFullYear(), estNow.getMonth(), estNow.getDate(), cut.h, cut.m, 0);
  const isLate = estNow >= cutDate;
  const timeStr = estNow.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const cutStr = cutDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(" ", "").toLowerCase();

  const loadToday = async () => {
    try {
      const { data } = await supabase.from("attendance").select("athlete_id,status,time_logged").eq("date", ymd(estNowDate()));
      setTodayIn(data || []);
    } catch (e) {}
  };

  useEffect(() => {
    (async () => {
      try {
        // Sleeping athletes come back for a new season — they must be able to check in too.
        const { data } = await supabase.from("athletes").select("id,name,photo_url,role,status").in("status", ["active", "sleeping"]).order("name");
        setAthletes(data || []);
      } catch (e) {}
      await loadToday();
      setLoading(false);
      try {
        const { data } = await supabase.from("announcements").select("message").eq("type", "program").eq("active", true).order("created_at", { ascending: false }).limit(1);
        if (data && data[0]) setProgram(JSON.parse(data[0].message || "{}"));
      } catch (e) {}
      try { setSeason(await loadSeason()); } catch (e) {}
    })();
    const poll = setInterval(loadToday, 20000); // "who's in" stays live
    return () => clearInterval(poll);
  }, []);

  // Room light follows the moment
  useEffect(() => {
    if (err) setMood("late");
    else if (done) setMood(done.already ? "already" : done.status === "early" ? "early" : "late");
    else if (isClassDay) setMood(isLate ? "late" : "early");
    else setMood("base");
  }, [err, done, isClassDay, isLate]);

  useEffect(() => () => { if (returnTimer.current) clearTimeout(returnTimer.current); }, []);

  const reset = () => {
    if (returnTimer.current) clearTimeout(returnTimer.current);
    returnTimer.current = null;
    setDone(null); setErr(null); setBusyId(null); setSearch("");
  };
  const scheduleReturn = () => {
    if (returnTimer.current) clearTimeout(returnTimer.current);
    returnTimer.current = setTimeout(reset, AUTO_RETURN_MS);
  };

  const doCheckin = async (athlete) => {
    if (busyId) return;
    setBusyId(athlete.id);
    try {
      const [attRes, lbRes] = await Promise.all([
        supabase.from("attendance").select("*").eq("athlete_id", athlete.id).eq("date", today),
        supabase.from("leaderboard").select("*").eq("athlete_id", athlete.id),
      ]);
      const existing = attRes.data;
      const lb = lbRes.data;
      if (existing && existing.length > 0) {
        hTap();
        setDone({ already: true, status: existing[0].status, time: existing[0].time_logged, name: athlete.name, streak: lb && lb[0] ? lb[0].current_streak || 0 : 0, place: null });
        scheduleReturn();
        return;
      }
      const status = isLate ? "late" : "early";
      const { error: insErr } = await supabase.from("attendance").insert({ athlete_id: athlete.id, date: today, day, status, time_logged: timeStr });
      if (insErr) { hError(); setErr({ name: athlete.name }); return; }
      if (status === "early") hSuccess(); else hError();
      // A sleeping athlete who shows up is back in the group
      if (athlete.status === "sleeping") {
        try { await supabase.from("athletes").update({ status: "active" }).eq("id", athlete.id); } catch (e) {}
        setAthletes((p) => p.map((x) => (x.id === athlete.id ? { ...x, status: "active" } : x)));
      }
      // Update leaderboard streak (unchanged logic)
      let streak = 0;
      if (lb && lb.length > 0) {
        const updates = {};
        if (status === "early") {
          updates.early_count = (lb[0].early_count || 0) + 1;
          updates.current_streak = (lb[0].current_streak || 0) + 1;
          if (updates.current_streak > (lb[0].best_streak || 0)) updates.best_streak = updates.current_streak;
        } else {
          updates.late_count = (lb[0].late_count || 0) + 1;
          updates.current_streak = 0;
        }
        streak = updates.current_streak;
        try { await supabase.from("leaderboard").update(updates).eq("athlete_id", athlete.id); } catch (e) {}
      } else {
        streak = status === "early" ? 1 : 0;
        try { await supabase.from("leaderboard").insert({ athlete_id: athlete.id, early_count: status === "early" ? 1 : 0, late_count: status === "late" ? 1 : 0, current_streak: streak, best_streak: streak }); } catch (e) {}
      }
      const place = todayIn.length + 1;
      setTodayIn((p) => [...p, { athlete_id: athlete.id, status, time_logged: timeStr }]);
      setDone({ already: false, status, time: timeStr, name: athlete.name, streak, place });
      scheduleReturn();
    } catch (e) {
      hError(); setErr({ name: athlete?.name });
    } finally {
      setBusyId(null);
    }
  };

  if (!mounted) return <><Head><title>Check In — TF College Group</title></Head><div className="tfx tfx-ci" /></>;

  // ── Failure: the check-in did NOT save ──────────────────────────────
  if (err) {
    return (
      <>
        <Head><title>Check-in failed</title></Head>
        <div className="tfx tfx-ci-result" style={{ "--c": RED }}>
          <div className="tfx-card tfx-ci-penalty" style={{ "--c": RED }}>
            <b>Didn't save</b>
            <span>{err.name ? err.name + " — y" : "Y"}our check-in was not recorded. Check the connection and tap your name again.</span>
          </div>
          <button className="tfx-btn tfx-press tfx-ci-done" onClick={reset}>Try again</button>
        </div>
      </>
    );
  }

  // ── Result ───────────────────────────────────────────────────────────
  if (done) {
    const early = done.status === "early";
    const c = done.already ? VIOLET : early ? GREEN : RED;
    return (
      <>
        <Head><title>{done.already ? "Already checked in" : early ? "You're early" : "You're late"}</title></Head>
        <div className="tfx tfx-ci-result" style={{ "--c": c }} onClick={reset} role="button" aria-label="Back to check-in">
          {early && !done.already && (
            <div style={{ position: "absolute", top: "30%", left: "50%", width: 0, height: 0, pointerEvents: "none" }}>
              {Array.from({ length: 18 }).map((_, i) => {
                const ang = (i / 18) * Math.PI * 2; const dist = 90 + ((i * 41) % 70);
                const cols = [GREEN, GOLD, "#bff0d4"];
                return <span key={i} className="tfx-spark" style={{ left: Math.cos(ang) * dist, top: Math.sin(ang) * dist * 0.65, "--c": cols[i % 3], animationDelay: (0.15 + (i % 6) * 0.05) + "s" }} />;
              })}
            </div>
          )}
          <svg className="tfx-ci-ring" viewBox="0 0 148 148" aria-hidden="true">
            <circle className="track" cx="74" cy="74" r="68" fill="none" strokeWidth="6" />
            <circle className="arc" cx="74" cy="74" r="68" fill="none" strokeWidth="6" strokeLinecap="round" transform="rotate(-90 74 74)" />
            {early || done.already
              ? <path className="mark" d="M47 76 L66 94 L102 56" fill="none" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
              : <path className="mark" d="M74 44 L74 78 L96 90" fill="none" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />}
          </svg>
          <div className="tfx-ci-verdict tfx-rise">{done.already ? "Already in" : early ? "You're early" : "You're late"}</div>
          <div className="tfx-ci-who tfx-rise" style={{ animationDelay: "0.08s" }}>{done.name}</div>
          <div className="tfx-ci-meta tfx-rise" style={{ animationDelay: "0.14s" }}>
            {done.time} · {DAY_LONG[day] || day}{done.place ? " · #" + done.place + " in today" : ""}
          </div>
          <div className="tfx-ci-pills tfx-rise" style={{ animationDelay: "0.2s" }}>
            {early && done.streak > 0 && <span className="tfx-ci-pill">🔥 {done.streak}-day early streak</span>}
            {early && !done.already && <span className="tfx-ci-pill">⚒ Iron sharpens iron</span>}
          </div>
          {!early && !done.already && (
            <div className="tfx-card tfx-ci-penalty tfx-rise" style={{ "--c": RED, animationDelay: "0.2s" }}>
              <b>50 crunches</b>
              <span>On time is late. Early is the only standard.</span>
            </div>
          )}
          <button className="tfx-btn-ghost tfx-press tfx-ci-done" onClick={(e) => { e.stopPropagation(); reset(); }}>Done</button>
          <div className="tfx-ci-autobar" style={{ "--t": AUTO_RETURN_MS + "ms" }}><i /></div>
        </div>
      </>
    );
  }

  // ── Rest day (or before the season starts): count down to the next class ──
  const preSeason = season && isBeforeSeason(season);
  if (!isClassDay) {
    const next = nextClassAt(season);
    const diff = next ? Math.max(0, next - tick) : 0;
    const parts = [
      [Math.floor(diff / 86400000), "Days"],
      [Math.floor((diff % 86400000) / 3600000), "Hrs"],
      [Math.floor((diff % 3600000) / 60000), "Min"],
      [Math.floor((diff % 60000) / 1000), "Sec"],
    ];
    return (
      <>
        <Head><title>Check In — TF College Group</title></Head>
        <div className="tfx tfx-ci-rest">
          <div className="tfx-eyebrow">{preSeason ? season.label : "No class today"}</div>
          <h1>{preSeason ? "First class in" : "Next class in"}</h1>
          {next && (
            <div className="tfx-ci-count" suppressHydrationWarning>
              {parts.map(([v, l]) => (
                <div key={l} className="tfx-card"><b suppressHydrationWarning>{String(v).padStart(2, "0")}</b><span>{l}</span></div>
              ))}
            </div>
          )}
          {next && (
            <div className="tfx-ci-when" suppressHydrationWarning>
              {preSeason ? fmtFirstClass(season) : next.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) + " · " + next.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </div>
          )}
          <div className="tfx-ci-note">Class days are Monday, Tuesday, Thursday &amp; Friday</div>
        </div>
      </>
    );
  }

  // ── Class day: the station ──────────────────────────────────────────
  const inSet = new Set(todayIn.map((r) => String(r.athlete_id)));
  const byId = Object.fromEntries(athletes.map((a) => [String(a.id), a]));
  const inAthletes = todayIn.map((r) => byId[String(r.athlete_id)]).filter(Boolean);
  const earlyCount = todayIn.filter((r) => r.status === "early").length;
  const q = search.trim().toLowerCase();
  const list = athletes
    .filter((a) => !q || a.name.toLowerCase().includes(q))
    .sort((a, b) => (inSet.has(String(a.id)) - inSet.has(String(b.id))) || a.name.localeCompare(b.name));

  // Meter drains over the last hour before the doors close
  const minsLeft = (cutDate - estNow) / 60000;
  const meter = Math.max(0, Math.min(1, minsLeft / 60));
  const minsPast = Math.floor((estNow - cutDate) / 60000);
  const h12 = ((estNow.getHours() + 11) % 12) + 1;
  const lifts = (program?.days?.[day] || []).map((l) => l.name).filter(Boolean);

  return (
    <>
      <Head><title>Check In — TF College Group</title></Head>
      <div className="tfx tfx-ci">
        <div className="tfx-ci-hero">
          <div className="tfx-eyebrow tfx-ci-eyebrow"><Icon name="anvil" size={14} color={GOLD} /> Check in · {DAY_LONG[day]}</div>
          <div className="tfx-ci-clock tfx-num" suppressHydrationWarning>
            {h12}:{String(estNow.getMinutes()).padStart(2, "0")}
            <span className="tfx-ci-sec">{String(estNow.getSeconds()).padStart(2, "0")}</span>
            <small>{estNow.getHours() < 12 ? "AM" : "PM"}</small>
          </div>
          <div className="tfx-ci-status" style={{ "--c": isLate ? RED : GREEN }} suppressHydrationWarning>
            <span className="tfx-livedot" style={{ "--c": isLate ? RED : GREEN }} />
            {isLate
              ? (minsPast < 1 ? "Late · doors just closed" : "Late · " + minsPast + " min past " + cutStr)
              : (minsLeft <= 60 ? "On time · " + Math.ceil(minsLeft) + " min until " + cutStr : "On time · doors close " + cutStr)}
          </div>
          {!isLate && <div className="tfx-ci-meter"><i style={{ "--p": meter }} /></div>}
        </div>

        {preSeason && (
          <div className="tfx-card tfx-ci-banner"><span>🗓</span><span><b>{season.label}</b> starts {fmtFirstClass(season)} — come get a head start.</span></div>
        )}

        <div className="tfx-ci-row">
          <div className="tfx-card tfx-ci-whosin tfx-rise">
            {inAthletes.length > 0 ? (
              <>
                <div className="tfx-ci-stack">
                  {inAthletes.slice(-5).reverse().map((a) => <Avatar key={a.id} a={a} cls="tfx-ci-mini" />)}
                  {inAthletes.length > 5 && <div className="tfx-ci-mini is-more">+{inAthletes.length - 5}</div>}
                </div>
                <div><b>{inAthletes.length}</b> <span className="tfx-eyebrow" style={{ letterSpacing: "0.08em" }}>in today</span><p>{earlyCount} early · {inAthletes.length - earlyCount} late</p></div>
              </>
            ) : (
              <div><b style={{ fontSize: 17 }}>Be the first one in 🔥</b><p>Nobody's checked in yet today.</p></div>
            )}
          </div>

          {lifts.length > 0 && (
            <div className="tfx-card tfx-ci-today tfx-rise" style={{ animationDelay: "0.06s" }}>
              <div className="tfx-eyebrow">Today in the Iron Room</div>
              <h3>{program.phase || "Today's session"}</h3>
              <div className="tfx-ci-chips">
                {lifts.slice(0, 4).map((n) => <span key={n} className="tfx-ci-chip">{n}</span>)}
                {lifts.length > 4 && <span className="tfx-ci-chip">+{lifts.length - 4} more</span>}
              </div>
            </div>
          )}
        </div>

        <div className="tfx-ci-search">
          <div className="tfx-ci-search-wrap">
            <span className="tfx-ci-sicon" style={{ left: 16 }}><Icon name="search" size={17} color="currentColor" /></span>
            <input className="tfx-field" type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Find your name…" autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} aria-label="Find your name" />
          </div>
        </div>

        <div className="tfx-ci-section">
          <span className="tfx-eyebrow">Tap your name</span>
          <span className="tfx-eyebrow">A–Z</span>
        </div>

        <div className="tfx-ci-grid">
          {loading ? (
            <div className="tfx-ci-empty">Loading the roster…</div>
          ) : list.length === 0 ? (
            <div className="tfx-ci-empty">No one by that name. Try your first name.</div>
          ) : list.map((a) => {
            const isIn = inSet.has(String(a.id));
            const col = a.role === "forge" ? FORGE : IRON;
            const [first, ...rest] = (a.name || "").split(" ");
            return (
              <button key={a.id} className={"tfx-ci-tile tfx-press" + (isIn ? " is-in" : "") + (busyId === a.id ? " is-busy" : "")}
                style={{ "--c": col }} onClick={() => doCheckin(a)} disabled={!!busyId} aria-label={(isIn ? "Already checked in: " : "Check in ") + a.name}>
                <div className="tfx-ci-av" style={{ "--c": col }}>
                  {a.photo_url ? <img src={a.photo_url} alt="" onError={(e) => { e.target.style.display = "none"; }} /> : first[0]}
                  {isIn && <span className="tfx-ci-badge">✓</span>}
                </div>
                <div className="tfx-ci-first">{first}</div>
                <div className="tfx-ci-last">{rest.join(" ") || " "}</div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
