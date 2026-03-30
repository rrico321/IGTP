'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConnectionBadgeProps {
  connected: boolean
  expiresAt: string | null
  className?: string
}

function formatShort(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'expired'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function ConnectionBadge({ connected, expiresAt, className }: ConnectionBadgeProps) {
  const [label, setLabel] = useState(() => expiresAt ? formatShort(expiresAt) : null)
  const [expired, setExpired] = useState(() =>
    expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false
  )

  useEffect(() => {
    if (!expiresAt) {
      setExpired(false)
      setLabel(null)
      return
    }
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) {
        setExpired(true)
        setLabel(null)
      } else {
        setExpired(false)
        setLabel(formatShort(expiresAt))
      }
    }
    update()
    const interval = setInterval(update, 30000)
    return () => clearInterval(interval)
  }, [expiresAt])

  // Not connected (no approved request, or expired)
  if (!connected || expired) {
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

  // Connected with countdown
  if (label) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
          'bg-green-500/10 text-green-400 border border-green-500/20',
          className
        )}
      >
        <Clock className="h-3 w-3" />
        connected · {label}
      </span>
    )
  }

  // Connected with no time limit (expires_at is null)
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium',
        'bg-green-500/10 text-green-400 border border-green-500/20',
        className
      )}
    >
      connected
    </span>
  )
}
