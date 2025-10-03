import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Set to true for testing - bypasses Stripe checkout
const TEST_MODE = true

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

    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    await client.connect()

    // Get event with participant count
    const eventResult = await client.query(
      `SELECT
        e.*,
        COUNT(CASE WHEN p."paymentStatus" = 'succeeded' THEN 1 END) as "paidParticipants"
      FROM events e
      LEFT JOIN participants p ON e.id = p."eventId"
      WHERE e.id = $1
      GROUP BY e.id`,
      [parseInt(eventId)]
    )

    await client.end()

    if (eventResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const event = eventResult.rows[0]
    const paidParticipants = parseInt(event.paidParticipants) || 0

    if (paidParticipants >= event.maxPlayers) {
      return NextResponse.json(
        { error: 'Event is full' },
        { status: 400 }
      )
    }

    // TEST MODE: Directly add participant without Stripe checkout
    if (TEST_MODE) {
      console.log('🧪 TEST MODE: Adding participant directly (bypassing Stripe)')

      const { error } = await supabaseAdmin
        .from('participants')
        .insert({
          name: participantName,
          email: participantEmail || null,
          payment_status: 'succeeded',
          stripe_payment_intent_id: 'test_mode_' + Date.now(),
          event_id: parseInt(eventId),
          user_id: userId || null,
          avatar_url: avatarUrl || '/default-avatar.svg',
        })

      if (error) {
        console.error('Error adding participant in test mode:', error)
        return NextResponse.json(
          { error: 'Failed to add participant' },
          { status: 500 }
        )
      }

      console.log(`✅ TEST MODE: Participant ${participantName} added to event ${eventId}`)

      // Return success URL to redirect user
      return NextResponse.json({
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/event/${eventId}?success=true`,
        testMode: true
      })
    }

    // PRODUCTION MODE: Normal Stripe checkout flow
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
            unit_amount: Math.round(event.pricePerPlayer * 100), // Convert to cents
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
        userId: userId || '',
        avatarUrl: avatarUrl || '/default-avatar.svg',
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