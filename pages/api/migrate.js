// TEMPORARY — will be deleted after one-time migration run
import { Client } from "pg";

const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsdXVvaWJ1aGt4dWticW9kZmV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkzNjg2NiwiZXhwIjoyMDkxNTEyODY2fQ.b4B4Lz2c1lsb7Oj75BB-Jtri7YPTUMO1eJxN1wTV3qo";

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

const ATTEMPTS = [
  // IPv6 direct — Supabase DB resolves to IPv6 only
  { host: "2600:1f18:2e13:9d45:1bd8:ad12:48ba:1fd6", port: 5432, user: "postgres", password: SERVICE_KEY },
  { host: "db.kluuoibuhkxukbqodfet.supabase.co", port: 5432, user: "postgres", password: SERVICE_KEY },
  // Pooler — us-east-1
  { host: "aws-0-us-east-1.pooler.supabase.com", port: 5432, user: "postgres.kluuoibuhkxukbqodfet", password: SERVICE_KEY },
  { host: "aws-0-us-east-1.pooler.supabase.com", port: 6543, user: "postgres.kluuoibuhkxukbqodfet", password: SERVICE_KEY },
  { host: "aws-0-us-east-1.pooler.supabase.com", port: 5432, user: "postgres", password: SERVICE_KEY },
  { host: "aws-0-us-east-1.pooler.supabase.com", port: 6543, user: "postgres", password: SERVICE_KEY },
];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (req.headers["x-migrate-secret"] !== "tf2026migrate")
    return res.status(401).json({ error: "unauthorized" });

  const errors = [];

  for (const cfg of ATTEMPTS) {
    const client = new Client({
      ...cfg,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 6000,
    });
    try {
      await client.connect();
      const ver = await client.query("SELECT current_user, version()");
      await client.query(SQL);
      await client.end();
      return res.json({ status: "success", cfg, user: ver.rows[0] });
    } catch (e) {
      errors.push(`${cfg.host}:${cfg.port}(${cfg.user}) — ${e.message}`);
      try { await client.end(); } catch (_) {}
    }
  }

  return res.status(500).json({ status: "failed", errors });
}
