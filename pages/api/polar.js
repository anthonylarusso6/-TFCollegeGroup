import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://kluuoibuhkxukbqodfet.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsdXVvaWJ1aGt4dWticW9kZmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzY4NjYsImV4cCI6MjA5MTUxMjg2Nn0.0LeTTeFYeSiv7JAH6P-QmfAU8pQALZZRt5zWmW2s5-M"
);

const CLIENT_ID = "d2759b37-57d2-4f8b-8d4a-b12a13288f4b";
const CLIENT_SECRET = "2b1a2a4d-5a55-452c-9bb9-ef92a0d4e0fe";

async function refreshToken(refreshToken, athleteId) {
  const res = await fetch("https://polarremote.com/v2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.access_token) return null;
  // Save new tokens to Supabase
  await supabase.from("athletes").update({
    polar_token: data.access_token,
    polar_refresh_token: data.refresh_token || refreshToken,
  }).eq("id", athleteId);
  return data.access_token;
}

async function fetchExercises(token) {
  // Try creating an exercise transaction to pull new workouts
  const txRes = await fetch("https://www.polaraccesslink.com/v3/users/transaction", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Accept": "application/json",
    },
  });

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
      // Commit transaction
      await fetch(`https://www.polaraccesslink.com/v3/users/transaction/${txId}`, {
        method: "PUT",
        headers: { "Authorization": "Bearer " + token },
      });
    }
  }

  // Fallback — try the exercises list endpoint
  if (exercises.length === 0) {
    const exRes = await fetch("https://www.polaraccesslink.com/v3/exercises", {
      headers: { "Authorization": "Bearer " + token, "Accept": "application/json" },
    });
    if (exRes.ok) {
      const exData = await exRes.json();
      exercises = exData?.data || exData?.exercises || [];
    }
  }

  return exercises;
}

export default async function handler(req, res) {
  const { token, athleteId, refreshToken: rToken } = req.query;
  if (!token) return res.status(400).json({ error: "No token" });

  let activeToken = token;

  try {
    // Check if token is valid first
    const checkRes = await fetch("https://www.polaraccesslink.com/v3/users/me", {
      headers: { "Authorization": "Bearer " + activeToken, "Accept": "application/json" },
    });

    // Token expired — try to refresh
    if (checkRes.status === 401 && rToken && athleteId) {
      const newToken = await refreshToken(rToken, athleteId);
      if (!newToken) {
        return res.status(200).json({ tokenExpired: true, connected: false });
      }
      activeToken = newToken;
    } else if (checkRes.status === 401) {
      return res.status(200).json({ tokenExpired: true, connected: false });
    }

    const user = await checkRes.json();

    // Fetch exercises
    const exercises = await fetchExercises(activeToken);

    if (!exercises || exercises.length === 0) {
      return res.status(200).json({ connected: true, noData: true });
    }

    // Get most recent exercise detail
    const latestUrl = typeof exercises[0] === "string" ? exercises[0] : exercises[0]?.url || exercises[0]?.href;
    if (!latestUrl) return res.status(200).json({ connected: true, noData: true });

    const detailRes = await fetch(latestUrl, {
      headers: { "Authorization": "Bearer " + activeToken, "Accept": "application/json" },
    });
    if (!detailRes.ok) return res.status(200).json({ connected: true, noData: true });

    const detail = await detailRes.json();

    return res.status(200).json({
      connected: true,
      newToken: activeToken !== token ? activeToken : null,
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
    return res.status(200).json({ error: e.message, connected: true });
  }
}
