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
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  // Filters state
  const [selectedCity, setSelectedCity] = useState<string>('all')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200])
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' })
  const [spotsFilter, setSpotsFilter] = useState<string>('all') // 'all', 'available', 'limited'
  const [sortBy, setSortBy] = useState<string>('date') // 'date', 'price', 'spots'

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    // Load filters from localStorage
    const savedFilters = localStorage.getItem('eventFilters')
    if (savedFilters) {
      const filters = JSON.parse(savedFilters)
      setSelectedCity(filters.city || 'all')
      setPriceRange(filters.priceRange || [0, 200])
      setDateRange(filters.dateRange || { from: '', to: '' })
      setSpotsFilter(filters.spotsFilter || 'all')
      setSortBy(filters.sortBy || 'date')
    }
  }, [])

  useEffect(() => {
    // Save filters to localStorage
    localStorage.setItem('eventFilters', JSON.stringify({
      city: selectedCity,
      priceRange,
      dateRange,
      spotsFilter,
      sortBy,
    }))
  }, [selectedCity, priceRange, dateRange, spotsFilter, sortBy])

  useEffect(() => {
    applyFilters()
  }, [events, selectedCity, priceRange, dateRange, spotsFilter, sortBy])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/public-events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events)
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...events]

    // City filter
    if (selectedCity !== 'all') {
      filtered = filtered.filter(event => event.city === selectedCity)
    }

    // Price filter
    filtered = filtered.filter(event =>
      event.pricePerPlayer >= priceRange[0] && event.pricePerPlayer <= priceRange[1]
    )

    // Date range filter
    if (dateRange.from) {
      const fromDate = new Date(dateRange.from)
      filtered = filtered.filter(event => new Date(event.date) >= fromDate)
    }
    if (dateRange.to) {
      const toDate = new Date(dateRange.to)
      toDate.setHours(23, 59, 59, 999) // End of day
      filtered = filtered.filter(event => new Date(event.date) <= toDate)
    }

    // Spots filter
    if (spotsFilter === 'available') {
      filtered = filtered.filter(event => event.availableSpots > 0)
    } else if (spotsFilter === 'limited') {
      filtered = filtered.filter(event => event.availableSpots > 0 && event.availableSpots <= 3)
    }

    // Sort
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    } else if (sortBy === 'price') {
      filtered.sort((a, b) => a.pricePerPlayer - b.pricePerPlayer)
    } else if (sortBy === 'spots') {
      filtered.sort((a, b) => b.availableSpots - a.availableSpots)
    }

    setFilteredEvents(filtered)
  }

  const resetFilters = () => {
    setSelectedCity('all')
    setPriceRange([0, 200])
    setDateRange({ from: '', to: '' })
    setSpotsFilter('all')
    setSortBy('date')
  }

  // Get unique cities from events
  const cities = Array.from(new Set(events.map(e => e.city))).sort()

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
        <p className="text-gray-600">Find and join football games in your area</p>
      </div>

      {/* Filters Section */}
      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <button
            onClick={resetFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* City Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="input"
            >
              <option value="all">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Spots Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Availability
            </label>
            <select
              value={spotsFilter}
              onChange={(e) => setSpotsFilter(e.target.value)}
              className="input"
            >
              <option value="all">All Events</option>
              <option value="available">With Available Spots</option>
              <option value="limited">Almost Full (≤3 spots)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input"
            >
              <option value="date">Date (Nearest First)</option>
              <option value="price">Price (Low to High)</option>
              <option value="spots">Available Spots (Most First)</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="input"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="input"
            />
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range: {priceRange[0]} - {priceRange[1]} PLN
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min="0"
                max="200"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="200"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(selectedCity !== 'all' || spotsFilter !== 'all' || dateRange.from || dateRange.to) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {selectedCity !== 'all' && (
                <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full">
                  {selectedCity}
                </span>
              )}
              {spotsFilter !== 'all' && (
                <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full">
                  {spotsFilter === 'available' ? 'Available' : 'Almost Full'}
                </span>
              )}
              {dateRange.from && (
                <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full">
                  From: {dateRange.from}
                </span>
              )}
              {dateRange.to && (
                <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full">
                  To: {dateRange.to}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      {!loading && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredEvents.length} of {events.length} events
        </div>
      )}

      {filteredEvents.length === 0 && events.length > 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Events Match Your Filters</h2>
          <p className="text-gray-600 mb-6">
            Try adjusting your filters to see more events.
          </p>
          <button onClick={resetFilters} className="btn-primary inline-block">
            Reset Filters
          </button>
        </div>
      ) : events.length === 0 ? (
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
          {filteredEvents.map((event) => {
            const now = new Date()
            const eventStartTime = new Date(event.date)
            const eventEndTime = new Date(event.endTime)
            const hasStarted = eventStartTime <= now
            const hasEnded = eventEndTime <= now
            const isOngoing = hasStarted && !hasEnded
            const isFreeEvent = event.pricePerPlayer === 0

            return (
            <Link
              key={event.id}
              href={`/event/${event.id}`}
              className={`card transition-all duration-200 cursor-pointer block ${
                isOngoing ? 'opacity-60 bg-gray-100 hover:shadow-lg' : 'hover:shadow-xl'
              } ${
                isFreeEvent ? 'border-2 border-green-400' : ''
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Left Section: Event Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {event.name}
                    </h3>
                    {isOngoing && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                        In Progress
                      </span>
                    )}
                  </div>

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
                      <span className={`text-xl font-bold ${isFreeEvent ? 'text-green-600' : 'text-primary-600'}`}>
                        {isFreeEvent ? 'FREE' : formatCurrency(event.pricePerPlayer)}
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
                    {isOngoing ? (
                      <div className="bg-yellow-50 text-yellow-700 text-center py-2 rounded-lg text-sm font-semibold">
                        In Progress
                      </div>
                    ) : event.availableSpots === 0 ? (
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
            )
          })}
        </div>
      )}
    </div>
  )
}
