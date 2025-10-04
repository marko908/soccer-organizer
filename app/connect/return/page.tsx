'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ConnectReturnPage() {
  const router = useRouter()

  useEffect(() => {
    // Give Stripe a moment to process, then redirect
    setTimeout(() => {
      router.push('/connect')
    }, 2000)
  }, [router])

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Account Setup Complete!
        </h1>
        <p className="text-gray-600">
          Redirecting you back...
        </p>
      </div>
    </div>
  )
}
