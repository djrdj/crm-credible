import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'

import { Assets } from './src/collections/Assets'
import { Clients } from './src/collections/Clients'
import { Feedback } from './src/collections/Feedback'
import { Invites } from './src/collections/Invites'
import { Notifications } from './src/collections/Notifications'
import { Projects } from './src/collections/Projects'
import { ScriptRows } from './src/collections/ScriptRows'
import { Scripts } from './src/collections/Scripts'
import { Users } from './src/collections/Users'
import { Workspaces } from './src/collections/Workspaces'
import { Activity } from './src/collections/Activity'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  secret: process.env.PAYLOAD_SECRET || 'local-dev-secret-change-me',
  routes: {
    admin: '/admin',
    api: '/api',
  },
  graphQL: {
    disable: true,
  },
  maxDepth: 2,
  db: postgresAdapter({
    pool: {
      connectionString:
        process.env.DATABASE_URI || 'postgresql://localhost:5432/crm_credible',
    },
  }),
  admin: {
    user: Users.slug,
    routes: {},
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
    Activity,
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'src/payload-types.ts'),
  },
})
