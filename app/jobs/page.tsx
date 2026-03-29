import Link from 'next/link'
import { getJobs, getMachines } from '@/lib/db'
import { requireUserId } from '@/lib/auth'
import { JobStatusBadge } from '@/app/components/StatusBadge'
import type { Machine } from '@/lib/types'

export default async function JobsPage() {
  const userId = await requireUserId()
  const [jobs, allMachines] = await Promise.all([
    getJobs({ requesterId: userId }),
    getMachines(),
  ])
  const machineMap = new Map<string, Machine>(allMachines.map((m) => [m.id, m]))

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Jobs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {jobs.length === 0
              ? 'No jobs submitted yet.'
              : `${jobs.length} job${jobs.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="text-sm bg-foreground text-background px-3 py-1.5 rounded-lg font-medium hover:bg-foreground/90 transition-colors"
        >
          + New Prompt
        </Link>
      </div>

      {jobs.length === 0 && (
        <div className="text-center px-8 py-20 border border-border rounded-xl bg-card/30">
          <p className="text-muted-foreground mb-4">
            You haven&apos;t submitted any GPU jobs yet.
          </p>
          <Link
            href="/jobs/new"
            className="text-sm text-foreground underline underline-offset-4 hover:text-foreground/80"
          >
            Submit your first job →
          </Link>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="space-y-3">
          {jobs.map((job) => {
            const machine = machineMap.get(job.machineId)
            const runtimeSec =
              job.startedAt && job.completedAt
                ? Math.round(
                    (new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000
                  )
                : null

            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block bg-card border border-border rounded-xl p-5 ring-1 ring-foreground/5 hover:ring-foreground/10 transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <code className="text-sm font-mono text-foreground truncate max-w-xs">
                    {job.command}
                  </code>
                  <JobStatusBadge status={job.status} />
                </div>

                <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground/60 mt-2">
                  <span>{machine?.name ?? job.machineId}</span>
                  {machine && (
                    <span>{machine.gpuModel} · {machine.vramGb} GB VRAM</span>
                  )}
                  {runtimeSec != null && (
                    <span>{runtimeSec < 60 ? `${runtimeSec}s` : `${Math.round(runtimeSec / 60)}m`}</span>
                  )}
                  {job.dockerImage && (
                    <span className="font-mono">{job.dockerImage}</span>
                  )}
                  <span>
                    {new Date(job.queuedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
