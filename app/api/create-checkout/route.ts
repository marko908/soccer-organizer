import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

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

    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) },
      include: {
        participants: {
          where: { paymentStatus: 'succeeded' }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (event.participants.length >= event.maxPlayers) {
      return NextResponse.json(
        { error: 'Event is full' },
        { status: 400 }
      )
    }

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