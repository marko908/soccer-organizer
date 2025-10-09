import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, participantName, participantEmail, userId, avatarUrl } = body

    if (!eventId || !participantName) {
      return NextResponse.json(
        { error: 'Event ID and participant name are required' },
        { status: 400 }
      )
    }

    // Get event details with organizer info using Supabase
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select(`
        *,
        organizer:users!organizer_id (
          stripe_account_id,
          stripe_onboarding_complete
        )
      `)
      .eq('id', parseInt(eventId))
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check if organizer has completed Stripe Connect onboarding
    const organizer = Array.isArray(event.organizer) ? event.organizer[0] : event.organizer
    if (!organizer?.stripe_account_id || !organizer?.stripe_onboarding_complete) {
      return NextResponse.json(
        { error: 'Event organizer has not completed payment setup' },
        { status: 400 }
      )
    }

    // Count paid participants
    const { count: paidParticipants } = await supabaseAdmin
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', parseInt(eventId))
      .eq('payment_status', 'succeeded')

    if ((paidParticipants || 0) >= event.max_players) {
      return NextResponse.json(
        { error: 'Event is full' },
        { status: 400 }
      )
    }

    // Create Stripe Checkout session with Connect
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'blik'],
      line_items: [
        {
          price_data: {
            currency: 'pln',
            product_data: {
              name: `${event.name} - Football Game`,
              description: `${event.location} on ${new Date(event.date).toLocaleDateString()}`,
            },
            unit_amount: Math.round(parseFloat(event.price_per_player) * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/event/${eventId}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/event/${eventId}?canceled=true`,
      payment_intent_data: {
        // Transfer funds to connected account (organizer)
        transfer_data: {
          destination: organizer.stripe_account_id,
        },
        // Platform fee: 15% of payment
        application_fee_amount: Math.round(parseFloat(event.price_per_player) * 100 * 0.15),
      },
      metadata: {
        eventId: eventId.toString(),
        participantName,
        participantEmail: participantEmail || '',
        userId: userId || '',
        avatarUrl: avatarUrl || '/default-avatar.svg',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to create checkout session: ${error.message}` },
      { status: 500 }
    )
  }
}