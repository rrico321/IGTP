'use client'

import { useActionState } from 'react'
import { grantAccessAction, type GrantAccessState } from './grant-actions'

export default function GrantAccessForm({ machineId, users }: {
  machineId: string
  users: { id: string; name: string; email: string }[]
}) {
  const [state, action, pending] = useActionState<GrantAccessState, FormData>(
    grantAccessAction.bind(null, machineId),
    null
  )

  if (users.length === 0) {
    return (
      <p className="text-xs text-muted-foreground/60">
        All users in your network already have access, or you have no network connections yet.
      </p>
    )
  }

  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="userId" className="block text-xs font-medium text-muted-foreground mb-1.5">
          User
        </label>
        <select
          id="userId"
          name="userId"
          required
          className="w-full bg-input/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 transition-colors"
        >
          <option value="">Select a user...</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="hours" className="block text-xs font-medium text-muted-foreground mb-1.5">
          Access duration (hours)
        </label>
        <input
          id="hours"
          name="hours"
          type="number"
          min="1"
          max="720"
          defaultValue="24"
          required
          className="w-full bg-input/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 transition-colors"
        />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-500">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
      >
        {pending ? 'Granting...' : 'Grant access'}
      </button>
    </form>
  )
}
