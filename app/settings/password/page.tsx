'use client'

import { useActionState } from 'react'
import { changePasswordAction, type ChangePasswordState } from './actions'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ChangePasswordPage() {
  const [state, action, pending] = useActionState<ChangePasswordState, FormData>(changePasswordAction, null)

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Settings
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Change Password</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update your account password.
        </p>
      </div>

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="currentPassword" className="block text-xs font-medium text-muted-foreground mb-1.5">
            Current password
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            className="w-full bg-input/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-xs font-medium text-muted-foreground mb-1.5">
            New password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            className="w-full bg-input/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-medium text-muted-foreground mb-1.5">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            className="w-full bg-input/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 transition-colors"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-green-500">{state.success}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {pending ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
