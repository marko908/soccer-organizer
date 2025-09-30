import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAuthUser } from '@/lib/simple-auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Admin authentication required
    const user = await getAuthUser(request)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get all organizers waiting for approval
    const organizers = await prisma.organizer.findMany({
      where: { adminApproved: false },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emailVerified: true,
        adminApproved: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ organizers })
  } catch (error: any) {
    console.error('Get pending organizers error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}