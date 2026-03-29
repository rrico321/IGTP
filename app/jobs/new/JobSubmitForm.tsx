'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AccessRequest, Machine } from '@/lib/types'

interface Props {
  approvedRequests: AccessRequest[]
  machineMap: Record<string, Machine>
  preselectedRequestId?: string
}

export function JobSubmitForm({ approvedRequests, machineMap, preselectedRequestId }: Props) {
  const router = useRouter()
  const [requestId, setRequestId] = useState(preselectedRequestId ?? approvedRequests[0]?.id ?? '')
  const [command, setCommand] = useState('')
  const [dockerImage, setDockerImage] = useState('')
  const [priority, setPriority] = useState('5')
  const [maxRuntimeSec, setMaxRuntimeSec] = useState('3600')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const selectedRequest = approvedRequests.find((r) => r.id === requestId)
  const selectedMachine = selectedRequest ? machineMap[selectedRequest.machineId] : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!command.trim()) {
      setError('Command is required')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          command: command.trim(),
          dockerImage: dockerImage.trim() || undefined,
          priority: Number(priority),
          maxRuntimeSec: Number(maxRuntimeSec),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to submit job')
        return
      }

      const job = await res.json()
      router.push(`/jobs/${job.id}`)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Machine / request selector */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Machine</label>
        <select
          value={requestId}
          onChange={(e) => setRequestId(e.target.value)}
          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
        >
          {approvedRequests.map((req) => {
            const machine = machineMap[req.machineId]
            return (
              <option key={req.id} value={req.id}>
                {machine?.name ?? req.machineId}
                {machine ? ` — ${machine.gpuModel} · ${machine.vramGb} GB VRAM` : ''}
              </option>
            )
          })}
        </select>
        {selectedMachine && (
          <p className="text-xs text-muted-foreground mt-1">
            {selectedMachine.cpuModel} · {selectedMachine.ramGb} GB RAM
          </p>
        )}
      </div>

      {/* Command */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Command</label>
        <textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="python train.py --epochs 10"
          rows={3}
          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/20 resize-none"
          required
        />
      </div>

      {/* Docker image (optional) */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          Docker image <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={dockerImage}
          onChange={(e) => setDockerImage(e.target.value)}
          placeholder="pytorch/pytorch:2.4.0-cuda12.4-cudnn9-runtime"
          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/20"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Leave blank to run as a bare process on the machine.
        </p>
      </div>

      {/* Priority + runtime */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
          >
            <option value="1">1 — Highest</option>
            <option value="3">3 — High</option>
            <option value="5">5 — Normal</option>
            <option value="7">7 — Low</option>
            <option value="10">10 — Lowest</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Max runtime</label>
          <select
            value={maxRuntimeSec}
            onChange={(e) => setMaxRuntimeSec(e.target.value)}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
          >
            <option value="900">15 minutes</option>
            <option value="3600">1 hour</option>
            <option value="7200">2 hours</option>
            <option value="14400">4 hours</option>
            <option value="28800">8 hours</option>
            <option value="86400">24 hours</option>
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-foreground text-background py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Submitting…' : 'Submit job'}
        </button>
        <a
          href="/jobs"
          className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
