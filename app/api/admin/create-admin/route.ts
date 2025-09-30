import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.organizer.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin user already exists' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { email, password, name, setupKey } = body

    // Verify setup key (from environment variable)
    if (setupKey !== process.env.ADMIN_SETUP_KEY) {
      return NextResponse.json(
        { error: 'Invalid setup key' },
        { status: 403 }
      )
    }

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin user
    const admin = await prisma.organizer.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
        emailVerified: true,
        phoneVerified: true,
        adminApproved: true,
        approvedAt: new Date(),
        approvedBy: 'system'
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
      { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // Set cookie
    const response = NextResponse.json({
      message: 'Admin user created successfully',
      user: admin,
      token
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    return response
  } catch (error: any) {
    console.error('Admin creation error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}