import type { CollectionConfig } from 'payload'

export const Activity: CollectionConfig = {
  slug: 'activity',
  admin: {
    useAsTitle: 'message',
    defaultColumns: ['message', 'project', 'type', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'PO') return true
      if (['AM', 'Scriptwriter', 'Editor'].includes(user.role)) {
        return {
          workspace: { equals: user.workspace },
        }
      }
      if (user.role === 'Client') {
        return {
          and: [
            { project: { clientUser: { equals: user.id } } },
            { isInternal: { equals: false } },
          ],
        }
      }
      return false
    },
    create: () => false, // Only via hooks
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      required: true,
      index: true,
    },
    {
      name: 'workspace',
      type: 'relationship',
      relationTo: 'workspaces',
      required: true,
      index: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: false, // System actions might not have a user
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Status Change', value: 'status_change' },
        { label: 'Upload', value: 'upload' },
        { label: 'Feedback', value: 'feedback' },
        { label: 'Comment', value: 'comment' },
        { label: 'System', value: 'system' },
      ],
    },
    {
      name: 'message',
      type: 'text',
      required: true,
    },
    {
      name: 'isInternal',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'If true, this activity is hidden from the Client role',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Optional additional data (e.g., old/new status values)',
      },
    },
  ],
}
