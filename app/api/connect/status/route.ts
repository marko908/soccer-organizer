import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSupabaseUser } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const user = await getSupabaseUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's Stripe account ID
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('stripe_account_id, stripe_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_account_id) {
      return NextResponse.json({
        connected: false,
        onboardingComplete: false,
        chargesEnabled: false,
        payoutsEnabled: false,
      })
    }

    // Fetch account details from Stripe
    const stripe = getStripe()
    const account = await stripe.accounts.retrieve(profile.stripe_account_id)

    const chargesEnabled = account.charges_enabled || false
    const payoutsEnabled = account.payouts_enabled || false
    const onboardingComplete = chargesEnabled && payoutsEnabled

    // Update database with latest status
    await supabaseAdmin
      .from('users')
      .update({
        stripe_onboarding_complete: onboardingComplete,
        stripe_charges_enabled: chargesEnabled,
        stripe_payouts_enabled: payoutsEnabled,
      })
      .eq('id', user.id)

    return NextResponse.json({
      connected: true,
      onboardingComplete,
      chargesEnabled,
      payoutsEnabled,
      accountId: profile.stripe_account_id,
    })
  } catch (error: any) {
    console.error('Connect status error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch account status' },
      { status: 500 }
    )
  }
}
