'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/workflows/activity'

export async function updateProjectTeam(projectId: string, data: { assignedEditor?: string | null, assignedWriter?: string | null }) {
  const user = await getCurrentUser()
  if (!user || !['PO', 'AM'].includes(user.role)) {
    throw new Error('Unauthorized')
  }

  const payload = await getPayload({ config })

  const updateData: any = {}
  if (data.assignedEditor !== undefined) updateData.assignedEditor = data.assignedEditor ? Number(data.assignedEditor) : null
  if (data.assignedWriter !== undefined) updateData.assignedWriter = data.assignedWriter ? Number(data.assignedWriter) : null

  const project = await payload.update({
    collection: 'projects',
    id: projectId,
    data: updateData,
  })

  await logActivity({
    req: { payload, user },
    project: projectId,
    type: 'system',
    message: `Project team updated by ${user.name || user.email}`,
    isInternal: true,
  })

  revalidatePath(`/projects/${projectId}`)
}
