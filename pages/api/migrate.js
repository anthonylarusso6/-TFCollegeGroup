// TEMPORARY — deleted after one run
import { Client } from "pg";

const SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsdXVvaWJ1aGt4dWticW9kZmV0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkzNjg2NiwiZXhwIjoyMDkxNTEyODY2fQ.b4B4Lz2c1lsb7Oj75BB-Jtri7YPTUMO1eJxN1wTV3qo";

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
GRANT ALL ON motivational_photo TO anon, authenticated, service_role;
GRANT ALL ON music_votes TO anon, authenticated, service_role;
`;

const HOSTS = [
  { host: "2600:1f18:2e13:9d45:1bd8:ad12:48ba:1fd6", port: 5432, user: "postgres", password: SK },
  { host: "db.kluuoibuhkxukbqodfet.supabase.co", port: 5432, user: "postgres", password: SK },
  { host: "aws-0-us-east-1.pooler.supabase.com", port: 5432, user: "postgres.kluuoibuhkxukbqodfet", password: SK },
  { host: "aws-0-us-east-1.pooler.supabase.com", port: 6543, user: "postgres.kluuoibuhkxukbqodfet", password: SK },
];

export default async function handler(req, res) {
  if (req.headers["x-migrate-secret"] !== "tf2026migrate")
    return res.status(401).json({ error: "unauthorized" });

  const log = [];

  for (const cfg of HOSTS) {
    const c = new Client({ ...cfg, database: "postgres", ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
    try {
      await c.connect();
      await c.query(SQL);
      await c.end();
      return res.json({ ok: true, via: `${cfg.host}:${cfg.port}` });
    } catch (e) {
      log.push(`${cfg.host}:${cfg.port} — ${e.message}`);
      try { await c.end(); } catch (_) {}
    }
  }

  return res.status(500).json({ ok: false, log });
}
