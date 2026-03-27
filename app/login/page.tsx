import { getUsers } from '@/lib/db'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  const users = getUsers()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight mb-1">IGTP</h1>
          <p className="text-zinc-500 text-sm">Sign in to access the platform</p>
        </div>
        <LoginForm users={users} />
      </div>
    </div>
  )
}
