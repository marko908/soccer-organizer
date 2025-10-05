import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id)
    const supabase = await createServerSupabaseClient()

    // Get event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      console.error('Event not found:', eventId, eventError)
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Get all participants for this event
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('id, name, email, payment_status, created_at, avatar_url, user_id')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (participantsError) {
      console.error('Error fetching participants:', participantsError)
    }

    // Count paid participants
    const { count: paidCount } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('payment_status', 'succeeded')

    const paidParticipants = paidCount || 0

    // Format response
    const formattedEvent = {
      id: event.id,
      name: event.name,
      date: event.date,
      endTime: event.end_time,
      location: event.location,
      totalCost: parseFloat(event.total_cost),
      minPlayers: event.min_players,
      maxPlayers: event.max_players,
      pricePerPlayer: parseFloat(event.price_per_player),
      playersPerTeam: event.players_per_team,
      fieldType: event.field_type,
      cleatsAllowed: event.cleats_allowed,
      organizerId: event.organizer_id,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      paidParticipants,
      participants: (participants || []).map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        avatarUrl: p.avatar_url,
        userId: p.user_id,
        paymentStatus: p.payment_status,
        createdAt: p.created_at,
      })),
      collectedAmount: paidParticipants * parseFloat(event.price_per_player),
      availableSpots: event.max_players - paidParticipants,
    }

    return NextResponse.json(formattedEvent)
  } catch (error: any) {
    console.error('Get event error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}