'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ConnectRefreshPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect back to connect page to restart onboarding
    setTimeout(() => {
      router.push('/connect')
    }, 1000)
  }, [router])

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="text-6xl mb-4">🔄</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Session Expired
        </h1>
        <p className="text-gray-600">
          Restarting the onboarding process...
        </p>
      </div>
    </div>
  )
}
