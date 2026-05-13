import type { CollectionConfig } from 'payload'

import {
  clientProjectAccessFilter,
  canManageWorkspaceUsers,
} from '@/lib/access/projects'
import { triggerStatusNotification } from '@/lib/workflows/notifications'
import { logActivity } from '@/lib/workflows/activity'

async function resolveClientUser(req: any, clientId?: string | number | null) {
  if (!clientId) return null

  const client = await req.payload.findByID({
    collection: 'clients',
    id: String(clientId),
    depth: 0,
  })

  return typeof client?.clientUser === 'object' ? client.clientUser?.id : client?.clientUser
}

export const Projects: CollectionConfig = {
  slug: 'projects',
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
      if (user.role === 'Editor') {
        return {
          assignedEditor: {
            equals: user.id,
          },
        } as any
      }
      if (user.role === 'Scriptwriter') {
        return {
          assignedWriter: {
            equals: user.id,
          },
        } as any
      }
      if (user.role === 'Client') {
        return clientProjectAccessFilter(user.id)
      }
      return false
    },
    create: ({ req: { user } }) => canManageWorkspaceUsers(user?.role),
    update: ({ req: { user } }) =>
      user?.role === 'PO' ||
      user?.role === 'AM' ||
      user?.role === 'Scriptwriter' ||
      user?.role === 'Editor',
    delete: ({ req: { user } }) => user?.role === 'PO',
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, operation, originalDoc }) => {
        const nextClientId =
          typeof data?.client === 'object' ? data.client?.id : data?.client ?? originalDoc?.client

        if (!nextClientId) return data

        const clientUser = await resolveClientUser(req, nextClientId)

        if (operation === 'create' && !clientUser) {
          throw new Error('Selected client must be linked to a client user.')
        }

        return {
          ...data,
          clientUser: clientUser ?? data?.clientUser ?? originalDoc?.clientUser,
        }
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        if (doc.status !== previousDoc?.status) {
          await triggerStatusNotification({ doc, previousDoc, req })
          await logActivity({
            req,
            project: doc.id,
            type: 'status_change',
            message: `Project status changed from ${previousDoc?.status || 'none'} to ${doc.status}`,
            metadata: {
              oldStatus: previousDoc?.status,
              newStatus: doc.status,
            },
          })
        }
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'drafting',
      options: [
        'drafting',
        'recording',
        'editing',
        'review',
        'approved',
        'in_revision',
        'delivered',
      ].map((value) => ({
        label: value,
        value,
      })),
    },
    {
      name: 'workspace',
      type: 'relationship',
      relationTo: 'workspaces',
      required: true,
    },
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'clients',
      required: true,
    },
    {
      name: 'clientUser',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description:
          'Denormalized from client.clientUser to keep client project scoping simple and secure.',
      },
    },
    {
      name: 'assignedAM',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'assignedEditor',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'assignedWriter',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'dueDate',
      type: 'date',
    },
    {
      name: 'isArchived',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Soft delete flag',
      },
    },
  ],
}
