'use server'

import { revalidatePath } from 'next/cache'
import { requireUserId } from '@/lib/auth'
import {
  acceptFriendRequest,
  denyFriendRequest,
  updateRequest,
} from '@/lib/db'

export async function approveFriendRequestAction(id: string): Promise<void> {
  try {
    const userId = await requireUserId()
    await acceptFriendRequest(id, userId)
    revalidatePath('/')
  } catch {
    // handled gracefully
  }
}

export async function denyFriendRequestAction(id: string): Promise<void> {
  try {
    const userId = await requireUserId()
    await denyFriendRequest(id, userId)
    revalidatePath('/')
  } catch {
    // handled gracefully
  }
}

export async function approveAccessRequestAction(id: string): Promise<void> {
  try {
    await requireUserId()
    await updateRequest(id, { status: 'approved' })
    revalidatePath('/')
  } catch {
    // handled gracefully
  }
}

export async function denyAccessRequestAction(id: string): Promise<void> {
  try {
    await requireUserId()
    await updateRequest(id, { status: 'denied' })
    revalidatePath('/')
  } catch {
    // handled gracefully
  }
}

export async function disconnectRequestAction(id: string): Promise<void> {
  try {
    await requireUserId()
    await updateRequest(id, { status: 'completed' })
    revalidatePath('/')
  } catch {
    // handled gracefully
  }
}

export async function cancelRequestAction(id: string): Promise<void> {
  try {
    await requireUserId()
    await updateRequest(id, { status: 'cancelled' })
    revalidatePath('/')
  } catch {
    // handled gracefully
  }
}
