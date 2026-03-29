import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMachineById, getRequestsByMachine, getUsers } from '@/lib/db'
import { updateRequestStatusAction } from './actions'
import type { AccessRequest, User } from '@/lib/types'

const STATUS_CLASSES: Record<AccessRequest['status'], string> = {
  pending: 'bg-yellow-900/50 text-yellow-400 border border-yellow-800',
  approved: 'bg-green-900/50 text-green-400 border border-green-800',
  denied: 'bg-red-900/50 text-red-400 border border-red-800',
  completed: 'bg-blue-900/50 text-blue-400 border border-blue-800',
  cancelled: 'bg-zinc-800 text-zinc-500 border border-zinc-700',
}

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/machines/${id}`}
            className="text-zinc-500 text-xs hover:text-zinc-300 mb-2 inline-block"
          >
            ← {machine.name}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Access Requests</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {requests.length === 0
              ? 'No requests yet.'
              : `${requests.length} request${requests.length === 1 ? '' : 's'} · ${pending.length} pending`}
          </p>
        </div>

        {/* Empty state */}
        {requests.length === 0 && (
          <div className="text-center py-20 border border-zinc-800 rounded-xl">
            <p className="text-zinc-500">No one has requested access to this machine yet.</p>
          </div>
        )}

        {/* Pending requests */}
        {pending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">
              Pending
            </h2>
            <div className="space-y-4">
              {pending.map((request) => {
                const requester = userMap.get(request.requesterId)
                const approveAction = updateRequestStatusAction.bind(
                  null,
                  request.id,
                  machine.id,
                  'approved'
                )
                const denyAction = updateRequestStatusAction.bind(
                  null,
                  request.id,
                  machine.id,
                  'denied'
                )

                return (
                  <div
                    key={request.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <span className="font-medium text-zinc-50">
                          {requester?.name ?? 'Unknown User'}
                        </span>
                        {requester && (
                          <span className="text-xs text-zinc-500 ml-2">{requester.email}</span>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_CLASSES[request.status]}`}
                      >
                        {request.status}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-300 mb-2 leading-relaxed">
                      {request.purpose}
                    </p>

                    <div className="flex flex-wrap gap-x-4 text-xs text-zinc-600 mb-4">
                      <span>~{request.estimatedHours}h estimated</span>
                      <span>
                        {new Date(request.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-zinc-800">
                      <form action={approveAction}>
                        <button
                          type="submit"
                          className="text-sm px-4 py-1.5 bg-green-900/40 border border-green-800 text-green-400 rounded-lg hover:bg-green-900/70 cursor-pointer"
                        >
                          Approve
                        </button>
                      </form>
                      <form action={denyAction}>
                        <button
                          type="submit"
                          className="text-sm px-4 py-1.5 bg-red-900/30 border border-red-900 text-red-400 rounded-lg hover:bg-red-900/50 cursor-pointer"
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
            <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">
              Resolved
            </h2>
            <div className="space-y-3">
              {other.map((request) => {
                const requester = userMap.get(request.requesterId)
                return (
                  <div
                    key={request.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <span className="font-medium text-zinc-50">
                        {requester?.name ?? 'Unknown User'}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_CLASSES[request.status]}`}
                      >
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 line-clamp-2">{request.purpose}</p>
                    <div className="text-xs text-zinc-600 mt-2">
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
    </div>
  )
}
