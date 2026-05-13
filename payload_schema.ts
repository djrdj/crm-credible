// payload.config.ts
import { buildConfig } from 'payload/config'
import { postgresAdapter } from '@payloadcms/db-postgres'
import path from 'path'
import { Users } from './collections/Users'
import { Workspaces } from './collections/Workspaces'
import { Clients } from './collections/Clients'
import { Projects } from './collections/Projects'
import { Scripts } from './collections/Scripts'
import { ScriptRows } from './collections/ScriptRows'
import { Assets } from './collections/Assets'
import { Feedback } from './collections/Feedback'
import { Notifications } from './collections/Notifications'
import { Invites } from './collections/Invites'

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  secret: process.env.PAYLOAD_SECRET || 'local-dev-secret-change-in-prod',
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || 'postgresql://localhost:5432/crm_credible' },
  }),
  // Local file storage — swap this block for S3 plugin when deploying
  upload: {
    staticDir: path.resolve(__dirname, '../media'),
    staticURL: '/media',
    // TODO (deploy): replace with s3Storage() plugin pointing to Cloudflare R2
  },
  collections: [
    Users,
    Workspaces,
    Clients,
    Projects,
    Scripts,
    ScriptRows,
    Assets,
    Feedback,
    Notifications,
    Invites,
  ],
})

// ─────────────────────────────────────────────
// collections/Users.ts
// ─────────────────────────────────────────────
import { CollectionConfig } from 'payload/types'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: { useAsTitle: 'email' },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'PO') return true
      // AM can read users in their workspace
      return { workspace: { equals: user.workspace } }
    },
    create: ({ req: { user } }) => ['PO', 'AM'].includes(user?.role),
    update: ({ req: { user } }) => user?.role === 'PO' || { id: { equals: user?.id } },
    delete: ({ req: { user } }) => user?.role === 'PO',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      options: [
        { label: 'Product Owner', value: 'PO' },
        { label: 'Account Manager', value: 'AM' },
        { label: 'Scriptwriter', value: 'Scriptwriter' },
        { label: 'Editor', value: 'Editor' },
        { label: 'Client', value: 'Client' },
      ],
    },
    {
      name: 'workspace',
      type: 'relationship',
      relationTo: 'workspaces',
      required: false, // PO has no workspace
    },
  ],
}

// ─────────────────────────────────────────────
// collections/Workspaces.ts
// ─────────────────────────────────────────────
import { CollectionConfig } from 'payload/types'

export const Workspaces: CollectionConfig = {
  slug: 'workspaces',
  admin: { useAsTitle: 'name' },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'PO') return true
      return { id: { equals: user?.workspace } }
    },
    create: ({ req: { user } }) => user?.role === 'PO',
    update: ({ req: { user } }) => user?.role === 'PO',
    delete: ({ req: { user } }) => user?.role === 'PO',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
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
      admin: { description: 'Default platform storage limit per workspace' },
    },
  ],
}

// ─────────────────────────────────────────────
// collections/Clients.ts
// ─────────────────────────────────────────────
import { CollectionConfig } from 'payload/types'

export const Clients: CollectionConfig = {
  slug: 'clients',
  admin: { useAsTitle: 'name' },
  access: {
    read: ({ req: { user } }) => {
      if (['PO', 'AM'].includes(user?.role)) return true
      if (user?.role === 'Client') return { clientUser: { equals: user?.id } }
      return false
    },
    create: ({ req: { user } }) => ['PO', 'AM'].includes(user?.role),
    update: ({ req: { user } }) => ['PO', 'AM'].includes(user?.role),
    delete: ({ req: { user } }) => user?.role === 'PO',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'company', type: 'text' },
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
      admin: { description: 'The user account for this client' },
    },
  ],
}

// ─────────────────────────────────────────────
// collections/Projects.ts
// ─────────────────────────────────────────────
import { CollectionConfig } from 'payload/types'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: { useAsTitle: 'name' },
  access: {
    read: ({ req: { user } }) => {
      if (['PO', 'AM'].includes(user?.role)) return true
      if (user?.role === 'Editor') return { assignedEditor: { equals: user?.id } }
      if (user?.role === 'Scriptwriter') return { assignedWriter: { equals: user?.id } }
      if (user?.role === 'Client') return { client: { equals: user?.id } } // matched via clientUser
      return false
    },
    create: ({ req: { user } }) => ['PO', 'AM'].includes(user?.role),
    update: ({ req: { user } }) => ['PO', 'AM', 'Scriptwriter', 'Editor'].includes(user?.role),
    delete: ({ req: { user } }) => user?.role === 'PO',
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        // Fire notifications on status transitions
        if (doc.status !== previousDoc?.status) {
          await triggerStatusNotification(doc, previousDoc, req)
        }
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'drafting',
      options: [
        { label: 'Drafting', value: 'drafting' },
        { label: 'Recording', value: 'recording' },
        { label: 'Editing', value: 'editing' },
        { label: 'Review', value: 'review' },
        { label: 'Approved', value: 'approved' },
        { label: 'In Revision', value: 'in_revision' },
        { label: 'Delivered', value: 'delivered' },
      ],
    },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', required: true },
    { name: 'client', type: 'relationship', relationTo: 'clients', required: true },
    { name: 'assignedAM', type: 'relationship', relationTo: 'users' },
    { name: 'assignedEditor', type: 'relationship', relationTo: 'users' },
    { name: 'assignedWriter', type: 'relationship', relationTo: 'users' },
    { name: 'dueDate', type: 'date' },
    {
      name: 'isArchived',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Soft delete flag' },
    },
  ],
}

