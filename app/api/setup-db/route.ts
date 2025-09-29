import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Create organizers table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "organizers" (
        "id" SERIAL NOT NULL,
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "organizers_pkey" PRIMARY KEY ("id")
      )
    `

    // Create unique index for email
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "organizers_email_key" ON "organizers"("email")
    `

    // Create events table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "events" (
        "id" SERIAL NOT NULL,
        "name" TEXT NOT NULL,
        "date" TIMESTAMP(3) NOT NULL,
        "location" TEXT NOT NULL,
        "totalCost" DOUBLE PRECISION NOT NULL,
        "maxPlayers" INTEGER NOT NULL,
        "pricePerPlayer" DOUBLE PRECISION NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "organizerId" INTEGER NOT NULL,
        CONSTRAINT "events_pkey" PRIMARY KEY ("id")
      )
    `

    // Create participants table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "participants" (
        "id" SERIAL NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT,
        "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
        "stripePaymentIntentId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "eventId" INTEGER NOT NULL,
        CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
      )
    `

    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}