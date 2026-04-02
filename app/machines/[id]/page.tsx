import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMachineById, getModelsForMachine, getConnectedUsersForMachine } from '@/lib/db'
import { MachineForm } from '../MachineForm'
import { updateMachineAction, updateMachineStatusAction } from '../actions'
import { MachineStatusBadge } from '@/app/components/StatusBadge'
import { ConnectedUsersPanel } from './ConnectedUsersPanel'
import type { Machine } from '@/lib/types'

const NEXT_STATUS: Record<Machine['status'], Machine['status']> = {
  available: 'busy',
  busy: 'offline',
  offline: 'available',
}

const STATUS_LABELS: Record<Machine['status'], string> = {
  available: 'Available for requests',
  busy: 'Currently busy',
  offline: 'Offline / unavailable',
}

export default async function MachineDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ edit?: string }>
}) {
  const { id } = await params
  const { edit } = await searchParams

  const machine = await getMachineById(id)
  if (!machine) notFound()

  const [models, connectedUsers] = await Promise.all([
    getModelsForMachine(id),
    getConnectedUsersForMachine(id),
  ])

  const isEditing = edit === '1'
  const nextStatus = NEXT_STATUS[machine.status]
  const toggleAction = updateMachineStatusAction.bind(null, machine.id, nextStatus)
  const editAction = updateMachineAction.bind(null, machine.id)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/machines"
          className="text-muted-foreground text-xs hover:text-foreground mb-3 inline-block transition-colors"
        >
          ← My Machines
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold tracking-tight">{machine.name}</h1>
          <MachineStatusBadge status={machine.status} />
        </div>
        <p className="text-muted-foreground text-sm mt-1">{STATUS_LABELS[machine.status]}</p>
      </div>

      {/* Details card */}
      {!isEditing && (
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
            <div>
              <dt className="text-xs text-muted-foreground mb-1">Registered</dt>
              <dd className="text-sm text-foreground/60">
                {new Date(machine.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground mb-1">Last Updated</dt>
              <dd className="text-sm text-foreground/60">
                {new Date(machine.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </dd>
            </div>
          </dl>

          {machine.a1111Enabled && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              <span className={`inline-flex items-center gap-1 text-xs rounded px-2 py-0.5 font-medium ${
                machine.a1111Available
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  : "bg-purple-500/5 text-purple-400/50 border border-purple-500/10"
              }`}>
                A1111 {machine.a1111Available ? "available" : "at capacity"}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-border">
            <form action={toggleAction}>
              <button
                type="submit"
                className="text-sm px-4 py-2 border border-border rounded-lg hover:border-border/60 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                Set → {nextStatus}
              </button>
            </form>
            <Link
              href={`/machines/${machine.id}?edit=1`}
              className="text-sm px-4 py-2 border border-border rounded-lg hover:border-border/60 text-muted-foreground hover:text-foreground transition-colors"
            >
              Edit Details
            </Link>
            <Link
              href={`/machines/${machine.id}/requests`}
              className="text-sm px-4 py-2 border border-border rounded-lg hover:border-border/60 text-muted-foreground hover:text-foreground transition-colors"
            >
              Requests
            </Link>
          </div>
        </div>
      )}

      {/* Connected Users */}
      {!isEditing && (
        <div className="mb-4">
          <ConnectedUsersPanel users={connectedUsers} machineId={machine.id} />
        </div>
      )}

      {/* Available Ollama Models */}
      {models.length > 0 && !isEditing && (
        <div className="bg-card border border-border rounded-xl p-6 mb-4 ring-1 ring-foreground/5">
          <h2 className="text-sm font-medium mb-3">
            Available Models <span className="text-muted-foreground font-normal">({models.length})</span>
          </h2>
          <div className="space-y-2">
            {models.map((m) => (
              <div key={m.modelName} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-foreground">{m.modelName}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                    m.modelType === "embedding"
                      ? "text-purple-400 border-purple-500/30"
                      : "text-blue-400 border-blue-500/30"
                  }`}>
                    {m.modelType}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {m.sizeBytes ? `${(m.sizeBytes / 1e9).toFixed(1)} GB` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit form */}
      {isEditing && (
        <div className="bg-card border border-border rounded-xl p-6 ring-1 ring-foreground/5">
          <h2 className="text-base font-medium mb-5">Edit Machine Details</h2>
          <MachineForm
            action={editAction}
            defaultValues={machine}
            submitLabel="Save Changes"
            cancelHref={`/machines/${machine.id}`}
          />
        </div>
      )}
    </div>
  )
}
