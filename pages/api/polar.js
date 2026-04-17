import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://kluuoibuhkxukbqodfet.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsdXVvaWJ1aGt4dWticW9kZmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzY4NjYsImV4cCI6MjA5MTUxMjg2Nn0.0LeTTeFYeSiv7JAH6P-QmfAU8pQALZZRt5zWmW2s5-M"
);

const CLIENT_ID = "d2759b37-57d2-4f8b-8d4a-b12a13288f4b";
const CLIENT_SECRET = "2b1a2a4d-5a55-452c-9bb9-ef92a0d4e0fe";

function parseDuration(iso) {
  if (!iso) return null;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return iso;
  const h = m[1] ? m[1].padStart(2,'0') : '00';
  const min = m[2] ? m[2].padStart(2,'0') : '00';
  const s = m[3] ? m[3].padStart(2,'0') : '00';
  return `${h}:${min}:${s}`;
}

export default async function handler(req, res) {
  const { token, athleteId, refreshToken } = req.query;
  if (!token) return res.status(400).json({ error: "No token" });

  try {
    // Verify token first
    const checkRes = await fetch("https://www.polaraccesslink.com/v3/users/me", {
      headers: { "Authorization": "Bearer " + token, "Accept": "application/json" },
    });

    if (checkRes.status === 401) {
      return res.status(200).json({ tokenExpired: true, connected: false });
    }

    const user = await checkRes.json();
    const polarUserId = user?.polar_user_id;

    // Try 1: exercise-transactions (personal device workouts)
    let exerciseData = null;
    if (polarUserId) {
      const txRes = await fetch(
        `https://www.polaraccesslink.com/v3/users/${polarUserId}/exercise-transactions`,
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + token,
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (txRes.ok) {
        const tx = await txRes.json();
        const txId = tx?.transaction_id;
        if (txId) {
          const listRes = await fetch(
            `https://www.polaraccesslink.com/v3/users/${polarUserId}/exercise-transactions/${txId}`,
            { headers: { "Authorization": "Bearer " + token, "Accept": "application/json" } }
          );
          if (listRes.ok) {
            const listData = await listRes.json();
            const exercises = listData?.exercises || [];
            if (exercises.length > 0) {
              const detailRes = await fetch(exercises[0], {
                headers: { "Authorization": "Bearer " + token, "Accept": "application/json" },
              });
              if (detailRes.ok) exerciseData = await detailRes.json();
            }
          }
          // Commit
          await fetch(
            `https://www.polaraccesslink.com/v3/users/${polarUserId}/exercise-transactions/${txId}`,
            { method: "PUT", headers: { "Authorization": "Bearer " + token } }
          );
        }
      }
    }

    // Try 2: training-data transactions (Polar Club / group training)
    if (!exerciseData && polarUserId) {
      const tdRes = await fetch(
        `https://www.polaraccesslink.com/v3/users/${polarUserId}/training-data/transaction`,
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + token,
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (tdRes.ok) {
        const td = await tdRes.json();
        const txId = td?.transaction_id;
        if (txId) {
          const listRes = await fetch(
            `https://www.polaraccesslink.com/v3/users/${polarUserId}/training-data/transaction/${txId}`,
            { headers: { "Authorization": "Bearer " + token, "Accept": "application/json" } }
          );
          if (listRes.ok) {
            const listData = await listRes.json();
            const exercises = listData?.exercises || [];
            if (exercises.length > 0) {
              const detailRes = await fetch(exercises[0], {
                headers: { "Authorization": "Bearer " + token, "Accept": "application/json" },
              });
              if (detailRes.ok) exerciseData = await detailRes.json();
            }
          }
          // Commit
          await fetch(
            `https://www.polaraccesslink.com/v3/users/${polarUserId}/training-data/transaction/${txId}`,
            { method: "PUT", headers: { "Authorization": "Bearer " + token } }
          );
        }
      }
    }

    if (!exerciseData) {
      return res.status(200).json({ 
        connected: true, 
        noData: true,
        userId: polarUserId,
      });
    }

    return res.status(200).json({
      connected: true,
      avgHr: exerciseData?.heart_rate?.average || null,
      maxHr: exerciseData?.heart_rate?.maximum || null,
      minHr: exerciseData?.heart_rate?.minimum || null,
      calories: exerciseData?.calories || null,
      duration: parseDuration(exerciseData?.duration) || null,
      date: exerciseData?.start_time?.split("T")[0] || null,
      sport: exerciseData?.detailed_sport_info || exerciseData?.sport || null,
      zone1: exerciseData?.heart_rate_zones?.zone1?.inzone || null,
      zone2: exerciseData?.heart_rate_zones?.zone2?.inzone || null,
      zone3: exerciseData?.heart_rate_zones?.zone3?.inzone || null,
      zone4: exerciseData?.heart_rate_zones?.zone4?.inzone || null,
      zone5: exerciseData?.heart_rate_zones?.zone5?.inzone || null,
    });

  } catch (e) {
    return res.status(200).json({ error: e.message, connected: true });
  }
}
