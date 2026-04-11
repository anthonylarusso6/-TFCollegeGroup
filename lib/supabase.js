import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kluuoibuhkxukbqodfet.supabase.co'
const supabaseKey = 'sb_publishable_IuHr-lSacxV6CwzpOT1Egw_-ebUnZQi'

export const supabase = createClient(supabaseUrl, supabaseKey)
