import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client (for browser usage)
// Provides cookie handlers for proper session management
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookies: {
    get(name: string) {
      // Use browser's document.cookie API
      const cookies = document.cookie.split('; ')
      const cookie = cookies.find(c => c.startsWith(`${name}=`))
      return cookie?.substring(name.length + 1)
    },
    set(name: string, value: string, options: any) {
      // Build cookie string
      let cookie = `${name}=${value}`
      if (options?.maxAge) cookie += `; max-age=${options.maxAge}`
      if (options?.path) cookie += `; path=${options.path}`
      if (options?.domain) cookie += `; domain=${options.domain}`
      if (options?.sameSite) cookie += `; samesite=${options.sameSite}`
      if (options?.secure) cookie += '; secure'
      document.cookie = cookie
    },
    remove(name: string, options: any) {
      // Remove cookie by setting max-age to 0
      let cookie = `${name}=; max-age=0`
      if (options?.path) cookie += `; path=${options.path}`
      if (options?.domain) cookie += `; domain=${options.domain}`
      document.cookie = cookie
    },
  },
})