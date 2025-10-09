import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// POST /api/admin/toggle-permission - Toggle can_create_events permission (admin only)
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { userId, canCreateEvents } = body

    if (!userId || canCreateEvents === undefined) {
      return NextResponse.json(
        { error: 'userId and canCreateEvents are required' },
        { status: 400 }
      )
    }

    // Update permission using admin client (bypasses RLS)
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ can_create_events: canCreateEvents })
      .eq('id', userId)
      .select('id, email, full_name, nickname, role, can_create_events, email_verified, created_at')
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update permission' },
        { status: 500 }
      )
    }

    // Format response
    const formattedUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.full_name,
      nickname: updatedUser.nickname,
      role: updatedUser.role,
      canCreateEvents: updatedUser.can_create_events,
      emailVerified: updatedUser.email_verified,
      createdAt: updatedUser.created_at,
    }

    return NextResponse.json({
      user: formattedUser,
      message: `Permission ${canCreateEvents ? 'granted' : 'revoked'} successfully`
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
