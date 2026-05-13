import type { CollectionConfig } from 'payload'

export const Clients: CollectionConfig = {
  slug: 'clients',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'PO') return true
      if (user.role === 'AM') {
        return {
          workspace: {
            equals: user.workspace,
          },
        } as any
      }
      if (user.role === 'Client') {
        return {
          clientUser: {
            equals: user.id,
          },
        } as any
      }
      return false
    },
    create: ({ req: { user } }) => user?.role === 'PO' || user?.role === 'AM',
    update: ({ req: { user } }) => user?.role === 'PO' || user?.role === 'AM',
    delete: ({ req: { user } }) => user?.role === 'PO',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'company',
      type: 'text',
    },
    {
      name: 'workspace',
      type: 'relationship',
      relationTo: 'workspaces',
      required: true,
    },
    {
      name: 'clientUser',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
  ],
}
