'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function CreateEvent() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    endTime: '',
    location: '',
    totalCost: '',
    minPlayers: '10',
    maxPlayers: '',
    playersPerTeam: '6',
    fieldType: 'artificial_grass',
    cleatsAllowed: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validation
    const totalCost = parseFloat(formData.totalCost)
    const minPlayers = parseInt(formData.minPlayers)
    const maxPlayers = parseInt(formData.maxPlayers)
    const playersPerTeam = parseInt(formData.playersPerTeam)
    const eventDate = new Date(formData.date)
    const endTime = new Date(formData.endTime)
    const now = new Date()
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 90)

    if (totalCost > 1500) {
      alert('Total cost cannot exceed 1500 PLN')
      setLoading(false)
      return
    }

    if (minPlayers < 2) {
      alert('Minimum players must be at least 2')
      setLoading(false)
      return
    }

    if (maxPlayers > 50) {
      alert('Maximum number of players is 50')
      setLoading(false)
      return
    }

    if (minPlayers >= maxPlayers) {
      alert('Minimum players must be less than maximum players')
      setLoading(false)
      return
    }

    if (playersPerTeam < 2 || playersPerTeam > 11) {
      alert('Players per team must be between 2 and 11')
      setLoading(false)
      return
    }

    if (eventDate < now) {
      alert('Event date must be in the future')
      setLoading(false)
      return
    }

    if (eventDate > maxDate) {
      alert('Events can only be created up to 90 days in advance')
      setLoading(false)
      return
    }

    if (endTime <= eventDate) {
      alert('End time must be after start time')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/simple-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: include cookies
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/event/${data.event.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create event')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const pricePerPlayer = formData.totalCost && formData.maxPlayers
    ? (parseFloat(formData.totalCost) / parseInt(formData.maxPlayers)).toFixed(2)
    : '0.00'

  if (authLoading) {
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
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Event</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Event Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="input"
              placeholder="e.g., Friday 6PM - Orlik Mokotow"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                id="date"
                name="date"
                required
                className="input"
                value={formData.date}
                onChange={handleChange}
                max="2050-12-31T23:59"
              />
              <p className="text-xs text-gray-500 mt-1">Up to 90 days in advance</p>
            </div>

            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="datetime-local"
                id="endTime"
                name="endTime"
                required
                className="input"
                value={formData.endTime}
                onChange={handleChange}
                max="2050-12-31T23:59"
              />
              <p className="text-xs text-gray-500 mt-1">Must be after start time</p>
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              required
              className="input"
              placeholder="e.g., Orlik Mokotów, ul. Sportowa 1"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="playersPerTeam" className="block text-sm font-medium text-gray-700 mb-2">
                Players per Team
              </label>
              <input
                type="number"
                id="playersPerTeam"
                name="playersPerTeam"
                min="2"
                max="11"
                required
                className="input"
                placeholder="6"
                value={formData.playersPerTeam}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-500 mt-1">e.g., 6 for 6v6</p>
            </div>

            <div>
              <label htmlFor="fieldType" className="block text-sm font-medium text-gray-700 mb-2">
                Field Type
              </label>
              <select
                id="fieldType"
                name="fieldType"
                required
                className="input"
                value={formData.fieldType}
                onChange={handleChange}
              >
                <option value="futsal">Futsal</option>
                <option value="artificial_grass">Artificial Grass</option>
                <option value="natural_grass">Natural Grass</option>
              </select>
            </div>

            <div className="flex items-center pt-8">
              <label htmlFor="cleatsAllowed" className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="cleatsAllowed"
                  name="cleatsAllowed"
                  checked={formData.cleatsAllowed}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Cleats Allowed</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="totalCost" className="block text-sm font-medium text-gray-700 mb-2">
                Total Cost (PLN)
              </label>
              <input
                type="number"
                id="totalCost"
                name="totalCost"
                step="0.01"
                min="0"
                max="1500"
                required
                className="input"
                placeholder="200.00"
                value={formData.totalCost}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-500 mt-1">Maximum: 1500 PLN</p>
            </div>

            <div>
              <label htmlFor="minPlayers" className="block text-sm font-medium text-gray-700 mb-2">
                Min Players
              </label>
              <input
                type="number"
                id="minPlayers"
                name="minPlayers"
                min="2"
                max="50"
                required
                className="input"
                placeholder="10"
                value={formData.minPlayers}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum to start game</p>
            </div>
          </div>

          <div>
            <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-700 mb-2">
              Max Players
            </label>
            <input
              type="number"
              id="maxPlayers"
              name="maxPlayers"
              min="2"
              max="50"
              required
              className="input"
              placeholder="14"
              value={formData.maxPlayers}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-500 mt-1">Maximum: 50 players (must be more than min players)</p>
          </div>

          {formData.totalCost && formData.maxPlayers && (
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-4 rounded-xl border border-primary-200">
              <p className="text-sm text-primary-800">
                <strong>Price per player:</strong> {pricePerPlayer} PLN
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}