import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthUser } from '@/lib/simple-auth'

export async function GET(request: NextRequest) {
  try {
    // Admin authentication required
    const user = await getAuthUser(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get all users waiting for approval
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, phone, email_verified, admin_approved, created_at')
      .eq('admin_approved', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Convert snake_case to camelCase for frontend compatibility
    const formattedUsers = users?.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      emailVerified: user.email_verified,
      adminApproved: user.admin_approved,
      createdAt: user.created_at
    }))

    return NextResponse.json({ organizers: formattedUsers })
  } catch (error: any) {
    console.error('Get pending users error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}