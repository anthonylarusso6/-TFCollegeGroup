import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Skeleton } from "./Skeleton";

const RED = "#C0392B";
const GREEN = "#1E6B3A";
const ORANGE = "#E8720C";
const GC = ["#534AB7","#C0392B","#1E6B3A","#D4AF37","#E8720C","#1A4F8A"];

export default function ResetTeams({ athletes = [] }) {
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("draft")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1);
        if (data && data[0]) setDraft(data[0]);
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const groups = draft?.groups || [];
  const leaders = draft?.leaders || [];
  const bracelets = draft?.bracelets || [];
  const totalAssigned = groups.flat().length;
  const groupCount = groups.filter(g => g && g.length > 0).length;

  const doReset = async () => {
    setResetting(true);
    setErr("");
    try {
      const active = athletes.filter(a => a.status === "active");
      await Promise.all(
        active.map(a =>
          supabase.from("athletes")
            .update({ role: "iron", group_idx: null, tier: null, bracelet: null })
            .eq("id", a.id)
        )
      );
      if (draft?.id) {
        const { error } = await supabase.from("draft").update({
          phase: "setup",
          leaders: [],
          groups: [],
          bracelets: [],
          locked: false,
        }).eq("id", draft.id);
        if (error) throw error;
      }
      setDraft(null);
      setConfirm(false);
      setDone(true);
    } catch (e) {
      setErr(e.message || "Reset failed");
    }
    setResetting(false);
  };

  if (loading) {
    return (
      <div style={{ paddingTop: 8 }}>
        <Skeleton height={80} radius={12} style={{ marginBottom: 10 }} />
        <Skeleton height={120} radius={12} />
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✓</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: GREEN, marginBottom: 8, letterSpacing: "-0.02em" }}>Teams cleared</div>
        <div style={{ fontSize: 13, color: "#555", marginBottom: 24 }}>All athletes reset to unassigned. Head to Teams to rebuild.</div>
        <button onClick={() => setDone(false)} style={{ padding: "11px 24px", borderRadius: 10, border: "none", background: "rgba(255,255,255,0.07)", color: "#aaa", fontSize: 13, cursor: "pointer", fontFamily: "Georgia,serif" }}>
          Back
        </button>
      </div>
    );
  }

  const isEmpty = totalAssigned === 0;

  return (
    <div>
      {/* Header */}
      <div style={{ background: "rgba(192,57,43,0.08)", borderRadius: 14, padding: "16px 18px", marginBottom: 14, border: "1px solid rgba(192,57,43,0.2)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: RED, marginBottom: 4 }}>Reset Teams</div>
        <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6 }}>
          Clears all group assignments, leaders, and bracelet assignments. Every athlete goes back to unassigned.
          This cannot be undone.
        </div>
      </div>

      {/* Current state summary */}
      <div style={{ background: "rgba(255,255,255,0.045)", borderRadius: 12, padding: "1.25rem", marginBottom: 14, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Current state</div>

        {isEmpty ? (
          <div style={{ fontSize: 13, color: "#555", fontStyle: "italic" }}>No groups currently assigned — nothing to reset.</div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, background: "#111", borderRadius: 10, padding: "12px", textAlign: "center", border: "0.5px solid #1e1e1e" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{groupCount}</div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 3 }}>groups</div>
              </div>
              <div style={{ flex: 1, background: "#111", borderRadius: 10, padding: "12px", textAlign: "center", border: "0.5px solid #1e1e1e" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{totalAssigned}</div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 3 }}>athletes placed</div>
              </div>
              <div style={{ flex: 1, background: "#111", borderRadius: 10, padding: "12px", textAlign: "center", border: "0.5px solid #1e1e1e" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{leaders.filter(Boolean).length}</div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 3 }}>leaders</div>
              </div>
            </div>

            {/* Group preview */}
            {groups.map((members, i) => {
              if (!members || members.length === 0) return null;
              const col = GC[i % GC.length];
              const leader = leaders[i];
              const brac = bracelets[i];
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, marginBottom: 6, background: col + "0c", border: "0.5px solid " + col + "33" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: col, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: col }}>Group {i + 1}</span>
                    {leader && <span style={{ fontSize: 11, color: "#666", marginLeft: 6 }}>⚒ {leader}</span>}
                  </div>
                  <span style={{ fontSize: 11, color: "#555" }}>{members.length} members</span>
                  {brac && <div style={{ width: 10, height: 10, borderRadius: "50%", background: brac.hex || "#888", flexShrink: 0 }} />}
                </div>
              );
            })}
          </>
        )}
      </div>

      {err && (
        <div style={{ fontSize: 12, color: RED, marginBottom: 10, padding: "8px 12px", background: "rgba(192,57,43,0.12)", border: "0.5px solid rgba(192,57,43,0.3)", borderRadius: 8 }}>
          ⚠ {err}
        </div>
      )}

      {!isEmpty && (
        !confirm ? (
          <button
            onClick={() => setConfirm(true)}
            style={{ width: "100%", padding: "14px", borderRadius: 10, border: "1px solid rgba(192,57,43,0.5)", background: "rgba(192,57,43,0.1)", color: RED, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Georgia,serif" }}
          >
            Reset all teams →
          </button>
        ) : (
          <div style={{ background: "rgba(192,57,43,0.12)", borderRadius: 12, padding: "1.25rem", border: "1px solid rgba(192,57,43,0.35)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: RED, marginBottom: 6 }}>Are you sure?</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 16, lineHeight: 1.6 }}>
              This will remove all {totalAssigned} athletes from their groups and clear all leader and bracelet assignments. There is no undo.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={doReset}
                disabled={resetting}
                style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: RED, color: "#fff", fontSize: 13, fontWeight: 700, cursor: resetting ? "not-allowed" : "pointer", fontFamily: "Georgia,serif", opacity: resetting ? 0.6 : 1 }}
              >
                {resetting ? "Resetting…" : "Yes, reset everything"}
              </button>
              <button
                onClick={() => setConfirm(false)}
                disabled={resetting}
                style={{ padding: "12px 18px", borderRadius: 10, border: "0.5px solid #2a2a2a", background: "transparent", color: "#555", fontSize: 13, cursor: "pointer", fontFamily: "Georgia,serif" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
