'use client'

import { useActionState } from 'react'
import { updateProfileAction, changePasswordAction, type ProfileState, type PasswordState } from './actions'

export default function AccountForm({ initialName, initialEmail }: { initialName: string; initialEmail: string }) {
  const [profileState, profileAction, profilePending] = useActionState<ProfileState, FormData>(updateProfileAction, null)
  const [passwordState, passwordAction, passwordPending] = useActionState<PasswordState, FormData>(changePasswordAction, null)

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <section>
        <h2 className="text-lg font-medium text-foreground mb-1">Profile</h2>
        <p className="text-xs text-muted-foreground mb-4">Update your name and email address.</p>

        <form action={profileAction} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-muted-foreground mb-1.5">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={initialName}
              className="w-full bg-input/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-muted-foreground mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={initialEmail}
              className="w-full bg-input/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 transition-colors"
            />
          </div>

          {profileState?.error && (
            <p className="text-sm text-destructive">{profileState.error}</p>
          )}
          {profileState?.success && (
            <p className="text-sm text-green-500">{profileState.success}</p>
          )}

          <button
            type="submit"
            disabled={profilePending}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {profilePending ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </section>

      <hr className="border-border" />

      {/* Password Section */}
      <section>
        <h2 className="text-lg font-medium text-foreground mb-1">Password</h2>
        <p className="text-xs text-muted-foreground mb-4">Change your account password.</p>

        <form action={passwordAction} className="space-y-4">
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

          {passwordState?.error && (
            <p className="text-sm text-destructive">{passwordState.error}</p>
          )}
          {passwordState?.success && (
            <p className="text-sm text-green-500">{passwordState.success}</p>
          )}

          <button
            type="submit"
            disabled={passwordPending}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {passwordPending ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  )
}
