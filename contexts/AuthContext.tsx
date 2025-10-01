'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'ORGANIZER'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string, phone?: string) => Promise<boolean>
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
    const { data: profile } = await supabase
      .from('organizers')
      .select('name, role')
      .eq('id', userId)
      .single()

    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (authUser) {
      setUser({
        id: authUser.id,
        email: authUser.email!,
        name: profile?.name || authUser.user_metadata?.name || 'User',
        role: (profile?.role || 'ORGANIZER') as 'ADMIN' | 'ORGANIZER',
      })
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

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
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

  const register = async (email: string, password: string, name: string, phone?: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone: phone || null,
          },
        },
      })

      if (error) {
        console.error('Registration error:', error)
        return false
      }

      if (data.user) {
        // Create organizer profile
        await supabase.from('organizers').insert({
          id: data.user.id,
          email: data.user.email!,
          name,
          phone: phone || null,
          role: 'ORGANIZER',
          email_verified: false,
          phone_verified: false,
          admin_approved: false,
        })

        await fetchUserProfile(data.user.id)
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