import Link from 'next/link'
import { getRequestsByRequester, getMachines } from '@/lib/db'
import { requireUserId } from '@/lib/auth'
import type { AccessRequest, Machine } from '@/lib/types'

const STATUS_CLASSES: Record<AccessRequest['status'], string> = {
  pending: 'bg-yellow-900/50 text-yellow-400 border border-yellow-800',
  approved: 'bg-green-900/50 text-green-400 border border-green-800',
  denied: 'bg-red-900/50 text-red-400 border border-red-800',
  completed: 'bg-blue-900/50 text-blue-400 border border-blue-800',
  cancelled: 'bg-zinc-800 text-zinc-500 border border-zinc-700',
}

export default async function RequestsPage() {
  const userId = await requireUserId()
  const [requests, allMachines] = await Promise.all([
    getRequestsByRequester(userId),
    getMachines(),
  ])
  const machineMap = new Map<string, Machine>(allMachines.map((m) => [m.id, m]))

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">My Requests</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {requests.length === 0
              ? 'No requests yet.'
              : `${requests.length} request${requests.length === 1 ? '' : 's'}`}
          </p>
        </div>

        {/* Empty state */}
        {requests.length === 0 && (
          <div className="text-center py-20 border border-zinc-800 rounded-xl">
            <p className="text-zinc-500 mb-4">
              You haven&apos;t requested access to any machines yet.
            </p>
            <Link
              href="/browse"
              className="text-white text-sm underline underline-offset-4"
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
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
                >
                  {/* Machine name + status */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="min-w-0">
                      <span className="font-medium text-zinc-50">
                        {machine?.name ?? 'Unknown Machine'}
                      </span>
                      {machine && (
                        <span className="text-xs text-zinc-500 ml-2">
                          {machine.gpuModel} · {machine.vramGb} GB VRAM
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_CLASSES[request.status]}`}
                    >
                      {request.status}
                    </span>
                  </div>

                  {/* Purpose */}
                  <p className="text-sm text-zinc-400 mb-2 line-clamp-2">{request.purpose}</p>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-4 text-xs text-zinc-600">
                    <span>~{request.estimatedHours}h estimated</span>
                    <span>
                      {new Date(request.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Owner note */}
                  {request.ownerNote && (
                    <div className="mt-3 pt-3 border-t border-zinc-800">
                      <p className="text-xs text-zinc-500 mb-1">Owner note</p>
                      <p className="text-sm text-zinc-300">{request.ownerNote}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
