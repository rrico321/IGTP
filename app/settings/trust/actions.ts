'use server'

import { revalidatePath } from 'next/cache'
import { addTrustConnection, removeTrustConnection, getUsers } from '@/lib/db'
import { requireUserId } from '@/lib/auth'

export type TrustActionState = { error: string } | { success: string } | null

export async function addTrustAction(
  _prevState: TrustActionState,
  formData: FormData
): Promise<TrustActionState> {
  const userId = await requireUserId()
  const query = (formData.get('query') as string)?.trim().toLowerCase()

  if (!query) return { error: 'Enter an email or name.' }

  const users = getUsers()
  const target = users.find(
    (u) =>
      u.email.toLowerCase() === query ||
      u.name.toLowerCase() === query
  )

  if (!target) return { error: 'No user found with that email or name.' }
  if (target.id === userId) return { error: 'You cannot trust yourself.' }

  const connection = addTrustConnection(userId, target.id)
  if (!connection) return { error: `${target.name} is already in your trust network.` }

  revalidatePath('/settings/trust')
  revalidatePath('/browse')
  return { success: `${target.name} added to your trust network.` }
}

export async function removeTrustAction(connectionId: string): Promise<void> {
  const userId = await requireUserId()
  removeTrustConnection(connectionId, userId)
  revalidatePath('/settings/trust')
  revalidatePath('/browse')
}
