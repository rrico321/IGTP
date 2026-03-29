'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { AccessRequest, Machine } from '@/lib/types'

interface Props {
  approvedRequests: AccessRequest[]
  machineMap: Record<string, Machine>
  modelsByMachine: Record<string, Array<{ modelName: string; modelType: string; sizeBytes: number | null }>>
  preselectedRequestId?: string
}

export function JobSubmitForm({ approvedRequests, machineMap, modelsByMachine, preselectedRequestId }: Props) {
  const router = useRouter()
  const [requestId, setRequestId] = useState(preselectedRequestId ?? approvedRequests[0]?.id ?? '')
  const [model, setModel] = useState('')
  const [prompt, setPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const selectedRequest = approvedRequests.find((r) => r.id === requestId)
  const selectedMachine = selectedRequest ? machineMap[selectedRequest.machineId] : null
  const availableModels = selectedRequest ? (modelsByMachine[selectedRequest.machineId] ?? []) : []

  // Auto-select first model when machine changes
  useEffect(() => {
    if (availableModels.length > 0 && !availableModels.some(m => m.modelName === model)) {
      setModel(availableModels[0].modelName)
    }
  }, [requestId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim()) {
      setError('Prompt is required')
      return
    }
    if (!model) {
      setError('Please select a model')
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
          command: prompt.trim(),
          model,
          prompt: prompt.trim(),
          jobType: availableModels.find(m => m.modelName === model)?.modelType ?? 'chat',
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

      {/* Model selector */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Model</label>
        {availableModels.length > 0 ? (
          <>
            <div className="flex items-center gap-2">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
              >
                {availableModels.map((m) => (
                  <option key={m.modelName} value={m.modelName}>
                    {m.modelName}
                  </option>
                ))}
              </select>
              {model && (
                <span className="inline-flex items-center rounded-md bg-foreground/10 px-2 py-1 text-xs font-medium text-foreground/70">
                  {availableModels.find(m => m.modelName === model)?.modelType ?? 'chat'}
                </span>
              )}
            </div>
            {model && availableModels.find(m => m.modelName === model)?.sizeBytes != null && (
              <p className="text-xs text-muted-foreground mt-1">
                Size: {(availableModels.find(m => m.modelName === model)!.sizeBytes! / 1e9).toFixed(1)} GB
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground bg-card border border-border rounded-lg px-3 py-2">
            No Ollama models available on this machine. The machine owner needs to install models with Ollama.
          </p>
        )}
      </div>

      {/* Prompt */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask anything..."
          rows={4}
          className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/20 resize-none"
          required
        />
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={loading || availableModels.length === 0}
          className="flex-1 bg-foreground text-background py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Sending...' : 'Send prompt'}
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
