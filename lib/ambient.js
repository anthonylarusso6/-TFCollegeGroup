import { useEffect } from "react";

// The ambient background (components/Ambient.js) reads its palette from
// <html data-mood="…">. Palettes live in styles/forge.css and cross-fade when the
// mood changes, so any screen can set the room's light with one call.
//
// Moods: base, iron, habits, weight, stretch, goals, faith, body, social,
//        callouts, coach, early, late, already, celebrate

let restoreTimer = null;
let baseMood = "base";

export function setMood(mood) {
  if (typeof document === "undefined") return;
  baseMood = mood || "base";
  if (restoreTimer) return; // a pulse is showing; it restores to baseMood when it ends
  document.documentElement.setAttribute("data-mood", baseMood);
}

export function useMood(mood) {
  useEffect(() => { setMood(mood); }, [mood]);
}

// Briefly take over the room (e.g. a gold wash on a new PR), then fade back.
export function pulseMood(mood, ms = 2600) {
  if (typeof document === "undefined") return;
  if (restoreTimer) clearTimeout(restoreTimer);
  document.documentElement.setAttribute("data-mood", mood);
  restoreTimer = setTimeout(() => {
    restoreTimer = null;
    document.documentElement.setAttribute("data-mood", baseMood);
  }, ms);
}
