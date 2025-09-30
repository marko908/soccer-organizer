'use client'

import { useState, useEffect } from 'react'

interface PendingOrganizer {
  id: number
  name: string
  email: string
  phone?: string
  emailVerified: boolean
  createdAt: string
}

export default function AdminPage() {
  const [pendingOrganizers, setPendingOrganizers] = useState<PendingOrganizer[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    fetchPendingOrganizers()
  }, [])

  const fetchPendingOrganizers = async () => {
    try {
      const response = await fetch('/api/admin/pending-organizers')
      if (response.ok) {
        const data = await response.json()
        setPendingOrganizers(data.organizers || [])
      }
    } catch (error) {
      console.error('Error fetching pending organizers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (organizerId: number) => {
    setActionLoading(organizerId)
    try {
      const response = await fetch('/api/admin/approve-organizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizerId, action: 'approve' }),
      })

      if (response.ok) {
        setPendingOrganizers(prev =>
          prev.filter(org => org.id !== organizerId)
        )
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to approve organizer')
      }
    } catch (error) {
      console.error('Error approving organizer:', error)
      alert('Failed to approve organizer')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (organizerId: number) => {
    if (!confirm('Are you sure you want to reject this organizer?')) {
      return
    }

    setActionLoading(organizerId)
    try {
      const response = await fetch('/api/admin/approve-organizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizerId, action: 'reject' }),
      })

      if (response.ok) {
        setPendingOrganizers(prev =>
          prev.filter(org => org.id !== organizerId)
        )
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to reject organizer')
      }
    } catch (error) {
      console.error('Error rejecting organizer:', error)
      alert('Failed to reject organizer')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-2">Manage organizer approvals</p>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Pending Organizers ({pendingOrganizers.length})
          </h2>
          <button
            onClick={fetchPendingOrganizers}
            className="btn-secondary text-sm"
          >
            Refresh
          </button>
        </div>

        {pendingOrganizers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">No pending organizer approvals.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingOrganizers.map((organizer) => (
              <div
                key={organizer.id}
                className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {organizer.name}
                    </h3>
                    <p className="text-gray-600">{organizer.email}</p>
                    {organizer.phone && (
                      <p className="text-gray-600">{organizer.phone}</p>
                    )}
                    <div className="mt-3 flex items-center space-x-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        organizer.emailVerified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {organizer.emailVerified ? '✓ Email Verified' : '⏳ Email Pending'}
                      </span>
                      <span className="text-sm text-gray-500">
                        Registered: {formatDate(organizer.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleApprove(organizer.id)}
                      disabled={actionLoading === organizer.id}
                      className="btn-primary text-sm"
                    >
                      {actionLoading === organizer.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(organizer.id)}
                      disabled={actionLoading === organizer.id}
                      className="btn-secondary text-sm"
                    >
                      {actionLoading === organizer.id ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}