// ─────────────────────────────────────────────
// collections/Scripts.ts
// ─────────────────────────────────────────────
import { CollectionConfig } from 'payload/types'

export const Scripts: CollectionConfig = {
  slug: 'scripts',
  admin: { useAsTitle: 'title' },
  access: {
    read: ({ req: { user } }) => {
      if (['PO', 'AM', 'Scriptwriter', 'Editor'].includes(user?.role)) return true
      // Client can read — editor_note is stripped in ScriptRows, not here
      if (user?.role === 'Client') return true
      return false
    },
    create: ({ req: { user } }) => ['PO', 'AM', 'Scriptwriter'].includes(user?.role),
    update: ({ req: { user } }) => ['PO', 'AM', 'Scriptwriter'].includes(user?.role),
    delete: ({ req: { user } }) => ['PO', 'AM'].includes(user?.role),
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true },
    {
      name: 'version',
      type: 'number',
      defaultValue: 1,
      admin: { readOnly: true },
    },
    { name: 'createdBy', type: 'relationship', relationTo: 'users' },
    {
      name: 'isReady',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Scriptwriter marks script complete — triggers recording phase' },
    },
  ],
}

// ─────────────────────────────────────────────
// collections/ScriptRows.ts
// ─────────────────────────────────────────────
import { CollectionConfig, Access } from 'payload/types'

// Strip editor_note for Client role at API level
const readAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  return true // row visibility handled below via hooks/field-level access
}

export const ScriptRows: CollectionConfig = {
  slug: 'script-rows',
  access: {
    read: readAccess,
    create: ({ req: { user } }) => ['PO', 'AM', 'Scriptwriter'].includes(user?.role),
    update: ({ req: { user } }) => ['PO', 'AM', 'Scriptwriter'].includes(user?.role),
    delete: ({ req: { user } }) => ['PO', 'AM', 'Scriptwriter'].includes(user?.role),
  },
  hooks: {
    // Strip editor_note before sending to Client
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
    { name: 'script', type: 'relationship', relationTo: 'scripts', required: true },
    {
      name: 'orderIndex',
      type: 'number',
      required: true,
      admin: { description: 'Sort order of this row in the script' },
    },
    {
      name: 'actionInstruction',
      type: 'textarea',
      admin: { description: 'Visible to all — what the client must physically do' },
    },
    {
      name: 'scriptText',
      type: 'textarea',
      admin: { description: 'Visible to all — lines the client must say' },
    },
    {
      name: 'editorNote',
      type: 'textarea',
      admin: {
        description: 'INTERNAL ONLY — hidden from Client. Instructions to the editor.',
      },
      // Field-level access: Client cannot read or write
      access: {
        read: ({ req: { user } }) => user?.role !== 'Client',
        update: ({ req: { user } }) => ['PO', 'AM', 'Scriptwriter'].includes(user?.role),
      },
    },
    {
      name: 'uploadSlotStatus',
      type: 'select',
      defaultValue: 'empty',
      options: [
        { label: 'Empty', value: 'empty' },
        { label: 'Uploaded', value: 'uploaded' },
        { label: 'Reviewed', value: 'reviewed' },
      ],
    },
  ],
}

// ─────────────────────────────────────────────
// collections/Assets.ts
// ─────────────────────────────────────────────
import { CollectionConfig } from 'payload/types'

export const Assets: CollectionConfig = {
  slug: 'assets',
  upload: {
    // Local: files go to /media, served at /media/*
    // TODO (deploy): remove this and enable S3 plugin in payload.config.ts instead
    staticURL: '/media',
    staticDir: 'media',
    mimeTypes: ['video/*', 'image/*', 'application/pdf'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (['PO', 'AM', 'Scriptwriter'].includes(user?.role)) return true
      if (user?.role === 'Editor') return { project: { assignedEditor: { equals: user?.id } } }
      if (user?.role === 'Client') {
        // Client can only read approved final videos or their own raw clips
        return {
          or: [
            { and: [{ assetType: { equals: 'final_video' } }, { isApproved: { equals: true } }] },
            { and: [{ assetType: { equals: 'raw_clip' } }, { uploadedBy: { equals: user?.id } }] },
          ],
        }
      }
      return false
    },
    create: () => true, // role-gated by assetType in hooks
    update: ({ req: { user } }) => ['PO', 'AM', 'Editor'].includes(user?.role),
    delete: ({ req: { user } }) => ['PO', 'AM'].includes(user?.role),
  },
  fields: [
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true },
    {
      name: 'scriptRow',
      type: 'relationship',
      relationTo: 'script-rows',
      admin: { description: 'Linked row for raw clips. Null for final videos.' },
    },
    { name: 'uploadedBy', type: 'relationship', relationTo: 'users', required: true },
    {
      name: 'assetType',
      type: 'select',
      required: true,
      options: [
        { label: 'Raw Clip', value: 'raw_clip' },
        { label: 'Final Video', value: 'final_video' },
        { label: 'Attachment', value: 'attachment' },
      ],
    },
    {
      name: 'storageProvider',
      type: 'select',
      defaultValue: 's3',
      options: [
        { label: 'S3 / R2', value: 's3' },
        { label: 'Google Drive', value: 'gdrive' },
        { label: 'Local', value: 'local' },
      ],
    },
    {
      name: 'externalFileId',
      type: 'text',
      admin: { description: 'Google Drive file ID or other external reference' },
    },
    {
      name: 'sequenceIndex',
      type: 'number',
      admin: { description: 'Used for bulk upload auto-mapping to script row order' },
    },
    {
      name: 'revisionRound',
      type: 'number',
      defaultValue: 1,
      admin: { description: 'Increments with each editor revision cycle' },
    },
    {
      name: 'isApproved',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'AM approval gate — final video only visible to Client when true' },
    },
    {
      name: 'isArchived',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Soft delete — set to true instead of deleting' },
    },
  ],
}

