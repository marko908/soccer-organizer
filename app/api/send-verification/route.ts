import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Use SQLite direct connection
    const Database = require('better-sqlite3')
    const db = new Database('./dev.db')

    // Check if organizer exists
    const organizer = db.prepare('SELECT id, emailVerified FROM organizers WHERE email = ?').get(email)

    if (!organizer) {
      db.close()
      return NextResponse.json(
        { error: 'Organizer not found' },
        { status: 404 }
      )
    }

    if (organizer.emailVerified) {
      db.close()
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      )
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Save verification token
    db.prepare(`
      INSERT OR REPLACE INTO email_verifications (token, email, organizerId, expiresAt, createdAt)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).run(token, email, organizer.id, expiresAt.toISOString())

    db.close()

    // In production, you would send actual email here
    // For now, just return the verification link for testing
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${token}`

    console.log(`Email verification link for ${email}: ${verificationUrl}`)

    return NextResponse.json({
      message: 'Verification email sent',
      // Remove this in production - only for testing
      verificationUrl: process.env.NODE_ENV === 'development' ? verificationUrl : undefined
    })
  } catch (error: any) {
    console.error('Send verification error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}