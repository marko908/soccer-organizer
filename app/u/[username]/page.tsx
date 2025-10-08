'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import Image from 'next/image'
import Link from 'next/link'

interface UserProfile {
  id: string
  email: string
  fullName: string
  nickname: string
  avatarUrl: string
  bio?: string
  age?: number
  weight?: number
  height?: number
  canCreateEvents: boolean
  role: 'ADMIN' | 'USER'
  createdAt: string
}

interface Event {
  id: string
  title: string
  date: string
  endTime?: string
  city: string
  location: string
  participantLimit: number
  participantCount: number
  status: string
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { t } = useLanguage()
  const username = params.username as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'about' | 'events'>('about')

  useEffect(() => {
    if (username) {
      fetchProfile()
    }
  }, [username])

  const fetchProfile = async () => {
    try {
      console.log('🔍 Fetching profile for username:', username)

      // Fetch user profile by nickname
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('id, email, full_name, nickname, avatar_url, bio, age, weight, height, can_create_events, role, created_at')
        .ilike('nickname', username)
        .single()

      if (profileError || !profileData) {
        console.error('❌ Profile not found:', profileError)
        setLoading(false)
        return
      }

      console.log('✅ Profile found:', profileData.nickname)

      setProfile({
        id: profileData.id,
        email: profileData.email,
        fullName: profileData.full_name,
        nickname: profileData.nickname,
        avatarUrl: profileData.avatar_url || '/default-avatar.svg',
        bio: profileData.bio,
        age: profileData.age,
        weight: profileData.weight,
        height: profileData.height,
        canCreateEvents: profileData.can_create_events,
        role: profileData.role,
        createdAt: profileData.created_at,
      })

      // Fetch user's events (only if they can create events)
      if (profileData.can_create_events) {
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select(`
            id,
            title,
            date,
            city,
            location,
            participant_limit,
            status,
            participants:participants(count)
          `)
          .eq('organizer_id', profileData.id)
          .order('date', { ascending: false })
          .limit(10)

        if (!eventsError && eventsData) {
          setEvents(eventsData.map((event: any) => ({
            id: event.id,
            title: event.title,
            date: event.date,
            city: event.city || '',
            location: event.location,
            participantLimit: event.participant_limit,
            participantCount: event.participants?.[0]?.count || 0,
            status: event.status,
          })))
        }
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
          <p className="text-gray-600 mb-6">
            The user @{username} doesn't exist.
          </p>
          <Link href="/" className="btn-primary inline-block">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Go Back</span>
        </button>

        {/* Profile Header Card */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary-500 shadow-lg">
                <Image
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  width={128}
                  height={128}
                  className="object-cover"
                />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.fullName}
                </h1>
                {profile.role === 'ADMIN' && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                    Admin
                  </span>
                )}
                {profile.canCreateEvents && (
                  <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm font-semibold rounded-full">
                    ⚽ Organizer
                  </span>
                )}
              </div>

              <p className="text-xl text-gray-600 mb-4">@{profile.nickname}</p>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Joined {formatDate(profile.createdAt)}</span>
                </div>
              </div>

              {isOwnProfile && (
                <div className="mt-4">
                  <Link href="/profile" className="btn-secondary text-sm">
                    Edit Profile
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('about')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'about'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              About
            </button>
            {profile.canCreateEvents && (
              <button
                onClick={() => setActiveTab('events')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'events'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Events ({events.length})
              </button>
            )}
          </div>

          <div className="p-6">
            {activeTab === 'about' && (
              <div className="space-y-6">
                {/* Bio */}
                {profile.bio && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Bio</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
                  </div>
                )}

                {/* Stats */}
                {(profile.age || profile.weight || profile.height) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Stats</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {profile.age && (
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-primary-600">{profile.age}</div>
                          <div className="text-sm text-gray-600">Years</div>
                        </div>
                      )}
                      {profile.weight && (
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-primary-600">{profile.weight}</div>
                          <div className="text-sm text-gray-600">kg</div>
                        </div>
                      )}
                      {profile.height && (
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-primary-600">{profile.height}</div>
                          <div className="text-sm text-gray-600">cm</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!profile.bio && !profile.age && !profile.weight && !profile.height && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📝</div>
                    <p className="text-gray-600">
                      {isOwnProfile
                        ? "You haven't added any information to your profile yet."
                        : "This user hasn't added any information to their profile yet."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'events' && (
              <div className="space-y-4">
                {events.length > 0 ? (
                  events.map(event => (
                    <Link
                      key={event.id}
                      href={`/event/${event.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">
                            {event.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">📍 {event.location}</p>
                          <p className="text-sm text-gray-600">
                            📅 {new Date(event.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 mb-1">
                            {event.participantCount}/{event.participantLimit} players
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            event.status === 'UPCOMING' ? 'bg-green-100 text-green-800' :
                            event.status === 'ONGOING' ? 'bg-blue-100 text-blue-800' :
                            event.status === 'FINISHED' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {event.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">⚽</div>
                    <p className="text-gray-600">
                      {isOwnProfile
                        ? "You haven't organized any events yet."
                        : "This user hasn't organized any events yet."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
