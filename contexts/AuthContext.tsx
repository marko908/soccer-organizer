'use client'

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  fullName: string
  nickname: string
  role: 'ADMIN' | 'USER'
  avatarUrl: string
  bio?: string
  age?: number
  weight?: number
  height?: number
  canCreateEvents: boolean
  skillLevel?: 'beginner' | 'intermediate' | 'advanced'
  positionPreference?: 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'any'
  gamesPlayed?: number
  onTimeRate?: number
  preferredCities?: string[]
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, fullName: string, nickname: string, phone?: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const fetchingRef = useRef(false)
  const currentUserIdRef = useRef<string | null>(null)
  const initialLoadComplete = useRef(false)
  const checkAuthRunning = useRef(false)

  useEffect(() => {
    // Prevent duplicate checkAuth calls (React StrictMode runs effects twice)
    if (checkAuthRunning.current) {
      return
    }
    checkAuthRunning.current = true
    checkAuth()

    // Listen for auth state changes
    // Supabase automatically refreshes tokens, no manual refresh needed
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip SIGNED_IN and INITIAL_SESSION on first load - checkAuth handles it
      if (!initialLoadComplete.current && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        return
      }

      if (event === 'SIGNED_OUT') {
        setUser(null)
      } else if (event === 'SIGNED_IN') {
        // Skip refetch if user is already loaded with same ID (e.g., tab switch)
        if (session?.user && currentUserIdRef.current !== session.user.id) {
          const userData = await fetchUserProfile(session.user.id)
          setUser(userData)
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Token refresh happens automatically (e.g., tab switching)
        // Don't refetch profile - user data doesn't change on token refresh
      } else if (session?.user) {
        const userData = await fetchUserProfile(session.user.id)
        setUser(userData)
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string, retryCount = 0): Promise<User | null> => {
    // Prevent concurrent fetches for the same user
    if (fetchingRef.current && currentUserIdRef.current === userId) {
      return user // Return existing user
    }

    fetchingRef.current = true
    currentUserIdRef.current = userId

    try {
      // Timeout after 10 seconds (increased for cold starts and network delays)
      const queryPromise = supabase
        .from('users')
        .select('email, full_name, nickname, role, avatar_url, bio, age, weight, height, can_create_events, skill_level, position_preference, games_played, on_time_rate, preferred_cities')
        .eq('id', userId)
        .single()

      const timeoutPromise = new Promise<{ data: null, error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), 10000)
      )

      const result = await Promise.race([queryPromise, timeoutPromise])
        .catch((err) => {
          return { data: null, error: err }
        })

      const { data: profile, error } = result

      if (error) {
        // Retry on timeout or error (max 2 retries)
        if (retryCount < 2) {
          fetchingRef.current = false
          await new Promise(resolve => setTimeout(resolve, 100)) // Wait 100ms before retry
          return fetchUserProfile(userId, retryCount + 1)
        }

        // Return existing user to prevent logout
        return user
      }

      if (!profile) {
        return null
      }

      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser && profile) {
        const userData: User = {
          id: authUser.id,
          email: profile.email || authUser.email!,
          fullName: profile.full_name || '',
          nickname: profile.nickname || '',
          role: (profile.role || 'USER') as 'ADMIN' | 'USER',
          avatarUrl: profile.avatar_url || '/default-avatar.svg',
          bio: profile.bio,
          age: profile.age,
          weight: profile.weight,
          height: profile.height,
          canCreateEvents: profile.can_create_events || false,
          skillLevel: profile.skill_level,
          positionPreference: profile.position_preference,
          gamesPlayed: profile.games_played || 0,
          onTimeRate: profile.on_time_rate || 1.0,
          preferredCities: profile.preferred_cities || [],
        }
        return userData
      } else {
        return null
      }
    } catch (error) {
      return null
    } finally {
      fetchingRef.current = false
    }
  }

  const checkAuth = async () => {
    let userData: User | null = null

    try {
      // Small delay to let Supabase initialize session from cookies
      await new Promise(resolve => setTimeout(resolve, 50))

      let { data: { session }, error: sessionError } = await supabase.auth.getSession()

      // If no session found, wait a bit and retry once (for slow cookie reads)
      if (!session && !sessionError) {
        await new Promise(resolve => setTimeout(resolve, 100))
        const retry = await supabase.auth.getSession()
        session = retry.data.session
        sessionError = retry.error
      }

      if (sessionError) {
        userData = null
      } else if (session?.user) {
        // Fetch profile and get user data
        userData = await fetchUserProfile(session.user.id)
      } else {
        userData = null
      }
    } catch (error) {
      userData = null
    } finally {
      // Set user first, then loading - React 18 batches these automatically
      setUser(userData)
      setLoading(false)
      initialLoadComplete.current = true
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return false
      }

      if (data.user) {
        const userData = await fetchUserProfile(data.user.id)
        setUser(userData)
        return true
      }

      return false
    } catch (error) {
      return false
    }
  }

  const register = async (email: string, password: string, fullName: string, nickname: string, phone?: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            full_name: fullName,
            nickname,
            phone: phone || null,
          },
        },
      })

      if (error) {
        return false
      }

      if (data.user) {
        // Create user profile
        const { error: insertError } = await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          nickname,
          phone: phone || null,
          role: 'USER',
          email_verified: false,
          phone_verified: false,
          can_create_events: false,
          avatar_url: '/default-avatar.svg',
        })

        if (insertError) {
          // Check for specific errors
          if (insertError.code === '23505') {
            // Unique constraint violation
            if (insertError.message.includes('nickname')) {
              alert('Nickname is already taken. Please choose a different nickname.')
            } else if (insertError.message.includes('email')) {
              alert('Email is already registered.')
            }
          } else if (insertError.code === '42501' || insertError.message.includes('row-level security')) {
            // Permission denied / RLS policy violation
            alert('Registration failed: Database permission error.\n\nPlease run the RLS fix script in Supabase.\nCheck the browser console for details.')
          } else {
            alert(`Registration failed: ${insertError.message}`)
          }

          return false
        }

        // Don't fetch profile yet - user needs to verify email first
        return true
      }

      return false
    } catch (error) {
      return false
    }
  }

  const logout = async () => {
    try {
      // Sign out with scope: 'local' clears the session from current tab
      // scope: 'global' clears from all tabs (default)
      await supabase.auth.signOut({ scope: 'global' })
      setUser(null)

      // Force a page reload to clear any cached state
      window.location.href = '/'
    } catch (error) {
      // Silent fail
    }
  }

  const refreshUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const userData = await fetchUserProfile(authUser.id)
        setUser(userData)
      }
    } catch (error) {
      // Silent fail
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}