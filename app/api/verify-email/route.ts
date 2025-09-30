import { NextRequest, NextResponse } from 'next/server'

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

    // Use SQLite direct connection
    const Database = require('better-sqlite3')
    const db = new Database('./dev.db')

    // Find verification token
    const verification = db.prepare(`
      SELECT v.*, o.email
      FROM email_verifications v
      JOIN organizers o ON v.organizerId = o.id
      WHERE v.token = ? AND v.usedAt IS NULL
    `).get(token)

    if (!verification) {
      db.close()
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(verification.expiresAt)

    if (now > expiresAt) {
      db.close()
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 400 }
      )
    }

    // Mark email as verified
    db.prepare('UPDATE organizers SET emailVerified = 1 WHERE id = ?')
      .run(verification.organizerId)

    // Mark token as used
    db.prepare('UPDATE email_verifications SET usedAt = datetime("now") WHERE id = ?')
      .run(verification.id)

    db.close()

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