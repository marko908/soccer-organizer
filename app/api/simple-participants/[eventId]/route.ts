import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    // Get user from Supabase session
    const user = await getSupabaseUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const organizerId = user.id
    const eventId = parseInt(params.eventId)

    const body = await request.json()
    const { name, email } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Verify the event belongs to this organizer
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('organizer_id', organizerId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found or unauthorized' },
        { status: 404 }
      )
    }

    // Add participant with 'succeeded' payment status (cash payment)
    const { data: participant, error: insertError } = await supabaseAdmin
      .from('participants')
      .insert({
        name: name.trim(),
        email: email?.trim() || null,
        event_id: eventId,
        payment_status: 'succeeded',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, name, email, payment_status, created_at')
      .single()

    if (insertError || !participant) {
      return NextResponse.json(
        { error: insertError?.message || 'Failed to add participant' },
        { status: 500 }
      )
    }

    return NextResponse.json({ participant })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}