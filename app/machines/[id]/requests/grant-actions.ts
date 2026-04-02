'use server'

import { revalidatePath } from 'next/cache'
import { requireUserId } from '@/lib/auth'
import { getMachineById, createRequest, updateRequest, hasApprovedRequest, createNotification, getUserById } from '@/lib/db'

export type GrantAccessState = { error?: string; success?: string } | null

export async function grantAccessAction(
  machineId: string,
  _prevState: GrantAccessState,
  formData: FormData
): Promise<GrantAccessState> {
  const ownerId = await requireUserId()

  const machine = await getMachineById(machineId)
  if (!machine || machine.ownerId !== ownerId) {
    return { error: 'Machine not found or not yours.' }
  }

  const userId = formData.get('userId') as string
  const hours = Number(formData.get('hours'))

  if (!userId) return { error: 'Please select a user.' }
  if (!hours || hours < 1) return { error: 'Please enter a valid duration.' }

  // Check if they already have active access
  const alreadyApproved = await hasApprovedRequest(machineId, userId)
  if (alreadyApproved) {
    return { error: 'This user already has active access to this machine.' }
  }

  const user = await getUserById(userId)
  if (!user) return { error: 'User not found.' }

  // Create access request on their behalf, then auto-approve it
  const request = await createRequest({
    machineId,
    requesterId: userId,
    purpose: `Access granted by machine owner`,
    estimatedHours: hours,
    ownerNote: '',
  })

  await updateRequest(request.id, { status: 'approved' })

  // Notify the user
  await createNotification({
    userId,
    type: 'request_approved',
    title: `Access granted to ${machine.name}`,
    message: `You've been granted ${hours}h access to ${machine.name}. You can now use it for AI tasks.`,
    requestId: request.id,
    linkUrl: '/requests',
  })

  revalidatePath(`/machines/${machineId}/requests`)
  revalidatePath('/requests')

  return { success: `Access granted to ${user.name} for ${hours} hours.` }
}
