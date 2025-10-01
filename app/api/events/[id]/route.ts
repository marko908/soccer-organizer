import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', parseInt(params.id))
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Get participants with succeeded payment status
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .eq('event_id', parseInt(params.id))
      .eq('payment_status', 'succeeded')

    if (participantsError) throw participantsError

    const paidParticipants = participants?.length || 0
    const collectedAmount = paidParticipants * event.price_per_player
    const availableSpots = event.max_players - paidParticipants

    return NextResponse.json({
      ...event,
      participants: participants || [],
      paidParticipants,
      collectedAmount,
      availableSpots
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}