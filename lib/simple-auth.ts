import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production'

export interface AuthUser {
  id: number
  email: string
  name: string
  role: 'ADMIN' | 'ORGANIZER'
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
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

  const { Client } = require('pg')
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  await client.connect()

  const result = await client.query(
    `INSERT INTO organizers (email, password, name, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, NOW(), NOW())
     RETURNING id, email, name`,
    [email, hashedPassword, name]
  )

  await client.end()

  return result.rows[0]
}

export async function authenticateOrganizer(email: string, password: string): Promise<AuthUser | null> {
  const { Client } = require('pg')
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  await client.connect()

  const result = await client.query(
    'SELECT id, email, name, password, role FROM organizers WHERE email = $1',
    [email]
  )

  await client.end()

  const organizer = result.rows[0]
  if (!organizer) return null

  const isValid = await verifyPassword(password, organizer.password)
  if (!isValid) return null

  return {
    id: organizer.id,
    email: organizer.email,
    name: organizer.name,
    role: organizer.role,
  }
}