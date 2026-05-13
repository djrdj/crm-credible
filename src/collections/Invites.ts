import type { CollectionConfig } from 'payload'

import { generateInviteExpiry, generateInviteToken } from '@/lib/auth/invites'
import { sendEmail } from '@/lib/workflows/email'

export const Invites: CollectionConfig = {
  slug: 'invites',
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'PO') return true
      if (user?.role === 'AM') return { workspace: { equals: user.workspace } }
      return false
    },
    create: ({ req: { user } }) => user?.role === 'PO' || user?.role === 'AM',
    update: () => false,
    delete: ({ req: { user } }) => {
      if (user?.role === 'PO') return true
      if (user?.role === 'AM') return { workspace: { equals: user.workspace } }
      return false
    },
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        return {
          ...data,
          token: data?.token || generateInviteToken(),
          expiresAt: data?.expiresAt || generateInviteExpiry(),
        }
      },
    ],
    afterChange: [
      async ({ doc, operation }) => {
        if (operation === 'create') {
          const inviteUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/invite/${doc.token}`
          await sendEmail({
            to: doc.email,
            subject: 'You have been invited to CRM Credible',
            html: `
              <p>You have been invited to join CRM Credible as a <strong>${doc.role}</strong>.</p>
              <p>Click the link below to activate your account and set your password:</p>
              <p><a href="${inviteUrl}">${inviteUrl}</a></p>
              <p>This invite will expire on ${new Date(doc.expiresAt).toLocaleDateString()}.</p>
            `,
          })
        }
      },
    ],
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      options: ['AM', 'Scriptwriter', 'Editor', 'Client'].map((value) => ({
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
      name: 'token',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
    },
    {
      name: 'isAccepted',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'invitedBy',
      type: 'relationship',
      relationTo: 'users',
    },
  ],
}
