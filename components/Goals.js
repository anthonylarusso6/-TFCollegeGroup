import { useState } from "react";
import { supabase } from "../lib/supabase";
import { fmtSeasonDate } from "../lib/season";

const GOALS = [
  {
    key: "athletic_goal", task: "coach_athletic_task", label: "Athletic goal", sub: "Physical", icon: "🎯", c: "#30A46C",
    q: "What are you chasing this season?",
    starters: ["Add 20 lbs to my squat", "Drop my 40 time", "Make the travel roster", "Hit every lift on the program"],
    deadline: true,
  },
  {
    key: "character_goal", task: "coach_character_task", label: "Character goal", sub: "Who you're becoming", icon: "⚔️", c: "#8E7CF0",
    q: "How are you growing as a person?",
    starters: ["First one in every day", "Lead without being asked", "Own my mistakes fast", "Encourage a teammate every class"],
    deadline: false,
  },
];

const DAY = 86400000;
const iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");

function DeadlineRing({ deadline, setAt }) {
  const end = new Date(deadline + "T23:59:59");
  const now = new Date();
  const start = setAt ? new Date(setAt) : new Date(end - 30 * DAY);
  const total = Math.max(DAY, end - start);
  const left = Math.max(0, end - now);
  const days = Math.ceil(left / DAY);
  const frac = Math.max(0, Math.min(1, left / total)); // ring = time remaining
  const R = 30, C = 2 * Math.PI * R;
  const passed = left <= 0;
  const status = passed ? "Deadline passed — set a new one" : days <= 7 ? "Final stretch. Finish it." : days <= 21 ? "Closing in. Stay on it." : "Plenty of runway. Build daily.";
  return (
    <div className="tfx-goal-ring">
      <div className="tfx-goal-dial">
        <svg viewBox="0 0 72 72" aria-hidden="true">
          <circle cx="36" cy="36" r={R} fill="none" strokeWidth="6" className="track" />
          <circle cx="36" cy="36" r={R} fill="none" strokeWidth="6" strokeLinecap="round" className="arc"
            strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 36 36)" />
        </svg>
        <div className="tfx-goal-ring-num tfx-num" suppressHydrationWarning>{passed ? "0" : days}<small>{days === 1 ? "day" : "days"}</small></div>
      </div>
      <div className="tfx-goal-ring-txt">
        <div className="tfx-eyebrow">Deadline</div>
        <b>{fmtSeasonDate(deadline, true)}</b>
        <span>{status}</span>
      </div>
    </div>
  );
}

