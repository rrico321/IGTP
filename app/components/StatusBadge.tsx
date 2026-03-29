import { cn } from '@/lib/utils'
import type { Machine, AccessRequest, GpuJobStatus } from '@/lib/types'

const MACHINE_STATUS_CLASSES: Record<Machine['status'], string> = {
  available: 'bg-green-500/10 text-green-400 border border-green-500/20',
  busy: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  offline: 'bg-zinc-800 text-zinc-500 border border-zinc-700',
}

const REQUEST_STATUS_CLASSES: Record<AccessRequest['status'], string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  approved: 'bg-green-500/10 text-green-400 border border-green-500/20',
  denied: 'bg-red-500/10 text-red-400 border border-red-500/20',
  completed: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  cancelled: 'bg-zinc-800 text-zinc-500 border border-zinc-700',
}

interface MachineStatusBadgeProps {
  status: Machine['status']
  className?: string
}

export function MachineStatusBadge({ status, className }: MachineStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium',
        MACHINE_STATUS_CLASSES[status],
        className
      )}
    >
      {status}
    </span>
  )
}

interface RequestStatusBadgeProps {
  status: AccessRequest['status']
  className?: string
}

export function RequestStatusBadge({ status, className }: RequestStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
        REQUEST_STATUS_CLASSES[status],
        className
      )}
    >
      {status}
    </span>
  )
}

const JOB_STATUS_CLASSES: Record<GpuJobStatus, string> = {
  queued:    'bg-zinc-800 text-zinc-400 border border-zinc-700',
  running:   'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  completed: 'bg-green-500/10 text-green-400 border border-green-500/20',
  failed:    'bg-red-500/10 text-red-400 border border-red-500/20',
  cancelled: 'bg-zinc-800 text-zinc-500 border border-zinc-700',
  timed_out: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
}

interface JobStatusBadgeProps {
  status: GpuJobStatus
  className?: string
}

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
        JOB_STATUS_CLASSES[status],
        className
      )}
    >
      {status.replace('_', ' ')}
    </span>
  )
}
