import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    // Check if admin already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'ADMIN')
      .single()

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin user already exists' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { email, password, name, setupKey } = body

    // Verify setup key (from environment variable)
    if (setupKey !== process.env.ADMIN_SETUP_KEY) {
      return NextResponse.json(
        { error: 'Invalid setup key' },
        { status: 403 }
      )
    }

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Create user with Supabase Auth (using admin client to bypass email confirmation)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
      },
    })

    if (authError) {
      console.error('Supabase Auth error:', authError)
      throw authError
    }

    if (!authData.user) {
      throw new Error('Failed to create auth user')
    }

    // Create user profile in users table with ADMIN role
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        full_name: name,
        nickname: name.toLowerCase().replace(/\s+/g, '_'),
        role: 'ADMIN',
        email_verified: true,
        can_create_events: true,
        avatar_url: '/default-avatar.svg',
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Try to clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    return NextResponse.json({
      message: 'Admin user created successfully. You can now log in.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        role: 'ADMIN',
      },
    })
  } catch (error: any) {
    console.error('Admin creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create admin user' },
      { status: 500 }
    )
  }
}