export default function Goals({ athlete, season, onUpdate }) {
  const [editing, setEditing] = useState({});
  const [draft, setDraft] = useState({});
  const [dl, setDl] = useState(athlete?.goal_deadline || "");
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState(null);

  if (!athlete) return null;
  const seasonEnd = season && season.explicit ? season.end : null;
  const plus30 = iso(new Date(Date.now() + 30 * DAY));

  const startEdit = (g) => {
    setDraft((d) => ({ ...d, [g.key]: athlete[g.key] || "" }));
    if (g.deadline) setDl(athlete.goal_deadline || seasonEnd || "");
    setEditing((e) => ({ ...e, [g.key]: true }));
    setError(null);
  };

  const save = async (g) => {
    const text = (draft[g.key] ?? athlete[g.key] ?? "").trim();
    if (!text) return;
    setSaving(g.key); setError(null);
    const patch = { [g.key]: text };
    if (g.deadline) {
      patch.goal_deadline = dl || null;
      if (text !== (athlete[g.key] || "") || (dl || null) !== (athlete.goal_deadline || null)) patch.goal_set_at = new Date().toISOString();
    }
    try {
      const { error: e } = await supabase.from("athletes").update(patch).eq("id", athlete.id);
      if (e) throw e;
      onUpdate && onUpdate(patch);
      setEditing((x) => ({ ...x, [g.key]: false }));
      setSaved(g.key); setTimeout(() => setSaved((s) => (s === g.key ? null : s)), 2600);
    } catch (e) {
      setError({ key: g.key, msg: "Couldn't save — check your connection and try again." });
    }
    setSaving(null);
  };

  return (
    <div className="tfx tfx-goals">
      <div className="tfx-goals-head">
        <h2>Your goals</h2>
        {season && <span className="tfx-eyebrow">{season.label}</span>}
      </div>

      {GOALS.map((g, i) => {
        const text = athlete[g.key];
        const isEditing = editing[g.key] || !text;
        const task = athlete[g.task];
        return (
          <section key={g.key} className="tfx-card tfx-goal tfx-rise" style={{ "--c": g.c, animationDelay: i * 0.07 + "s" }}>
            <header className="tfx-goal-head">
              <div className="tfx-goal-icon" aria-hidden="true">{g.icon}</div>
              <div>
                <div className="tfx-eyebrow tfx-goal-sub">{g.sub}</div>
                <h3>{g.label}</h3>
              </div>
              {text && !isEditing && (
                <button className="tfx-goal-edit tfx-press" onClick={() => startEdit(g)} aria-label={"Edit " + g.label}>
                  {saved === g.key ? "✓ Saved" : "Edit"}
                </button>
              )}
            </header>

            {!isEditing ? (
              <>
                <blockquote className="tfx-goal-quote">{text}</blockquote>
                {g.deadline && (athlete.goal_deadline
                  ? <DeadlineRing deadline={athlete.goal_deadline} setAt={athlete.goal_set_at} />
                  : <button className="tfx-chipbtn tfx-goal-adddl tfx-press" onClick={() => startEdit(g)}>+ Add a deadline</button>)}
              </>
            ) : (
              <div className="tfx-goal-form">
                <p className="tfx-goal-q">{g.q}</p>
                <textarea className="tfx-field tfx-goal-input" rows={3} value={draft[g.key] ?? text ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [g.key]: e.target.value }))}
                  placeholder="Type it like you mean it…" aria-label={g.label} />
                <div className="tfx-goal-starters">
                  {g.starters.map((s) => (
                    <button key={s} className={"tfx-chipbtn tfx-press" + ((draft[g.key] ?? "") === s ? " is-on" : "")} onClick={() => setDraft((d) => ({ ...d, [g.key]: s }))}>{s}</button>
                  ))}
                </div>
                {g.deadline && (
                  <div className="tfx-goal-dl">
                    <div className="tfx-eyebrow">Deadline</div>
                    <div className="tfx-goal-dlrow">
                      {seasonEnd && <button className={"tfx-chipbtn tfx-press" + (dl === seasonEnd ? " is-on" : "")} onClick={() => setDl(seasonEnd)}>End of season · {fmtSeasonDate(seasonEnd)}</button>}
                      <button className={"tfx-chipbtn tfx-press" + (dl === plus30 ? " is-on" : "")} onClick={() => setDl(plus30)}>30 days</button>
                      <input type="date" className="tfx-field tfx-goal-date" value={dl} onChange={(e) => setDl(e.target.value)} aria-label="Custom deadline" />
                    </div>
                  </div>
                )}
                {error && error.key === g.key && <div className="tfx-goal-err">{error.msg}</div>}
                <div className="tfx-goal-actions">
                  {text && <button className="tfx-btn-ghost tfx-press" onClick={() => setEditing((e) => ({ ...e, [g.key]: false }))}>Cancel</button>}
                  <button className="tfx-btn tfx-press" disabled={!(draft[g.key] ?? text ?? "").trim() || saving === g.key} onClick={() => save(g)}>
                    {saving === g.key ? "Saving…" : "Lock it in"}
                  </button>
                </div>
              </div>
            )}

            {task && (
              <div className="tfx-goal-coach">
                <div className="tfx-goal-coach-av" aria-hidden="true">⚒</div>
                <div>
                  <div className="tfx-eyebrow">From Coach Ant</div>
                  <p>{task}</p>
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
