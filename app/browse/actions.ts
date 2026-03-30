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
  const isExtension = formData.get('isExtension') === 'true'

  if (!purpose) return { error: 'Purpose is required.' }
  if (!estimatedHours || estimatedHours < 1) {
    return { error: 'Hours must be at least 1.' }
  }

  const accessRequest = await createRequest({
    machineId,
    requesterId: userId,
    purpose: isExtension ? `[Extension] ${purpose}` : purpose,
    estimatedHours,
  })

  // Notify the machine owner
  const requester = await getUserById(userId)
  const notifTitle = isExtension
    ? `Extension request — ${machine.name}`
    : `New request — ${machine.name}`
  const notifMessage = isExtension
    ? `${requester?.name ?? "Someone"} wants ${estimatedHours} more hours on ${machine.name}: "${purpose}"`
    : `${requester?.name ?? "Someone"} wants to use ${machine.name} for ${estimatedHours}h: "${purpose}"`

  createNotification({
    userId: machine.ownerId,
    type: "request_submitted",
    title: notifTitle,
    message: notifMessage,
    requestId: accessRequest.id,
    linkUrl: `/machines/${machineId}/requests`,
  }).catch(() => {})

  revalidatePath('/requests')
  revalidatePath(`/browse/${machineId}`)

  return { success: true }
}
