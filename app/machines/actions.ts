'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  createMachine as dbCreate,
  updateMachine as dbUpdate,
  getMachineById,
} from '@/lib/db'
import { requireUserId } from '@/lib/auth'

export type ActionState = { error: string } | null

function parseGpuModel(formData: FormData): string {
  const select = formData.get('gpuModelSelect') as string
  if (select === '__custom__') {
    return (formData.get('gpuModelCustom') as string) ?? ''
  }
  return select ?? ''
}

export async function createMachineAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId()

  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string) ?? ''
  const gpuModel = parseGpuModel(formData).trim()
  const vramGb = Number(formData.get('vramGb'))
  const cpuModel = (formData.get('cpuModel') as string)?.trim()
  const ramGb = Number(formData.get('ramGb'))

  if (!name || !gpuModel || !vramGb || !cpuModel || !ramGb) {
    return { error: 'All required fields must be filled in.' }
  }

  dbCreate({
    name,
    description,
    gpuModel,
    vramGb,
    cpuModel,
    ramGb,
    status: 'available',
    ownerId: userId,
  })

  revalidatePath('/machines')
  redirect('/machines')
}

export async function updateMachineStatusAction(
  id: string,
  status: string,
  _formData: FormData
): Promise<void> {
  const userId = await requireUserId()
  const machine = getMachineById(id)
  if (!machine || machine.ownerId !== userId) return

  dbUpdate(id, { status: status as 'available' | 'busy' | 'offline' })
  revalidatePath('/machines')
  revalidatePath(`/machines/${id}`)
}

export async function updateMachineAction(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await requireUserId()
  const machine = getMachineById(id)
  if (!machine || machine.ownerId !== userId) {
    return { error: 'Not authorized to edit this machine.' }
  }

  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string) ?? ''
  const gpuModel = parseGpuModel(formData).trim()
  const vramGb = Number(formData.get('vramGb'))
  const cpuModel = (formData.get('cpuModel') as string)?.trim()
  const ramGb = Number(formData.get('ramGb'))

  if (!name || !gpuModel || !vramGb || !cpuModel || !ramGb) {
    return { error: 'All required fields must be filled in.' }
  }

  dbUpdate(id, { name, description, gpuModel, vramGb, cpuModel, ramGb })
  revalidatePath('/machines')
  revalidatePath(`/machines/${id}`)
  redirect(`/machines/${id}`)
}
