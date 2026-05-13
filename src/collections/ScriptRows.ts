import type { CollectionConfig } from 'payload'

export const ScriptRows: CollectionConfig = {
  slug: 'script-rows',
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'PO') return true
      if (user.role === 'AM' || user.role === 'Scriptwriter') {
        return {
          'script.project.workspace': {
            equals: user.workspace,
          },
        } as any
      }
      if (user.role === 'Editor') {
        return {
          'script.project.assignedEditor': {
            equals: user.id,
          },
        } as any
      }
      if (user.role === 'Client') {
        return {
          'script.project.clientUser': {
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
    delete: ({ req: { user } }) =>
      user?.role === 'PO' || user?.role === 'AM' || user?.role === 'Scriptwriter',
  },
  hooks: {
    afterRead: [
      ({ doc, req }) => {
        if (req.user?.role === 'Client') {
          doc.editorNote = undefined
        }
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'script',
      type: 'relationship',
      relationTo: 'scripts',
      required: true,
    },
    {
      name: 'orderIndex',
      type: 'number',
      required: true,
    },
    {
      name: 'actionInstruction',
      type: 'textarea',
    },
    {
      name: 'scriptText',
      type: 'textarea',
    },
    {
      name: 'editorNote',
      type: 'textarea',
      access: {
        read: ({ req: { user } }) => user?.role !== 'Client',
        update: ({ req: { user } }) =>
          user?.role === 'PO' || user?.role === 'AM' || user?.role === 'Scriptwriter',
      },
    },
    {
      name: 'uploadSlotStatus',
      type: 'select',
      defaultValue: 'empty',
      options: ['empty', 'uploaded', 'reviewed'].map((value) => ({
        label: value,
        value,
      })),
    },
  ],
}
