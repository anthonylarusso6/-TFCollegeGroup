import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://kluuoibuhkxukbqodfet.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsdXVvaWJ1aGt4dWticW9kZmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzY4NjYsImV4cCI6MjA5MTUxMjg2Nn0.0LeTTeFYeSiv7JAH6P-QmfAU8pQALZZRt5zWmW2s5-M"
);

const CLIENT_ID = "d2759b37-57d2-4f8b-8d4a-b12a13288f4b";
const CLIENT_SECRET = "2b1a2a4d-5a55-452c-9bb9-ef92a0d4e0fe";

export default async function handler(req, res) {
  const { code, state } = req.query;
  if (!code) return res.status(400).json({ error: "No code" });

  try {
    // Exchange code for token SERVER-SIDE (no CORS issues)
    const tokenRes = await fetch("https://polarremote.com/v2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: "https://tfcollegegroup.com/callback",
      }),
    });

    const data = await tokenRes.json();
    console.log("Polar token response:", JSON.stringify(data));

    if (!data.access_token) {
      return res.status(200).json({ error: "No access token", raw: data });
    }

    // Register user with Polar Access Link
    await fetch("https://www.polaraccesslink.com/v3/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + data.access_token,
      },
      body: JSON.stringify({ "member-id": state }),
    });

    // Save to Supabase
    if (state) {
      await supabase.from("athletes").update({
        polar_token: data.access_token,
        polar_refresh_token: data.refresh_token || null,
      }).eq("id", state);
    }

    return res.status(200).json({
      success: true,
      hasRefreshToken: !!data.refresh_token,
      expiresIn: data.expires_in,
    });

  } catch (e) {
    return res.status(200).json({ error: e.message });
  }
}
