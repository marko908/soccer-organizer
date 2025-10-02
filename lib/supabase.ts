import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client (for browser usage)
// Uses default cookie handling from @supabase/ssr for better compatibility
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
)