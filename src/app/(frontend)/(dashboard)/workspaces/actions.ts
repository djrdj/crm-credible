'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'

export async function updateWorkspace(workspaceId: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'PO') {
    throw new Error('Unauthorized')
  }

  const name = formData.get('name') as string
  const storageLimitGb = formData.get('storageLimitGb') as string

  const payload = await getPayload({ config })

  await payload.update({
    collection: 'workspaces',
    id: workspaceId,
    user,
    data: {
      name,
      storageLimitGb: Number(storageLimitGb),
    },
  })

  revalidatePath('/workspaces')
  revalidatePath(`/workspaces/${workspaceId}`)
}
