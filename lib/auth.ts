import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { supabase } from './supabase'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production'

export interface AuthUser {
  id: number
  email: string
  name: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    return decoded
  } catch (error) {
    return null
  }
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization')
  const cookieToken = request.cookies.get('auth-token')?.value

  const token = authHeader?.replace('Bearer ', '') || cookieToken

  if (!token) return null

  return verifyToken(token)
}

export async function createOrganizer(email: string, password: string, name: string) {
  const hashedPassword = await hashPassword(password)

  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password: hashedPassword,
      name,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function authenticateOrganizer(email: string, password: string): Promise<AuthUser | null> {
  const { data: organizer, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !organizer) return null

  const isValid = await verifyPassword(password, organizer.password)
  if (!isValid) return null

  return {
    id: organizer.id,
    email: organizer.email,
    name: organizer.name,
  }
}