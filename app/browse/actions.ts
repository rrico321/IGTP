'use server'

import { revalidatePath } from 'next/cache'
import { createRequest, getMachineById, getUserById, isTrusted, createNotification } from '@/lib/db'
import { requireUserId } from '@/lib/auth'

export type ActionState = { error: string } | { success: true } | null

export async function createRequestAction(
  machineId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId()

  const machine = await getMachineById(machineId)
  if (!machine) return { error: 'Machine not found.' }
  if (machine.ownerId === userId) return { error: 'You cannot request your own machine.' }
  if (!(await isTrusted(userId, machine.ownerId))) {
    return { error: 'You can only request machines from trusted users.' }
  }

  const purpose = (formData.get('purpose') as string)?.trim()
  const estimatedHours = Number(formData.get('estimatedHours'))

  if (!purpose) return { error: 'Purpose is required.' }
  if (!estimatedHours || estimatedHours < 1) {
    return { error: 'Estimated hours must be at least 1.' }
  }

  const accessRequest = await createRequest({
    machineId,
    requesterId: userId,
    purpose,
    estimatedHours,
  })

  // Notify the machine owner about the new request
  const requester = await getUserById(userId)
  createNotification({
    userId: machine.ownerId,
    type: "request_submitted",
    title: `New request — ${machine.name}`,
    message: `${requester?.name ?? "Someone"} wants to use ${machine.name} for ${estimatedHours}h: "${purpose}"`,
    requestId: accessRequest.id,
  }).catch(() => {})

  revalidatePath('/requests')
  revalidatePath(`/browse/${machineId}`)

  return { success: true }
}
