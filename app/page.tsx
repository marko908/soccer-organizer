'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user, loading } = useAuth()
  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <div className="text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-medium mb-8">
            <span className="mr-2">🚀</span>
            New: Cash payment support for organizers
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Organize Soccer Games
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-700 block sm:inline"> Like a Pro</span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            The complete solution for organizing soccer games with a pay-to-play system.
            Create events, collect payments instantly, and manage participants effortlessly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            {!loading && (
              user ? (
                <>
                  <Link href="/dashboard" className="btn-primary">
                    Go to Dashboard
                  </Link>
                  <Link href="/create" className="btn-secondary">
                    Create Event
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/register" className="btn-primary">
                    Get Started Free
                  </Link>
                  <Link href="/login" className="btn-secondary">
                    Sign In
                  </Link>
                </>
              )
            )}
          </div>

          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              No setup fees
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              BLIK payments
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Real-time updates
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need</h2>
          <p className="text-lg text-gray-600">Powerful features to make organizing soccer games effortless</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="feature-card">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">⚽</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Quick Event Creation</h3>
            <p className="text-gray-600">Create soccer events in seconds with our intuitive interface. Set dates, locations, and pricing with ease.</p>
          </div>

          <div className="feature-card">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-green-100 to-green-200 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">💳</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure Payments</h3>
            <p className="text-gray-600">Integrated Stripe payments with full BLIK support. Players pay instantly and securely to guarantee their spot.</p>
          </div>

          <div className="feature-card">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">👥</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Live Tracking</h3>
            <p className="text-gray-600">Real-time participant lists, payment status, and progress tracking. Always know who's coming to play.</p>
          </div>

          <div className="feature-card">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">💰</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Cash Payments</h3>
            <p className="text-gray-600">Accept both online and cash payments. Manually add participants who pay in person for complete flexibility.</p>
          </div>

          <div className="feature-card">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Analytics</h3>
            <p className="text-gray-600">Track your events with detailed analytics. Monitor collection progress and manage multiple games effortlessly.</p>
          </div>

          <div className="feature-card">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-red-100 to-red-200 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🔐</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Organizer Dashboard</h3>
            <p className="text-gray-600">Professional dashboard for organizers. Manage all your events, participants, and payments in one place.</p>
          </div>
        </div>
      </div>

      {/* How it works section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-12 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How it works</h2>
          <p className="text-lg text-gray-600">Get your soccer game organized in 3 simple steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Event</h3>
            <p className="text-gray-600">Set up your game details: date, location, total cost, and max players</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Share Link</h3>
            <p className="text-gray-600">Share your event link with players. They can pay instantly to secure their spot</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Play Ball!</h3>
            <p className="text-gray-600">Track payments in real-time. When you reach enough players, game on!</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-12 text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to organize your first game?</h2>
        <p className="text-primary-100 mb-8 text-lg">Join organizers who trust Soccer Organizer for their games</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!loading && (
            user ? (
              <>
                <Link href="/dashboard" className="bg-white text-primary-600 font-semibold py-3 px-8 rounded-xl hover:bg-gray-50 transition-colors">
                  Go to Dashboard
                </Link>
                <Link href="/create" className="border-2 border-white text-white font-semibold py-3 px-8 rounded-xl hover:bg-white hover:text-primary-600 transition-colors">
                  Create Event
                </Link>
              </>
            ) : (
              <>
                <Link href="/register" className="bg-white text-primary-600 font-semibold py-3 px-8 rounded-xl hover:bg-gray-50 transition-colors">
                  Start Free Today
                </Link>
                <Link href="/login" className="border-2 border-white text-white font-semibold py-3 px-8 rounded-xl hover:bg-white hover:text-primary-600 transition-colors">
                  Sign In
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </div>
  )
}