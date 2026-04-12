export default async function handler(req, res) {
  const API_KEY = "ba1b08b4-6c4d-46fc-8ecc-d108ca3402d5";

  try {
    const response = await fetch("https://api-exports.vitruve.fit/vbt-workouts?date=last-30days&limit=10", {
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const raw = await response.text();
      return res.status(200).json({ error: "Could not fetch Vitruve data", status: response.status, raw });
    }

    const data = await response.json();
    const workouts = data?.data || data?.workouts || data || [];

    if (!workouts.length) {
      return res.status(200).json({ noData: true });
    }

    const latest = workouts[0];
    const sets = latest?.sets || latest?.metrics || latest?.exercises || [];

    return res.status(200).json({
      connected: true,
      date: latest?.date || latest?.created_at?.split("T")[0] || null,
      exercise: latest?.exercise_name || latest?.exercise || latest?.name || null,
      sets: sets.map(s => ({
        load: s?.load || s?.weight || null,
        peakVelocity: s?.peak_velocity || s?.peak_vel || s?.peakVelocity || null,
        meanVelocity: s?.mean_velocity || s?.mean_vel || s?.meanVelocity || null,
        reps: s?.reps || s?.repetitions || null,
      })),
    });

  } catch (e) {
    return res.status(200).json({ error: "Failed to connect to Vitruve", message: e.message });
  }
}
