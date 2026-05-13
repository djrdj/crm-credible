'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth/get-user'
import { canTransitionTo, type ProjectStatus } from '@/lib/workflows/projectStatus'
import type { UserRole } from '@/lib/access/roles'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logActivity } from '@/lib/workflows/activity'

export async function updateProjectStatus(projectId: string, targetStatus: ProjectStatus) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const payload = await getPayload({ config })

  // 1. Fetch current project state
  const project = await payload.findByID({
    collection: 'projects',
    id: projectId,
  })

  if (!project) throw new Error('Project not found')

  // 2. Validate transition
  const { allowed, reason } = canTransitionTo(
    project.status as ProjectStatus,
    targetStatus,
    user.role as UserRole
  )

  if (!allowed) {
    throw new Error(reason || 'Transition not allowed')
  }

  // 3. Perform update
  await payload.update({
    collection: 'projects',
    id: projectId,
    data: {
      status: targetStatus,
    },
  })

  // 4. If approved, mark the latest final_video as approved
  if (targetStatus === 'approved') {
    const { docs: finalVideos } = await payload.find({
      collection: 'assets',
      where: {
        project: { equals: projectId },
        assetType: { equals: 'final_video' },
      },
      sort: '-createdAt',
      limit: 1,
    })

    if (finalVideos.length > 0) {
      await payload.update({
        collection: 'assets',
        id: finalVideos[0].id,
        data: {
          isApproved: true,
        },
      })
    }
  }

  revalidatePath(`/projects/${projectId}`)
}

export async function archiveProject(projectId: string) {
  const user = await getCurrentUser()
  if (!user || !['PO', 'AM'].includes(user.role)) {
    throw new Error('Unauthorized')
  }

  const payload = await getPayload({ config })

  await payload.update({
    collection: 'projects',
    id: projectId,
    data: {
      isArchived: true,
    },
  })

  await logActivity({
    req: { payload, user },
    project: projectId,
    type: 'system',
    message: `Project archived by ${user.name || user.email}`,
    isInternal: true,
  })

  redirect('/projects')
}
