import { createClient } from "@supabase/supabase-js";
import webpush from "../../../lib/webpush";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  // Vercel sets Authorization header for cron routes — verify it
  const auth = req.headers.authorization;
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Today's date in EST
  const estNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const today = estNow.getFullYear() + "-" + String(estNow.getMonth() + 1).padStart(2, "0") + "-" + String(estNow.getDate()).padStart(2, "0");

  // All active push subscriptions (day column holds the athlete id)
  let { data: subs } = await supabase.from("announcements")
    .select("day, message")
    .eq("type", "push_sub")
    .eq("active", true);

  if (!subs?.length) return res.status(200).json({ ok: true, sent: 0 });

  // Today's habit logs — figure out who has already completed all three
  const athleteIds = subs.map(s => s.day);
  let { data: habitRows } = await supabase.from("announcements")
    .select("day, message")
    .eq("type", "habit_log")
    .eq("week_label", today)
    .in("day", athleteIds);

  const completed = new Set();
  for (const row of (habitRows || [])) {
    try {
      const p = JSON.parse(row.message);
      if (p.water === true && p.nutrition === true && p.sleep != null) completed.add(String(row.day));
    } catch (e) { /* ignore malformed */ }
  }

  const msg = {
    title: "💧 Daily habits check-in",
    body: "Log your water, nutrition, and sleep to keep your streak alive.",
  };

  let sent = 0, skipped = 0, failed = 0;
  for (const sub of subs) {
    if (completed.has(String(sub.day))) { skipped++; continue; }
    try {
      const pushSub = JSON.parse(sub.message);
      await webpush.sendNotification(pushSub, JSON.stringify({
        title: msg.title,
        body: msg.body,
        url: "/athlete",
      }));
      sent++;
    } catch (e) {
      if (e.statusCode === 410 || e.statusCode === 404) {
        await supabase.from("announcements").update({ active: false })
          .eq("type", "push_sub").eq("day", sub.day);
      }
      failed++;
    }
  }

  return res.status(200).json({ ok: true, sent, skipped, failed });
}
