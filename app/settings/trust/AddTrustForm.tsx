'use client'

import { useActionState } from 'react'
import { addTrustAction, type TrustActionState } from './actions'

export function AddTrustForm() {
  const [state, action, pending] = useActionState<TrustActionState, FormData>(
    addTrustAction,
    null
  )

  return (
    <form action={action} className="flex gap-2">
      <input
        name="query"
        type="text"
        placeholder="Email or name"
        className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
      />
      <button
        type="submit"
        disabled={pending}
        className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 shrink-0"
      >
        {pending ? 'Adding…' : 'Add'}
      </button>
      {state && 'error' in state && (
        <p className="absolute mt-10 text-xs text-red-400">{state.error}</p>
      )}
      {state && 'success' in state && (
        <p className="absolute mt-10 text-xs text-green-400">{state.success}</p>
      )}
    </form>
  )
}
