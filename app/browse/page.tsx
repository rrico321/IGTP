import Link from 'next/link'
import { getMachines, getUserById, getTrustedUserIds } from '@/lib/db'
import { requireUserId } from '@/lib/auth'
import { BrowseFilters } from './BrowseFilters'
import type { Machine } from '@/lib/types'

const STATUS_CLASSES: Record<Machine['status'], string> = {
  available: 'bg-green-900/50 text-green-400 border border-green-800',
  busy: 'bg-yellow-900/50 text-yellow-400 border border-yellow-800',
  offline: 'bg-zinc-800 text-zinc-500 border border-zinc-700',
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; gpuModel?: string; minVram?: string; showAll?: string }>
}) {
  const userId = await requireUserId()
  const { q, gpuModel, minVram, showAll } = await searchParams

  const trustedIds = getTrustedUserIds(userId)

  let machines = getMachines().filter((m) => trustedIds.includes(m.ownerId))

  // Default: available only
  if (showAll !== '1') {
    machines = machines.filter((m) => m.status === 'available')
  }

  if (q) {
    const query = q.toLowerCase()
    machines = machines.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.gpuModel.toLowerCase().includes(query)
    )
  }

  if (gpuModel) {
    machines = machines.filter((m) =>
      m.gpuModel.toLowerCase().includes(gpuModel.toLowerCase())
    )
  }

  if (minVram) {
    const min = Number(minVram)
    if (!isNaN(min) && min > 0) {
      machines = machines.filter((m) => m.vramGb >= min)
    }
  }

  const hasFilters = !!(q || gpuModel || minVram || showAll === '1')

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Browse Machines</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {machines.length === 0
              ? 'No machines match your filters.'
              : `${machines.length} machine${machines.length === 1 ? '' : 's'} from your trust network`}
          </p>
        </div>

        {/* Filters */}
        <BrowseFilters
          q={q ?? ''}
          gpuModel={gpuModel ?? ''}
          minVram={minVram ?? ''}
          showAll={showAll === '1'}
        />

        {/* No trust network */}
        {trustedIds.length === 0 && (
          <div className="text-center py-20 border border-zinc-800 rounded-xl mt-6">
            <p className="text-zinc-500 mb-3">Your trust network is empty.</p>
            <Link
              href="/settings/trust"
              className="text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-4"
            >
              Add trusted users →
            </Link>
          </div>
        )}

        {/* Results */}
        {trustedIds.length > 0 && machines.length > 0 && (
          <div className="space-y-3 mt-6">
            {machines.map((machine) => {
              const owner = getUserById(machine.ownerId)
              return (
                <Link
                  key={machine.id}
                  href={`/browse/${machine.id}`}
                  className="block bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="font-medium text-zinc-50">{machine.name}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[machine.status]}`}
                        >
                          {machine.status}
                        </span>
                      </div>
                      {machine.description && (
                        <p className="text-sm text-zinc-400 mb-2 line-clamp-1">
                          {machine.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500">
                        <span>
                          GPU: <span className="text-zinc-300">{machine.gpuModel}</span>
                        </span>
                        <span>
                          VRAM: <span className="text-zinc-300">{machine.vramGb} GB</span>
                        </span>
                        {owner && (
                          <span>
                            Owner: <span className="text-zinc-300">{owner.name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-zinc-600 shrink-0 text-sm">→</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {trustedIds.length > 0 && machines.length === 0 && (
          <div className="text-center py-20 border border-zinc-800 rounded-xl mt-6">
            <p className="text-zinc-500 mb-3">No machines match your filters.</p>
            {hasFilters && (
              <Link
                href="/browse"
                className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-4"
              >
                Clear filters
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
