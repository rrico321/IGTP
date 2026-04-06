import Link from 'next/link'
import { getMachines } from '@/lib/db'
import { requireUserId } from '@/lib/auth'
import { updateMachineStatusAction } from './actions'
import { MachineStatusBadge } from '@/app/components/StatusBadge'
import { DeleteMachineButton } from './DeleteMachineButton'
import { Terminal, Monitor, Apple } from 'lucide-react'
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
      </div>

      {/* Empty state — daemon install instructions */}
      {machines.length === 0 && (
        <div className="border border-border rounded-xl bg-card/30 px-8 py-10">
          <div className="text-center mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-2">Add your first machine</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Install the IGTP daemon on the computer you want to share. It takes about 2 minutes — the installer will detect your hardware and connect automatically.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 max-w-2xl mx-auto mb-8">
            {/* Windows */}
            <div className="border border-border rounded-lg p-4 bg-card">
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Windows</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Open PowerShell and run:</p>
              <code className="block bg-muted text-foreground text-xs font-mono p-2.5 rounded-md break-all leading-relaxed select-all">
                irm https://igtp.ricobuilds.com/install.ps1 | iex
              </code>
            </div>

            {/* Mac */}
            <div className="border border-border rounded-lg p-4 bg-card">
              <div className="flex items-center gap-2 mb-3">
                <Apple className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Mac</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Open Terminal and run:</p>
              <code className="block bg-muted text-foreground text-xs font-mono p-2.5 rounded-md break-all leading-relaxed select-all">
                curl -fsSL https://igtp.ricobuilds.com/install.sh | bash
              </code>
            </div>

            {/* Linux */}
            <div className="border border-border rounded-lg p-4 bg-card">
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Linux</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Open a terminal and run:</p>
              <code className="block bg-muted text-foreground text-xs font-mono p-2.5 rounded-md break-all leading-relaxed select-all">
                curl -fsSL https://igtp.ricobuilds.com/install.sh | bash
              </code>
            </div>
          </div>

          <div className="text-center space-y-3">
            <p className="text-xs text-muted-foreground">
              You&apos;ll need an <Link href="/settings" className="text-primary underline underline-offset-2 hover:opacity-80">API key</Link> from Settings — the installer will ask for it.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Just want to use someone else&apos;s machine?{' '}
              <Link href="/browse" className="text-primary underline underline-offset-2 hover:opacity-80">
                Browse machines
              </Link>
            </p>
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
