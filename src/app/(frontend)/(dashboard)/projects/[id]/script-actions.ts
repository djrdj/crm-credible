'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'

export async function createScript(projectId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const payload = await getPayload({ config })

  const script = await payload.create({
    collection: 'scripts',
    user,
    data: {
      title: 'New Script',
      project: Number(projectId),
      createdBy: user.id,
      version: 1,
      isReady: false,
    },
  })

  revalidatePath(`/projects/${projectId}`)
  return script
}

export async function addScriptRow(scriptId: string, orderIndex: number) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const payload = await getPayload({ config })

  const row = await payload.create({
    collection: 'script-rows',
    user,
    data: {
      script: Number(scriptId),
      orderIndex,
      actionInstruction: '',
      scriptText: '',
      editorNote: '',
      uploadSlotStatus: 'empty',
    },
  })

  return row
}

export async function updateScriptRow(rowId: string, data: any) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const payload = await getPayload({ config })

  const updatedRow = await payload.update({
    collection: 'script-rows',
    id: rowId,
    user,
    data,
  })

  return updatedRow
}

export async function deleteScriptRow(rowId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'script-rows',
    id: rowId,
    user,
  })
}

export async function toggleScriptReady(scriptId: string, isReady: boolean) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const payload = await getPayload({ config })

  const updatedScript = await payload.update({
    collection: 'scripts',
    id: scriptId,
    user,
    data: {
      isReady,
    },
  })

  return updatedScript
}

export async function reorderScriptRows(rowOrders: { id: string; orderIndex: number }[]) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const payload = await getPayload({ config })

  await Promise.all(
    rowOrders.map((row) =>
      payload.update({
        collection: 'script-rows',
        id: row.id,
        user,
        data: {
          orderIndex: row.orderIndex,
        },
      })
    )
  )
}
