import { cookies } from 'next/headers'
import { validateApiKey } from './db'

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

/**
 * Authenticate a request via API key (Authorization: Bearer igtp_...)
 * or fall back to session cookie. Returns user ID or null.
 */
export async function authenticateRequest(request: Request): Promise<string | null> {
  // Check for API key first
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer igtp_")) {
    const key = authHeader.slice(7); // Remove "Bearer "
    return validateApiKey(key);
  }
  // Fall back to session cookie
  return getCurrentUserId();
}

export { SESSION_COOKIE }
