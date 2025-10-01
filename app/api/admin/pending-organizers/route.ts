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

    // Get all organizers waiting for approval
    const { data: organizers, error } = await supabase
      .from('users')
      .select('id, name, email, phone, email_verified, admin_approved, created_at')
      .eq('admin_approved', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Convert snake_case to camelCase for frontend compatibility
    const formattedOrganizers = organizers?.map(org => ({
      id: org.id,
      name: org.name,
      email: org.email,
      phone: org.phone,
      emailVerified: org.email_verified,
      adminApproved: org.admin_approved,
      createdAt: org.created_at
    }))

    return NextResponse.json({ organizers: formattedOrganizers })
  } catch (error: any) {
    console.error('Get pending organizers error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}