import { actionSecretOk } from "../../lib/apiGuard";

// Reads ONE of Rich's programming slides (a JPEG) with Claude vision and returns structured JSON.
// Only the FAST row of a lift slide, and the Fortified/Fast section of a run slide, are read (Anthony's call):
// warmups and "(RAIN)" slides are skipped. Nothing is stored; the image is only sent to Claude.
export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

const MODEL = process.env.PROGRAM_READ_MODEL || "claude-sonnet-5-5";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEDIA = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const PROMPT = `You are reading ONE training slide from a strength and conditioning coach. Return ONLY a JSON object, no prose, no markdown fence.

The slide is one of two kinds:
- LIFT slide: a table with 5 level rows (Foundation, Fit, Fortified, Fast, Varsity/In-Season) and 3 columns (Tier 1, Tier 2, Tier 3). Each cell lists exercises, each with a rep scheme such as "8, 6, 5, 4", "3 x 10e" or "(.40-.60m/s)".
- RUN slide: 4 columns: warmup, two run blocks, finisher. Each block has a "Foundation/Fit" section and a "Fortified/Fast" section.

RULES
1. If the slide title contains "(RAIN)", return {"skip":true,"reason":"rain","title":"<title>"}.
2. Read ONLY the FAST row of a lift slide. Ignore every other level row.
3. On a run slide, ignore the warmup column entirely. For each run block and the finisher, read ONLY the "Fortified/Fast" section.
4. Copy exercise names and rep schemes exactly as printed. Do not guess. If something is unreadable, leave it out and add its position to "unclear".
5. "day" is one of Mon, Tue, Wed, Thu, Fri, Sat, Sun from the slide title or header; null if the slide does not say.

OUTPUT SHAPE
{"skip":false,"title":"<slide title as printed>","day":"Mon","type":"lift","lifts":[{"tier":1,"name":"SSB Hatfield Squat","scheme":"8, 6, 5, 4"}],"runs":[],"unclear":["short description of anything you could not read"]}
For a run slide use "type":"run", "lifts":[], and "runs":[{"block":"Block 1","text":"the Fortified/Fast content, one line per drill, exactly as printed"},{"block":"Block 2","text":"..."},{"block":"Finisher","text":"..."}].
"tier" is 1, 2 or 3 (the column).`;

function extractJson(text) {
  const s = String(text || "");
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error("no JSON in the reply");
  return JSON.parse(s.slice(a, b + 1));
}

// Never trust the shape: the review screen shows exactly what comes back, so clamp it.
function clean(raw) {
  if (raw && raw.skip) {
    return { skip: true, reason: String(raw.reason || "skipped"), title: String(raw.title || "").slice(0, 120) };
  }
  const type = raw.type === "run" ? "run" : "lift";
  const day = DAYS.includes(raw.day) ? raw.day : null;
  const lifts = (Array.isArray(raw.lifts) ? raw.lifts : [])
    .map((l) => ({
      tier: [1, 2, 3].includes(Number(l.tier)) ? Number(l.tier) : 1,
      name: String(l.name || "").trim().slice(0, 120),
      scheme: String(l.scheme || "").trim().slice(0, 120),
    }))
    .filter((l) => l.name);
  const runs = (Array.isArray(raw.runs) ? raw.runs : [])
    .map((r) => ({ block: String(r.block || "Block").trim().slice(0, 40), text: String(r.text || "").trim().slice(0, 1500) }))
    .filter((r) => r.text);
  const unclear = (Array.isArray(raw.unclear) ? raw.unclear : []).map((u) => String(u).slice(0, 160)).slice(0, 10);
  return { skip: false, title: String(raw.title || "").slice(0, 120), day, type, lifts: type === "lift" ? lifts : [], runs: type === "run" ? runs : [], unclear };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (!actionSecretOk(req)) return res.status(401).json({ error: "unauthorized" });
  const { image, mediaType } = req.body || {};
  if (typeof image !== "string" || !image || image.length > 5_500_000) {
    return res.status(400).json({ error: "send one slide image, base64, under about 4MB" });
  }
  const type = MEDIA.includes(mediaType) ? mediaType : "image/jpeg";
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "ANTHROPIC_API_KEY is not set on the server" });
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "anthropic-version": "2023-06-01", "x-api-key": process.env.ANTHROPIC_API_KEY },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: type, data: image } },
            { type: "text", text: PROMPT },
          ],
        }],
      }),
    });
    const data = await r.json();
    if (data.error) return res.status(502).json({ error: data.error.message || "the model returned an error" });
    const text = data.content && data.content[0] && data.content[0].text;
    let parsed;
    try {
      parsed = extractJson(text);
    } catch (e) {
      return res.status(502).json({ error: "could not read that slide (" + e.message + "). Try it again." });
    }
    return res.status(200).json({ slide: clean(parsed) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
