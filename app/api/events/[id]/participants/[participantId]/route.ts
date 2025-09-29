import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; participantId: string } }
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
    const participantId = parseInt(params.participantId)

    // Check if event exists and belongs to the organizer
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId: user.id
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or unauthorized' },
        { status: 404 }
      )
    }

    // Check if participant exists and belongs to this event
    const participant = await prisma.participant.findFirst({
      where: {
        id: participantId,
        eventId: eventId
      }
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      )
    }

    // Delete the participant
    await prisma.participant.delete({
      where: {
        id: participantId
      }
    })

    return NextResponse.json({ message: 'Participant removed successfully' })
  } catch (error) {
    console.error('Error removing participant:', error)
    return NextResponse.json(
      { error: 'Failed to remove participant' },
      { status: 500 }
    )
  }
}