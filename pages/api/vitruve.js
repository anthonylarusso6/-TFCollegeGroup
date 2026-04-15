export default async function handler(req, res) {
  const API_KEY = "ba1b08b4-6c4d-46fc-8ecc-d108ca3402d5";
  const { athleteName, date = "all", vitruveId } = req.query;

  try {
    const [currentRes, weekRes] = await Promise.all([
      fetch(`https://api-exports.vitruve.fit/vbt-workouts?date=${date}&limit=50`, {
        headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
      }),
      fetch(`https://api-exports.vitruve.fit/vbt-workouts?date=this-week&limit=50`, {
        headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
      }),
    ]);

    if (!currentRes.ok) return res.status(200).json({ error: "Could not fetch Vitruve data" });

    const data = await currentRes.json();
    const weekData = await weekRes.json();

    let workouts = data?.data || data?.workouts || data || [];
    let weekWorkouts = weekData?.data || weekData?.workouts || weekData || [];

    // Filter by vitruveId or name
    const filter = (list) => {
      if (vitruveId) {
        const f = list.filter(w => w?.userId === vitruveId);
        if (f.length) return f;
      }
      if (athleteName) {
        const f = list.filter(w =>
          (w?.athlete_name || w?.athlete || w?.user_name || w?.name || "")
          .toLowerCase().includes(athleteName.toLowerCase())
        );
        if (f.length) return f;
      }
      return list;
    };

    workouts = filter(workouts);
    weekWorkouts = filter(weekWorkouts);

    if (!workouts.length) return res.status(200).json({ noData: true });

    // Sort newest first
    workouts.sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));

    // Deduplicate by date + exercise
    const seen = new Set();
    const unique = [];
    for (const w of workouts) {
      for (const ex of (w?.exercises || [])) {
        const key = (w.completedAt || "").split("T")[0] + "-" + ex.name;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push({ ...w, exercises: [ex] });
        }
      }
    }

    const getMetric = (mvs, name) => {
      const m = mvs?.find(mv => mv.metric === name);
      return m ? Math.round(m.value * 1000) / 1000 : null;
    };

    const processWorkout = (w) => {
      const ex = w?.exercises?.[0];
      if (!ex) return null;
      const allSets = [];
      const allReps = [];

      for (const serie of (ex.series || [])) {
        const concentric = (serie.repetitions || []).filter(r => r.type === "concentric");
        if (!concentric.length) continue;

        const repData = concentric.map((r, ri) => ({
          rep: ri + 1,
          peak: Math.round((getMetric(r.metricValues, "Peak Velocity") || 0) * 100) / 100,
          mean: Math.round((getMetric(r.metricValues, "Mean Velocity") || 0) * 100) / 100,
          oneRM: getMetric(r.metricValues, "1RM"),
        }));

        // Mark best rep
        const bestPeakVal = Math.max(...repData.map(r => r.peak));
        repData.forEach(r => { r.isBest = r.peak === bestPeakVal; });

        const peakVels = repData.map(r => r.peak).filter(Boolean);
        const meanVels = repData.map(r => r.mean).filter(Boolean);
        const weight = getMetric(concentric[0]?.metricValues, "Weight");
        const oneRM = repData.find(r => r.oneRM)?.oneRM;
        const fatigue = getMetric(concentric[concentric.length - 1]?.metricValues, "Fatigue (PV)") ||
                        getMetric(concentric[concentric.length - 1]?.metricValues, "Fatigue [MPV]");

        const avgPeak = peakVels.length ? Math.round(peakVels.reduce((a, b) => a + b, 0) / peakVels.length * 100) / 100 : null;
        const avgMean = meanVels.length ? Math.round(meanVels.reduce((a, b) => a + b, 0) / meanVels.length * 100) / 100 : null;
        const loadLbs = weight ? Math.round(weight * 2.20462) : null;
        const oneRMLbs = oneRM ? Math.round(oneRM * 2.20462) : null;

        allSets.push({
          load: loadLbs,
          peakVelocity: avgPeak,
          meanVelocity: avgMean,
          reps: concentric.length,
          oneRM: oneRMLbs,
          fatigue,
          repData,
        });
        allReps.push(...repData);
      }

      const bestPeak = allSets.length ? Math.max(...allSets.map(s => s.peakVelocity || 0)) : 0;
      const bestMean = allSets.length ? Math.max(...allSets.map(s => s.meanVelocity || 0)) : 0;
      const topOneRM = allSets.find(s => s.oneRM)?.oneRM || 0;
      const totalReps = allSets.reduce((n, s) => n + (s.reps || 0), 0);
      const maxLoad = Math.max(...allSets.map(s => s.load || 0));
      const lastFatigue = allSets[allSets.length - 1]?.fatigue || null;

      // Session score — based on velocity consistency and fatigue
      const velocities = allSets.map(s => s.peakVelocity || 0).filter(Boolean);
      let score = 7;
      if (velocities.length > 1) {
        const drop = (velocities[0] - velocities[velocities.length - 1]) / velocities[0] * 100;
        if (drop < 5) score = 9;
        else if (drop < 10) score = 8;
        else if (drop < 20) score = 7;
        else if (drop < 30) score = 6;
        else score = 5;
      }
      if (lastFatigue > 30) score = Math.max(4, score - 1);

      return {
        date: (w.completedAt || "").split("T")[0],
        exercise: ex.name,
        sets: allSets,
        bestPeak,
        bestMean,
        oneRM: topOneRM,
        totalReps,
        maxLoad,
        fatigue: lastFatigue,
        score: Math.round(score * 10) / 10,
      };
    };

    const history = unique.slice(0, 20).map(processWorkout).filter(Boolean);
    const latest = history[0] || null;

    // Previous session of same exercise for comparison
    let prevSame = null;
    if (latest) {
      const sameEx = history.slice(1).find(h => h.exercise === latest.exercise);
      if (sameEx) {
        prevSame = { peak: sameEx.bestPeak, oneRM: sameEx.oneRM };
      }
    }

    // Weekly volume
    const weekUnique = [];
    const weekSeen = new Set();
    for (const w of filter(weekWorkouts).sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))) {
      for (const ex of (w?.exercises || [])) {
        const key = (w.completedAt || "").split("T")[0] + "-" + ex.name;
        if (!weekSeen.has(key)) {
          weekSeen.add(key);
          weekUnique.push({ ...w, exercises: [ex] });
        }
      }
    }
    const weekProcessed = weekUnique.map(processWorkout).filter(Boolean);
    const weekVolume = {
      sessions: weekProcessed.length,
      sets: weekProcessed.reduce((n, w) => n + (w.sets?.length || 0), 0),
      reps: weekProcessed.reduce((n, w) => n + (w.totalReps || 0), 0),
      lbs: weekProcessed.reduce((n, w) => n + (w.sets || []).reduce((a, s) => a + ((s.load || 0) * (s.reps || 0)), 0), 0),
    };

    // Debug — show raw userIds
    const rawIds=workouts.slice(0,3).map(w=>({userId:w.userId,keys:Object.keys(w)}));
    return res.status(200).json({
      connected: true,
      latest,
      history: history.slice(1),
      prevSame,
      weekVolume,
      rawIds,
    });

  } catch (e) {
    return res.status(200).json({ error: "Failed to connect to Vitruve", message: e.message });
  }
}
