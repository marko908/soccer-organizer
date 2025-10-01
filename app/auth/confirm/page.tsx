'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

export default function ConfirmEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Get the token from URL (Supabase will handle this automatically)
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')

        if (!token_hash || type !== 'email') {
          setStatus('error')
          setErrorMessage('Invalid confirmation link')
          return
        }

        // Supabase automatically handles the token verification
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'email',
        })

        if (error) {
          console.error('Email confirmation error:', error)
          setStatus('error')
          setErrorMessage(error.message)
        } else {
          setStatus('success')
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push('/dashboard')
          }, 3000)
        }
      } catch (error: any) {
        console.error('Confirmation error:', error)
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
