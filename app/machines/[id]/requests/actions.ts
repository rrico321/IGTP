'use server'

import { revalidatePath } from 'next/cache'
import { updateRequest, getMachineById } from '@/lib/db'
import { requireUserId } from '@/lib/auth'
import type { AccessRequest } from '@/lib/types'

export async function updateRequestStatusAction(
  requestId: string,
  machineId: string,
  status: AccessRequest['status'],
  _formData: FormData
): Promise<void> {
  const userId = await requireUserId()
  const machine = getMachineById(machineId)
  if (!machine || machine.ownerId !== userId) return

  updateRequest(requestId, { status })
  revalidatePath(`/machines/${machineId}/requests`)
  revalidatePath('/requests')
}
