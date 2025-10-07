import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET /api/profile - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Format response (snake_case to camelCase)
    const formattedProfile = {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      nickname: profile.nickname,
      phone: profile.phone,
      role: profile.role,
      avatarUrl: profile.avatar_url,
      bio: profile.bio,
      age: profile.age,
      weight: profile.weight,
      height: profile.height,
      canCreateEvents: profile.can_create_events,
      emailVerified: profile.email_verified,
      nicknameLastChanged: profile.nickname_last_changed,
      skillLevel: profile.skill_level,
      positionPreference: profile.position_preference,
      gamesPlayed: profile.games_played || 0,
      onTimeRate: profile.on_time_rate || 1.0,
      preferredCities: profile.preferred_cities || [],
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    }

    return NextResponse.json({ profile: formattedProfile })
  } catch (error: any) {
    console.error('Get profile error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/profile - Update current user's profile
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nickname, bio, age, weight, height, avatarUrl, skillLevel, positionPreference, preferredCities } = body

    // Get current profile to check nickname change restriction
    const { data: currentProfile } = await supabase
      .from('users')
      .select('nickname, nickname_last_changed')
      .eq('id', user.id)
      .single()

    // Prepare update object
    const updateData: any = {}

    // Check if nickname is being changed
    if (nickname && nickname !== currentProfile?.nickname) {
      // Check 30-day restriction
      if (currentProfile?.nickname_last_changed) {
        const lastChanged = new Date(currentProfile.nickname_last_changed)
        const daysSinceChange = (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24)

        if (daysSinceChange < 30) {
          const daysRemaining = Math.ceil(30 - daysSinceChange)
          return NextResponse.json(
            { error: `You can change your nickname again in ${daysRemaining} days` },
            { status: 400 }
          )
        }
      }

      // Check if nickname is unique (case-insensitive)
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .ilike('nickname', nickname)
        .neq('id', user.id)
        .single()

      if (existingUser) {
        return NextResponse.json(
          { error: 'Nickname already taken' },
          { status: 400 }
        )
      }

      updateData.nickname = nickname
      updateData.nickname_last_changed = new Date().toISOString()
    }

    // Add other fields if provided
    if (bio !== undefined) updateData.bio = bio
    if (age !== undefined) updateData.age = age
    if (weight !== undefined) updateData.weight = weight
    if (height !== undefined) updateData.height = height
    if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl
    if (skillLevel !== undefined) updateData.skill_level = skillLevel
    if (positionPreference !== undefined) updateData.position_preference = positionPreference
    if (preferredCities !== undefined) updateData.preferred_cities = preferredCities

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    // Format response
    const formattedProfile = {
      id: updatedProfile.id,
      email: updatedProfile.email,
      fullName: updatedProfile.full_name,
      nickname: updatedProfile.nickname,
      phone: updatedProfile.phone,
      role: updatedProfile.role,
      avatarUrl: updatedProfile.avatar_url,
      bio: updatedProfile.bio,
      age: updatedProfile.age,
      weight: updatedProfile.weight,
      height: updatedProfile.height,
      canCreateEvents: updatedProfile.can_create_events,
      emailVerified: updatedProfile.email_verified,
      nicknameLastChanged: updatedProfile.nickname_last_changed,
      skillLevel: updatedProfile.skill_level,
      positionPreference: updatedProfile.position_preference,
      gamesPlayed: updatedProfile.games_played || 0,
      onTimeRate: updatedProfile.on_time_rate || 1.0,
      preferredCities: updatedProfile.preferred_cities || [],
      createdAt: updatedProfile.created_at,
      updatedAt: updatedProfile.updated_at,
    }

    return NextResponse.json({ profile: formattedProfile })
  } catch (error: any) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
