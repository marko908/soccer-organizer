import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client (for browser usage)
// Uses cookie storage to match server-side session handling
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    cookies: {
      get(name: string) {
        if (typeof document === 'undefined') return undefined
        const value = document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${name}=`))
          ?.split('=')[1]
        return value ? decodeURIComponent(value) : undefined
      },
      set(name: string, value: string, options: any) {
        if (typeof document === 'undefined') return

        let cookie = `${name}=${encodeURIComponent(value)}`

        if (options?.maxAge) {
          cookie += `; max-age=${options.maxAge}`
        }
        if (options?.path) {
          cookie += `; path=${options.path}`
        } else {
          cookie += '; path=/'
        }
        if (options?.domain) {
          cookie += `; domain=${options.domain}`
        }
        if (options?.sameSite) {
          cookie += `; samesite=${options.sameSite}`
        }
        if (options?.secure) {
          cookie += '; secure'
        }

        document.cookie = cookie
      },
      remove(name: string, options: any) {
        if (typeof document === 'undefined') return

        const path = options?.path || '/'
        document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      },
    },
  }
)