'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { logoutAction } from '@/app/login/actions'

const NAV_LINKS = [
  { href: '/browse', label: 'Browse' },
  { href: '/machines', label: 'My Machines' },
  { href: '/requests', label: 'My Requests' },
  { href: '/settings/trust', label: 'Trust' },
]

interface MobileNavProps {
  userName: string
}

export function MobileNav({ userName }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="p-2 -mr-1 text-zinc-400 hover:text-zinc-100 transition-colors"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute top-12 left-0 right-0 bg-zinc-950 border-b border-border z-50">
          <div className="max-w-4xl mx-auto px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block py-2.5 px-2 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-border pt-2 mt-2 flex items-center justify-between px-2">
              <span className="text-sm text-zinc-500">{userName}</span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-sm text-zinc-500 hover:text-red-400 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
