'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface Participant {
  id: number
  name: string
  email?: string
  paymentStatus: string
  createdAt: string
  stripePaymentIntentId?: string
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
}

export default function ManageEventPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [addingParticipant, setAddingParticipant] = useState(false)
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    email: ''
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchEvent()
    }
  }, [user, params.id])

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

  const addCashParticipant = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newParticipant.name.trim()) {
      alert('Please enter participant name')
      return
    }

    setAddingParticipant(true)

    try {
      const response = await fetch(`/api/simple-participants/${params.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newParticipant.name.trim(),
          email: newParticipant.email.trim() || null,
          paymentMethod: 'cash'
        }),
      })

      if (response.ok) {
        setNewParticipant({ name: '', email: '' })
        fetchEvent() // Refresh event data
        alert('Participant added successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add participant')
      }
    } catch (error) {
      console.error('Error adding participant:', error)
      alert('Failed to add participant')
    } finally {
      setAddingParticipant(false)
    }
  }

  const removeParticipant = async (participantId: number) => {
    if (!confirm('Are you sure you want to remove this participant?')) {
      return
    }

    try {
      const response = await fetch(`/api/simple-participants/${params.id}/${participantId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchEvent() // Refresh event data
        alert('Participant removed successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to remove participant')
      }
    } catch (error) {
      console.error('Error removing participant:', error)
      alert('Failed to remove participant')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user || !event) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h1>
        <p className="text-gray-600">The event you're looking for doesn't exist or you don't have permission to manage it.</p>
      </div>
    )
  }

  const isAdmin = user.role === 'ADMIN'
  const progressPercentage = (event.collectedAmount / event.totalCost) * 100

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="card">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.name}</h1>
            <p className="text-gray-600">
              {formatDateTime(event.date)}
            </p>
            <p className="text-gray-600">{event.location}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => router.push(`/event/${event.id}`)}
              className="btn-secondary"
            >
              View Public Page
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{event.paidParticipants}</div>
            <div className="text-sm text-gray-500">Players Registered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{event.availableSpots}</div>
            <div className="text-sm text-gray-500">Spots Available</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(event.collectedAmount)}</div>
            <div className="text-sm text-gray-500">Money Collected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(event.totalCost)}</div>
            <div className="text-sm text-gray-500">Total Needed</div>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div
            className="bg-primary-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          ></div>
        </div>
        <div className="text-sm text-gray-600 text-right">
          {progressPercentage.toFixed(1)}% funded
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Participants ({event.participants.length})
          </h2>

          {event.participants.length > 0 ? (
            <div className="space-y-3">
              {event.participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{participant.name}</div>
                      <div className="text-xs text-gray-400">
                        Added: {new Date(participant.createdAt).toLocaleDateString('pl-PL')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={participant.paymentStatus === 'succeeded'
                      ? (participant.stripePaymentIntentId ? 'status-badge-paid' : 'status-badge-cash')
                      : 'status-badge-cash'
                    }>
                      {participant.paymentStatus === 'succeeded'
                        ? (participant.stripePaymentIntentId ? 'Stripe' : 'Cash')
                        : 'Cash'
                      }
                    </span>
                    {participant.stripePaymentIntentId ? (
                      // Stripe payment - admin only can remove
                      isAdmin ? (
                        <button
                          onClick={() => removeParticipant(participant.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          Contact admin
                        </span>
                      )
                    ) : (
                      // Cash payment - organizer can remove
                      <button
                        onClick={() => removeParticipant(participant.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No participants yet</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Cash Payment</h2>
          <p className="text-sm text-gray-600 mb-4">
            Add participants who paid in cash directly to the event.
          </p>

          {event.availableSpots > 0 ? (
            <form onSubmit={addCashParticipant} className="space-y-4">
              <div>
                <label htmlFor="participantName" className="block text-sm font-medium text-gray-700 mb-2">
                  Participant Name *
                </label>
                <input
                  type="text"
                  id="participantName"
                  required
                  className="input"
                  placeholder="Enter full name"
                  value={newParticipant.name}
                  onChange={(e) => setNewParticipant(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                />
              </div>

              <div>
                <label htmlFor="participantEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  id="participantEmail"
                  className="input"
                  placeholder="participant@email.com"
                  value={newParticipant.email}
                  onChange={(e) => setNewParticipant(prev => ({
                    ...prev,
                    email: e.target.value
                  }))}
                />
              </div>

              <button
                type="submit"
                disabled={addingParticipant || !newParticipant.name.trim()}
                className="btn-primary w-full"
              >
                {addingParticipant ? 'Adding...' : `Add Participant (${formatCurrency(event.pricePerPlayer)})`}
              </button>
            </form>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🚫</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Event is Full</h3>
              <p className="text-gray-600">No more spots available for this event.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}