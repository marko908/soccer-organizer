import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Get all upcoming public events
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select(`
        *,
        organizer:users!organizer_id (
          full_name,
          nickname,
          avatar_url
        )
      `)
      .gte('date', new Date().toISOString()) // Only future events
      .order('date', { ascending: true })

    if (eventsError) {
      console.error('Error fetching public events:', eventsError)
      throw eventsError
    }

    // For each event, count paid participants
    const eventsWithParticipants = await Promise.all(
      (eventsData || []).map(async (event) => {
        const { count } = await supabase
          .from('participants')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('payment_status', 'succeeded')

        const organizer = Array.isArray(event.organizer) ? event.organizer[0] : event.organizer

        return {
          id: event.id,
          name: event.name,
          date: event.date,
          location: event.location,
          totalCost: parseFloat(event.total_cost),
          maxPlayers: event.max_players,
          pricePerPlayer: parseFloat(event.price_per_player),
          paidParticipants: count || 0,
          availableSpots: event.max_players - (count || 0),
          organizer: {
            fullName: organizer?.full_name,
            nickname: organizer?.nickname,
            avatarUrl: organizer?.avatar_url || '/default-avatar.svg',
          },
        }
      })
    )

    return NextResponse.json({ events: eventsWithParticipants })
  } catch (error: any) {
    console.error('Get public events error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
