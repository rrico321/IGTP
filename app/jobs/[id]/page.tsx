import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getJobById, getSnapshotsForJob, getMachineById } from '@/lib/db'
import { requireUserId } from '@/lib/auth'
import { JobStatusBadge } from '@/app/components/StatusBadge'
import { LocalTime } from '@/app/components/LocalTime'
import { CancelJobButton } from './CancelJobButton'
import { MarkdownContent } from '@/app/components/MarkdownContent'

async function JobOutput({ url }: { url: string }) {
  let content: string
  try {
    const res = await fetch(url, { next: { revalidate: 0 } })
    content = res.ok ? await res.text() : 'Failed to load output.'
  } catch {
    content = 'Failed to load output.'
  }

  return (
    <>
      <pre className="bg-black/40 rounded-lg p-4 text-sm font-mono text-green-300 overflow-x-auto whitespace-pre-wrap break-all max-h-96 overflow-y-auto">
        {content || '(empty output)'}
      </pre>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Download full log →
      </a>
    </>
  )
}

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
          { label: 'Queued', node: <LocalTime date={job.queuedAt} /> },
          { label: 'Started', node: job.startedAt ? <LocalTime date={job.startedAt} /> : null, value: '—' },
          { label: 'Completed', node: job.completedAt ? <LocalTime date={job.completedAt} /> : null, value: '—' },
          { label: 'Runtime', value: runtimeSec != null ? (runtimeSec < 60 ? `${runtimeSec}s` : `${Math.round(runtimeSec / 60)}m`) : '—' },
          { label: 'Exit code', value: job.exitCode != null ? String(job.exitCode) : '—' },
          { label: 'Priority', value: String(job.priority) },
        ].map(({ label, value, node }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className="text-sm font-medium font-mono">{node ?? value}</p>
          </div>
        ))}
      </div>

      {/* Token Usage */}
      {job.totalTokens != null && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Prompt tokens</p>
            <p className="text-sm font-medium font-mono">{job.promptTokens?.toLocaleString() ?? '—'}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Completion tokens</p>
            <p className="text-sm font-medium font-mono">{job.completionTokens?.toLocaleString() ?? '—'}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-0.5">Total tokens</p>
            <p className="text-sm font-medium font-mono">{job.totalTokens?.toLocaleString() ?? '—'}</p>
          </div>
        </div>
      )}

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

      {/* Sent to Machine */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <h2 className="text-sm font-medium mb-2 text-blue-400">Sent to Machine</h2>
        {job.model && (
          <p className="text-xs text-muted-foreground mb-2">
            Model: <span className="font-mono text-foreground/70">{job.model}</span>
          </p>
        )}
        <pre className="bg-black/40 rounded-lg p-4 text-sm font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-all">
          {job.prompt ? job.prompt : <><span className="text-muted-foreground select-none">$ </span>{job.command}</>}
        </pre>
        {job.dockerImage && (
          <div className="mt-2 text-xs text-muted-foreground">
            Docker image: <span className="font-mono text-foreground/70">{job.dockerImage}</span>
          </div>
        )}
      </div>

      {/* Received from Machine */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="text-sm font-medium mb-2 text-green-400">Received from Machine</h2>
        {job.outputLog ? (
          <div className="bg-black/40 rounded-lg p-4 max-h-96 overflow-y-auto">
            <MarkdownContent content={job.outputLog} />
          </div>
        ) : job.outputLogUrl ? (
          <JobOutput url={job.outputLogUrl} />
        ) : job.status === 'queued' ? (
          <p className="text-xs text-muted-foreground italic">Waiting for machine to pick up this job...</p>
        ) : job.status === 'running' ? (
          <p className="text-xs text-muted-foreground italic">Job is running — output will appear when complete.</p>
        ) : (
          <p className="text-xs text-muted-foreground italic">No output available.</p>
        )}
      </div>
    </div>
  )
}
