'use server'

import { requireUserId } from '@/lib/auth'
import { verifyPassword, updatePassword } from '@/lib/db'

export type ChangePasswordState = { error?: string; success?: string } | null

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const userId = await requireUserId()

  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'All fields are required.' }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match.' }
  }

  if (newPassword.length < 4) {
    return { error: 'Password must be at least 4 characters.' }
  }

  const valid = await verifyPassword(userId, currentPassword)
  if (!valid) {
    return { error: 'Current password is incorrect.' }
  }

  await updatePassword(userId, newPassword)

  return { success: 'Password updated successfully.' }
}
