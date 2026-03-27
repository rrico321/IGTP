import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE } from '@/lib/auth'
import {
  getTrustConnections,
  addTrustConnection,
  getUsers,
} from '@/lib/db'

async function getSessionUserId(): Promise<string | null> {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value ?? null
}

export async function GET() {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const connections = getTrustConnections().filter((t) => t.userId === userId)
  return NextResponse.json(connections)
}

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { email, name } = body as { email?: string; name?: string }

  const users = getUsers()
  let target = email
    ? users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    : name
    ? users.find((u) => u.name.toLowerCase() === name.toLowerCase())
    : undefined

  if (!target) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  }

  if (target.id === userId) {
    return NextResponse.json({ error: 'Cannot trust yourself.' }, { status: 400 })
  }

  const connection = addTrustConnection(userId, target.id)
  if (!connection) {
    return NextResponse.json({ error: 'Already trusted.' }, { status: 409 })
  }

  return NextResponse.json(connection, { status: 201 })
}
