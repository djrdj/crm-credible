'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/lib/access/roles'

export async function createInvite(formData: FormData) {
  const user = await getCurrentUser()
  if (!user || !['PO', 'AM'].includes(user.role)) {
    throw new Error('Unauthorized')
  }

  const email = formData.get('email') as string
  const role = formData.get('role') as UserRole

  const payload = await getPayload({ config })

  await payload.create({
    collection: 'invites',
    user,
    data: {
      email,
      role,
      workspace: typeof user.workspace === 'object' ? user.workspace?.id : (user.workspace as any),
      invitedBy: user.id,
    },
  })

  redirect('/invites')
}
