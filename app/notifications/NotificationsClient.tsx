"use client";

import Link from 'next/link'
import type { Notification } from '@/lib/types'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

const ICONS = {
  request_approved: <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />,
  request_denied: <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />,
  request_submitted: <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />,
}

export function NotificationsClient({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) {
    return (
      <div className="text-center py-20 border border-border rounded-xl bg-card/30 w-full">
        <p className="text-muted-foreground text-sm">No notifications yet. You&apos;ll see updates here when someone requests your machine or your request is approved.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`flex gap-3 items-start p-4 rounded-xl border border-border bg-card ring-1 ring-foreground/5 ${
            !n.read ? 'border-primary/20 bg-primary/5' : ''
          }`}
        >
          {ICONS[n.type]}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{n.title}</p>
              <span className="text-xs text-muted-foreground/60 shrink-0 tabular-nums">
                {new Date(n.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
            {n.requestId && (
              <Link
                href="/requests"
                className="text-xs text-foreground/60 underline underline-offset-4 hover:text-foreground mt-1 inline-block"
              >
                View request →
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
