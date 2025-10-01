import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    // Get user from JWT token (check both cookie names for compatibility)
    const token = request.cookies.get('auth-token')?.value || request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const organizerId = decoded.id

    console.log('JWT decoded:', decoded)
    console.log('Looking for events with organizerId:', organizerId)

    // Direct SQL query
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    await client.connect()

    const result = await client.query(
      `SELECT
        e.*,
        COUNT(CASE WHEN p.payment_status = 'succeeded' THEN 1 END) as paid_participants
      FROM events e
      LEFT JOIN participants p ON e.id = p.event_id
      WHERE e.organizer_id = $1
      GROUP BY e.id
      ORDER BY e.created_at DESC`,
      [organizerId]
    )

    await client.end()

    const events = result.rows.map((event: any) => ({
      id: event.id,
      name: event.name,
      date: event.date,
      location: event.location,
      totalCost: parseFloat(event.total_cost),
      maxPlayers: event.max_players,
      pricePerPlayer: parseFloat(event.price_per_player),
      organizerId: event.organizer_id,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      paidParticipants: parseInt(event.paid_participants) || 0
    }))

    console.log('Query result rows:', result.rows.length)
    console.log('Events found:', events)

    return NextResponse.json({ events })
  } catch (error: any) {
    console.error('Get events error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from JWT token (check both cookie names for compatibility)
    const token = request.cookies.get('auth-token')?.value || request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const organizerId = decoded.id

    const body = await request.json()
    const { name, date, location, totalCost, maxPlayers } = body

    // Calculate price per player
    const pricePerPlayer = totalCost / maxPlayers

    // Direct SQL insert
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    await client.connect()

    const result = await client.query(
      `INSERT INTO events (name, date, location, total_cost, max_players, price_per_player, organizer_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, name, date, location, total_cost, max_players, price_per_player, organizer_id, created_at, updated_at`,
      [name, date, location, totalCost, maxPlayers, pricePerPlayer, organizerId]
    )

    await client.end()

    const rawEvent = result.rows[0]
    const event = {
      id: rawEvent.id,
      name: rawEvent.name,
      date: rawEvent.date,
      location: rawEvent.location,
      totalCost: parseFloat(rawEvent.total_cost),
      maxPlayers: rawEvent.max_players,
      pricePerPlayer: parseFloat(rawEvent.price_per_player),
      organizerId: rawEvent.organizer_id,
      createdAt: rawEvent.created_at,
      updatedAt: rawEvent.updated_at
    }

    return NextResponse.json({ event })
  } catch (error: any) {
    console.error('Create event error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}