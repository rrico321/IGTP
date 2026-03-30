'use server'

import { revalidatePath } from 'next/cache'
import { requireUserId } from '@/lib/auth'
import { getMachineById, updateRequest, getRequestById, createNotification } from '@/lib/db'

export async function kickUserAction(
  requestId: string,
  machineId: string
): Promise<{ error?: string }> {
  const userId = await requireUserId()
  const machine = await getMachineById(machineId)
  if (!machine || machine.ownerId !== userId) {
    return { error: 'Not authorized' }
  }

  // End the access request
  await updateRequest(requestId, { status: 'completed' })

  // Notify daemon to kill any active tunnels for this machine
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'
  await fetch(`${baseUrl}/api/machines/${machineId}/kick`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': '', // Server-side call, no cookies needed — kick uses authenticateRequest
    },
  }).catch(() => {})

  // Notify the kicked user
  const request = await getRequestById(requestId)
  if (request) {
    createNotification({
      userId: request.requesterId,
      type: 'request_denied',
      title: `Disconnected from ${machine.name}`,
      message: `The machine owner ended your access to ${machine.name}.`,
    }).catch(() => {})
  }

  revalidatePath(`/machines/${machineId}`)
  return {}
}
