// Hard reset — preserves Mindset Monday notes, PINs, photos, program
import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  // Secret is overridable via env so it can be rotated without a code change.
  const { secret } = req.body;
  const RESET_SECRET = process.env.RESET_SECRET || 'TFCG2025RESET';
  if (secret !== RESET_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results = [];
  const errors = [];

  const run = async (label, fn) => {
    try { 
      await fn(); 
      results.push(`✅ ${label}`); 
    } catch(e) { 
      errors.push(`❌ ${label}: ${e.message}`); 
    }
  };

  // 1. Clear attendance
  await run('Clear attendance', async () => {
    const { error } = await supabase.from('attendance').delete().gte('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
  });

  // 2. Clear draft
  await run('Clear draft', async () => {
    const { error } = await supabase.from('draft').delete().gte('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
  });

  // 3. Clear weight logs
  await run('Clear weight_log', async () => {
    const { error } = await supabase.from('weight_log').delete().gte('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
  });

  // 4. Clear PR logs
  await run('Clear pr_log', async () => {
    const { error } = await supabase.from('pr_log').delete().gte('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
  });

  // 5. Clear callouts
  await run('Clear callouts', async () => {
    const { error } = await supabase.from('callouts').delete().gte('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
  });

  // 6. Clear inbox (keep injuries for safety)
  await run('Clear inbox messages', async () => {
    const { error } = await supabase.from('inbox').delete().eq('type', 'message');
    if (error) throw error;
  });

  // 7. Clear anvil history
  await run('Clear anvil', async () => {
    const { error } = await supabase.from('anvil').delete().gte('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
  });

  // 8. Clear leaderboard
  await run('Clear leaderboard', async () => {
    const { error } = await supabase.from('leaderboard').delete().gte('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
  });

  // 9. Reset athlete roles BUT preserve mindset_note_1 through mindset_note_6
  // and fellowship notes, PINs, photos, goals
  await run('Reset athlete roles & groups (keeping Mindset notes)', async () => {
    const { error } = await supabase.from('athletes').update({
      role: 'iron',
      group_idx: null,
      bracelet: null,
      tier: null,
      // NOTE: mindset_note_1 through mindset_note_12 are NOT cleared
      // NOTE: fellowship_note_1 through fellowship_note_12 are NOT cleared
      // NOTE: pin, photo_url, athletic_goal, character_goal are NOT cleared
    }).eq('status', 'active');
    if (error) throw error;
  });

  // 10. Clear culture photos
  await run('Clear culture_photos', async () => {
    const { error } = await supabase.from('culture_photos').delete().gte('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
  });

  // 11. Clear culture rsvps
  await run('Clear culture_rsvps', async () => {
    const { error } = await supabase.from('culture_rsvps').delete().gte('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
  });

  return res.status(200).json({
    message: errors.length > 0 ? 'Reset complete with some errors' : 'Hard reset complete!',
    results,
    errors,
    timestamp: new Date().toISOString(),
    preserved: [
      'Athlete accounts & PINs',
      'Profile photos', 
      'Mindset Monday notes (all 12 weeks)',
      'Fellowship Friday notes (all 12 weeks)',
      'Athletic & character goals',
      'Training program'
    ]
  });
}
