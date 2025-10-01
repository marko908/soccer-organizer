import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    // Find verification token
    const { data: verification, error: verifyError } = await supabase
      .from('email_verifications')
      .select('*, organizers:organizer_id(id, email)')
      .eq('token', token)
      .single()

    if (verifyError || !verification || !verification.organizers || verification.used_at) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(verification.expires_at)

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 400 }
      )
    }

    // Mark email as verified
    const { error: updateOrgError } = await supabase
      .from('organizers')
      .update({ email_verified: true })
      .eq('id', verification.organizer_id)

    if (updateOrgError) throw updateOrgError

    // Mark token as used
    const { error: updateVerifyError } = await supabase
      .from('email_verifications')
      .update({ used_at: new Date().toISOString() })
      .eq('id', verification.id)

    if (updateVerifyError) throw updateVerifyError

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