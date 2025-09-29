import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, date, location, totalCost, maxPlayers } = body

    if (!name || !date || !location || !totalCost || !maxPlayers) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const pricePerPlayer = totalCost / maxPlayers

    const event = await prisma.event.create({
      data: {
        name,
        date: new Date(date),
        location,
        totalCost: parseFloat(totalCost),
        maxPlayers: parseInt(maxPlayers),
        pricePerPlayer,
        organizerId: user.id,
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        participants: {
          where: {
            paymentStatus: 'succeeded'
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}