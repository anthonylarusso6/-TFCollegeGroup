import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// No hardcoded fallback on purpose: a committed URL and key silently pin the app
// to one Supabase project, which makes migrating between projects a code change
// instead of a config change. Fail loudly instead.
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and ' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (local) or the Vercel project ' +
    'settings (deployed). See .env.example.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
