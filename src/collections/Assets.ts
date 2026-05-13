import type { CollectionConfig } from 'payload'

import { clientProjectAccessFilter } from '@/lib/access/projects'
import { logActivity } from '@/lib/workflows/activity'

export const Assets: CollectionConfig = {
  slug: 'assets',
  upload: {
    staticDir: 'media',
    mimeTypes: ['video/*', 'image/*', 'application/pdf'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'PO') return true
      if (user.role === 'AM' || user.role === 'Scriptwriter') {
        return {
          workspace: {
            equals: user.workspace,
          },
        } as any
      }
      if (user.role === 'Editor') {
        return {
          project: {
            assignedEditor: {
              equals: user.id,
            },
          },
        } as any
      }
      if (user.role === 'Client') {
        return {
          and: [
            {
              project: clientProjectAccessFilter(user.id),
            },
            {
              or: [
                {
                  and: [
                    { assetType: { equals: 'final_video' } },
                    { isApproved: { equals: true } },
                  ],
                },
                {
                  and: [
                    { assetType: { equals: 'raw_clip' } },
                    { uploadedBy: { equals: user.id } },
                  ],
                },
              ],
            },
          ],
        } as any
      }
      return false
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) =>
      user?.role === 'PO' || user?.role === 'AM' || user?.role === 'Editor',
    delete: ({ req: { user } }) => user?.role === 'PO' || user?.role === 'AM',
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (operation === 'create' && req.user) {
          let revisionRound = data?.revisionRound || 1

          if (data?.assetType === 'final_video' && data?.project) {
            // Find max revision round for this project
            const { docs: previousFinals } = await req.payload.find({
              collection: 'assets',
              where: {
                project: { equals: data.project },
                assetType: { equals: 'final_video' },
              },
              sort: '-revisionRound',
              limit: 1,
            })

            if (previousFinals.length > 0) {
              revisionRound = (previousFinals[0].revisionRound || 1) + 1
            }
          }

          return {
            ...data,
            revisionRound,
            uploadedBy: data?.uploadedBy || req.user.id,
            workspace:
              data?.workspace ||
              (typeof req.user.workspace === 'object'
                ? req.user.workspace?.id
                : req.user.workspace),
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return

        if (doc.assetType === 'raw_clip' && doc.scriptRow) {
          await logActivity({
            req,
            project: doc.project,
            type: 'upload',
            message: `New raw clip uploaded by ${req.user?.name || req.user?.email}`,
          })
          await req.payload.update({
            collection: 'script-rows',
            id: String(typeof doc.scriptRow === 'object' ? doc.scriptRow.id : doc.scriptRow),
            data: {
              uploadSlotStatus: 'uploaded',
            },
          })
        }

        if (doc.assetType === 'final_video' && doc.project) {
          await logActivity({
            req,
            project: doc.project,
            type: 'upload',
            message: `New final video uploaded (Round ${doc.revisionRound})`,
          })
          await req.payload.update({
            collection: 'projects',
            id: String(typeof doc.project === 'object' ? doc.project.id : doc.project),
            data: {
              status: 'review',
            },
          })
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
      name: 'workspace',
      type: 'relationship',
      relationTo: 'workspaces',
      required: true,
    },
    {
      name: 'scriptRow',
      type: 'relationship',
      relationTo: 'script-rows',
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'assetType',
      type: 'select',
      required: true,
      options: ['raw_clip', 'final_video', 'attachment'].map((value) => ({
        label: value,
        value,
      })),
    },
    {
      name: 'storageProvider',
      type: 'select',
      defaultValue: 'local',
      options: ['local', 's3', 'gdrive'].map((value) => ({
        label: value,
        value,
      })),
    },
    {
      name: 'externalFileId',
      type: 'text',
    },
    {
      name: 'sequenceIndex',
      type: 'number',
    },
    {
      name: 'revisionRound',
      type: 'number',
      defaultValue: 1,
    },
    {
      name: 'isApproved',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'isArchived',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
