export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "prompt required" });
  if (typeof prompt !== "string" || prompt.length > 8000)
    return res.status(400).json({ error: "invalid prompt" });
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await r.json();
    if (data.error) return res.status(200).json({ text: "", error: data.error });
    res.json({ text: data.content?.[0]?.text || "" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
