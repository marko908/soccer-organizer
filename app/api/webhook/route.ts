import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
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
    const stripe = getStripe()
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
      const { eventId, participantName, participantEmail, userId, avatarUrl } = session.metadata

      // Check if participant already exists with this payment intent
      const { data: existingParticipant } = await supabaseAdmin
        .from('participants')
        .select('id')
        .eq('stripe_payment_intent_id', session.payment_intent)
        .single()

      if (existingParticipant) {
        console.log(`⏭️ Participant already exists for payment intent ${session.payment_intent}, skipping`)
        return NextResponse.json({ received: true, skipped: true })
      }

      const { error } = await supabaseAdmin
        .from('participants')
        .insert({
          name: participantName,
          email: participantEmail || null,
          payment_status: 'succeeded',
          stripe_payment_intent_id: session.payment_intent,
          event_id: parseInt(eventId),
          user_id: userId || null,
          avatar_url: avatarUrl || '/default-avatar.svg',
        })

      if (error) throw error

      console.log(`✅ Participant ${participantName} successfully added to event ${eventId}`)
    } catch (error) {
      console.error('❌ Error creating participant:', error)
      return NextResponse.json(
        { error: 'Failed to create participant' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
}