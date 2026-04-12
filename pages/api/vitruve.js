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
      return res.status(200).json({ error: "Could not fetch Vitruve data", status: response.status });
    }

    const data = await response.json();
    const workouts = data?.data || data?.workouts || data || [];

    if (!workouts.length) return res.status(200).json({ noData: true });

    const latest = workouts[0];
    const exercises = latest?.exercises || [];

    const getMetric = (metricValues, name) => {
      const m = metricValues?.find(mv => mv.metric === name);
      return m ? Math.round(m.value * 100) / 100 : null;
    };

    const sets = [];
    exercises.forEach(ex => {
      (ex.series || []).forEach(serie => {
        const concentric = (serie.repetitions || []).filter(r => r.type === "concentric");
        if (concentric.length > 0) {
          const avgPeakVel = concentric.reduce((sum, r) => sum + (getMetric(r.metricValues, "Peak Velocity") || 0), 0) / concentric.length;
          const avgMeanVel = concentric.reduce((sum, r) => sum + (getMetric(r.metricValues, "Mean Velocity") || 0), 0) / concentric.length;
          const weight = getMetric(concentric[0]?.metricValues, "Weight");
          sets.push({
            exercise: ex.name,
            load: weight ? Math.round(weight * 10) / 10 : null,
            peakVelocity: Math.round(avgPeakVel * 100) / 100,
            meanVelocity: Math.round(avgMeanVel * 100) / 100,
            reps: concentric.length,
          });
        }
      });
    });

    return res.status(200).json({
      connected: true,
      date: latest?.completedAt?.split("T")[0] || null,
      exercise: exercises[0]?.name || "VBT Workout",
      sets: sets.slice(0, 5),
    });

  } catch (e) {
    return res.status(200).json({ error: "Failed to connect to Vitruve", message: e.message });
  }
}
