'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import LanguageSelector from './LanguageSelector'

export default function Navigation() {
  const { user, logout, loading } = useAuth()
  const { t } = useLanguage()
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
          </div>

          <div className="flex items-center space-x-4">
            {!loading && (
              <>
                {user ? (
                  <>
                    <span className="text-gray-700">{t('dashboard.welcome')}, {user.name}</span>
                    {!isDashboard && (
                      <Link href="/dashboard" className="btn-secondary text-sm">
                        {t('nav.dashboard')}
                      </Link>
                    )}
                    <Link href="/create" className="btn-primary text-sm">
                      {t('dashboard.createEvent')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-gray-600 hover:text-gray-900 text-sm"
                    >
                      {t('nav.logout')}
                    </button>
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