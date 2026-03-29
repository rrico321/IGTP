import Link from 'next/link'
import { getRequestsByRequester, getMachines } from '@/lib/db'
import { requireUserId } from '@/lib/auth'
import { RequestStatusBadge } from '@/app/components/StatusBadge'
import type { Machine } from '@/lib/types'

export default async function RequestsPage() {
  const userId = await requireUserId()
  const [requests, allMachines] = await Promise.all([
    getRequestsByRequester(userId),
    getMachines(),
  ])
  const machineMap = new Map<string, Machine>(allMachines.map((m) => [m.id, m]))

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">My Requests</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {requests.length === 0
            ? 'No requests yet.'
            : `${requests.length} request${requests.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {/* Empty state */}
      {requests.length === 0 && (
        <div className="text-center py-20 border border-border rounded-xl bg-card/30">
          <p className="text-muted-foreground mb-4">
            You haven&apos;t requested access to any machines yet.
          </p>
          <Link
            href="/browse"
            className="text-sm text-foreground underline underline-offset-4 hover:text-foreground/80"
          >
            Browse available machines →
          </Link>
        </div>
      )}

      {/* Request list */}
      {requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((request) => {
            const machine = machineMap.get(request.machineId)
            return (
              <div
                key={request.id}
                className="bg-card border border-border rounded-xl p-5 ring-1 ring-foreground/5"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <span className="font-medium text-sm text-foreground">
                      {machine?.name ?? 'Unknown Machine'}
                    </span>
                    {machine && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {machine.gpuModel} · {machine.vramGb} GB VRAM
                      </span>
                    )}
                  </div>
                  <RequestStatusBadge status={request.status} />
                </div>

                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {request.purpose}
                </p>

                <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground/60">
                  <span>~{request.estimatedHours}h estimated</span>
                  <span>
                    {new Date(request.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {request.ownerNote && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-1">Owner note</p>
                    <p className="text-sm text-foreground/80">{request.ownerNote}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
