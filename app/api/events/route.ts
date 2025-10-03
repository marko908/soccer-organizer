import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseUser } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const user = await getSupabaseUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, date, location, totalCost, maxPlayers } = body

    if (!name || !date || !location || !totalCost || !maxPlayers) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const pricePerPlayer = totalCost / maxPlayers

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        name,
        date: new Date(date).toISOString(),
        location,
        total_cost: parseFloat(totalCost),
        max_players: parseInt(maxPlayers),
        price_per_player: pricePerPlayer,
        organizer_id: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get all events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true })

    if (eventsError) throw eventsError

    // Get all participants with succeeded payment status
    const { data: allParticipants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .eq('payment_status', 'succeeded')

    if (participantsError) throw participantsError

    // Combine events with their participants
    const eventsWithParticipants = events?.map(event => ({
      ...event,
      participants: allParticipants?.filter(p => p.event_id === event.id) || []
    })) || []

    return NextResponse.json(eventsWithParticipants)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}