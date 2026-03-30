'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConnectionBadgeProps {
  expiresAt: string | null
  className?: string
}

function getTimeRemaining(expiresAt: string): { expired: boolean; hours: number; minutes: number } {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return { expired: true, hours: 0, minutes: 0 }
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return { expired: false, hours, minutes }
}

export function ConnectionBadge({ expiresAt, className }: ConnectionBadgeProps) {
  const [remaining, setRemaining] = useState(() =>
    expiresAt ? getTimeRemaining(expiresAt) : { expired: true, hours: 0, minutes: 0 }
  )

  useEffect(() => {
    if (!expiresAt) return

    setRemaining(getTimeRemaining(expiresAt))

    const interval = setInterval(() => {
      setRemaining(getTimeRemaining(expiresAt))
    }, 30_000)

    return () => clearInterval(interval)
  }, [expiresAt])

  const connected = expiresAt !== null && !remaining.expired

  if (!connected) {
    return (
      <span
        className={cn(
          'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium',
          'bg-red-500/10 text-red-400 border border-red-500/20',
          className
        )}
      >
        not connected
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
        'bg-green-500/10 text-green-400 border border-green-500/20',
        className
      )}
    >
      <Clock className="h-3 w-3" />
      connected · {remaining.hours}h {remaining.minutes}m
    </span>
  )
}
