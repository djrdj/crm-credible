'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth/get-user'
import { parseTimestampLabel } from '@/lib/utils/timestamps'
import { revalidatePath } from 'next/cache'

export async function submitFeedback(projectId: string, assetId: string, data: { timestampLabel: string; comment: string }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'Client') throw new Error('Only clients can submit feedback')

  const payload = await getPayload({ config })

  const timestampSeconds = parseTimestampLabel(data.timestampLabel)

  // Get current revision round from asset
  const asset = await payload.findByID({
    collection: 'assets',
    id: assetId,
  })

  await payload.create({
    collection: 'feedback',
    user,
    data: {
      project: Number(projectId),
      asset: Number(assetId),
      submittedBy: user.id,
      timestampLabel: data.timestampLabel,
      timestampSeconds,
      comment: data.comment,
      status: 'open',
      revisionRound: asset.revisionRound || 1,
    },
  })

  // Hook in collection already handles moving project to in_revision

  revalidatePath(`/projects/${projectId}`)
}

export async function resolveFeedback(feedbackId: string) {
  const user = await getCurrentUser()
  if (!user || !['PO', 'AM', 'Editor'].includes(user.role)) {
    throw new Error('Unauthorized')
  }

  const payload = await getPayload({ config })

  await payload.update({
    collection: 'feedback',
    id: feedbackId,
    user,
    data: {
      status: 'resolved',
    },
  })

  revalidatePath(`/projects/[id]`, 'layout') // Revalidate project detail
}
