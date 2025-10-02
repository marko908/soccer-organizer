import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client (for browser usage)
// Uses localStorage for better session persistence
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
)