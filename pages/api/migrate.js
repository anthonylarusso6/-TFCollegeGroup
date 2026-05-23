// TEMPORARY — will be deleted after one-time migration run
import { Client } from "pg";

const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsdXVvaWJ1aGt4dWticW9kZmV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkzNjg2NiwiZXhwIjoyMDkxNTEyODY2fQ.b4B4Lz2c1lsb7Oj75BB-Jtri7YPTUMO1eJxN1wTV3qo";

const REGIONS = ["us-east-1", "us-west-1", "us-east-2", "eu-west-1", "ap-southeast-1"];

const SQL = `
  CREATE TABLE IF NOT EXISTS music_votes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    athlete_id uuid REFERENCES athletes(id),
    class_date text NOT NULL,
    genre text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(athlete_id, class_date)
  );

  CREATE TABLE IF NOT EXISTS motivational_photo (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_url text,
    caption text,
    week_label text,
    created_at timestamptz DEFAULT now()
  );
`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (req.headers["x-migrate-secret"] !== "tf2026migrate")
    return res.status(401).json({ error: "unauthorized" });

  const errors = [];

  // Try each region's connection pooler
  for (const region of REGIONS) {
    for (const port of [5432, 6543]) {
      const client = new Client({
        host: `aws-0-${region}.pooler.supabase.com`,
        port,
        database: "postgres",
        user: `postgres.kluuoibuhkxukbqodfet`,
        password: SERVICE_KEY,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });
      try {
        await client.connect();
        await client.query(SQL);
        await client.end();
        return res.json({ status: "success", region, port });
      } catch (e) {
        errors.push(`${region}:${port} — ${e.message}`);
        try { await client.end(); } catch (_) {}
      }
    }
  }

  // Also try direct host
  const direct = new Client({
    host: `db.kluuoibuhkxukbqodfet.supabase.co`,
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: SERVICE_KEY,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });
  try {
    await direct.connect();
    await direct.query(SQL);
    await direct.end();
    return res.json({ status: "success", via: "direct" });
  } catch (e) {
    errors.push(`direct — ${e.message}`);
    try { await direct.end(); } catch (_) {}
  }

  return res.status(500).json({ status: "failed", errors });
}
