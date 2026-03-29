'use client'

import { useActionState, useState } from 'react'
import { loginAction, type LoginState } from './actions'
import type { User } from '@/lib/types'

export function LoginForm({ users }: { users: User[] }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, null)
  const [selected, setSelected] = useState(users[0]?.id ?? '__new__')
  const [newName, setNewName] = useState('')

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        {users.map((u) => (
          <label
            key={u.id}
            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
              selected === u.id
                ? 'border-ring bg-card'
                : 'border-border hover:border-border/60 bg-card/50'
            }`}
          >
            <input
              type="radio"
              name="userId"
              value={u.id}
              checked={selected === u.id}
              onChange={() => setSelected(u.id)}
              className="accent-primary"
            />
            <div>
              <div className="font-medium text-sm text-foreground">{u.name}</div>
              <div className="text-xs text-muted-foreground">{u.email}</div>
            </div>
          </label>
        ))}

        <label
          className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
            selected === '__new__'
              ? 'border-ring bg-card'
              : 'border-border hover:border-border/60 bg-card/50'
          }`}
        >
          <input
            type="radio"
            name="userId"
            value="__new__"
            checked={selected === '__new__'}
            onChange={() => setSelected('__new__')}
            className="accent-primary mt-0.5"
          />
          <div className="flex-1">
            <div className="font-medium text-sm text-foreground mb-2">Create new account</div>
            {selected === '__new__' && (
              <input
                name="newName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Your name"
                autoFocus
                className="w-full bg-input/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 transition-colors"
              />
            )}
          </div>
        </label>
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-medium text-muted-foreground mb-1.5">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder={selected === '__new__' ? 'Choose a password' : 'Enter your password'}
          className="w-full bg-input/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/50 transition-colors"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
