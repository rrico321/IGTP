'use client'

import { useActionState, useState } from 'react'
import type { ActionState } from './actions'
import type { Machine } from '@/lib/types'

const GPU_OPTIONS = [
  'RTX 4090',
  'RTX 4080 Super',
  'RTX 4080',
  'RTX 4070 Ti Super',
  'RTX 4070 Ti',
  'RTX 3090 Ti',
  'RTX 3090',
  'RTX 3080 Ti',
  'RTX 3080',
  'A100 80GB SXM',
  'A100 80GB PCIe',
  'A100 40GB',
  'H100 80GB SXM',
  'H100 80GB PCIe',
  'H100 NVL',
  'V100 32GB',
  'RTX 6000 Ada',
  'RTX A6000',
  'M3 Max',
  'M2 Ultra',
  '__custom__',
]

const LABEL = 'text-xs font-medium text-muted-foreground mb-1.5 block'
const INPUT =
  'w-full bg-input/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 transition-colors'

interface MachineFormProps {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  defaultValues?: Partial<Machine>
  submitLabel?: string
  cancelHref?: string
}

export function MachineForm({
  action,
  defaultValues,
  submitLabel = 'Register Machine',
  cancelHref,
}: MachineFormProps) {
  const [state, formAction, pending] = useActionState(action, null)

  const defaultGpu = defaultValues?.gpuModel ?? ''
  const isCustomDefault = defaultGpu && !GPU_OPTIONS.includes(defaultGpu)
  const [gpuSelect, setGpuSelect] = useState(
    isCustomDefault ? '__custom__' : defaultGpu
  )
  const [gpuCustom, setGpuCustom] = useState(isCustomDefault ? defaultGpu : '')

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-lg">
          {state.error}
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className={LABEL}>
          Machine Name <span className="text-destructive">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name ?? ''}
          placeholder="e.g. Alice's Beast"
          className={INPUT}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className={LABEL}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ''}
          placeholder="What's special about this machine? Use case, location, notes..."
          className={`${INPUT} resize-none`}
        />
      </div>

      {/* GPU Model */}
      <div>
        <label htmlFor="gpuModelSelect" className={LABEL}>
          GPU Model <span className="text-destructive">*</span>
        </label>
        <select
          id="gpuModelSelect"
          name="gpuModelSelect"
          required
          value={gpuSelect}
          onChange={(e) => setGpuSelect(e.target.value)}
          className={`${INPUT} cursor-pointer`}
        >
          <option value="" disabled>
            Select GPU model…
          </option>
          {GPU_OPTIONS.map((opt) =>
            opt === '__custom__' ? (
              <option key={opt} value="__custom__">
                Custom / Other…
              </option>
            ) : (
              <option key={opt} value={opt}>
                {opt}
              </option>
            )
          )}
        </select>
        {gpuSelect === '__custom__' && (
          <input
            name="gpuModelCustom"
            type="text"
            required
            value={gpuCustom}
            onChange={(e) => setGpuCustom(e.target.value)}
            placeholder="Enter GPU model name"
            className={`${INPUT} mt-2`}
          />
        )}
      </div>

      {/* VRAM + RAM row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="vramGb" className={LABEL}>
            VRAM (GB) <span className="text-destructive">*</span>
          </label>
          <input
            id="vramGb"
            name="vramGb"
            type="number"
            required
            min={1}
            defaultValue={defaultValues?.vramGb ?? ''}
            placeholder="e.g. 24"
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="ramGb" className={LABEL}>
            RAM (GB) <span className="text-destructive">*</span>
          </label>
          <input
            id="ramGb"
            name="ramGb"
            type="number"
            required
            min={1}
            defaultValue={defaultValues?.ramGb ?? ''}
            placeholder="e.g. 64"
            className={INPUT}
          />
        </div>
      </div>

      {/* CPU Model */}
      <div>
        <label htmlFor="cpuModel" className={LABEL}>
          CPU Model <span className="text-destructive">*</span>
        </label>
        <input
          id="cpuModel"
          name="cpuModel"
          type="text"
          required
          defaultValue={defaultValues?.cpuModel ?? ''}
          placeholder="e.g. Intel i9-13900K"
          className={INPUT}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {pending ? 'Saving…' : submitLabel}
        </button>
        {cancelHref && (
          <a
            href={cancelHref}
            className="px-5 py-2 rounded-lg text-sm text-muted-foreground border border-border hover:border-border/60 hover:text-foreground transition-colors"
          >
            Cancel
          </a>
        )}
      </div>
    </form>
  )
}
