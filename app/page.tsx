import Link from 'next/link'
import { getMachines, getTrustedUserIds } from '@/lib/db'
import { requireUserId } from '@/lib/auth'
import type { Machine } from '@/lib/types'

const STATUS_CLASSES: Record<Machine['status'], string> = {
  available: 'bg-green-900/50 text-green-400 border border-green-800',
  busy: 'bg-yellow-900/50 text-yellow-400 border border-yellow-800',
  offline: 'bg-zinc-800 text-zinc-500 border border-zinc-700',
}

export default async function HomePage() {
  const userId = await requireUserId()
  const trustedIds = getTrustedUserIds(userId)

  const allMachines = getMachines()
  const trustedMachines = allMachines.filter(
    (m) => m.status === 'available' && trustedIds.includes(m.ownerId)
  )
  const featured = trustedMachines.slice(0, 3)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-2">I Got The Power</h1>
          <p className="text-zinc-400 text-sm">
            Share and access GPU compute with people you trust.
          </p>
        </div>

        {/* Featured available machines from trust network */}
        {featured.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
                Available from your network
              </h2>
              <Link href="/browse" className="text-xs text-zinc-500 hover:text-zinc-300">
                View all {trustedMachines.length} →
              </Link>
            </div>
            <div className="space-y-3">
              {featured.map((machine) => (
                <Link
                  key={machine.id}
                  href={`/browse/${machine.id}`}
                  className="block bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <span className="font-medium text-zinc-50">{machine.name}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[machine.status]}`}
                        >
                          {machine.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-5 text-xs text-zinc-500">
                        <span>
                          GPU: <span className="text-zinc-300">{machine.gpuModel}</span>
                        </span>
                        <span>
                          VRAM: <span className="text-zinc-300">{machine.vramGb} GB</span>
                        </span>
                      </div>
                    </div>
                    <span className="text-zinc-600 shrink-0">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {trustedMachines.length === 0 && (
          <div className="text-center py-24 border border-zinc-800 rounded-xl">
            <p className="text-zinc-500 mb-4">
              {trustedIds.length === 0
                ? 'Add trusted users to see their machines here.'
                : 'No machines available from your trust network right now.'}
            </p>
            <div className="flex justify-center gap-4 text-sm">
              {trustedIds.length === 0 && (
                <Link
                  href="/settings/trust"
                  className="text-white underline underline-offset-4"
                >
                  Manage trust network →
                </Link>
              )}
              <Link
                href="/machines/new"
                className="text-zinc-400 underline underline-offset-4"
              >
                Register your machine →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
