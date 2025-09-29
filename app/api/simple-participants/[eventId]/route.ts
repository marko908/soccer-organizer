import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
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

    const body = await request.json()
    const { name, email } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

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

    // Add participant with 'cash' payment status
    const result = await client.query(
      `INSERT INTO participants (name, email, "eventId", "paymentStatus", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 'succeeded', NOW(), NOW())
       RETURNING id, name, email, "paymentStatus", "createdAt"`,
      [name.trim(), email?.trim() || null, eventId]
    )

    await client.end()

    return NextResponse.json({ participant: result.rows[0] })
  } catch (error: any) {
    console.error('Add participant error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}