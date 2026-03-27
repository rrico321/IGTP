'use client'

import { useActionState, useState } from 'react'
import { loginAction, type LoginState } from './actions'
import type { User } from '@/lib/types'

export function LoginForm({ users }: { users: User[] }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, null)
  const [selected, setSelected] = useState(users[0]?.id ?? '__new__')
  const [newName, setNewName] = useState('')

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        {users.map((u) => (
          <label
            key={u.id}
            className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
              selected === u.id
                ? 'border-zinc-500 bg-zinc-800'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <input
              type="radio"
              name="userId"
              value={u.id}
              checked={selected === u.id}
              onChange={() => setSelected(u.id)}
              className="accent-white"
            />
            <div>
              <div className="font-medium text-zinc-100">{u.name}</div>
              <div className="text-xs text-zinc-500">{u.email}</div>
            </div>
          </label>
        ))}

        <label
          className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
            selected === '__new__'
              ? 'border-zinc-500 bg-zinc-800'
              : 'border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <input
            type="radio"
            name="userId"
            value="__new__"
            checked={selected === '__new__'}
            onChange={() => setSelected('__new__')}
            className="accent-white mt-0.5"
          />
          <div className="flex-1">
            <div className="font-medium text-zinc-100 mb-2">Create new account</div>
            {selected === '__new__' && (
              <input
                name="newName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Your name"
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
            )}
          </div>
        </label>
      </div>

      {state?.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-white text-black py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-100 disabled:opacity-50 transition-colors"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
