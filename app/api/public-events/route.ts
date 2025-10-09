import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    // Get all upcoming/ongoing events (exclude only events that have ended)
    // An event is considered ended when end_time has passed
    const now = new Date()

    const { data: eventsData, error: eventsError } = await supabaseAdmin
      .from('events')
      .select(`
        *,
        organizer:users!organizer_id (
          full_name,
          nickname,
          avatar_url
        )
      `)
      .gte('end_time', now.toISOString()) // Only events that haven't ended yet
      .order('date', { ascending: true })

    if (eventsError) {
      throw eventsError
    }

    // For each event, count paid participants
    const eventsWithParticipants = await Promise.all(
      (eventsData || []).map(async (event) => {
        const { count } = await supabaseAdmin
          .from('participants')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('payment_status', 'succeeded')

        const organizer = Array.isArray(event.organizer) ? event.organizer[0] : event.organizer

        return {
          id: event.id,
          name: event.name,
          date: event.date,
          endTime: event.end_time,
          city: event.city,
          location: event.location,
          totalCost: parseFloat(event.total_cost),
          minPlayers: event.min_players,
          maxPlayers: event.max_players,
          pricePerPlayer: parseFloat(event.price_per_player),
          playersPerTeam: event.players_per_team,
          fieldType: event.field_type,
          cleatsAllowed: event.cleats_allowed,
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
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
