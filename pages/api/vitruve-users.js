export default async function handler(req, res) {
  const API_KEY = "ba1b08b4-6c4d-46fc-8ecc-d108ca3402d5";

  try {
    const response = await fetch("https://api-exports.vitruve.fit/integration-users", {
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(200).json({ error: e.message });
  }
}
