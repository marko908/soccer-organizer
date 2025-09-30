import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Find verification token
    const verification = await prisma.emailVerification.findUnique({
      where: { token },
      include: {
        organizer: {
          select: { id: true, email: true }
        }
      }
    })

    if (!verification || !verification.organizer || verification.usedAt) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    const now = new Date()

    if (now > verification.expiresAt) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 400 }
      )
    }

    // Mark email as verified and token as used
    await prisma.$transaction([
      prisma.organizer.update({
        where: { id: verification.organizerId! },
        data: { emailVerified: true }
      }),
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: { usedAt: new Date() }
      })
    ])

    return NextResponse.json({
      message: 'Email verified successfully',
      email: verification.email
    })
  } catch (error: any) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}