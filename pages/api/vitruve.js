export default async function handler(req, res) {
  const API_KEY = "ba1b08b4-6c4d-46fc-8ecc-d108ca3402d5";
  const { athleteName, date = "last-30days", vitruveId } = req.query;

  try {
    const response = await fetch(`https://api-exports.vitruve.fit/vbt-workouts?date=${date}&limit=50`, {
      headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return res.status(200).json({ error: "Could not fetch Vitruve data", status: response.status });
    }

    const data = await response.json();
    let workouts = data?.data || data?.workouts || data || [];
    if (!workouts.length) return res.status(200).json({ noData: true });

    if (vitruveId) {
      const filtered = workouts.filter(w => w?.userId === vitruveId);
      if (filtered.length) workouts = filtered;
    } else if (athleteName) {
      const filtered = workouts.filter(w =>
        (w?.athlete_name || w?.athlete || w?.user_name || w?.name || "")
        .toLowerCase().includes(athleteName.toLowerCase())
      );
      if (filtered.length) workouts = filtered;
    }

    const getMetric = (metricValues, name) => {
      const m = metricValues?.find(mv => mv.metric === name);
      return m ? Math.round(m.value * 1000) / 1000 : null;
    };

    const processWorkout = (workout) => {
      const exercises = workout?.exercises || [];
      const allSets = [];

      exercises.forEach(ex => {
        (ex.series || []).forEach(serie => {
          const concentric = (serie.repetitions || []).filter(r => r.type === "concentric");
          if (!concentric.length) return;
          const peakVels = concentric.map(r => getMetric(r.metricValues, "Peak Velocity")).filter(Boolean);
          const meanVels = concentric.map(r => getMetric(r.metricValues, "Mean Velocity")).filter(Boolean);
          const weight = getMetric(concentric[0]?.metricValues, "Weight");
          const oneRM = getMetric(concentric[concentric.length - 1]?.metricValues, "1RM");
          const fatigue = getMetric(concentric[concentric.length - 1]?.metricValues, "Fatigue (PV)") ||
                          getMetric(concentric[concentric.length - 1]?.metricValues, "Fatigue [MPV]");
          const avgPeak = peakVels.length ? Math.round((peakVels.reduce((a,b)=>a+b,0)/peakVels.length)*100)/100 : null;
          const avgMean = meanVels.length ? Math.round((meanVels.reduce((a,b)=>a+b,0)/meanVels.length)*100)/100 : null;
          const loadLbs = weight ? Math.round(weight * 2.20462) : null;
          const oneRMLbs = oneRM ? Math.round(oneRM * 2.20462) : null;

          allSets.push({
            exercise: ex.name,
            load: loadLbs,
            peakVelocity: avgPeak,
            meanVelocity: avgMean,
            reps: concentric.length,
            oneRM: oneRMLbs,
            fatigue: fatigue,
          });
        });
      });

      return {
        date: workout?.completedAt?.split("T")[0] || null,
        exercise: exercises[0]?.name || "VBT Workout",
        sets: allSets,
        oneRM: allSets.find(s => s.oneRM)?.oneRM || null,
        bestPeak: allSets.length ? Math.max(...allSets.map(s => s.peakVelocity || 0)) : null,
        bestMean: allSets.length ? Math.max(...allSets.map(s => s.meanVelocity || 0)) : null,
        fatigue: allSets[allSets.length - 1]?.fatigue || null,
      };
    };

    const latest = processWorkout(workouts[0]);
    const history = workouts.slice(0, 10).map(processWorkout);

    return res.status(200).json({ connected: true, latest, history });

  } catch (e) {
    return res.status(200).json({ error: "Failed to connect to Vitruve", message: e.message });
  }
}
