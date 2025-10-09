import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const organizerId = session.user.id

    // Get events for this organizer using Supabase client
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', organizerId)
      .order('created_at', { ascending: false })

    if (eventsError) {
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
          organizerId: event.organizer_id,
          createdAt: event.created_at,
          updatedAt: event.updated_at,
          paidParticipants: count || 0
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const organizerId = session.user.id

    const body = await request.json()
    const { name, date, endTime, city, location, totalCost, minPlayers, maxPlayers, playersPerTeam, fieldType, cleatsAllowed } = body

    // Validate input
    if (!name || !date || !endTime || !city || !location || !totalCost || !minPlayers || !maxPlayers || !playersPerTeam || !fieldType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate price per player
    const pricePerPlayer = totalCost / maxPlayers

    // Insert event using Supabase client
    const { data: event, error: insertError } = await supabase
      .from('events')
      .insert({
        name,
        date,
        end_time: endTime,
        city,
        location,
        total_cost: totalCost,
        min_players: minPlayers,
        max_players: maxPlayers,
        price_per_player: pricePerPlayer,
        players_per_team: playersPerTeam,
        field_type: fieldType,
        cleats_allowed: cleatsAllowed ?? true,
        organizer_id: organizerId,
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    const formattedEvent = {
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
      organizerId: event.organizer_id,
      createdAt: event.created_at,
      updatedAt: event.updated_at
    }

    return NextResponse.json({ event: formattedEvent })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}