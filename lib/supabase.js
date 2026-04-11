import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kluuoibuhkxukbqodfet.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsdXVvaWJ1aGt4dWticW9kZmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzY4NjYsImV4cCI6MjA5MTUxMjg2Nn0.0LeTTeFYeSiv7JAH6P-QmfAU8pQALZZRt5zWmW2s5-M'

export const supabase = createClient(supabaseUrl, supabaseKey)
