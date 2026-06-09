import { Pool } from "pg";

const SECRET = "TFCG_HABIT_MIGRATE_2026";

const SQL = `
  CREATE TABLE IF NOT EXISTS public.habit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id int8 NOT NULL,
    date date NOT NULL,
    water bool,
    nutrition bool,
    sleep numeric,
    created_at timestamptz DEFAULT now(),
    UNIQUE(athlete_id, date)
  );
`;

async function tryConnect(connStr) {
  const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
  try {
    await pool.query(SQL);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    await pool.end().catch(() => {});
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (req.body?.secret !== SECRET) return res.status(401).json({ error: "Unauthorized" });

  const ref = "kluuoibuhkxukbqodfet";
  const svcKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const tried = [];

  // Standard Vercel integration env vars
  for (const env of ["POSTGRES_URL_NON_POOLING", "POSTGRES_URL", "DATABASE_URL"]) {
    if (process.env[env]) {
      const result = await tryConnect(process.env[env]);
      if (result.ok) return res.status(200).json({ ok: true, via: env });
      tried.push({ env, error: result.error });
    }
  }

  // Supabase Supavisor pooler — JWT auth (service key as password)
  // Try common AWS regions
  const regions = ["us-east-1", "us-west-2", "eu-central-1", "ap-southeast-1", "ap-northeast-1"];
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    // Session mode (port 5432) — required for DDL
    const connStr = `postgresql://postgres.${ref}:${svcKey}@${host}:5432/postgres`;
    const result = await tryConnect(connStr);
    if (result.ok) return res.status(200).json({ ok: true, via: `pooler-${region}` });
    tried.push({ env: `pooler-${region}`, error: result.error });
  }

  // Direct connection fallback
  const direct = `postgresql://postgres.${ref}:${svcKey}@db.${ref}.supabase.co:5432/postgres`;
  const directResult = await tryConnect(direct);
  if (directResult.ok) return res.status(200).json({ ok: true, via: "direct" });
  tried.push({ env: "direct", error: directResult.error });

  return res.status(500).json({ error: "All connection attempts failed", tried });
}
