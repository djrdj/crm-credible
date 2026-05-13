import type { CollectionConfig } from 'payload'

import { parseTimestampLabel } from '@/lib/utils/timestamps'
import { handleFeedbackSubmitted } from '@/lib/workflows/notifications'

export const Feedback: CollectionConfig = {
  slug: 'feedback',
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'PO' || user.role === 'AM' || user.role === 'Editor') return true
      if (user.role === 'Client') {
        return {
          submittedBy: {
            equals: user.id,
          },
        }
      }
      return false
    },
    create: ({ req: { user } }) => user?.role === 'Client',
    update: ({ req: { user } }) =>
      user?.role === 'PO' || user?.role === 'AM' || user?.role === 'Editor',
    delete: ({ req: { user } }) => user?.role === 'PO',
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        const nextData = { ...data }

        if (typeof nextData.timestampLabel === 'string') {
          nextData.timestampSeconds = parseTimestampLabel(nextData.timestampLabel)
        }

        if (nextData.asset && !nextData.revisionRound) {
          const asset = await req.payload.findByID({
            collection: 'assets',
            id: typeof nextData.asset === 'object' ? nextData.asset.id : nextData.asset,
            depth: 0,
          })

          nextData.revisionRound = asset?.revisionRound ?? 1
        }

        return nextData
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === 'create') {
          await handleFeedbackSubmitted({ doc, req })
        }
      },
    ],
  },
  fields: [
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      required: true,
    },
    {
      name: 'asset',
      type: 'relationship',
      relationTo: 'assets',
      required: true,
    },
    {
      name: 'submittedBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'timestampLabel',
      type: 'text',
      required: true,
    },
    {
      name: 'timestampSeconds',
      type: 'number',
    },
    {
      name: 'comment',
      type: 'textarea',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      options: ['open', 'resolved'].map((value) => ({
        label: value,
        value,
      })),
    },
    {
      name: 'revisionRound',
      type: 'number',
    },
  ],
}
