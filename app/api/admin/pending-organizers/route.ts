import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // In production, add admin authentication here
    // const user = await getAuthUser(request)
    // if (!user || !user.isAdmin) return 401

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