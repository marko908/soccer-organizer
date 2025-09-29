'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Home() {
  const { user, loading } = useAuth()
  const { t } = useLanguage()

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <div className="text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-medium mb-8">
            <span className="mr-2">🚀</span>
            {t('home.newFeature')}
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {t('home.organizeTitle')}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-700 block sm:inline"> {t('home.organizeSubtitle')}</span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('home.heroDescription')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            {!loading && (
              user ? (
                <>
                  <Link href="/dashboard" className="btn-primary">
                    {t('home.goToDashboard')}
                  </Link>
                  <Link href="/create" className="btn-secondary">
                    {t('home.createEvent')}
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/register" className="btn-primary">
                    {t('home.getStartedFree')}
                  </Link>
                  <Link href="/login" className="btn-secondary">
                    {t('home.signIn')}
                  </Link>
                </>
              )
            )}
          </div>

          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              {t('home.noSetupFees')}
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              {t('home.blikPayments')}
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              {t('home.realTimeUpdates')}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('home.everythingYouNeed')}</h2>
          <p className="text-lg text-gray-600">{t('home.powerfulFeatures')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="feature-card">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">⚽</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('home.quickEventCreation')}</h3>
            <p className="text-gray-600">{t('home.quickEventDescription')}</p>
          </div>

          <div className="feature-card">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">💳</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('home.securePayments')}</h3>
            <p className="text-gray-600">{t('home.securePaymentsDescription')}</p>
          </div>

          <div className="feature-card">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">👥</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('home.liveTracking')}</h3>
            <p className="text-gray-600">{t('home.liveTrackingDescription')}</p>
          </div>

          <div className="feature-card">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">💰</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('home.cashPayments')}</h3>
            <p className="text-gray-600">{t('home.cashPaymentsDescription')}</p>
          </div>

          <div className="feature-card">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('home.smartAnalytics')}</h3>
            <p className="text-gray-600">{t('home.smartAnalyticsDescription')}</p>
          </div>

          <div className="feature-card">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-red-100 to-red-200 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🔐</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('home.organizerDashboard')}</h3>
            <p className="text-gray-600">{t('home.organizerDashboardDescription')}</p>
          </div>
        </div>
      </div>

      {/* How it works section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-12 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('home.howItWorks')}</h2>
          <p className="text-lg text-gray-600">{t('home.howItWorksDescription')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('home.step1Title')}</h3>
            <p className="text-gray-600">{t('home.step1Description')}</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('home.step2Title')}</h3>
            <p className="text-gray-600">{t('home.step2Description')}</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('home.step3Title')}</h3>
            <p className="text-gray-600">{t('home.step3Description')}</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-12 text-white">
        <h2 className="text-3xl font-bold mb-4">{t('home.readyToOrganize')}</h2>
        <p className="text-primary-100 mb-8 text-lg">{t('home.joinOrganizers')}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!loading && (
            user ? (
              <>
                <Link href="/dashboard" className="bg-white text-primary-600 font-semibold py-3 px-8 rounded-xl hover:bg-gray-50 transition-colors">
                  {t('home.goToDashboard')}
                </Link>
                <Link href="/create" className="border-2 border-white text-white font-semibold py-3 px-8 rounded-xl hover:bg-white hover:text-primary-600 transition-colors">
                  {t('home.createEvent')}
                </Link>
              </>
            ) : (
              <>
                <Link href="/register" className="bg-white text-primary-600 font-semibold py-3 px-8 rounded-xl hover:bg-gray-50 transition-colors">
                  {t('home.startFreeToday')}
                </Link>
                <Link href="/login" className="border-2 border-white text-white font-semibold py-3 px-8 rounded-xl hover:bg-white hover:text-primary-600 transition-colors">
                  {t('home.signIn')}
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </div>
  )
}