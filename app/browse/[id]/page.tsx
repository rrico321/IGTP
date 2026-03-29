import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMachineById, getUserById } from '@/lib/db'
import { requireUserId } from '@/lib/auth'
import { RequestForm } from './RequestForm'
import { A1111SessionPanel } from './A1111SessionPanel'
import { createRequestAction } from '../actions'
import { MachineStatusBadge } from '@/app/components/StatusBadge'
import { isTrusted } from '@/lib/db'
import type { Machine } from '@/lib/types'

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
  const userId = await requireUserId()
  const machine = await getMachineById(id)
  if (!machine) notFound()

  const owner = await getUserById(machine.ownerId)
  const isOwner = machine.ownerId === userId
  const canRequest = machine.status === 'available' && !isOwner
  const userIsTrusted = isOwner || await isTrusted(machine.ownerId, userId)
  const showA1111 = machine.a1111Enabled && userIsTrusted

  const action = createRequestAction.bind(null, machine.id)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/browse"
          className="text-muted-foreground text-xs hover:text-foreground mb-3 inline-block transition-colors"
        >
          ← Browse
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold tracking-tight">{machine.name}</h1>
          <MachineStatusBadge status={machine.status} />
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          {STATUS_LABELS[machine.status]}
          {owner && <> · Owned by {owner.name}</>}
        </p>
      </div>

      {/* Details card */}
      <div className="bg-card border border-border rounded-xl p-6 mb-4 ring-1 ring-foreground/5">
        {machine.description && (
          <p className="text-foreground/80 text-sm mb-5 leading-relaxed">
            {machine.description}
          </p>
        )}
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-muted-foreground mb-1">GPU Model</dt>
            <dd className="text-sm font-medium text-foreground">{machine.gpuModel}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground mb-1">VRAM</dt>
            <dd className="text-sm font-medium text-foreground">{machine.vramGb} GB</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground mb-1">CPU Model</dt>
            <dd className="text-sm font-medium text-foreground">{machine.cpuModel}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground mb-1">RAM</dt>
            <dd className="text-sm font-medium text-foreground">{machine.ramGb} GB</dd>
          </div>
        </dl>
      </div>

      {/* A1111 Session */}
      {showA1111 && (
        <A1111SessionPanel
          machineId={machine.id}
          machineName={machine.name}
          isAvailable={machine.a1111Available}
        />
      )}

      {/* Request access */}
      {canRequest && (
        <div className="bg-card border border-border rounded-xl p-6 ring-1 ring-foreground/5">
          <h2 className="text-base font-medium mb-4">Request Access</h2>
          <RequestForm action={action} />
        </div>
      )}

      {/* Owner info */}
      {isOwner && (
        <div className="bg-card border border-border rounded-xl p-5 text-center ring-1 ring-foreground/5">
          <p className="text-muted-foreground text-sm mb-2">This is your machine.</p>
          <Link
            href={`/machines/${machine.id}/requests`}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            View incoming requests →
          </Link>
        </div>
      )}

      {/* Not available and not owner */}
      {!canRequest && !isOwner && (
        <div className="bg-card border border-border rounded-xl p-5 text-center ring-1 ring-foreground/5">
          <p className="text-muted-foreground text-sm">
            This machine is not currently available for requests.
          </p>
        </div>
      )}
    </div>
  )
}
