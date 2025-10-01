import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET /api/admin/users - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get search query
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('users')
      .select('id, email, full_name, nickname, role, can_create_events, email_verified, created_at')
      .order('created_at', { ascending: false })

    // Add search filter if provided
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,nickname.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: users, error: usersError } = await query

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Format response (snake_case to camelCase)
    const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      nickname: u.nickname,
      role: u.role,
      canCreateEvents: u.can_create_events,
      emailVerified: u.email_verified,
      createdAt: u.created_at,
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error: any) {
    console.error('Admin users list error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
