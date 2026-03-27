import Link from 'next/link'
import { getCurrentUserId } from '@/lib/auth'
import { getUserById } from '@/lib/db'
import { LogoutButton } from './LogoutButton'

export async function NavBar() {
  const userId = await getCurrentUserId()
  if (!userId) return null
  const user = getUserById(userId)
  if (!user) return null

  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/" className="font-semibold text-zinc-100 hover:text-white">
            IGTP
          </Link>
          <Link href="/browse" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            Browse
          </Link>
          <Link href="/machines" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            My Machines
          </Link>
          <Link href="/requests" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            My Requests
          </Link>
          <Link href="/settings/trust" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            Trust
          </Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-400">{user.name}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
