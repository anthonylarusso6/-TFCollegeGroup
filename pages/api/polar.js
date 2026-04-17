export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "No token" });

  try {
    // Step 1 — create a pull notification transaction to get new data
    const txRes = await fetch("https://www.polaraccesslink.com/v3/users/transaction", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });

    // Step 2 — try to list exercises from the transaction
    let exercises = [];

    if (txRes.ok) {
      const tx = await txRes.json();
      const txId = tx?.transaction_id;
      if (txId) {
        const listRes = await fetch(`https://www.polaraccesslink.com/v3/users/transaction/${txId}/exercises`, {
          headers: { "Authorization": "Bearer " + token, "Accept": "application/json" },
        });
        if (listRes.ok) {
          const listData = await listRes.json();
          exercises = listData?.exercises || [];
        }
        // Commit the transaction
        await fetch(`https://www.polaraccesslink.com/v3/users/transaction/${txId}`, {
          method: "PUT",
          headers: { "Authorization": "Bearer " + token },
        });
      }
    }

    // Step 3 — fallback: try the continuous data endpoint for recent training data
    if (exercises.length === 0) {
      const now = new Date();
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const from = weekAgo.toISOString().split("T")[0];
      const to = now.toISOString().split("T")[0];

      const contRes = await fetch(
        `https://www.polaraccesslink.com/v3/exercises?from=${from}&to=${to}`,
        {
          headers: {
            "Authorization": "Bearer " + token,
            "Accept": "application/json",
          },
        }
      );

      if (contRes.ok) {
        const contData = await contRes.json();
        exercises = contData?.data || contData?.exercises || [];
      }
    }

    if (!exercises || exercises.length === 0) {
      return res.status(200).json({ connected: true, noData: true });
    }

    // Get detail of most recent exercise
    const latestUrl = typeof exercises[0] === "string" ? exercises[0] : exercises[0]?.url || exercises[0]?.id;

    if (!latestUrl) return res.status(200).json({ connected: true, noData: true });

    const detailRes = await fetch(latestUrl, {
      headers: {
        "Authorization": "Bearer " + token,
        "Accept": "application/json",
      },
    });

    if (!detailRes.ok) return res.status(200).json({ connected: true, noData: true });

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
    return res.status(200).json({ error: "Failed: " + e.message, connected: true });
  }
}
