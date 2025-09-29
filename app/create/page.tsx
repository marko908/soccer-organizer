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
    location: '',
    totalCost: '',
    maxPlayers: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const event = await response.json()
        router.push(`/event/${event.id}`)
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Soccer Event</h1>

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
              placeholder="e.g., Friday Soccer at Orlik"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date & Time
            </label>
            <input
              type="datetime-local"
              id="date"
              name="date"
              required
              className="input"
              value={formData.date}
              onChange={handleChange}
            />
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
                required
                className="input"
                placeholder="200.00"
                value={formData.totalCost}
                onChange={handleChange}
              />
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
            </div>
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