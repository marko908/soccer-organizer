import { NextRequest, NextResponse } from 'next/server'
import { createOrganizer, generateToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const existingOrganizer = await prisma.organizer.findUnique({
      where: { email },
    })

    if (existingOrganizer) {
      return NextResponse.json(
        { error: 'An organizer with this email already exists' },
        { status: 409 }
      )
    }

    const organizer = await createOrganizer(email, password, name)

    const user = {
      id: organizer.id,
      email: organizer.email,
      name: organizer.name,
    }

    const token = generateToken(user)

    const response = NextResponse.json({ user, token })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}