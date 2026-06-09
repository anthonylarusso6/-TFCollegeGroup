import { createClient } from "@supabase/supabase-js";
import webpush from "../../lib/webpush";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { title, body, url } = req.body || {};
  if (!title) return res.status(400).json({ error: "title required" });

  try {
    const { data: subs } = await supabase
      .from("announcements")
      .select("day, message")
      .eq("type", "push_sub")
      .eq("active", true);

    if (!subs?.length) return res.status(200).json({ ok: true, sent: 0, total: 0 });

    let sent = 0, failed = 0;
    for (const sub of subs) {
      try {
        const pushSub = JSON.parse(sub.message);
        await webpush.sendNotification(
          pushSub,
          JSON.stringify({ title, body: body || "", url: url || "/athlete" })
        );
        sent++;
      } catch (e) {
        if (e.statusCode === 410 || e.statusCode === 404) {
          await supabase.from("announcements").update({ active: false })
            .eq("type", "push_sub").eq("day", sub.day);
        }
        failed++;
      }
    }

    return res.status(200).json({ ok: true, sent, failed, total: subs.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
