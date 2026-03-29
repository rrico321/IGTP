import Link from 'next/link'
import { getMachines } from '@/lib/db'
import { requireUserId } from '@/lib/auth'
import { updateMachineStatusAction } from './actions'
import { MachineStatusBadge } from '@/app/components/StatusBadge'
import { DeleteMachineButton } from './DeleteMachineButton'
import type { Machine } from '@/lib/types'

const NEXT_STATUS: Record<Machine['status'], Machine['status']> = {
  available: 'busy',
  busy: 'offline',
  offline: 'available',
}

export default async function MachinesPage() {
  const userId = await requireUserId()
  const machines = (await getMachines()).filter((m) => m.ownerId === userId)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Machines</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {machines.length === 0
              ? 'No machines registered yet.'
              : `${machines.length} machine${machines.length === 1 ? '' : 's'} registered`}
          </p>
        </div>
        <Link
          href="/machines/new"
          className="inline-flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
        >
          + Register Machine
        </Link>
      </div>

      {/* Empty state */}
      {machines.length === 0 && (
        <div className="text-center px-8 py-24 border border-border rounded-xl bg-card/30">
          <p className="text-muted-foreground mb-2 text-sm">
            You don&apos;t have any machines registered yet.
          </p>
          <p className="text-muted-foreground/60 mb-6 text-xs max-w-sm mx-auto">
            If you want to share your computer&apos;s power, install the IGTP daemon. If you just want to use someone else&apos;s machine, go to Browse.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/machines/new"
              className="text-sm px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:bg-foreground/90 transition-colors"
            >
              Register a machine
            </Link>
            <Link
              href="/browse"
              className="text-sm px-4 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              Browse machines
            </Link>
          </div>
        </div>
      )}

      {/* Machine list */}
      {machines.length > 0 && (
        <div className="space-y-3">
          {machines.map((machine) => {
            const nextStatus = NEXT_STATUS[machine.status]
            const toggleAction = updateMachineStatusAction.bind(null, machine.id, nextStatus)

            return (
              <div
                key={machine.id}
                className="bg-card border border-border rounded-xl p-5 ring-1 ring-foreground/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                      <h2 className="font-medium text-sm text-foreground">{machine.name}</h2>
                      <MachineStatusBadge status={machine.status} />
                    </div>
                    {machine.description && (
                      <p className="text-sm text-muted-foreground mb-2.5 line-clamp-2">
                        {machine.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>GPU: <span className="text-foreground/80">{machine.gpuModel}</span></span>
                      <span>VRAM: <span className="text-foreground/80">{machine.vramGb} GB</span></span>
                      <span>CPU: <span className="text-foreground/80">{machine.cpuModel}</span></span>
                      <span>RAM: <span className="text-foreground/80">{machine.ramGb} GB</span></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Link
                      href={`/machines/${machine.id}`}
                      className="text-xs text-center px-3 py-1.5 border border-border rounded-lg hover:border-border/60 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Details
                    </Link>
                    <Link
                      href={`/machines/${machine.id}?edit=1`}
                      className="text-xs text-center px-3 py-1.5 border border-border rounded-lg hover:border-border/60 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Edit
                    </Link>
                    <form action={toggleAction}>
                      <button
                        type="submit"
                        className="w-full text-xs px-3 py-1.5 border border-border rounded-lg hover:border-border/60 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      >
                        → {nextStatus}
                      </button>
                    </form>
                    <DeleteMachineButton machineId={machine.id} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
