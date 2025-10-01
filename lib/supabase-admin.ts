import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Admin Supabase client with service_role key (bypasses RLS)
// WARNING: Only use this for:
// 1. Stripe webhooks updating payment status
// 2. Admin operations that need to bypass RLS
// 3. Server-side operations that require elevated privileges
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
