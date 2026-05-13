'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'

export async function createClient(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !['PO', 'AM'].includes(user.role)) {
    throw new Error('Unauthorized')
  }

  const name = formData.get('name') as string
  const company = formData.get('company') as string
  const clientUserEmail = formData.get('clientUserEmail') as string

  const payload = await getPayload({ config })

  // 1. Find or verify the client user (they must already exist or be invited)
  // For simplicity in v1, we assume the user might not exist yet, 
  // but the PRD says invite-only. So we should probably check if a user with this email exists.
  const { docs: users } = await payload.find({
    collection: 'users',
    where: {
      email: { equals: clientUserEmail },
    },
  })

  let clientUserId = users[0]?.id

  if (!clientUserId) {
    // Option: Auto-create a skeleton user or throw error
    // The checklist says "invite-only". So maybe we should throw error if user not found.
    throw new Error('Client user not found. Please invite the client first.')
  }

  // 2. Create the client record
  await payload.create({
    collection: 'clients',
    user,
    data: {
      name,
      company,
      workspace: typeof user.workspace === 'object' ? user.workspace?.id : (user.workspace as any),
      clientUser: clientUserId,
    },
  })

  redirect('/clients')
}
