import { createClient } from "@supabase/supabase-js";
import webpush from "../../lib/webpush";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { athleteId, title, body, url } = req.body;
  if (!athleteId || !title) return res.status(400).json({ error: "Missing fields" });

  try {
    const { data } = await supabase.from("announcements")
      .select("message")
      .eq("type", "push_sub")
      .eq("day", String(athleteId))
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data?.message) return res.status(200).json({ ok: true, sent: false, reason: "no_sub" });

    let sub;
    try { sub = JSON.parse(data.message); } catch {
      await supabase.from("announcements").update({ active: false })
        .eq("type", "push_sub").eq("day", String(athleteId));
      return res.status(200).json({ ok: true, sent: false, reason: "bad_sub" });
    }
    await webpush.sendNotification(sub, JSON.stringify({ title, body, url: url || "/athlete" }));
    return res.status(200).json({ ok: true, sent: true });
  } catch (e) {
    // If subscription is expired/invalid, deactivate it
    if (e.statusCode === 410 || e.statusCode === 404 || e.statusCode === 400 || e.statusCode === 401) {
      await supabase.from("announcements").update({ active: false })
        .eq("type", "push_sub").eq("day", String(athleteId));
    }
    return res.status(200).json({ ok: true, sent: false, error: e.message });
  }
}
