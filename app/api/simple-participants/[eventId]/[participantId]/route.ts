import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string; participantId: string } }
) {
  try {
    // Get user from JWT token
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const organizerId = decoded.id
    const eventId = parseInt(params.eventId)
    const participantId = parseInt(params.participantId)

    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    await client.connect()

    // Verify the event belongs to this organizer
    const eventCheck = await client.query(
      'SELECT id FROM events WHERE id = $1 AND "organizerId" = $2',
      [eventId, organizerId]
    )

    if (eventCheck.rows.length === 0) {
      await client.end()
      return NextResponse.json(
        { error: 'Event not found or unauthorized' },
        { status: 404 }
      )
    }

    // Delete participant
    const result = await client.query(
      'DELETE FROM participants WHERE id = $1 AND "eventId" = $2 RETURNING id',
      [participantId, eventId]
    )

    await client.end()

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Participant removed successfully' })
  } catch (error: any) {
    console.error('Remove participant error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}