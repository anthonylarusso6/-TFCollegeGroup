import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { athleteId, subscription } = req.body;
    if (!athleteId || !subscription) return res.status(400).json({ error: "Missing fields" });
    try {
      // Deactivate old subscriptions for this athlete
      await supabase.from("announcements").update({ active: false })
        .eq("type", "push_sub").eq("day", String(athleteId));
      // Insert new subscription
      const { error } = await supabase.from("announcements").insert({
        type: "push_sub",
        day: String(athleteId),
        message: JSON.stringify(subscription),
        active: true,
      });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
  if (req.method === "DELETE") {
    const { athleteId } = req.body;
    if (!athleteId) return res.status(400).json({ error: "Missing athleteId" });
    try {
      await supabase.from("announcements").update({ active: false })
        .eq("type", "push_sub").eq("day", String(athleteId));
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(405).end();
}
