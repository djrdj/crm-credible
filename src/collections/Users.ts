import type { CollectionConfig } from 'payload'

import { canManageWorkspaceUsers } from '@/lib/access/projects'
import { USER_ROLES } from '@/lib/access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
  },
  admin: {
    useAsTitle: 'email',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'PO') return true

      return {
        workspace: {
          equals: user.workspace,
        },
      }
    },
    create: ({ req: { user } }) => canManageWorkspaceUsers(user?.role),
    update: ({ req: { user } }) =>
      user?.role === 'PO'
        ? true
        : {
            id: {
              equals: user?.id,
            },
          },
    delete: ({ req: { user } }) => user?.role === 'PO',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      access: {
        update: ({ req: { user } }) => user?.role === 'PO',
      },
      options: USER_ROLES.map((value) => ({
        label: value,
        value,
      })),
    },
    {
      name: 'workspace',
      type: 'relationship',
      relationTo: 'workspaces',
      access: {
        update: ({ req: { user } }) => user?.role === 'PO',
      },
    },
  ],
}
