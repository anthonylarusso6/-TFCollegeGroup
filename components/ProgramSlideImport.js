import { useState, useRef } from "react";
import { RED, GREEN, GOLD, ORANGE, PUR } from "../lib/constants";
import { supabase } from "../lib/supabase";
import { todayEST } from "../lib/dates";

// Rich's weekly slides -> structured program. Only the FAST row of a lift slide and the Fortified/Fast part of a
// run slide are read (the server prompt enforces it); warmups and "(RAIN)" slides are skipped. Nothing is saved to
// the live program from here: "Use in builder" fills the builder below, which has its own Save.

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const APP_DAYS = ["Mon", "Tue", "Thu", "Fri"]; // the days the builder and Iron Room have
const TIER_COLORS = { 1: PUR, 2: GREEN, 3: ORANGE };
const DRAFT_KEY = "tf_program_import_draft";

// Shrink to about 1600px JPEG in the browser: keeps each upload small and nothing is stored anywhere.
function downscale(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const max = 1600;
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.85).split(",")[1]);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("could not open that image"));
    };
    img.src = url;
  });
}

const inp = {
  padding: "8px 10px", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.12)", fontSize: 13,
  fontFamily: "Georgia,serif", background: "rgba(255,255,255,0.05)", color: "#ddd", boxSizing: "border-box",
};
const box = {
  background: "rgba(255,255,255,0.045)", borderRadius: 12, padding: "1.25rem", marginBottom: 12,
  border: "1px solid rgba(255,255,255,0.08)",
};

