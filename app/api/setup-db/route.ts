import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Try to create tables by running a simple query
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "organizers" (
        "id" SERIAL NOT NULL,
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "organizers_pkey" PRIMARY KEY ("id")
      );
    `

    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "organizers_email_key" ON "organizers"("email");
    `

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
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "organizerId" INTEGER NOT NULL,

        CONSTRAINT "events_pkey" PRIMARY KEY ("id")
      );
    `

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
      );
    `

    // Add foreign key constraints
    await prisma.$executeRaw`
      ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_organizerId_fkey";
      ALTER TABLE "events" ADD CONSTRAINT "events_organizerId_fkey"
      FOREIGN KEY ("organizerId") REFERENCES "organizers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `

    await prisma.$executeRaw`
      ALTER TABLE "participants" DROP CONSTRAINT IF EXISTS "participants_eventId_fkey";
      ALTER TABLE "participants" ADD CONSTRAINT "participants_eventId_fkey"
      FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
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