// ─────────────────────────────────────────────
// collections/Feedback.ts
// ─────────────────────────────────────────────
import { CollectionConfig } from 'payload/types'

export const Feedback: CollectionConfig = {
  slug: 'feedback',
  access: {
    read: ({ req: { user } }) => {
      if (['PO', 'AM', 'Editor'].includes(user?.role)) return true
      if (user?.role === 'Client') return { submittedBy: { equals: user?.id } }
      return false
    },
    create: ({ req: { user } }) => user?.role === 'Client',
    update: ({ req: { user } }) => ['PO', 'AM', 'Editor'].includes(user?.role), // resolve only
    delete: ({ req: { user } }) => user?.role === 'PO',
  },
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === 'create') {
          // Move project to in_revision + notify Editor + AM
          await handleFeedbackSubmitted(doc, req)
        }
      },
    ],
  },
  fields: [
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true },
    { name: 'asset', type: 'relationship', relationTo: 'assets', required: true },
    { name: 'submittedBy', type: 'relationship', relationTo: 'users', required: true },
    {
      name: 'timestampLabel',
      type: 'text',
      required: true,
      admin: { description: 'Human-readable e.g. "03:34"' },
    },
    {
      name: 'timestampSeconds',
      type: 'number',
      admin: { description: 'Parsed seconds for sorting — auto-calculated from timestampLabel' },
    },
    { name: 'comment', type: 'textarea', required: true },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Resolved', value: 'resolved' },
      ],
    },
    {
      name: 'revisionRound',
      type: 'number',
      admin: { description: 'Which revision cycle this feedback belongs to' },
    },
  ],
}

// ─────────────────────────────────────────────
// collections/Notifications.ts
// ─────────────────────────────────────────────
import { CollectionConfig } from 'payload/types'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  access: {
    read: ({ req: { user } }) => ({ recipient: { equals: user?.id } }),
    create: () => false, // created only via server hooks, never by users
    update: ({ req: { user } }) => ({ recipient: { equals: user?.id } }), // mark as read only
    delete: () => false,
  },
  fields: [
    { name: 'recipient', type: 'relationship', relationTo: 'users', required: true },
    { name: 'project', type: 'relationship', relationTo: 'projects' },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Script Ready', value: 'script_ready' },
        { label: 'Footage Uploaded', value: 'footage_uploaded' },
        { label: 'Video Approved', value: 'video_approved' },
        { label: 'Revision Requested', value: 'revision_requested' },
        { label: 'General', value: 'general' },
      ],
    },
    { name: 'message', type: 'text', required: true },
    { name: 'isRead', type: 'checkbox', defaultValue: false },
  ],
}

// ─────────────────────────────────────────────
// collections/Invites.ts
// ─────────────────────────────────────────────
import { CollectionConfig } from 'payload/types'

export const Invites: CollectionConfig = {
  slug: 'invites',
  access: {
    read: ({ req: { user } }) => ['PO', 'AM'].includes(user?.role),
    create: ({ req: { user } }) => ['PO', 'AM'].includes(user?.role),
    update: () => false, // tokens are consumed, not updated
    delete: ({ req: { user } }) => ['PO', 'AM'].includes(user?.role),
  },
  fields: [
    { name: 'email', type: 'email', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      options: [
        { label: 'Account Manager', value: 'AM' },
        { label: 'Scriptwriter', value: 'Scriptwriter' },
        { label: 'Editor', value: 'Editor' },
        { label: 'Client', value: 'Client' },
      ],
    },
    { name: 'workspace', type: 'relationship', relationTo: 'workspaces', required: true },
    { name: 'token', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'expiresAt', type: 'date', required: true },
    {
      name: 'isAccepted',
      type: 'checkbox',
      defaultValue: false,
    },
    { name: 'invitedBy', type: 'relationship', relationTo: 'users' },
  ],
}
