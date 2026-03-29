import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMachineById } from '@/lib/db'
import { MachineForm } from '../MachineForm'
import { updateMachineAction, updateMachineStatusAction } from '../actions'
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

  const isEditing = edit === '1'
  const nextStatus = NEXT_STATUS[machine.status]
  const toggleAction = updateMachineStatusAction.bind(null, machine.id, nextStatus)
  const editAction = updateMachineAction.bind(null, machine.id)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/machines"
            className="text-zinc-500 text-xs hover:text-zinc-300 mb-2 inline-block"
          >
            ← My Machines
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">{machine.name}</h1>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[machine.status]}`}
            >
              {machine.status}
            </span>
          </div>
          <p className="text-zinc-500 text-sm mt-1">{STATUS_LABELS[machine.status]}</p>
        </div>

        {/* Details card */}
        {!isEditing && (
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
              <div>
                <dt className="text-xs text-zinc-500 mb-1">Registered</dt>
                <dd className="text-sm text-zinc-400">
                  {new Date(machine.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500 mb-1">Last Updated</dt>
                <dd className="text-sm text-zinc-400">
                  {new Date(machine.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </dd>
              </div>
            </dl>

            {/* Status toggle + edit actions */}
            <div className="flex gap-3 mt-6 pt-5 border-t border-zinc-800">
              <form action={toggleAction}>
                <button
                  type="submit"
                  className="text-sm px-4 py-2 border border-zinc-700 rounded-lg hover:border-zinc-500 text-zinc-400 hover:text-zinc-100 cursor-pointer"
                >
                  Set → {nextStatus}
                </button>
              </form>
              <Link
                href={`/machines/${machine.id}?edit=1`}
                className="text-sm px-4 py-2 border border-zinc-700 rounded-lg hover:border-zinc-500 text-zinc-400 hover:text-zinc-100"
              >
                Edit Details
              </Link>
              <Link
                href={`/machines/${machine.id}/requests`}
                className="text-sm px-4 py-2 border border-zinc-700 rounded-lg hover:border-zinc-500 text-zinc-400 hover:text-zinc-100"
              >
                Requests
              </Link>
            </div>
          </div>
        )}

        {/* Edit form */}
        {isEditing && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
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
    </div>
  )
}