export default function ProgramSlideImport({ onApply }) {
  const [slides, setSlides] = useState([]); // {id, name, status, title, error}
  const [edit, setEdit] = useState({}); // day -> {lifts:[{tier,name,scheme}], runs:[{block,text}]}
  const [notes, setNotes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef(null);

  const setSlide = (id, patch) => setSlides((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const addToReview = (slide, fileName) => {
    const day = slide.day || "Mon";
    setEdit((prev) => {
      const cur = prev[day] || { lifts: [], runs: [] };
      return {
        ...prev,
        [day]: { lifts: [...cur.lifts, ...slide.lifts], runs: [...cur.runs, ...slide.runs] },
      };
    });
    if (!slide.day) setNotes((n) => [...n, fileName + ": no day on the slide, put under Mon. Move it if wrong."]);
    if (slide.unclear && slide.unclear.length) setNotes((n) => [...n, fileName + ": could not read " + slide.unclear.join("; ")]);
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setBusy(true);
    setMsg("");
    const base = Date.now();
    const rows = files.map((f, i) => ({ id: base + "-" + i, name: f.name, status: "queued" }));
    setSlides((s) => [...s, ...rows]);
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const id = rows[i].id;
      if (/\(rain\)/i.test(f.name)) {
        setSlide(id, { status: "skipped", title: "(RAIN) slide" });
        continue;
      }
      setSlide(id, { status: "reading" });
      try {
        const image = await downscale(f);
        const headers = { "Content-Type": "application/json" };
        if (process.env.NEXT_PUBLIC_APP_ACTION_SECRET) headers["x-app-secret"] = process.env.NEXT_PUBLIC_APP_ACTION_SECRET;
        const res = await fetch("/api/program-read", { method: "POST", headers, body: JSON.stringify({ image, mediaType: "image/jpeg" }) });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.slide) {
          setSlide(id, { status: "error", error: body.error || "failed (" + res.status + ")" });
          continue;
        }
        const slide = body.slide;
        if (slide.skip) {
          setSlide(id, { status: "skipped", title: slide.title || slide.reason });
          continue;
        }
        setSlide(id, { status: "done", title: slide.title, kind: slide.type, day: slide.day });
        addToReview(slide, f.name);
      } catch (e) {
        setSlide(id, { status: "error", error: e.message });
      }
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const updLift = (day, i, patch) =>
    setEdit((p) => ({ ...p, [day]: { ...p[day], lifts: p[day].lifts.map((l, j) => (j === i ? { ...l, ...patch } : l)) } }));
  const delLift = (day, i) => setEdit((p) => ({ ...p, [day]: { ...p[day], lifts: p[day].lifts.filter((_, j) => j !== i) } }));
  const addLift = (day) => setEdit((p) => ({ ...p, [day]: { ...p[day], lifts: [...p[day].lifts, { tier: 1, name: "", scheme: "" }] } }));
  const updRun = (day, i, patch) =>
    setEdit((p) => ({ ...p, [day]: { ...p[day], runs: p[day].runs.map((r, j) => (j === i ? { ...r, ...patch } : r)) } }));
  const delRun = (day, i) => setEdit((p) => ({ ...p, [day]: { ...p[day], runs: p[day].runs.filter((_, j) => j !== i) } }));
  const moveDay = (from, to) =>
    setEdit((p) => {
      if (from === to || !p[from]) return p;
      const dest = p[to] || { lifts: [], runs: [] };
      const next = { ...p, [to]: { lifts: [...dest.lifts, ...p[from].lifts], runs: [...dest.runs, ...p[from].runs] } };
      delete next[from];
      return next;
    });

  const days = DAY_ORDER.filter((d) => edit[d] && (edit[d].lifts.length || edit[d].runs.length));
  const liftCount = days.reduce((n, d) => n + edit[d].lifts.length, 0);

  const useInBuilder = () => {
    const out = {};
    const skipped = [];
    for (const d of days) {
      const lifts = edit[d].lifts.filter((l) => l.name.trim()).map((l) => ({ name: l.name.trim(), tier: l.tier, sets: l.scheme.trim() }));
      if (!lifts.length) continue;
      if (APP_DAYS.includes(d)) out[d] = lifts;
      else skipped.push(d);
    }
    onApply && onApply(out);
    setMsg(
      "Loaded into the builder below" +
        (skipped.length ? ". " + skipped.join(", ") + " is not one of the app's four days (Mon, Tue, Thu, Fri), so it was left out." : ".") +
        " Check it there, then push."
    );
  };

  const saveDraft = async () => {
    const parsed = { savedOn: todayEST(), days: edit, notes };
    try {
      const { error } = await supabase.from("program_uploads").insert({ status: "draft", parsed });
      if (error) throw new Error(error.message);
      setMsg("Draft saved.");
    } catch (e) {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(parsed));
        setMsg("Saved on this device (the drafts table is not set up yet: " + e.message + ").");
      } catch (e2) {
        setMsg("Could not save the draft: " + e2.message);
      }
    }
  };

  const loadLocalDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) { setMsg("No draft saved on this device."); return; }
      const d = JSON.parse(raw);
      setEdit(d.days || {});
      setNotes(d.notes || []);
      setMsg("Loaded the draft from " + (d.savedOn || "earlier") + ".");
    } catch (e) {
      setMsg("Could not load the draft: " + e.message);
    }
  };

  const statusColor = { queued: "#777", reading: GOLD, done: GREEN, skipped: "#999", error: RED };

  return (
    <div style={box}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>📸 Import Rich&apos;s slides</div>
      <div style={{ fontSize: 11, color: "#aaa", marginBottom: 12, lineHeight: 1.5 }}>
        Drop in the day slides (JPEG). Lifts come from the Fast row only; runs from the Fortified/Fast part. Warmups and (RAIN) slides are skipped.
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple disabled={busy} onChange={(e) => handleFiles(e.target.files)} style={{ ...inp, width: "100%", marginBottom: 10 }} />

      {slides.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {slides.map((s) => (
            <div key={s.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 11, padding: "4px 0", color: "#bbb" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor[s.status], flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
              <span style={{ color: statusColor[s.status] }}>
                {s.status === "done" ? (s.kind === "run" ? "run" : "lift") + (s.day ? " · " + s.day : "") : s.status === "error" ? s.error : s.status === "skipped" ? "skipped" : s.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {notes.length > 0 && (
        <div style={{ background: "rgba(232,114,12,0.1)", border: "1px solid " + ORANGE + "55", borderRadius: 8, padding: "8px 10px", marginBottom: 12, fontSize: 11, color: "#e8b88a", lineHeight: 1.5 }}>
          {notes.map((n, i) => <div key={i}>⚠ {n}</div>)}
        </div>
      )}

      {days.map((d) => (
        <div key={d} style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10, marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", flex: 1 }}>{d}</div>
            <select value={d} onChange={(e) => moveDay(d, e.target.value)} style={{ ...inp, padding: "4px 6px", fontSize: 11 }} aria-label={"Move " + d + " to another day"}>
              {DAY_ORDER.map((x) => <option key={x} value={x}>{x === d ? "Move to…" : "→ " + x}</option>)}
            </select>
          </div>

          {edit[d].lifts.map((l, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
              <select value={l.tier} onChange={(e) => updLift(d, i, { tier: Number(e.target.value) })} style={{ ...inp, width: 54, color: TIER_COLORS[l.tier], fontWeight: 700 }} aria-label="Tier">
                <option value={1}>T1</option><option value={2}>T2</option><option value={3}>T3</option>
              </select>
              <input value={l.name} onChange={(e) => updLift(d, i, { name: e.target.value })} placeholder="Exercise" style={{ ...inp, flex: 2, minWidth: 0 }} />
              <input value={l.scheme} onChange={(e) => updLift(d, i, { scheme: e.target.value })} placeholder="Scheme" style={{ ...inp, flex: 1.2, minWidth: 0 }} />
              <button onClick={() => delLift(d, i)} aria-label="Remove lift" style={{ ...inp, width: 34, padding: "6px 0", cursor: "pointer", color: "#888" }}>✕</button>
            </div>
          ))}
          <button onClick={() => addLift(d)} style={{ ...inp, cursor: "pointer", fontSize: 11, color: "#aaa" }}>＋ Add a lift</button>

          {edit[d].runs.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Run (Fortified / Fast)</div>
              {edit[d].runs.map((r, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                    <input value={r.block} onChange={(e) => updRun(d, i, { block: e.target.value })} style={{ ...inp, flex: 1, minWidth: 0 }} />
                    <button onClick={() => delRun(d, i)} aria-label="Remove run block" style={{ ...inp, width: 34, padding: "6px 0", cursor: "pointer", color: "#888" }}>✕</button>
                  </div>
                  <textarea value={r.text} onChange={(e) => updRun(d, i, { text: e.target.value })} rows={3} style={{ ...inp, width: "100%", resize: "vertical" }} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {days.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <button onClick={useInBuilder} disabled={!liftCount} style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: liftCount ? ORANGE : "#333", color: "#fff", fontSize: 13, fontWeight: 700, cursor: liftCount ? "pointer" : "default", fontFamily: "Georgia,serif" }}>
            Use {liftCount} lifts in the builder
          </button>
          <button onClick={saveDraft} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid " + GOLD + "55", background: GOLD + "11", color: GOLD, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Georgia,serif" }}>
            Save draft
          </button>
        </div>
      )}
      {days.length === 0 && (
        <button onClick={loadLocalDraft} style={{ ...inp, cursor: "pointer", fontSize: 11, color: "#aaa" }}>Load the saved draft</button>
      )}
      {msg && <div style={{ marginTop: 10, fontSize: 12, color: "#ccc", lineHeight: 1.5 }}>{msg}</div>}
    </div>
  );
}
