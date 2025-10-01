import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Server-side Supabase client with cookie-based auth
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: async (key: string) => {
          return cookieStore.get(key)?.value ?? null
        },
        setItem: async (key: string, value: string) => {
          cookieStore.set(key, value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
          })
        },
        removeItem: async (key: string) => {
          cookieStore.delete(key)
        },
      },
    },
  })
}
