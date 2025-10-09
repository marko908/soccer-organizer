'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface ConnectStatus {
  connected: boolean
  onboardingComplete: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
}

export default function ConnectPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null)
  const [onboarding, setOnboarding] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      checkConnectStatus()
    }
  }, [user])

  const checkConnectStatus = async () => {
    try {
      const response = await fetch('/api/connect/status')
      if (response.ok) {
        const data = await response.json()
        setConnectStatus(data)
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }

  const startOnboarding = async () => {
    setOnboarding(true)
    try {
      const response = await fetch('/api/connect/onboarding', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to Stripe onboarding
        window.location.href = data.url
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to start onboarding')
        setOnboarding(false)
      }
    } catch (error) {
      alert('Failed to start onboarding')
      setOnboarding(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Connect Your Stripe Account
        </h1>

        {connectStatus?.onboardingComplete ? (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-4">✅</div>
                <div>
                  <h3 className="text-lg font-semibold">Account Connected</h3>
                  <p className="text-sm">Your Stripe account is fully set up and ready to receive payments.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Charges</div>
                <div className={`text-lg font-semibold ${connectStatus.chargesEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                  {connectStatus.chargesEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Payouts</div>
                <div className={`text-lg font-semibold ${connectStatus.payoutsEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                  {connectStatus.payoutsEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => router.push('/dashboard')}
                className="btn-primary w-full"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-6 rounded-lg">
              <div className="flex items-start">
                <div className="text-3xl mr-4">💳</div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Enable Payments</h3>
                  <p className="text-sm mb-4">
                    Connect your Stripe account to receive payments from players who join your events.
                    This is required to create and manage events.
                  </p>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>Receive payments directly to your bank account</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>Secure payment processing by Stripe</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">✓</span>
                      <span>Support for cards and BLIK payments</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">What you'll need:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Bank account details</li>
                <li>• Personal identification (PESEL or passport)</li>
                <li>• Business information (if applicable)</li>
              </ul>
            </div>

            <button
              onClick={startOnboarding}
              disabled={onboarding}
              className="btn-primary w-full"
            >
              {onboarding ? 'Redirecting to Stripe...' : 'Connect Stripe Account'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              By connecting your account, you agree to Stripe's Terms of Service
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
