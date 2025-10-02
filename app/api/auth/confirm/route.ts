import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  console.log('🔐 Server-side confirmation - code:', code)

  if (!code) {
    return NextResponse.redirect(new URL('/auth/confirm?error=missing_code', request.url))
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('🔐 Calling exchangeCodeForSession...')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    console.log('🔐 Response data:', data)
    console.log('🔐 Response error:', error)

    if (error) {
      console.error('❌ Server-side confirmation error:', error)
      return NextResponse.redirect(
        new URL(`/auth/confirm?error=${encodeURIComponent(error.message)}`, request.url)
      )
    }

    if (data.session) {
      console.log('✅ Session created successfully')

      // Set the session cookie
      const response = NextResponse.redirect(new URL('/dashboard', request.url))

      // Set auth cookie
      response.cookies.set('sb-access-token', data.session.access_token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: data.session.expires_in,
      })

      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return response
    }

    return NextResponse.redirect(new URL('/auth/confirm?error=no_session', request.url))
  } catch (error: any) {
    console.error('❌ Server-side confirmation exception:', error)
    return NextResponse.redirect(
      new URL(`/auth/confirm?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }
}
