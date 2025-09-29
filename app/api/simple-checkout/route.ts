import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

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