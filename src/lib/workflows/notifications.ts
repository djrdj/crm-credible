import { sendEmail } from './email'
import { logActivity } from './activity'

const STATUS_NOTIFICATION_TYPES: Record<string, string> = {
  recording: 'script_ready',
  review: 'general',
  approved: 'video_approved',
  in_revision: 'revision_requested',
}

function getRelationshipId(value: unknown) {
  if (!value) return null
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return (value as { id?: string | number }).id ?? null
  }
  return value
}

async function createNotification(req: any, recipient: unknown, project: unknown, type: string, message: string) {
  const recipientId = getRelationshipId(recipient)
  const projectId = getRelationshipId(project)

  if (!recipientId) return

  // 1. Fetch recipient to get email
  const user = await req.payload.findByID({
    collection: 'users',
    id: recipientId,
  })

  // 2. Create in-app notification
  await req.payload.create({
    collection: 'notifications',
    data: {
      recipient: recipientId,
      project: projectId ?? undefined,
      type,
      message,
    },
  })

  // 3. Send email
  if (user?.email) {
    await sendEmail({
      to: user.email,
      subject: `Notification: ${type.replaceAll('_', ' ')}`,
      html: `<p>${message}</p><p><a href="${process.env.PAYLOAD_PUBLIC_SERVER_URL}">Log in to view</a></p>`,
    })
  }
}

export async function triggerStatusNotification({
  doc,
  previousDoc,
  req,
}: {
  doc: any
  previousDoc?: any
  req: any
}) {
  if (!doc?.status || doc.status === previousDoc?.status) return

  const type = STATUS_NOTIFICATION_TYPES[doc.status] ?? 'general'
  const message = `Project "${doc.name}" moved to ${doc.status.replaceAll('_', ' ')}.`

  if (doc.status === 'recording') {
    await createNotification(req, doc.clientUser, doc.id, type, message)
  }

  if (doc.status === 'review') {
    await createNotification(req, doc.assignedAM, doc.id, type, message)
  }

  if (doc.status === 'approved') {
    await createNotification(req, doc.clientUser, doc.id, type, message)
  }

  if (doc.status === 'in_revision') {
    await createNotification(req, doc.assignedEditor, doc.id, type, message)
    await createNotification(req, doc.assignedAM, doc.id, type, message)
  }
}

export async function handleFeedbackSubmitted({
  doc,
  req,
}: {
  doc: any
  req: any
}) {
  const projectId = getRelationshipId(doc?.project)

  if (!projectId) return

  // 1. Move project to in_revision
  const project = await req.payload.update({
    collection: 'projects',
    id: projectId,
    data: {
      status: 'in_revision',
    },
  })

  // 2. Notify Editor and AM
  const message = `New feedback submitted for project "${project.name}" at ${doc.timestampLabel}.`
  await logActivity({
    req,
    project: projectId,
    type: 'feedback',
    message,
  })
  await createNotification(req, project.assignedEditor, projectId, 'revision_requested', message)
  await createNotification(req, project.assignedAM, projectId, 'revision_requested', message)
}
