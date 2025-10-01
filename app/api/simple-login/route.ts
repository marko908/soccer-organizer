import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error('Supabase Auth error:', authError)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Get user profile from organizers table
    const { data: profile } = await supabase
      .from('organizers')
      .select('name, role')
      .eq('id', authData.user.id)
      .single()

    const user = {
      id: authData.user.id,
      email: authData.user.email!,
      name: profile?.name || authData.user.user_metadata?.name || 'User',
      role: (profile?.role || 'ORGANIZER') as 'ADMIN' | 'ORGANIZER',
    }

    return NextResponse.json({
      user,
      session: authData.session,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}