export default async function handler(req, res) {
  const { athleteId } = req.query;
  const API_KEY = "ba1b08b4-6c4d-46fc-8ecc-d108ca3402d5";
  const ORG_ID = "df679f8f-2aa7-5820-994a-24aa7453886e";

  try {
    const response = await fetch(`https://api.vitruve.fit/v1/organizations/${ORG_ID}/sessions?limit=10`, {
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return res.status(200).json({ error: "Could not fetch Vitruve data", status: response.status });
    }

    const data = await response.json();
    const sessions = data?.data || data?.sessions || data || [];

    if (!sessions.length) {
      return res.status(200).json({ noData: true });
    }

    // Get most recent session
    const latest = sessions[0];
    const sets = latest?.sets || latest?.metrics || [];

    return res.status(200).json({
      connected: true,
      date: latest?.date || latest?.created_at?.split("T")[0] || null,
      exercise: latest?.exercise_name || latest?.exercise || null,
      sets: sets.map(s => ({
        load: s?.load || s?.weight || null,
        peakVelocity: s?.peak_velocity || s?.peak_vel || null,
        meanVelocity: s?.mean_velocity || s?.mean_vel || null,
        reps: s?.reps || s?.repetitions || null,
      })),
    });

  } catch (e) {
    return res.status(200).json({ error: "Failed to connect to Vitruve" });
  }
}
