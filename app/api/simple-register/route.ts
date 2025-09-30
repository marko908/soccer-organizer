import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, phone } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Check if user exists
    const existingUser = await prisma.organizer.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    // Insert new user
    const user = await prisma.organizer.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone: phone || null,
        emailVerified: false,
        phoneVerified: false,
        adminApproved: false
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // Set cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    // Send verification email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
    } catch (error) {
      console.error('Failed to send verification email:', error)
      // Don't fail registration if email sending fails
    }

    return response
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}