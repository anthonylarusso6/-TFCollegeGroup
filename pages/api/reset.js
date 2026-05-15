// Hard reset endpoint — run on June 17th before first class
// Only accessible with the correct secret key
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { secret } = req.body;
  if (secret !== 'TFCG2025RESET') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = [];
  const errors = [];

  const run = async (label, fn) => {
    try { await fn(); results.push(`✅ ${label}`); }
    catch(e) { errors.push(`❌ ${label}: ${e.message}`); }
  };

  // 1. Clear attendance
  await run('Clear attendance', () =>
    supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  );

  // 2. Clear draft
  await run('Clear draft', () =>
    supabase.from('draft').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  );

  // 3. Clear weight logs
  await run('Clear weight_log', () =>
    supabase.from('weight_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  );

  // 4. Clear PR logs
  await run('Clear pr_log', () =>
    supabase.from('pr_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  );

  // 5. Clear callouts
  await run('Clear callouts', () =>
    supabase.from('callouts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  );

  // 6. Clear inbox
  await run('Clear inbox', () =>
    supabase.from('inbox').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  );

  // 7. Clear anvil history
  await run('Clear anvil', () =>
    supabase.from('anvil').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  );

  // 8. Clear leaderboard
  await run('Clear leaderboard', () =>
    supabase.from('leaderboard').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  );

  // 9. Reset all athlete roles to iron, clear group/bracelet/tier assignments
  await run('Reset athlete roles & groups', () =>
    supabase.from('athletes').update({
      role: 'iron',
      group_idx: null,
      bracelet: null,
      tier: null,
    }).eq('status', 'active')
  );

  // 10. Clear culture photos
  await run('Clear culture_photos', () =>
    supabase.from('culture_photos').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  );

  // 11. Clear culture rsvps
  await run('Clear culture_rsvps', () =>
    supabase.from('culture_rsvps').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  );

  return res.status(200).json({
    message: 'Hard reset complete!',
    results,
    errors,
    timestamp: new Date().toISOString(),
    note: 'Athlete accounts, PINs, photos, and program are preserved.'
  });
}
