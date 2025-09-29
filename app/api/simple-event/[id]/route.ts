import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = parseInt(params.id)

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
      [eventId]
    )

    if (eventResult.rows.length === 0) {
      await client.end()
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Get all participants for this event
    const participantsResult = await client.query(
      `SELECT id, name, email, "paymentStatus", "createdAt"
       FROM participants
       WHERE "eventId" = $1
       ORDER BY "createdAt" DESC`,
      [eventId]
    )

    await client.end()

    const eventData = eventResult.rows[0]
    const paidParticipants = parseInt(eventData.paidParticipants) || 0

    const event = {
      ...eventData,
      paidParticipants,
      participants: participantsResult.rows,
      collectedAmount: paidParticipants * eventData.pricePerPlayer,
      availableSpots: eventData.maxPlayers - paidParticipants
    }

    return NextResponse.json(event)
  } catch (error: any) {
    console.error('Get event error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}