import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMachineById, getRequestsByMachine, getUsers } from '@/lib/db'
import { updateRequestStatusAction } from './actions'
import { RequestStatusBadge } from '@/app/components/StatusBadge'
import type { User } from '@/lib/types'

export default async function MachineRequestsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const machine = await getMachineById(id)
  if (!machine) notFound()

  const [requests, allUsers] = await Promise.all([
    getRequestsByMachine(id),
    getUsers(),
  ])
  const userMap = new Map<string, User>(allUsers.map((u) => [u.id, u]))
  const pending = requests.filter((r) => r.status === 'pending')
  const other = requests.filter((r) => r.status !== 'pending')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/machines/${id}`}
          className="text-muted-foreground text-xs hover:text-foreground mb-3 inline-block transition-colors"
        >
          ← {machine.name}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Access Requests</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {requests.length === 0
            ? 'No requests yet.'
            : `${requests.length} request${requests.length === 1 ? '' : 's'} · ${pending.length} pending`}
        </p>
      </div>

      {/* Empty state */}
      {requests.length === 0 && (
        <div className="text-center py-20 border border-border rounded-xl bg-card/30">
          <p className="text-muted-foreground">No one has requested access to this machine yet.</p>
        </div>
      )}

      {/* Pending requests */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
            Pending
          </h2>
          <div className="space-y-4">
            {pending.map((request) => {
              const requester = userMap.get(request.requesterId)
              const approveAction = updateRequestStatusAction.bind(null, request.id, machine.id, 'approved')
              const denyAction = updateRequestStatusAction.bind(null, request.id, machine.id, 'denied')

              return (
                <div
                  key={request.id}
                  className="bg-card border border-border rounded-xl p-5 ring-1 ring-foreground/5"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <span className="font-medium text-sm text-foreground">
                        {requester?.name ?? 'Unknown User'}
                      </span>
                      {requester && (
                        <span className="text-xs text-muted-foreground ml-2">{requester.email}</span>
                      )}
                    </div>
                    <RequestStatusBadge status={request.status} />
                  </div>

                  <p className="text-sm text-foreground/80 mb-2 leading-relaxed">
                    {request.purpose}
                  </p>

                  <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground/60 mb-4">
                    <span>~{request.estimatedHours}h estimated</span>
                    <span>
                      {new Date(request.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-border">
                    <form action={approveAction}>
                      <button
                        type="submit"
                        className="text-sm px-4 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg hover:bg-green-500/20 cursor-pointer transition-colors"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={denyAction}>
                      <button
                        type="submit"
                        className="text-sm px-4 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 cursor-pointer transition-colors"
                      >
                        Deny
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Resolved requests */}
      {other.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
            Resolved
          </h2>
          <div className="space-y-3">
            {other.map((request) => {
              const requester = userMap.get(request.requesterId)
              return (
                <div
                  key={request.id}
                  className="bg-card border border-border rounded-xl p-5 ring-1 ring-foreground/5"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <span className="font-medium text-sm text-foreground">
                      {requester?.name ?? 'Unknown User'}
                    </span>
                    <RequestStatusBadge status={request.status} />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{request.purpose}</p>
                  <div className="text-xs text-muted-foreground/50 mt-2">
                    ~{request.estimatedHours}h ·{' '}
                    {new Date(request.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
