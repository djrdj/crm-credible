import type { CollectionConfig } from 'payload'

export const Scripts: CollectionConfig = {
  slug: 'scripts',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'PO') return true
      if (user.role === 'AM' || user.role === 'Scriptwriter') {
        return {
          'project.workspace': {
            equals: user.workspace,
          },
        } as any
      }
      if (user.role === 'Editor') {
        return {
          'project.assignedEditor': {
            equals: user.id,
          },
        } as any
      }
      if (user.role === 'Client') {
        return {
          'project.clientUser': {
            equals: user.id,
          },
        } as any
      }
      return false
    },
    create: ({ req: { user } }) =>
      user?.role === 'PO' || user?.role === 'AM' || user?.role === 'Scriptwriter',
    update: ({ req: { user } }) =>
      user?.role === 'PO' || user?.role === 'AM' || user?.role === 'Scriptwriter',
    delete: ({ req: { user } }) => user?.role === 'PO' || user?.role === 'AM',
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        if (doc.isReady && !previousDoc?.isReady && doc.project) {
          await req.payload.update({
            collection: 'projects',
            id: typeof doc.project === 'object' ? doc.project.id : doc.project,
            data: {
              status: 'recording',
            },
          })
        }
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      required: true,
      unique: true,
    },
    {
      name: 'version',
      type: 'number',
      defaultValue: 1,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'isReady',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
