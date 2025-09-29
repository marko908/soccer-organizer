import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature found' },
      { status: 400 }
    )
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any

    try {
      const { eventId, participantName, participantEmail } = session.metadata

      await prisma.participant.create({
        data: {
          name: participantName,
          email: participantEmail || null,
          paymentStatus: 'succeeded',
          stripePaymentIntentId: session.payment_intent,
          eventId: parseInt(eventId),
        },
      })

      console.log(`Participant ${participantName} successfully added to event ${eventId}`)
    } catch (error) {
      console.error('Error creating participant:', error)
      return NextResponse.json(
        { error: 'Failed to create participant' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
}