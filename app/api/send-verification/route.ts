import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabase } from '@/lib/supabase'

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

    // Check if organizer exists
    const { data: organizer, error: orgError } = await supabase
      .from('users')
      .select('id, email_verified')
      .eq('email', email)
      .single()

    if (orgError || !organizer) {
      return NextResponse.json(
        { error: 'Organizer not found' },
        { status: 404 }
      )
    }

    if (organizer.email_verified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      )
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Delete any existing verification tokens for this organizer
    await supabase
      .from('email_verifications')
      .delete()
      .eq('organizer_id', organizer.id)

    // Create new verification token
    const { error: insertError } = await supabase
      .from('email_verifications')
      .insert({
        token,
        email,
        organizer_id: organizer.id,
        expires_at: expiresAt.toISOString()
      })

    if (insertError) throw insertError

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