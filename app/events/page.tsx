'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatCurrency, formatDateTimeShort, formatTimeRange, formatFieldType, getFieldTypeIcon } from '@/lib/utils'
import Image from 'next/image'

interface Event {
  id: number
  name: string
  date: string
  endTime: string
  city: string
  location: string
  totalCost: number
  minPlayers: number
  maxPlayers: number
  pricePerPlayer: number
  playersPerTeam: number
  fieldType: 'futsal' | 'artificial_grass' | 'natural_grass'
  cleatsAllowed: boolean
  paidParticipants: number
  availableSpots: number
  organizer: {
    fullName: string
    nickname: string
    avatarUrl: string
  }
}

export default function PublicEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/public-events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events)
      } else {
        console.error('Failed to fetch events')
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg text-gray-600">Loading events...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Upcoming Events</h1>
        <p className="text-gray-600">Find and join soccer games in your area</p>
      </div>

      {events.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">⚽</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Events Available</h2>
          <p className="text-gray-600 mb-6">
            There are no upcoming events at the moment. Check back later!
          </p>
          <Link href="/" className="btn-primary inline-block">
            Go Home
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/event/${event.id}`}
              className="card hover:shadow-xl transition-all duration-200 cursor-pointer block"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Left Section: Event Info */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {event.name}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📅</span>
                      <span>{formatDateTimeShort(event.date)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-lg">⏰</span>
                      <span>{formatTimeRange(event.date, event.endTime)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏙️</span>
                      <span>{event.city}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getFieldTypeIcon(event.fieldType)}</span>
                      <span>{formatFieldType(event.fieldType)} • {event.playersPerTeam}v{event.playersPerTeam}</span>
                    </div>

                    <div className="flex items-center gap-2 sm:col-span-2">
                      <span className="text-lg">📍</span>
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  </div>

                  {/* Organizer */}
                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
                      <Image
                        src={event.organizer.avatarUrl}
                        alt={event.organizer.fullName}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Organized by {event.organizer.fullName}
                      </div>
                      <div className="text-xs text-gray-500">
                        @{event.organizer.nickname}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section: Stats & Status */}
                <div className="lg:w-64 flex-shrink-0">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Price</span>
                      <span className="text-xl font-bold text-primary-600">
                        {formatCurrency(event.pricePerPlayer)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Spots</span>
                      <span className={`text-sm font-semibold ${
                        event.availableSpots === 0 ? 'text-red-600' :
                        event.availableSpots <= 3 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {event.availableSpots} / {event.maxPlayers} available
                      </span>
                    </div>

                    {/* Status Badge */}
                    {event.availableSpots === 0 ? (
                      <div className="bg-red-50 text-red-700 text-center py-2 rounded-lg text-sm font-semibold">
                        Event Full
                      </div>
                    ) : event.availableSpots <= 3 ? (
                      <div className="bg-orange-50 text-orange-700 text-center py-2 rounded-lg text-sm font-semibold">
                        Almost Full!
                      </div>
                    ) : (
                      <div className="bg-green-50 text-green-700 text-center py-2 rounded-lg text-sm font-semibold">
                        Join Now →
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
