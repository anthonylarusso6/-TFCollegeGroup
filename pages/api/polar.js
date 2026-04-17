export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "No token" });

  try {
    // Try the most basic endpoint first — get user info to confirm token works
    const userRes = await fetch("https://www.polaraccesslink.com/v3/users/me", {
      headers: {
        "Authorization": "Bearer " + token,
        "Accept": "application/json",
      },
    });

    if (!userRes.ok) {
      return res.status(200).json({ 
        error: "Token invalid or expired", 
        status: userRes.status,
        connected: false 
      });
    }

    const user = await userRes.json();

    // Try listing exercises directly with date range
    const now = new Date();
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const from = monthAgo.toISOString().split("T")[0];
    const to = now.toISOString().split("T")[0];

    // Try pull notifications first
    const pullRes = await fetch("https://www.polaraccesslink.com/v3/notifications", {
      headers: {
        "Authorization": "Bearer " + token,
        "Accept": "application/json",
      },
    });
    const pullData = pullRes.ok ? await pullRes.json() : null;

    // Try exercises endpoint
    const exRes = await fetch(`https://www.polaraccesslink.com/v3/exercises`, {
      headers: {
        "Authorization": "Bearer " + token,
        "Accept": "application/json",
      },
    });
    const exData = exRes.ok ? await exRes.json() : { status: exRes.status };

    // Try training data endpoint
    const trainRes = await fetch(`https://www.polaraccesslink.com/v3/users/${user.polar_user_id}/exercise-transactions`, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Accept": "application/json",
      },
    });
    const trainData = trainRes.ok ? await trainRes.json() : { status: trainRes.status, text: await trainRes.text() };

    return res.status(200).json({
      debug: true,
      connected: true,
      user: { id: user.polar_user_id, name: user.first_name },
      pullNotifications: pullData,
      exercises: exData,
      transactionResult: trainData,
    });

  } catch (e) {
    return res.status(200).json({ error: e.message, connected: true });
  }
}
