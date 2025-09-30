'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link')
      return
    }

    verifyEmail(token)
  }, [searchParams])

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('Your email has been verified successfully!')
        setEmail(data.email)
      } else {
        setStatus('error')
        setMessage(data.error || 'Verification failed')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>

        <div className="mt-8">
          {status === 'loading' && (
            <div className="text-center">
              <div className="text-lg text-gray-600">
                Verifying your email...
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-6 rounded-lg text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-semibold mb-2">Email Verified!</h3>
              <p className="mb-4">{message}</p>
              {email && (
                <p className="text-sm text-green-600 mb-4">
                  Verified email: {email}
                </p>
              )}
              <Link
                href="/login"
                className="btn-primary inline-block"
              >
                Continue to Login
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-6 rounded-lg text-center">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="text-lg font-semibold mb-2">Verification Failed</h3>
              <p className="mb-4">{message}</p>
              <div className="space-y-2">
                <Link
                  href="/register"
                  className="btn-secondary inline-block mr-2"
                >
                  Create New Account
                </Link>
                <Link
                  href="/login"
                  className="btn-primary inline-block"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-primary-600 hover:text-primary-500">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}