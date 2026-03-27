import Link from 'next/link'
import { getMachines } from '@/lib/db'
import { requireUserId } from '@/lib/auth'
import { updateMachineStatusAction } from './actions'
import type { Machine } from '@/lib/types'

const STATUS_CLASSES: Record<Machine['status'], string> = {
  available: 'bg-green-900/50 text-green-400 border border-green-800',
  busy: 'bg-yellow-900/50 text-yellow-400 border border-yellow-800',
  offline: 'bg-zinc-800 text-zinc-500 border border-zinc-700',
}

const NEXT_STATUS: Record<Machine['status'], Machine['status']> = {
  available: 'busy',
  busy: 'offline',
  offline: 'available',
}

export default async function MachinesPage() {
  const userId = await requireUserId()
  const machines = getMachines().filter((m) => m.ownerId === userId)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">My Machines</h1>
            <p className="text-zinc-500 text-sm mt-1">
              {machines.length === 0
                ? 'No machines registered yet.'
                : `${machines.length} machine${machines.length === 1 ? '' : 's'} registered`}
            </p>
          </div>
          <Link
            href="/machines/new"
            className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-100 shrink-0"
          >
            + Register Machine
          </Link>
        </div>

        {/* Empty state */}
        {machines.length === 0 && (
          <div className="text-center py-24 border border-zinc-800 rounded-xl">
            <p className="text-zinc-500 mb-4">
              Register your first machine to start sharing compute.
            </p>
            <Link
              href="/machines/new"
              className="text-white text-sm underline underline-offset-4"
            >
              Register a machine →
            </Link>
          </div>
        )}

        {/* Machine list */}
        {machines.length > 0 && (
          <div className="space-y-3">
            {machines.map((machine) => {
              const nextStatus = NEXT_STATUS[machine.status]
              const toggleAction = updateMachineStatusAction.bind(
                null,
                machine.id,
                nextStatus
              )

              return (
                <div
                  key={machine.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {/* Name + status */}
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h2 className="font-medium text-zinc-50">{machine.name}</h2>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[machine.status]}`}
                        >
                          {machine.status}
                        </span>
                      </div>

                      {/* Description */}
                      {machine.description && (
                        <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
                          {machine.description}
                        </p>
                      )}

                      {/* Specs */}
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500">
                        <span>
                          GPU:{' '}
                          <span className="text-zinc-300">{machine.gpuModel}</span>
                        </span>
                        <span>
                          VRAM:{' '}
                          <span className="text-zinc-300">{machine.vramGb} GB</span>
                        </span>
                        <span>
                          CPU:{' '}
                          <span className="text-zinc-300">{machine.cpuModel}</span>
                        </span>
                        <span>
                          RAM:{' '}
                          <span className="text-zinc-300">{machine.ramGb} GB</span>
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <Link
                        href={`/machines/${machine.id}`}
                        className="text-xs text-center px-3 py-1.5 border border-zinc-700 rounded-lg hover:border-zinc-500 text-zinc-400 hover:text-zinc-100"
                      >
                        Details
                      </Link>
                      <Link
                        href={`/machines/${machine.id}?edit=1`}
                        className="text-xs text-center px-3 py-1.5 border border-zinc-700 rounded-lg hover:border-zinc-500 text-zinc-400 hover:text-zinc-100"
                      >
                        Edit
                      </Link>
                      <form action={toggleAction}>
                        <button
                          type="submit"
                          className="w-full text-xs px-3 py-1.5 border border-zinc-700 rounded-lg hover:border-zinc-500 text-zinc-400 hover:text-zinc-100 cursor-pointer"
                        >
                          → {nextStatus}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
