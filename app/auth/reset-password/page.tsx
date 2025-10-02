'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [validSession, setValidSession] = useState(false)

  useEffect(() => {
    // Check if user has a valid session from reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔐 Reset password session:', session)

      if (session) {
        setValidSession(true)
      } else {
        console.log('⚠️ No valid session for password reset')
        setMessage({ type: 'error', text: 'Invalid or expired reset link. Please request a new one.' })
      }
    }

    checkSession()
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        console.error('❌ Password reset error:', error)
        setMessage({ type: 'error', text: error.message || 'Failed to reset password' })
      } else {
        console.log('✅ Password reset successful')
        setMessage({ type: 'success', text: 'Password updated successfully! Redirecting to dashboard...' })

        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (error: any) {
      console.error('❌ Password reset exception:', error)
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (!validSession && !message) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900">Verifying reset link...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            🔐 {t('auth.resetPassword.title') || 'Reset Your Password'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.resetPassword.subtitle') || 'Enter your new password below'}
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </p>
          </div>
        )}

        {validSession && !message?.type.includes('success') && (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.resetPassword.newPassword') || 'New Password'}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.resetPassword.confirmPassword') || 'Confirm New Password'}
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('auth.resetPassword.updating') || 'Updating...'}
                  </span>
                ) : (
                  t('auth.resetPassword.submit') || 'Reset Password'
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {t('auth.resetPassword.backToLogin') || 'Back to Login'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
