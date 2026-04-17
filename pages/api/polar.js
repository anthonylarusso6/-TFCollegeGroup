import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://kluuoibuhkxukbqodfet.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsdXVvaWJ1aGt4dWticW9kZmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzY4NjYsImV4cCI6MjA5MTUxMjg2Nn0.0LeTTeFYeSiv7JAH6P-QmfAU8pQALZZRt5zWmW2s5-M"
);

const CLIENT_ID = "d2759b37-57d2-4f8b-8d4a-b12a13288f4b";
const CLIENT_SECRET = "2b1a2a4d-5a55-452c-9bb9-ef92a0d4e0fe";

async function refreshPolarToken(refreshToken, athleteId) {
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
  await supabase.from("athletes").update({
    polar_token: data.access_token,
    polar_refresh_token: data.refresh_token || refreshToken,
  }).eq("id", athleteId);
  return data.access_token;
}

export default async function handler(req, res) {
  const { token, athleteId, refreshToken } = req.query;
  if (!token) return res.status(400).json({ error: "No token" });

  let activeToken = token;

  try {
    // Step 1 — verify token
    const checkRes = await fetch("https://www.polaraccesslink.com/v3/users/me", {
      headers: { "Authorization": "Bearer " + activeToken, "Accept": "application/json" },
    });

    // Token expired — try refresh
    if (checkRes.status === 401) {
      if (refreshToken && athleteId) {
        const newToken = await refreshPolarToken(refreshToken, athleteId);
        if (newToken) {
          activeToken = newToken;
        } else {
          return res.status(200).json({ tokenExpired: true, connected: false });
        }
      } else {
        return res.status(200).json({ tokenExpired: true, connected: false });
      }
    }

    const user = checkRes.ok ? await checkRes.json() : null;
    const polarUserId = user?.polar_user_id;

    // Step 2 — create exercise transaction to pull new workouts
    let exercises = [];
    let txStatus = "not tried";

    if (polarUserId) {
      const txRes = await fetch(`https://www.polaraccesslink.com/v3/users/${polarUserId}/exercise-transactions`, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + activeToken,
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      });
      txStatus = txRes.status;

      if (txRes.ok) {
        const tx = await txRes.json();
        const txId = tx?.transaction_id;
        if (txId) {
          const listRes = await fetch(`https://www.polaraccesslink.com/v3/users/${polarUserId}/exercise-transactions/${txId}`, {
            headers: { "Authorization": "Bearer " + activeToken, "Accept": "application/json" },
          });
          if (listRes.ok) {
            const listData = await listRes.json();
            exercises = listData?.exercises || [];
          }
          // Commit transaction
          await fetch(`https://www.polaraccesslink.com/v3/users/${polarUserId}/exercise-transactions/${txId}`, {
            method: "PUT",
            headers: { "Authorization": "Bearer " + activeToken },
          });
        }
      }
    }

    if (!exercises || exercises.length === 0) {
      return res.status(200).json({ 
        connected: true, 
        noData: true,
        debug: { polarUserId, txStatus }
      });
    }

    // Step 3 — get latest exercise detail
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
    return res.status(200).json({ error: e.message, stack: e.stack?.slice(0,200) });
  }
}
