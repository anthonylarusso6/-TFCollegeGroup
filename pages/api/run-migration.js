import { Pool } from "pg";

const SECRET = "TFCG_HABIT_MIGRATE_2026";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (req.body?.secret !== SECRET) return res.status(401).json({ error: "Unauthorized" });

  const connStr =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    null;

  if (!connStr) {
    return res.status(500).json({
      error: "No database connection string found in env",
      checked: ["POSTGRES_URL_NON_POOLING", "POSTGRES_URL", "DATABASE_URL"],
    });
  }

  const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
  try {
    await pool.query(`
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
    `);
    return res.status(200).json({ ok: true, message: "habit_log table created (or already existed)" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  } finally {
    await pool.end();
  }
}
