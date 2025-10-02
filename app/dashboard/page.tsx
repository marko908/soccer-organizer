'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDateTimeShort } from '@/lib/utils'

interface Event {
  id: number
  name: string
  date: string
  location: string
  totalCost: number
  maxPlayers: number
  pricePerPlayer: number
  participants: any[]
  paidParticipants: number
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchEvents()
    }
  }, [user])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/simple-events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setEventsLoading(false)
    }
  }

  if (loading) {
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
          <p className="text-gray-600">Welcome back, {user.fullName}!</p>
        </div>
        {user.canCreateEvents && (
          <Link href="/create" className="btn-primary">
            Create New Event
          </Link>
        )}
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Events</h2>
        </div>

        {eventsLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-600">Loading events...</div>
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event) => {
              const paidParticipants = event.paidParticipants || 0
              const collectedAmount = paidParticipants * event.pricePerPlayer
              const progressPercentage = (collectedAmount / event.totalCost) * 100

              return (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{event.name}</h3>
                      <p className="text-sm text-gray-600">
                        {formatDateTimeShort(event.date)}
                      </p>
                      <p className="text-sm text-gray-600">{event.location}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/event/${event.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        View Event
                      </Link>
                      <Link
                        href={`/event/${event.id}/manage`}
                        className="btn-secondary text-sm"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{paidParticipants}</div>
                      <div className="text-xs text-gray-500">Players</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{event.maxPlayers - paidParticipants}</div>
                      <div className="text-xs text-gray-500">Spots Left</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{collectedAmount.toFixed(2)} PLN</div>
                      <div className="text-xs text-gray-500">Collected</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{event.totalCost} PLN</div>
                      <div className="text-xs text-gray-500">Target</div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {progressPercentage.toFixed(1)}% funded
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">⚽</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-600 mb-4">Create your first event to get started!</p>
            <Link href="/create" className="btn-primary">
              Create New Event
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}