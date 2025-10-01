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

    console.log('Fetching events for organizer:', organizerId)

    // Get events for this organizer using Supabase client
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', organizerId)
      .order('created_at', { ascending: false })

    if (eventsError) {
      console.error('Error fetching events:', eventsError)
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
          location: event.location,
          totalCost: parseFloat(event.total_cost),
          maxPlayers: event.max_players,
          pricePerPlayer: parseFloat(event.price_per_player),
          organizerId: event.organizer_id,
          createdAt: event.created_at,
          updatedAt: event.updated_at,
          paidParticipants: count || 0
        }
      })
    )

    console.log('Events found:', eventsWithParticipants.length)

    return NextResponse.json({ events: eventsWithParticipants })
  } catch (error: any) {
    console.error('Get events error:', error)
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
    const { name, date, location, totalCost, maxPlayers } = body

    // Validate input
    if (!name || !date || !location || !totalCost || !maxPlayers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate price per player
    const pricePerPlayer = totalCost / maxPlayers

    console.log('Creating event for organizer:', organizerId)

    // Insert event using Supabase client
    const { data: event, error: insertError } = await supabase
      .from('events')
      .insert({
        name,
        date,
        location,
        total_cost: totalCost,
        max_players: maxPlayers,
        price_per_player: pricePerPlayer,
        organizer_id: organizerId,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating event:', insertError)
      throw insertError
    }

    const formattedEvent = {
      id: event.id,
      name: event.name,
      date: event.date,
      location: event.location,
      totalCost: parseFloat(event.total_cost),
      maxPlayers: event.max_players,
      pricePerPlayer: parseFloat(event.price_per_player),
      organizerId: event.organizer_id,
      createdAt: event.created_at,
      updatedAt: event.updated_at
    }

    console.log('Event created:', formattedEvent.id)

    return NextResponse.json({ event: formattedEvent })
  } catch (error: any) {
    console.error('Create event error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}