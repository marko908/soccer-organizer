import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client (for browser usage)
// With proper cookie handling for session persistence
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    cookies: {
      get(name: string) {
        // Use document.cookie to get cookies client-side
        const cookies = document.cookie.split('; ')
        const cookie = cookies.find(c => c.startsWith(`${name}=`))
        return cookie ? decodeURIComponent(cookie.split('=')[1]) : undefined
      },
      set(name: string, value: string, options: any) {
        // Set cookie with proper options
        let cookieString = `${name}=${encodeURIComponent(value)}`

        if (options?.maxAge) {
          cookieString += `; max-age=${options.maxAge}`
        }
        if (options?.path) {
          cookieString += `; path=${options.path}`
        }
        if (options?.domain) {
          cookieString += `; domain=${options.domain}`
        }
        if (options?.sameSite) {
          cookieString += `; samesite=${options.sameSite}`
        }
        if (options?.secure) {
          cookieString += '; secure'
        }

        document.cookie = cookieString
      },
      remove(name: string, options: any) {
        // Remove cookie by setting expiry in the past
        let cookieString = `${name}=; max-age=0`

        if (options?.path) {
          cookieString += `; path=${options.path}`
        }
        if (options?.domain) {
          cookieString += `; domain=${options.domain}`
        }

        document.cookie = cookieString
      },
    },
  }
)