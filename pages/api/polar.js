export default async function handler(req, res) {
  const { token, athleteId } = req.query;
  if (!token) return res.status(400).json({ error: "No token" });

  try {
    // Create transaction to get latest data
    const txRes = await fetch("https://www.polaraccesslink.com/v3/exercises", {
      headers: {
        "Authorization": "Bearer " + token,
        "Accept": "application/json",
      },
    });

    if (!txRes.ok) {
      return res.status(200).json({ error: "No data yet", connected: true });
    }

    const data = await txRes.json();
    const exercises = data?.data || [];

    if (exercises.length === 0) {
      return res.status(200).json({ connected: true, noData: true });
    }

    // Get most recent exercise
    const latest = exercises[0];
    const detailRes = await fetch(latest, {
      headers: {
        "Authorization": "Bearer " + token,
        "Accept": "application/json",
      },
    });
    const detail = await detailRes.json();

    return res.status(200).json({
      connected: true,
      avgHr: detail?.heart_rate?.average || null,
      maxHr: detail?.heart_rate?.maximum || null,
      calories: detail?.calories || null,
      duration: detail?.duration || null,
      date: detail?.start_time?.split("T")[0] || null,
     sport: detail?.detailed_sport_info || detail?.sport || null,
      zone1: detail?.heart_rate_zones?.zone1?.inzone || null,
      zone2: detail?.heart_rate_zones?.zone2?.inzone || null,
      zone3: detail?.heart_rate_zones?.zone3?.inzone || null,
      zone4: detail?.heart_rate_zones?.zone4?.inzone || null,
      zone5: detail?.heart_rate_zones?.zone5?.inzone || null,
    });

  } catch (e) {
    return res.status(200).json({ error: "Failed to fetch Polar data", connected: true });
  }
}
