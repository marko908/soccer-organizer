import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
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
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId: user.id
      },
      include: {
        participants: {
          where: { paymentStatus: 'succeeded' }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or unauthorized' },
        { status: 404 }
      )
    }

    // Check if event is full
    if (event.participants.length >= event.maxPlayers) {
      return NextResponse.json(
        { error: 'Event is full' },
        { status: 400 }
      )
    }

    // Create participant with cash payment status
    const participant = await prisma.participant.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        paymentStatus: 'succeeded', // Cash payments are considered succeeded
        stripePaymentIntentId: null, // No Stripe payment for cash
        eventId: eventId,
      },
    })

    return NextResponse.json(participant)
  } catch (error) {
    console.error('Error adding participant:', error)
    return NextResponse.json(
      { error: 'Failed to add participant' },
      { status: 500 }
    )
  }
}