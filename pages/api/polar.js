const CLIENT_ID = "d2759b37-57d2-4f8b-8d4a-b12a13288f4b";
const CLIENT_SECRET = "2b1a2a4d-5a55-452c-9bb9-ef92a0d4e0fe";

function parseDuration(iso) {
  if (!iso) return null;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return iso;
  const h = parseInt(m[1]||0), min = parseInt(m[2]||0), s = parseInt(m[3]||0);
  return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "No token" });

  try {
    // Verify token
    const checkRes = await fetch("https://www.polaraccesslink.com/v3/users/me", {
      headers: { "Authorization": "Bearer " + token, "Accept": "application/json" },
    });

    if (checkRes.status === 401) {
      return res.status(200).json({ tokenExpired: true, connected: false });
    }

    const user = await checkRes.json();
    const polarUserId = user?.polar_user_id;

    // Try the nightly data endpoint — no transactions, just list recent exercises
    const now = new Date();
    const from = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const to = now.toISOString().split("T")[0];

    // Try exercises list (non-transaction based)
    const exRes = await fetch(
      `https://www.polaraccesslink.com/v3/exercises?from=${from}&to=${to}`,
      { headers: { "Authorization": "Bearer " + token, "Accept": "application/json" } }
    );

    let exercises = [];
    if (exRes.ok) {
      const exData = await exRes.json();
      exercises = exData?.data || exData?.exercises || [];
    }

    // Also try v3/users/{id}/exercises
    if (exercises.length === 0 && polarUserId) {
      const ex2Res = await fetch(
        `https://www.polaraccesslink.com/v3/users/${polarUserId}/exercises?from=${from}&to=${to}`,
        { headers: { "Authorization": "Bearer " + token, "Accept": "application/json" } }
      );
      if (ex2Res.ok) {
        const ex2Data = await ex2Res.json();
        exercises = ex2Data?.data || ex2Data?.exercises || [];
      }
    }

    if (!exercises || exercises.length === 0) {
      // Return connected with user info so we know token works
      return res.status(200).json({ 
        connected: true, 
        noData: true,
        userId: polarUserId,
        name: user?.first_name,
      });
    }

    // Get most recent
    const latest = exercises[exercises.length - 1];
    const url = typeof latest === "string" ? latest : latest?.url || latest?.href;
    if (!url) return res.status(200).json({ connected: true, noData: true });

    const detailRes = await fetch(url, {
      headers: { "Authorization": "Bearer " + token, "Accept": "application/json" },
    });
    if (!detailRes.ok) return res.status(200).json({ connected: true, noData: true });

    const d = await detailRes.json();

    return res.status(200).json({
      connected: true,
      avgHr: d?.heart_rate?.average || null,
      maxHr: d?.heart_rate?.maximum || null,
      minHr: d?.heart_rate?.minimum || null,
      calories: d?.calories || null,
      duration: parseDuration(d?.duration) || null,
      date: d?.start_time?.split("T")[0] || null,
      sport: d?.detailed_sport_info || d?.sport || null,
      zone1: d?.heart_rate_zones?.zone1?.inzone || null,
      zone2: d?.heart_rate_zones?.zone2?.inzone || null,
      zone3: d?.heart_rate_zones?.zone3?.inzone || null,
      zone4: d?.heart_rate_zones?.zone4?.inzone || null,
      zone5: d?.heart_rate_zones?.zone5?.inzone || null,
    });

  } catch (e) {
    return res.status(200).json({ error: e.message, connected: true });
  }
}
