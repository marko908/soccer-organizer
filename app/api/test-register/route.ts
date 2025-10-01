import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    console.log('Received registration request:', { email, name })

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('organizers')
      .select('*')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const { data: user, error } = await supabase
      .from('organizers')
      .insert({
        email,
        password: hashedPassword,
        name
      })
      .select()
      .single()

    if (error) throw error

    console.log('User created successfully:', user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}