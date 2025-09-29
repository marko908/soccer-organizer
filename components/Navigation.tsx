'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function Navigation() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const isEventPage = pathname?.startsWith('/event/')
  const isCreatePage = pathname === '/create'
  const isDashboard = pathname === '/dashboard'

  return (
    <header className="header-gradient sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-primary-600 transition-colors">
              ⚽ Soccer Organizer
            </Link>

            {isEventPage && (
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 flex items-center"
              >
                ← Back
              </button>
            )}

            {isCreatePage && (
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 flex items-center">
                ← Back to Dashboard
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {!loading && (
              <>
                {user ? (
                  <>
                    <span className="text-gray-700">Hello, {user.name}</span>
                    {!isDashboard && (
                      <Link href="/dashboard" className="btn-secondary text-sm">
                        Dashboard
                      </Link>
                    )}
                    <Link href="/create" className="btn-primary text-sm">
                      Create Event
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-gray-600 hover:text-gray-900 text-sm"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="text-gray-600 hover:text-gray-900">
                      Login
                    </Link>
                    <Link href="/register" className="btn-primary text-sm">
                      Register
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}