import { cookies } from 'next/headers'

const SESSION_COOKIE = 'igtp-session'

export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value ?? null
}

export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Not authenticated')
  return userId
}

export { SESSION_COOKIE }
