'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'

export async function createProject(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !['PO', 'AM'].includes(user.role)) {
    throw new Error('Unauthorized')
  }

  const name = formData.get('name') as string
  const clientId = formData.get('clientId') as string
  const dueDate = formData.get('dueDate') as string

  const payload = await getPayload({ config })

  // 1. Fetch client to get its clientUser
  const client = await payload.findByID({
    collection: 'clients',
    id: clientId,
  })

  if (!client) {
    throw new Error('Client not found.')
  }

  // 2. Create the project
  await payload.create({
    collection: 'projects',
    user,
    data: {
      name,
      status: 'drafting',
      workspace: typeof user.workspace === 'object' ? user.workspace?.id : (user.workspace as any),
      client: Number(clientId),
      clientUser: typeof client.clientUser === 'object' ? client.clientUser?.id : (client.clientUser as any),
      assignedAM: user.id,
    },
  })

  redirect('/projects')
}
