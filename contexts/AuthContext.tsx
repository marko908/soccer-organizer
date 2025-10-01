'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (emailOrNickname: string, password: string) => Promise<boolean>
  register: (email: string, password: string, fullName: string, nickname: string, phone?: string) => Promise<boolean>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('email, full_name, nickname, role, avatar_url, bio, age, weight, height, can_create_events')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser && profile) {
        setUser({
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
        })
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    }
  }

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        await fetchUserProfile(session.user.id)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (emailOrNickname: string, password: string): Promise<boolean> => {
    try {
      let email = emailOrNickname

      // Check if input is a nickname (doesn't contain @)
      if (!emailOrNickname.includes('@')) {
        // Lookup email by nickname
        const { data: profile, error: lookupError } = await supabase
          .from('users')
          .select('email')
          .ilike('nickname', emailOrNickname)
          .single()

        if (lookupError || !profile) {
          console.error('Nickname not found:', emailOrNickname)
          return false
        }

        email = profile.email
      }

      // Login with email
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Login error:', error)
        return false
      }

      if (data.user) {
        await fetchUserProfile(data.user.id)
        return true
      }

      return false
    } catch (error) {
      console.error('Login failed:', error)
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
        console.error('Registration error:', error)
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
          console.error('Error creating user profile:', insertError)
          return false
        }

        // Don't fetch profile yet - user needs to verify email first
        return true
      }

      return false
    } catch (error) {
      console.error('Registration failed:', error)
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
      console.error('Logout failed:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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