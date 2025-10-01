import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthUser } from '@/lib/simple-auth'

export async function POST(request: NextRequest) {
  try {
    // Admin authentication required
    const user = await getAuthUser(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { organizerId, action } = body

    if (!organizerId || !action) {
      return NextResponse.json(
        { error: 'Missing organizerId or action' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve or reject' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Approve organizer
      try {
        const { data, error } = await supabase
          .from('organizers')
          .update({
            admin_approved: true,
            approved_at: new Date().toISOString(),
            approved_by: 'admin'
          })
          .eq('id', organizerId)
          .eq('admin_approved', false)
          .select()

        if (error) throw error

        if (!data || data.length === 0) {
          return NextResponse.json(
            { error: 'Organizer not found or already processed' },
            { status: 404 }
          )
        }

        return NextResponse.json({ message: 'Organizer approved successfully' })
      } catch (error) {
        console.error('Error approving organizer:', error)
        return NextResponse.json(
          { error: 'Failed to approve organizer' },
          { status: 500 }
        )
      }
    } else {
      // Reject organizer (delete from database)
      try {
        const { data, error } = await supabase
          .from('organizers')
          .delete()
          .eq('id', organizerId)
          .eq('admin_approved', false)
          .select()

        if (error) throw error

        if (!data || data.length === 0) {
          return NextResponse.json(
            { error: 'Organizer not found or already processed' },
            { status: 404 }
          )
        }

        return NextResponse.json({ message: 'Organizer rejected and removed' })
      } catch (error) {
        console.error('Error rejecting organizer:', error)
        return NextResponse.json(
          { error: 'Failed to reject organizer' },
          { status: 500 }
        )
      }
    }
  } catch (error: any) {
    console.error('Approve organizer error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}