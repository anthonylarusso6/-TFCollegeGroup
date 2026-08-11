// Shared color constants across all components
export const BG = "#0f0f0f";
export const PUR = "#534AB7";
export const RED = "#C0392B";
export const GREEN = "#1E6B3A";
export const GOLD = "#D4AF37";
export const STEEL = "#708090";
export const ORANGE = "#E8720C";

// Columns safe to load for the whole roster / public athlete list.
// Excludes credentials that must never be broadcast to every device:
//   pin, polar_token, polar_refresh_token
// A single athlete's own record is still fetched with select("*") at login.
export const ATHLETE_SAFE_COLS = "id,name,sport,gender,role,photo_url,bracelet,tier,group_idx,status,vitruve_data,athletic_goal,character_goal,coach_athletic_task,coach_character_task,notes,leader_checkin_start,leader_checkin_end,injury,injury_note,created_at,vitruve_id,fellowship_note_1,fellowship_note_2,fellowship_note_3,fellowship_note_4,fellowship_note_5,fellowship_note_6,fellowship_note_7,fellowship_note_8,fellowship_note_9,fellowship_note_10,fellowship_note_11,fellowship_note_12,anonymous,mindset_note_1,mindset_note_2,mindset_note_3,mindset_note_4,mindset_note_5,mindset_note_6";
