'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createUser, getUserById } from '@/lib/db'
import { SESSION_COOKIE } from '@/lib/auth'

export type LoginState = { error: string } | null

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const userId = formData.get('userId') as string
  const newName = (formData.get('newName') as string)?.trim()

  let selectedUserId = userId

  if (userId === '__new__') {
    if (!newName) return { error: 'Name is required to create an account.' }
    const user = await createUser(newName)
    selectedUserId = user.id
  } else {
    const user = await getUserById(selectedUserId)
    if (!user) return { error: 'User not found.' }
  }

  const store = await cookies()
  store.set(SESSION_COOKIE, selectedUserId, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  })

  redirect('/')
}

export async function logoutAction() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  redirect('/login')
}
