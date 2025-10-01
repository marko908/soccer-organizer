'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

interface ProfileData {
  fullName: string
  nickname: string
  email: string
  phone?: string
  bio?: string
  age?: number
  weight?: number
  height?: number
  avatarUrl: string
  canCreateEvents: boolean
  nicknameLastChanged?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    nickname: '',
    email: '',
    bio: '',
    age: undefined,
    weight: undefined,
    height: undefined,
    avatarUrl: '/default-avatar.svg',
    canCreateEvents: false,
  })

  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfileData(data.profile)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: profileData.nickname,
          bio: profileData.bio,
          age: profileData.age,
          weight: profileData.weight,
          height: profileData.height,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setProfileData(data.profile)
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        setEditMode(false)
        // Refresh auth context
        window.location.reload()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordReset = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(profileData.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        setMessage({ type: 'error', text: 'Failed to send password reset email' })
      } else {
        setMessage({ type: 'success', text: 'Password reset email sent! Check your inbox.' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send password reset email' })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: name === 'age' || name === 'weight' || name === 'height'
        ? value ? parseFloat(value) : undefined
        : value
    }))
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const getDaysUntilNicknameChange = () => {
    if (!profileData.nicknameLastChanged) return 0
    const lastChanged = new Date(profileData.nicknameLastChanged)
    const daysSince = (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24)
    return Math.max(0, Math.ceil(30 - daysSince))
  }

  const canChangeNickname = getDaysUntilNicknameChange() === 0

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="btn-primary"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditMode(false)
                  fetchProfile()
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200">
              <Image
                src={profileData.avatarUrl}
                alt="Profile avatar"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{profileData.fullName}</h3>
              <p className="text-gray-600">@{profileData.nickname}</p>
              {profileData.canCreateEvents && (
                <span className="inline-block mt-2 px-3 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                  Can Create Events
                </span>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profileData.fullName}
                disabled
                className="input bg-gray-50 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">Full name cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nickname
              </label>
              <input
                type="text"
                name="nickname"
                value={profileData.nickname}
                onChange={handleChange}
                disabled={!editMode || !canChangeNickname}
                className={`input ${!editMode || !canChangeNickname ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              />
              {!canChangeNickname && (
                <p className="mt-1 text-xs text-orange-600">
                  Can change in {getDaysUntilNicknameChange()} days
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profileData.email}
                disabled
                className="input bg-gray-50 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">Email managed by Supabase</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={profileData.phone || ''}
                disabled
                className="input bg-gray-50 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              rows={4}
              value={profileData.bio || ''}
              onChange={handleChange}
              disabled={!editMode}
              className={`input ${!editMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                name="age"
                value={profileData.age || ''}
                onChange={handleChange}
                disabled={!editMode}
                className={`input ${!editMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="25"
                min="1"
                max="120"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                name="weight"
                step="0.1"
                value={profileData.weight || ''}
                onChange={handleChange}
                disabled={!editMode}
                className={`input ${!editMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="70"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Height (cm)
              </label>
              <input
                type="number"
                name="height"
                step="0.1"
                value={profileData.height || ''}
                onChange={handleChange}
                disabled={!editMode}
                className={`input ${!editMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                placeholder="180"
              />
            </div>
          </div>

          {/* Password Section */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
            <button
              onClick={handlePasswordReset}
              className="btn-secondary"
            >
              Change Password
            </button>
            <p className="mt-2 text-xs text-gray-500">
              We'll send you an email with a link to reset your password
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
