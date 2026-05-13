import type { CollectionConfig } from 'payload'

export const Workspaces: CollectionConfig = {
  slug: 'workspaces',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'PO') return true
      if (!user?.workspace) return false

      return {
        id: {
          equals: user.workspace,
        },
      }
    },
    create: ({ req: { user } }) => user?.role === 'PO',
    update: ({ req: { user } }) => user?.role === 'PO',
    delete: ({ req: { user } }) => user?.role === 'PO',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'storageLimitGb',
      type: 'number',
      defaultValue: 50,
    },
  ],
}
