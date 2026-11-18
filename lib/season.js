import { supabase } from "./supabase";

// The season the coach sets in Coach → Program → Season dates is stored as an
// announcements row (type "season", JSON message). When none is set, fall back
// to the current academic term inferred from today's date, so nothing in the app
// ever shows a season that already ended.
//
// Season shape: { label, start: "YYYY-MM-DD", end: "YYYY-MM-DD", explicit }

export function defaultSeason(now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth(); // 0 = Jan
  if (m >= 7) return { label: `Fall ${y}`, start: `${y}-08-01`, end: `${y}-12-20`, explicit: false };
  if (m <= 4) return { label: `Spring ${y}`, start: `${y}-01-05`, end: `${y}-05-15`, explicit: false };
  return { label: `Summer ${y}`, start: `${y}-05-16`, end: `${y}-07-31`, explicit: false };
}

export async function loadSeason() {
  try {
    const { data } = await supabase
      .from("announcements")
      .select("message")
      .eq("type", "season")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.message) {
      const s = JSON.parse(data.message);
      if (s && s.start && s.end) return { label: s.label || "This Season", start: s.start, end: s.end, explicit: true };
    }
  } catch (e) {}
  return defaultSeason();
}

export async function saveSeason({ label, start, end }) {
  await supabase.from("announcements").update({ active: false }).eq("type", "season");
  const { error } = await supabase
    .from("announcements")
    .insert({ type: "season", message: JSON.stringify({ label, start, end }), active: true });
  if (error) throw error;
}

// Local-time boundaries: the season starts at 00:00 on its first day and runs
// through the end of its last day.
export const seasonStart = (s) => new Date(s.start + "T00:00:00");
export const seasonEnd = (s) => new Date(s.end + "T23:59:59");

export function seasonWeeks(s) {
  return Math.max(1, Math.ceil((seasonEnd(s) - seasonStart(s)) / (7 * 86400000)));
}

export function fmtSeasonDate(iso, withYear = false) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

// Class start times (match the home page): Mon/Fri 9:00am, Tue/Thu 9:30am.
export const CLASS_DAYS = [1, 2, 4, 5];
export function classTimeOn(date) {
  const d = new Date(date);
  const monFri = d.getDay() === 1 || d.getDay() === 5;
  d.setHours(9, monFri ? 0 : 30, 0, 0);
  return d;
}

// The first actual class of the season: the start date, or the next class day
// after it if the start date isn't one.
export function firstClassAt(s) {
  const d = seasonStart(s);
  for (let i = 0; i < 7; i++) {
    if (CLASS_DAYS.includes(d.getDay())) return classTimeOn(d);
    d.setDate(d.getDate() + 1);
  }
  return classTimeOn(seasonStart(s));
}

// True while the coach has set a season that hasn't had its first class yet.
export function isBeforeSeason(s, now = new Date()) {
  return !!(s && s.explicit && now < firstClassAt(s));
}

export function fmtFirstClass(s) {
  const d = firstClassAt(s);
  const day = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(":00", "").replace(" ", "").toLowerCase();
  return day + " · " + time;
}
