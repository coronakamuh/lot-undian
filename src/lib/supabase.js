import { createClient } from '@supabase/supabase-js'

// Kunci publishable memang aman berada di frontend; akses dibatasi oleh RLS di database.
const SUPABASE_URL = 'https://lebwxqkbpjqqszzvmnas.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_-ZI4t9ZuLF9LuIee8W_7Fg_EUrgXFat'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
