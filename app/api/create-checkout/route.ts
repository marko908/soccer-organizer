import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, participantName, participantEmail } = body

    if (!eventId || !participantName) {
      return NextResponse.json(
        { error: 'Event ID and participant name are required' },
        { status: 400 }
      )
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', parseInt(eventId))
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
      .eq('event_id', parseInt(eventId))
      .eq('payment_status', 'succeeded')

    if (participantsError) throw participantsError

    if ((participants?.length || 0) >= event.max_players) {
      return NextResponse.json(
        { error: 'Event is full' },
        { status: 400 }
      )
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'blik'],
      line_items: [
        {
          price_data: {
            currency: 'pln',
            product_data: {
              name: `${event.name} - Soccer Game`,
              description: `${event.location} on ${new Date(event.date).toLocaleDateString()}`,
            },
            unit_amount: Math.round(event.price_per_player * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/event/${eventId}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/event/${eventId}?canceled=true`,
      metadata: {
        eventId: eventId.toString(),
        participantName,
        participantEmail: participantEmail || '',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}