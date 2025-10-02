'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

function ConfirmEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        console.log('📧 All URL params:', Object.fromEntries(searchParams.entries()))

        // Try the manual flow first
        const code = searchParams.get('code')
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')

        if (code) {
          console.log('📧 Using PKCE flow with code:', code)
          console.log('📧 Calling exchangeCodeForSession...')

          try {
            const exchangePromise = supabase.auth.exchangeCodeForSession(code)
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Exchange code timeout after 10s')), 10000)
            )

            const { data, error } = await Promise.race([exchangePromise, timeoutPromise]) as any

            console.log('📧 exchangeCodeForSession response - data:', data)
            console.log('📧 exchangeCodeForSession response - error:', error)

            if (error) {
              console.error('❌ Email confirmation error:', error)
              console.error('❌ Error details:', JSON.stringify(error, null, 2))
              setStatus('error')
              setErrorMessage(error.message || 'Confirmation link expired or invalid')
            } else {
              console.log('✅ Email confirmed successfully!')
              console.log('✅ User data:', data)
              setStatus('success')
              setTimeout(() => {
                router.push('/dashboard')
              }, 2000)
            }
          } catch (exchangeError: any) {
            console.error('❌ exchangeCodeForSession threw error:', exchangeError)
            setStatus('error')
            setErrorMessage(exchangeError.message || 'Failed to exchange code for session')
          }
        } else if (token_hash && type) {
          console.log('📧 Using legacy flow - token_hash:', token_hash, 'type:', type)

          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          })

          if (error) {
            console.error('❌ Email confirmation error:', error)
            setStatus('error')
            setErrorMessage(error.message)
          } else {
            console.log('✅ Email confirmed successfully!')
            setStatus('success')
            setTimeout(() => {
              router.push('/dashboard')
            }, 2000)
          }
        } else {
          console.log('⚠️ No confirmation parameters found')
          setStatus('error')
          setErrorMessage('Invalid confirmation link - no code or token provided')
        }
      } catch (error: any) {
        console.error('❌ Confirmation error:', error)
        setStatus('error')
        setErrorMessage(error.message || 'An error occurred')
      }
    }

    confirmEmail()
  }, [searchParams, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('auth.confirmEmail.verifying')}
          </h1>
          <p className="text-gray-600">
            {t('auth.confirmEmail.pleaseWait')}
          </p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('auth.confirmEmail.error')}
          </h1>
          <p className="text-gray-600 mb-6">
            {errorMessage || t('auth.confirmEmail.errorMessage')}
          </p>
          <Link href="/login" className="btn-primary inline-block">
            {t('auth.confirmEmail.backToLogin')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card max-w-md w-full text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('auth.confirmEmail.success')}
        </h1>
        <p className="text-gray-600 mb-6">
          {t('auth.confirmEmail.successMessage')}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          {t('auth.confirmEmail.redirecting')}
        </p>
        <Link href="/dashboard" className="btn-primary inline-block">
          {t('auth.confirmEmail.goToDashboard')}
        </Link>
      </div>
    </div>
  )
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
        </div>
      </div>
    }>
      <ConfirmEmailContent />
    </Suspense>
  )
}
