import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // In production, add admin authentication here
    // const user = await getAuthUser(request)
    // if (!user || !user.isAdmin) return 401

    // Use SQLite direct connection
    const Database = require('better-sqlite3')
    const db = new Database('./dev.db')

    // Get all organizers waiting for approval
    const organizers = db.prepare(`
      SELECT
        id, name, email, phone, emailVerified, adminApproved, createdAt
      FROM organizers
      WHERE adminApproved = 0
      ORDER BY createdAt DESC
    `).all()

    db.close()

    return NextResponse.json({ organizers })
  } catch (error: any) {
    console.error('Get pending organizers error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}