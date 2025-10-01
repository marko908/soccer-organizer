'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import LanguageSelector from './LanguageSelector'

export default function Navigation() {
  const { user, logout, loading } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const isEventPage = pathname?.startsWith('/event/')
  const isCreatePage = pathname === '/create'
  const isDashboard = pathname === '/dashboard'
  const isAdminPage = pathname === '/admin'
  const isProfilePage = pathname === '/profile'

  return (
    <header className="header-gradient sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-primary-600 transition-colors">
              ⚽ {t('home.title')}
            </Link>

            {isEventPage && (
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 flex items-center"
              >
                ← {t('common.back')}
              </button>
            )}

            {isCreatePage && (
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 flex items-center">
                ← {t('manage.backToDashboard')}
              </Link>
            )}

            {isAdminPage && (
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
                    {user.canCreateEvents && (
                      <Link href="/create" className="btn-primary text-sm">
                        {t('dashboard.createEvent')}
                      </Link>
                    )}

                    {/* User Profile Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center space-x-2 focus:outline-none"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 hover:border-primary-500 transition-colors">
                          <Image
                            src={user.avatarUrl}
                            alt="Profile"
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                        <svg
                          className={`w-4 h-4 text-gray-600 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {dropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setDropdownOpen(false)}
                          />
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                            <div className="px-4 py-2 border-b border-gray-200">
                              <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                              <p className="text-xs text-gray-500">@{user.nickname}</p>
                              {user.role === 'ADMIN' && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                                  Admin
                                </span>
                              )}
                            </div>

                            <Link
                              href="/profile"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setDropdownOpen(false)}
                            >
                              👤 My Profile
                            </Link>

                            <Link
                              href="/dashboard"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setDropdownOpen(false)}
                            >
                              📊 My Events
                            </Link>

                            {user.role === 'ADMIN' && (
                              <Link
                                href="/admin"
                                className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                onClick={() => setDropdownOpen(false)}
                              >
                                🔐 Admin Panel
                              </Link>
                            )}

                            <hr className="my-2 border-gray-200" />

                            <button
                              onClick={() => {
                                setDropdownOpen(false)
                                handleLogout()
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              🚪 {t('nav.logout')}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="text-gray-600 hover:text-gray-900">
                      {t('nav.login')}
                    </Link>
                    <Link href="/register" className="btn-primary text-sm">
                      {t('nav.register')}
                    </Link>
                  </>
                )}
              </>
            )}
            <LanguageSelector />
          </div>
        </div>
      </div>
    </header>
  )
}