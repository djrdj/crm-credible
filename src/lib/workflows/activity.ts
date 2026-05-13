async function getRelationshipId(value: unknown) {
  if (!value) return null
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return (value as { id?: string | number }).id ?? null
  }
  return value
}

export async function logActivity({
  req,
  project,
  type,
  message,
  isInternal = false,
  metadata = {},
}: {
  req: any
  project: unknown
  type: 'status_change' | 'upload' | 'feedback' | 'comment' | 'system'
  message: string
  isInternal?: boolean
  metadata?: any
}) {
  const projectId = await getRelationshipId(project)
  if (!projectId) return

  // Fetch project to get workspace
  const projectDoc = await req.payload.findByID({
    collection: 'projects',
    id: projectId,
    depth: 0,
  })

  if (!projectDoc) return

  await req.payload.create({
    collection: 'activity',
    data: {
      project: projectId,
      workspace: typeof projectDoc.workspace === 'object' ? projectDoc.workspace?.id : projectDoc.workspace,
      user: req.user?.id,
      type,
      message,
      isInternal,
      metadata,
    },
  })
}
