"use client";

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Notification } from '@/lib/types'
import { CheckCircle, XCircle, Clock, UserPlus } from 'lucide-react'

const ICONS: Record<string, React.ReactNode> = {
  request_approved: <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />,
  request_denied: <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />,
  request_submitted: <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />,
  friend_request: <UserPlus className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />,
}

function FriendRequestActions({ friendRequestId }: { friendRequestId: string }) {
  const [result, setResult] = useState<'accepted' | 'denied' | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleAction(action: 'accept' | 'deny') {
    startTransition(async () => {
      const res = await fetch(`/api/friend-requests/${friendRequestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        setResult(action === 'accept' ? 'accepted' : 'denied')
        router.refresh()
      }
    })
  }

  if (result) {
    return (
      <span className={`text-xs font-medium ${result === 'accepted' ? 'text-green-400' : 'text-muted-foreground'}`}>
        {result === 'accepted' ? 'Accepted' : 'Denied'}
      </span>
    )
  }

  return (
    <div className="flex gap-2 mt-2">
      <button
        onClick={() => handleAction('accept')}
        disabled={isPending}
        className="px-3 py-1 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 transition-colors cursor-pointer"
      >
        Approve
      </button>
      <button
        onClick={() => handleAction('deny')}
        disabled={isPending}
        className="px-3 py-1 text-xs font-medium rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors cursor-pointer"
      >
        Deny
      </button>
    </div>
  )
}

export function NotificationsClient({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) {
    return (
      <div className="text-center px-8 py-20 border border-border rounded-xl bg-card/30 w-full">
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
            {n.friendRequestId && (
              <FriendRequestActions friendRequestId={n.friendRequestId} />
            )}
            {n.linkUrl && (
              <Link
                href={n.linkUrl}
                className="text-xs text-foreground/60 underline underline-offset-4 hover:text-foreground mt-1 inline-block"
              >
                View request →
              </Link>
            )}
            {!n.friendRequestId && !n.linkUrl && n.requestId && (
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
