import type { CollectionConfig } from 'payload'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      return {
        recipient: {
          equals: user.id,
        },
      }
    },
    create: () => false,
    update: ({ req: { user } }) => {
      if (!user) return false
      return {
        recipient: {
          equals: user.id,
        },
      }
    },
    delete: () => false,
  },
  fields: [
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        'script_ready',
        'footage_uploaded',
        'video_approved',
        'revision_requested',
        'general',
      ].map((value) => ({
        label: value,
        value,
      })),
    },
    {
      name: 'message',
      type: 'text',
      required: true,
    },
    {
      name: 'isRead',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
