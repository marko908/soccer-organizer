import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    if (action === 'approve') {
      // Approve organizer
      try {
        const updatedOrganizer = await prisma.organizer.updateMany({
          where: {
            id: organizerId,
            adminApproved: false
          },
          data: {
            adminApproved: true,
            approvedAt: new Date(),
            approvedBy: 'admin'
          }
        })

        if (updatedOrganizer.count === 0) {
          return NextResponse.json(
            { error: 'Organizer not found or already processed' },
            { status: 404 }
          )
        }

        return NextResponse.json({ message: 'Organizer approved successfully' })
      } catch (error) {
        console.error('Error approving organizer:', error)
        return NextResponse.json(
          { error: 'Failed to approve organizer' },
          { status: 500 }
        )
      }
    } else {
      // Reject organizer (delete from database)
      try {
        const deletedOrganizer = await prisma.organizer.deleteMany({
          where: {
            id: organizerId,
            adminApproved: false
          }
        })

        if (deletedOrganizer.count === 0) {
          return NextResponse.json(
            { error: 'Organizer not found or already processed' },
            { status: 404 }
          )
        }

        return NextResponse.json({ message: 'Organizer rejected and removed' })
      } catch (error) {
        console.error('Error rejecting organizer:', error)
        return NextResponse.json(
          { error: 'Failed to reject organizer' },
          { status: 500 }
        )
      }
    }
  } catch (error: any) {
    console.error('Approve organizer error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}