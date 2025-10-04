import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSupabaseUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const user = await getSupabaseUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user already has a Stripe account
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', user.id)
      .single()

    const stripe = getStripe()
    let accountId = profile?.stripe_account_id

    // Create a new Connect account if user doesn't have one
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'PL', // Poland
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          blik_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
      })

      accountId = account.id

      // Save account ID to database
      await supabaseAdmin
        .from('users')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id)
    }

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/connect/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/connect/return`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error: any) {
    console.error('Connect onboarding error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create onboarding link' },
      { status: 500 }
    )
  }
}
