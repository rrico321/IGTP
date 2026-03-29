import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMachineById, getUserById } from '@/lib/db'
import { RequestForm } from './RequestForm'
import { createRequestAction } from '../actions'
import type { Machine } from '@/lib/types'

// No auth yet — demo: current user is Bob (user-2)
const CURRENT_USER_ID = 'user-2'

const STATUS_CLASSES: Record<Machine['status'], string> = {
  available: 'bg-green-900/50 text-green-400 border border-green-800',
  busy: 'bg-yellow-900/50 text-yellow-400 border border-yellow-800',
  offline: 'bg-zinc-800 text-zinc-500 border border-zinc-700',
}

const STATUS_LABELS: Record<Machine['status'], string> = {
  available: 'Available for requests',
  busy: 'Currently busy',
  offline: 'Offline / unavailable',
}

export default async function BrowseMachineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const machine = await getMachineById(id)
  if (!machine) notFound()

  const owner = await getUserById(machine.ownerId)
  const isOwner = machine.ownerId === CURRENT_USER_ID
  const canRequest = machine.status === 'available' && !isOwner

  const action = createRequestAction.bind(null, machine.id)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/browse"
            className="text-zinc-500 text-xs hover:text-zinc-300 mb-2 inline-block"
          >
            ← Browse
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">{machine.name}</h1>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[machine.status]}`}
            >
              {machine.status}
            </span>
          </div>
          <p className="text-zinc-500 text-sm mt-1">
            {STATUS_LABELS[machine.status]}
            {owner && <> · Owned by {owner.name}</>}
          </p>
        </div>

        {/* Details card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-4">
          {machine.description && (
            <p className="text-zinc-300 text-sm mb-5 leading-relaxed">
              {machine.description}
            </p>
          )}
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-zinc-500 mb-1">GPU Model</dt>
              <dd className="text-sm font-medium text-zinc-100">{machine.gpuModel}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500 mb-1">VRAM</dt>
              <dd className="text-sm font-medium text-zinc-100">{machine.vramGb} GB</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500 mb-1">CPU Model</dt>
              <dd className="text-sm font-medium text-zinc-100">{machine.cpuModel}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500 mb-1">RAM</dt>
              <dd className="text-sm font-medium text-zinc-100">{machine.ramGb} GB</dd>
            </div>
          </dl>
        </div>

        {/* Request access */}
        {canRequest && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-base font-medium mb-4">Request Access</h2>
            <RequestForm action={action} />
          </div>
        )}

        {/* Owner info */}
        {isOwner && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center">
            <p className="text-zinc-500 text-sm mb-2">This is your machine.</p>
            <Link
              href={`/machines/${machine.id}/requests`}
              className="text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-4"
            >
              View incoming requests →
            </Link>
          </div>
        )}

        {/* Not available and not owner */}
        {!canRequest && !isOwner && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center">
            <p className="text-zinc-500 text-sm">
              This machine is not currently available for requests.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
