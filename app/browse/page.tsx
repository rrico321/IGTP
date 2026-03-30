import Link from 'next/link'
import { getMachines, getUsers, getTrustedUserIds, getApprovedRequest, getAllMachineModels } from '@/lib/db'
import type { MachineModel } from '@/lib/types'
import { requireUserId } from '@/lib/auth'
import { BrowseFilters } from './BrowseFilters'
import { MachineStatusBadge } from '@/app/components/StatusBadge'
import { ConnectionBadge } from '@/app/components/ConnectionBadge'
import type { User } from '@/lib/types'

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; gpuModel?: string; minVram?: string; showAll?: string }>
}) {
  const userId = await requireUserId()
  const { q, gpuModel, minVram, showAll } = await searchParams

  const [trustedIds, allMachines, allUsers, allModels] = await Promise.all([
    getTrustedUserIds(userId),
    getMachines(),
    getUsers(),
    getAllMachineModels(),
  ])
  const userMap = new Map<string, User>(allUsers.map((u) => [u.id, u]))
  const modelsByMachine = new Map<string, MachineModel[]>()
  for (const m of allModels) {
    if (!modelsByMachine.has(m.machineId)) modelsByMachine.set(m.machineId, [])
    modelsByMachine.get(m.machineId)!.push(m)
  }

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

  function formatSize(bytes: number | null): string {
    if (!bytes) return ''
    const gb = bytes / 1e9
    return gb >= 1 ? `${gb.toFixed(1)}GB` : `${(bytes / 1e6).toFixed(0)}MB`
  }

  // Batch fetch connection status for all visible machines
  const approvedRequests = await Promise.all(
    machines.map((m) => getApprovedRequest(m.id, userId))
  )
  const connectionMap = new Map<string, { connected: boolean; expiresAt: string | null }>(
    machines.map((m, i) => [m.id, {
      connected: !!approvedRequests[i],
      expiresAt: approvedRequests[i]?.expiresAt ?? null,
    }])
  )

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
            const models = modelsByMachine.get(machine.id) || []
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
                      <ConnectionBadge
                        connected={connectionMap.get(machine.id)?.connected ?? false}
                        expiresAt={connectionMap.get(machine.id)?.expiresAt ?? null}
                      />
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
                    {(models.length > 0 || machine.a1111Enabled) && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {machine.a1111Enabled && (
                          <span className={`inline-flex items-center gap-1 text-xs rounded px-2 py-0.5 font-medium ${
                            machine.a1111Available
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : "bg-purple-500/5 text-purple-400/50 border border-purple-500/10"
                          }`}>
                            A1111 {machine.a1111Available ? "available" : "at capacity"}
                          </span>
                        )}
                        {models.map((model) => (
                          <span
                            key={model.modelName}
                            className="inline-flex items-center gap-1 text-xs font-mono bg-foreground/5 text-foreground/70 rounded px-2 py-0.5"
                          >
                            {model.modelName}
                            {model.sizeBytes ? (
                              <span className="text-muted-foreground/50">{formatSize(model.sizeBytes)}</span>
                            ) : null}
                          </span>
                        ))}
                      </div>
                    )}
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
