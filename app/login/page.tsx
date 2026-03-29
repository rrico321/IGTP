import { getUsers } from '@/lib/db'
import { LoginForm } from './LoginForm'

const REASON_MESSAGES: Record<string, string> = {
  invite_existing_account:
    'An account with that email already exists. Please sign in below.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const [users, { reason }] = await Promise.all([getUsers(), searchParams])
  const notice = reason ? REASON_MESSAGES[reason] : null

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight mb-1">IGTP</h1>
          <p className="text-muted-foreground text-sm">Sign in to access the platform</p>
        </div>
        {notice && (
          <p className="mb-4 text-sm text-center text-amber-600 dark:text-amber-400">{notice}</p>
        )}
        <LoginForm users={users} />
      </div>
    </div>
  )
}
