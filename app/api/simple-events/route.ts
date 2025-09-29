import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
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
        COUNT(CASE WHEN p."paymentStatus" = 'succeeded' THEN 1 END) as "paidParticipants"
      FROM events e
      LEFT JOIN participants p ON e.id = p."eventId"
      WHERE e."organizerId" = $1
      GROUP BY e.id
      ORDER BY e."createdAt" DESC`,
      [organizerId]
    )

    await client.end()

    const events = result.rows.map((event: any) => ({
      ...event,
      paidParticipants: parseInt(event.paidParticipants) || 0
    }))

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
      `INSERT INTO events (name, date, location, "totalCost", "maxPlayers", "pricePerPlayer", "organizerId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, name, date, location, "totalCost", "maxPlayers", "pricePerPlayer"`,
      [name, date, location, totalCost, maxPlayers, pricePerPlayer, organizerId]
    )

    await client.end()

    const event = result.rows[0]

    return NextResponse.json({ event })
  } catch (error: any) {
    console.error('Create event error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}