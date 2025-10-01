import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, phone } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone: phone || null,
        },
      },
    })

    if (authError) {
      console.error('Supabase Auth error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create organizer profile in our custom table
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id, // Use auth user ID
        email: authData.user.email!,
        name,
        phone: phone || null,
        role: 'ORGANIZER',
        email_verified: false,
        phone_verified: false,
        admin_approved: false,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't fail the request - auth user is created
    }

    const user = {
      id: authData.user.id,
      email: authData.user.email!,
      name,
      role: 'ORGANIZER' as const,
    }

    return NextResponse.json({
      user,
      session: authData.session,
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}