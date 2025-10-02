import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user profile from users table
    const { data: profile } = await supabase
      .from('users')
      .select('name, role')
      .eq('id', session.user.id)
      .single()

    const user = {
      id: session.user.id,
      email: session.user.email!,
      name: profile?.name || session.user.user_metadata?.name || 'User',
      role: (profile?.role || 'ORGANIZER') as 'ADMIN' | 'ORGANIZER',
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}