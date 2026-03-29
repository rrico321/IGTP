import Link from 'next/link'
import { getMachines, getUsers, getTrustedUserIds } from '@/lib/db'
import { requireUserId } from '@/lib/auth'
import { BrowseFilters } from './BrowseFilters'
import { MachineStatusBadge } from '@/app/components/StatusBadge'
import type { User } from '@/lib/types'

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; gpuModel?: string; minVram?: string; showAll?: string }>
}) {
  const userId = await requireUserId()
  const { q, gpuModel, minVram, showAll } = await searchParams

  const [trustedIds, allMachines, allUsers] = await Promise.all([
    getTrustedUserIds(userId),
    getMachines(),
    getUsers(),
  ])
  const userMap = new Map<string, User>(allUsers.map((u) => [u.id, u]))

  let machines = allMachines.filter((m) => trustedIds.includes(m.ownerId))

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Browse Machines</h1>
        <p className="text-muted-foreground text-sm mt-1">
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
        <div className="text-center px-8 py-20 border border-border rounded-xl bg-card/30 mt-6">
          <p className="text-muted-foreground mb-3">Your trust network is empty.</p>
          <Link
            href="/settings/trust"
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Add trusted users →
          </Link>
        </div>
      )}

      {/* Results */}
      {trustedIds.length > 0 && machines.length > 0 && (
        <div className="space-y-2 mt-6">
          {machines.map((machine) => {
            const owner = userMap.get(machine.ownerId)
            return (
              <Link
                key={machine.id}
                href={`/browse/${machine.id}`}
                className="block bg-card border border-border rounded-xl p-4 hover:border-border/60 hover:bg-card/80 transition-colors ring-1 ring-foreground/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                      <span className="font-medium text-sm text-foreground">{machine.name}</span>
                      <MachineStatusBadge status={machine.status} />
                    </div>
                    {machine.description && (
                      <p className="text-sm text-muted-foreground mb-1.5 line-clamp-1">
                        {machine.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>GPU: <span className="text-foreground/80">{machine.gpuModel}</span></span>
                      <span>VRAM: <span className="text-foreground/80">{machine.vramGb} GB</span></span>
                      {owner && (
                        <span>Owner: <span className="text-foreground/80">{owner.name}</span></span>
                      )}
                    </div>
                  </div>
                  <span className="text-muted-foreground/40 shrink-0 text-sm">→</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {trustedIds.length > 0 && machines.length === 0 && (
        <div className="text-center px-8 py-20 border border-border rounded-xl bg-card/30 mt-6">
          <p className="text-muted-foreground mb-3">No machines match your filters.</p>
          {hasFilters && (
            <Link
              href="/browse"
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
            >
              Clear filters
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
