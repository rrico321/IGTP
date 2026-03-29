import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getJobById, getSnapshotsForJob, getMachineById } from '@/lib/db'
import { requireUserId } from '@/lib/auth'
import { JobStatusBadge } from '@/app/components/StatusBadge'
import { CancelJobButton } from './CancelJobButton'

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const userId = await requireUserId()

  const job = await getJobById(id)
  if (!job) notFound()

  const [snapshots, machine] = await Promise.all([
    getSnapshotsForJob(id),
    getMachineById(job.machineId),
  ])

  const runtimeSec =
    job.startedAt && job.completedAt
      ? Math.round(
          (new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000
        )
      : job.startedAt
      ? Math.round((Date.now() - new Date(job.startedAt).getTime()) / 1000)
      : null

  const avgGpuUtil =
    snapshots.length > 0
      ? Math.round(
          snapshots.reduce((s, snap) => s + (snap.gpuUtilPct ?? 0), 0) / snapshots.length
        )
      : null

  const avgVram =
    snapshots.length > 0
      ? (snapshots.reduce((s, snap) => s + (snap.vramUsedGb ?? 0), 0) / snapshots.length).toFixed(1)
      : null

  const isOwner = job.requesterId === userId
  const canCancel = isOwner && (job.status === 'queued' || job.status === 'running')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/jobs"
        className="text-xs text-muted-foreground hover:text-foreground mb-6 inline-block"
      >
        ← Back to jobs
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight truncate font-mono">
            {job.command}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {machine?.name ?? job.machineId}
            {machine ? ` — ${machine.gpuModel}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <JobStatusBadge status={job.status} />
          {canCancel && <CancelJobButton jobId={job.id} />}
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Queued', value: new Date(job.queuedAt).toLocaleString() },
          { label: 'Started', value: job.startedAt ? new Date(job.startedAt).toLocaleString() : '—' },
          { label: 'Completed', value: job.completedAt ? new Date(job.completedAt).toLocaleString() : '—' },
          { label: 'Runtime', value: runtimeSec != null ? (runtimeSec < 60 ? `${runtimeSec}s` : `${Math.round(runtimeSec / 60)}m`) : '—' },
          { label: 'Exit code', value: job.exitCode != null ? String(job.exitCode) : '—' },
          { label: 'Priority', value: String(job.priority) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className="text-sm font-medium font-mono">{value}</p>
          </div>
        ))}
      </div>

      {/* Resource limits */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <h2 className="text-sm font-medium mb-3">Resource limits</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
          <span className="text-muted-foreground">Max runtime</span>
          <span>{Math.round(job.maxRuntimeSec / 60)} min</span>
          <span className="text-muted-foreground">VRAM</span>
          <span>{job.vramLimitGb != null ? `${job.vramLimitGb} GB` : 'machine default'}</span>
          <span className="text-muted-foreground">CPU cores</span>
          <span>{job.cpuLimitCores != null ? String(job.cpuLimitCores) : 'machine default'}</span>
          <span className="text-muted-foreground">RAM</span>
          <span>{job.ramLimitGb != null ? `${job.ramLimitGb} GB` : 'machine default'}</span>
          {job.dockerImage && (
            <>
              <span className="text-muted-foreground">Image</span>
              <span className="font-mono text-xs truncate">{job.dockerImage}</span>
            </>
          )}
        </div>
      </div>

      {/* Usage snapshots */}
      {snapshots.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 mb-6">
          <h2 className="text-sm font-medium mb-3">
            Usage averages <span className="text-muted-foreground font-normal">({snapshots.length} samples)</span>
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            <span className="text-muted-foreground">Avg GPU utilisation</span>
            <span>{avgGpuUtil != null ? `${avgGpuUtil}%` : '—'}</span>
            <span className="text-muted-foreground">Avg VRAM used</span>
            <span>{avgVram != null ? `${avgVram} GB` : '—'}</span>
          </div>
        </div>
      )}

      {/* Log output */}
      {job.outputLogUrl && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-medium mb-2">Output log</h2>
          <a
            href={job.outputLogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2"
          >
            Download log →
          </a>
        </div>
      )}
    </div>
  )
}
