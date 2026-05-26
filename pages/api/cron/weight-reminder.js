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

  // Get EST date for today
  const estNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  const today = estNow.getFullYear() + "-" + String(estNow.getMonth() + 1).padStart(2, "0") + "-" + String(estNow.getDate()).padStart(2, "0");
  const dow = estNow.getDay(); // 1=Mon, 5=Fri

  const messages = {
    1: { title: "⚖️ Monday Weigh-In", body: "Log your weight before hitting the iron today. Track the progress!" },
    5: { title: "⚖️ Friday Weigh-In", body: "Last lift of the week — log your weight before you get to work!" },
  };
  const msg = messages[dow];
  if (!msg) return res.status(200).json({ ok: true, skipped: true, reason: "not a lift day" });

  // Fetch all active push subscriptions
  let { data: subs } = await supabase.from("announcements")
    .select("day, message")
    .eq("type", "push_sub")
    .eq("active", true);

  if (!subs?.length) return res.status(200).json({ ok: true, sent: 0 });

  // For each subscriber, check if they already logged weight today
  const athleteIds = subs.map(s => s.day);
  let { data: todayLogs } = await supabase.from("weight_log")
    .select("athlete_id")
    .eq("date", today)
    .in("athlete_id", athleteIds);

  const alreadyLogged = new Set((todayLogs || []).map(l => String(l.athlete_id)));

  let sent = 0, skipped = 0, failed = 0;
  for (const sub of subs) {
    if (alreadyLogged.has(sub.day)) { skipped++; continue; }
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
