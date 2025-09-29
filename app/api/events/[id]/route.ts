import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        participants: {
          where: {
            paymentStatus: 'succeeded'
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const paidParticipants = event.participants.length
    const collectedAmount = paidParticipants * event.pricePerPlayer
    const availableSpots = event.maxPlayers - paidParticipants

    return NextResponse.json({
      ...event,
      paidParticipants,
      collectedAmount,
      availableSpots
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}