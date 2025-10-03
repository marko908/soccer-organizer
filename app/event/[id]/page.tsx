'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { formatCurrency, formatDateTime, formatDateTimeShort } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'

interface Participant {
  id: number
  name: string
  email?: string
  avatarUrl?: string
}

interface Event {
  id: number
  name: string
  date: string
  location: string
  totalCost: number
  maxPlayers: number
  pricePerPlayer: number
  participants: Participant[]
  paidParticipants: number
  collectedAmount: number
  availableSpots: number
  organizerId: string
}

export default function EventPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [participantData, setParticipantData] = useState({
    name: '',
    email: ''
  })
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [nameDisplayOption, setNameDisplayOption] = useState<'fullName' | 'nickname' | 'both'>('fullName')

  // Auto-fill name when user is logged in
  useEffect(() => {
    if (user) {
      setParticipantData(prev => ({
        ...prev,
        name: getDisplayName(),
        email: prev.email || user.email
      }))
    }
  }, [user, nameDisplayOption])

  const getDisplayName = () => {
    if (!user) return ''

    switch (nameDisplayOption) {
      case 'fullName':
        return user.fullName
      case 'nickname':
        return user.nickname
      case 'both':
        return `${user.fullName} (@${user.nickname})`
      default:
        return user.fullName
    }
  }

  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  useEffect(() => {
    fetchEvent()
  }, [params.id])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/simple-event/${params.id}`)
      if (response.ok) {
        const eventData = await response.json()
        setEvent(eventData)
      } else {
        console.error('Event not found')
      }
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!participantData.name.trim()) {
      alert('Please enter your name')
      return
    }

    setPaymentLoading(true)

    try {
      const response = await fetch('/api/simple-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: params.id,
          participantName: participantData.name.trim(),
          participantEmail: participantData.email.trim() || null,
          userId: user?.id || null,
          avatarUrl: user?.avatarUrl || '/default-avatar.svg',
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Check if in test mode - if so, redirect immediately
        if (data.testMode) {
          console.log('🧪 Test mode: Redirecting to success page')
          window.location.href = data.url
        } else {
          // Production mode: redirect to Stripe checkout
          window.location.href = data.url
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create payment session')
      }
    } catch (error) {
      console.error('Error creating payment session:', error)
      alert('Failed to create payment session')
    } finally {
      setPaymentLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg text-gray-600">Loading event...</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
        <p className="text-gray-600">The event you're looking for doesn't exist.</p>
      </div>
    )
  }

  const progressPercentage = (event.collectedAmount / event.totalCost) * 100
  const isOrganizer = user && event && user.id === event.organizerId

  return (
    <div className="max-w-4xl mx-auto">
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
          🎉 Payment successful! You've secured your spot in the game.
        </div>
      )}

      {canceled && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
          Payment was canceled. You can try again if you'd like to join the game.
        </div>
      )}

      <div className="card mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.name}</h1>

            <div className="space-y-3 text-gray-600">
              <div className="flex items-center">
                <span className="text-lg">📅</span>
                <span className="ml-2">
                  {formatDateTimeShort(event.date)}
                </span>
              </div>

              <div className="flex items-center">
                <span className="text-lg">📍</span>
                <span className="ml-2">{event.location}</span>
              </div>

              <div className="flex items-center">
                <span className="text-lg">💰</span>
                <span className="ml-2">{formatCurrency(event.pricePerPlayer)} per player</span>
              </div>
            </div>
          </div>

          <div className="lg:w-80">
            <div className="stat-card space-y-6">
              {isOrganizer && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-gray-700">Collection Progress</span>
                    <span className="text-sm text-gray-600 font-medium">
                      {formatCurrency(event.collectedAmount)} / {formatCurrency(event.totalCost)}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 text-right">
                    {progressPercentage.toFixed(1)}% complete
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {event.paidParticipants}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Registered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600 mb-1">
                    {event.availableSpots}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Registered Players ({event.participants.length})
          </h2>

          {event.participants.length > 0 ? (
            <div className="space-y-2">
              {event.participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className="participant-card"
                >
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
                      <Image
                        src={participant.avatarUrl || '/default-avatar.svg'}
                        alt={participant.name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{participant.name}</div>
                    {participant.email && (
                      <div className="text-sm text-gray-500">{participant.email}</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    ✓ Confirmed
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No players registered yet</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Join the Game</h2>

          {event.availableSpots > 0 ? (
            <div className="space-y-4">
              {!showPaymentForm ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Secure your spot by paying {formatCurrency(event.pricePerPlayer)}
                  </p>
                  <button
                    onClick={() => setShowPaymentForm(true)}
                    className="btn-primary w-full"
                  >
                    Pay & Sign Up
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {user && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name As
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="nameDisplay"
                            value="fullName"
                            checked={nameDisplayOption === 'fullName'}
                            onChange={(e) => setNameDisplayOption(e.target.value as 'fullName')}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">{user.fullName}</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="nameDisplay"
                            value="nickname"
                            checked={nameDisplayOption === 'nickname'}
                            onChange={(e) => setNameDisplayOption(e.target.value as 'nickname')}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">@{user.nickname}</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="nameDisplay"
                            value="both"
                            checked={nameDisplayOption === 'both'}
                            onChange={(e) => setNameDisplayOption(e.target.value as 'both')}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">{user.fullName} (@{user.nickname})</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      className="input"
                      placeholder="Enter your full name"
                      value={participantData.name}
                      onChange={(e) => setParticipantData(prev => ({
                        ...prev,
                        name: e.target.value
                      }))}
                      disabled={!!user}
                    />
                    {user && (
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-filled from your profile. Select a different display option above to change.
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email (optional)
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="input"
                      placeholder="your.email@example.com"
                      value={participantData.email}
                      onChange={(e) => setParticipantData(prev => ({
                        ...prev,
                        email: e.target.value
                      }))}
                      disabled={!!user}
                    />
                    {user && (
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-filled from your profile.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handlePayment}
                      disabled={paymentLoading || !participantData.name.trim()}
                      className="btn-primary flex-1"
                    >
                      {paymentLoading ? 'Processing...' : `Pay ${formatCurrency(event.pricePerPlayer)}`}
                    </button>
                    <button
                      onClick={() => setShowPaymentForm(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    Payments are processed securely through Stripe. BLIK payments are supported.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">😞</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Event is Full</h3>
              <p className="text-gray-600">All spots have been taken for this game.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}