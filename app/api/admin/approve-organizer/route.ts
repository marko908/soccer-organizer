import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // In production, add admin authentication here
    // const user = await getAuthUser(request)
    // if (!user || !user.isAdmin) return 401

    const body = await request.json()
    const { organizerId, action } = body

    if (!organizerId || !action) {
      return NextResponse.json(
        { error: 'Missing organizerId or action' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve or reject' },
        { status: 400 }
      )
    }

    // Use SQLite direct connection
    const Database = require('better-sqlite3')
    const db = new Database('./dev.db')

    if (action === 'approve') {
      // Approve organizer
      const result = db.prepare(`
        UPDATE organizers
        SET adminApproved = 1, approvedAt = datetime('now'), approvedBy = ?
        WHERE id = ? AND adminApproved = 0
      `).run('admin', organizerId)

      if (result.changes === 0) {
        db.close()
        return NextResponse.json(
          { error: 'Organizer not found or already processed' },
          { status: 404 }
        )
      }

      db.close()
      return NextResponse.json({ message: 'Organizer approved successfully' })
    } else {
      // Reject organizer (delete from database)
      const result = db.prepare('DELETE FROM organizers WHERE id = ? AND adminApproved = 0')
        .run(organizerId)

      if (result.changes === 0) {
        db.close()
        return NextResponse.json(
          { error: 'Organizer not found or already processed' },
          { status: 404 }
        )
      }

      db.close()
      return NextResponse.json({ message: 'Organizer rejected and removed' })
    }
  } catch (error: any) {
    console.error('Approve organizer error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}