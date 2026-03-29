import Link from 'next/link'
import { getCurrentUserId } from '@/lib/auth'
import { getUserById, getUnreadCountForUser } from '@/lib/db'
import { LogoutButton } from './LogoutButton'
import { MobileNav } from './MobileNav'
import { NotificationBell } from './NotificationBell'

const NAV_LINKS = [
  { href: '/browse', label: 'Browse' },
  { href: '/machines', label: 'My Machines' },
  { href: '/requests', label: 'My Requests' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/network', label: 'Network' },
  { href: '/settings/invites', label: 'Invite' },
]

export async function NavBar() {
  const userId = await getCurrentUserId()
  if (!userId) return null
  const [user, unreadCount] = await Promise.all([
    getUserById(userId),
    getUnreadCountForUser(userId),
  ])
  if (!user) return null

  return (
    <header className="relative border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-sm text-foreground hover:text-foreground/80 transition-colors">
            IGTP
          </Link>
          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop right side */}
        <div className="hidden sm:flex items-center gap-3">
          <NotificationBell initialUnread={unreadCount} />
          <span className="text-sm text-muted-foreground">{user.name}</span>
          <LogoutButton />
        </div>

        {/* Mobile hamburger */}
        <MobileNav userName={user.name} />
      </div>
    </header>
  )
}
