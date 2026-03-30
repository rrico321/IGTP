'use server'

import { requireUserId } from '@/lib/auth'
import { getUserById, getUserByEmail, updateUserProfile, verifyPassword, updatePassword } from '@/lib/db'

export type ProfileState = { error?: string; success?: string } | null

export async function updateProfileAction(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const userId = await requireUserId()

  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()

  if (!name || !email) {
    return { error: 'Name and email are required.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Please enter a valid email address.' }
  }

  const existing = await getUserByEmail(email)
  if (existing && existing.id !== userId) {
    return { error: 'That email is already in use by another account.' }
  }

  await updateUserProfile(userId, name, email)

  return { success: 'Profile updated successfully.' }
}

export type PasswordState = { error?: string; success?: string } | null

export async function changePasswordAction(
  _prevState: PasswordState,
  formData: FormData
): Promise<PasswordState> {
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

export async function getProfile() {
  const userId = await requireUserId()
  const user = await getUserById(userId)
  if (!user) throw new Error('User not found')
  return { name: user.name, email: user.email }
}
