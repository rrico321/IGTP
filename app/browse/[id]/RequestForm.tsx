'use client'

import { useActionState } from 'react'
import type { ActionState } from '../actions'

const LABEL = 'text-xs font-medium text-zinc-400 mb-1 block'
const INPUT =
  'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500'

interface RequestFormProps {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  isExtension?: boolean
}

export function RequestForm({ action, isExtension = false }: RequestFormProps) {
  const [state, formAction, pending] = useActionState(action, null)

  if (state && 'success' in state) {
    return (
      <div className="bg-green-900/30 border border-green-800 text-green-400 text-sm px-4 py-4 rounded-lg">
        {isExtension ? 'Extension request submitted!' : 'Request submitted!'} Track its status on{' '}
        <a
          href="/requests"
          className="underline underline-offset-4 hover:text-green-300"
        >
          My Requests
        </a>
        .
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      {state && 'error' in state && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="purpose" className={LABEL}>
          {isExtension ? 'Reason for extension' : 'Purpose'} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="purpose"
          name="purpose"
          rows={3}
          required
          placeholder={isExtension
            ? "Why do you need more time? e.g. Still training, need more inference runs…"
            : "What will you use this machine for? Training a model, running inference…"}
          className={`${INPUT} resize-none`}
        />
      </div>

      <div>
        <label htmlFor="estimatedHours" className={LABEL}>
          {isExtension ? 'Additional Hours' : 'Estimated Hours'} <span className="text-red-500">*</span>
        </label>
        <input
          id="estimatedHours"
          name="estimatedHours"
          type="number"
          min={1}
          required
          placeholder={isExtension ? "e.g. 2" : "e.g. 8"}
          className={INPUT}
        />
      </div>

      {isExtension && (
        <input type="hidden" name="isExtension" value="true" />
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-white text-black px-5 py-2 rounded-lg text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? 'Submitting…' : isExtension ? 'Request Extension' : 'Request Access'}
      </button>
    </form>
  )
}
