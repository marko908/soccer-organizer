import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseUser } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSupabaseUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const eventId = parseInt(params.id)
    const body = await request.json()
    const { name, email, paymentMethod } = body

    if (!name || !paymentMethod) {
      return NextResponse.json(
        { error: 'Name and payment method are required' },
        { status: 400 }
      )
    }

    // Check if event exists and belongs to the organizer
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('organizer_id', user.id)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found or unauthorized' },
        { status: 404 }
      )
    }

    // Get participants with succeeded payment status
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .eq('event_id', eventId)
      .eq('payment_status', 'succeeded')

    if (participantsError) throw participantsError

    // Check if event is full
    if ((participants?.length || 0) >= event.max_players) {
      return NextResponse.json(
        { error: 'Event is full' },
        { status: 400 }
      )
    }

    // Create participant with cash payment status
    const { data: participant, error: insertError } = await supabase
      .from('participants')
      .insert({
        name: name.trim(),
        email: email?.trim() || null,
        payment_status: 'succeeded', // Cash payments are considered succeeded
        stripe_payment_intent_id: null, // No Stripe payment for cash
        event_id: eventId,
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json(participant)
  } catch (error) {
    console.error('Error adding participant:', error)
    return NextResponse.json(
      { error: 'Failed to add participant' },
      { status: 500 }
    )
  }
}