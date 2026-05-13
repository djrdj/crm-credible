'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { isInviteExpired } from '@/lib/auth/invites'
import { redirect } from 'next/navigation'

export async function acceptInvite(token: string, formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || password !== confirmPassword) {
    throw new Error('Passwords do not match or are empty.')
  }

  const payload = await getPayload({ config })

  // 1. Find the invite
  const { docs: invites } = await payload.find({
    collection: 'invites',
    where: {
      token: { equals: token },
      isAccepted: { equals: false },
    },
  })

  if (invites.length === 0) {
    throw new Error('Invalid or already accepted invite.')
  }

  const invite = invites[0]

  // 2. Check expiry
  if (isInviteExpired(invite.expiresAt)) {
    throw new Error('Invite has expired.')
  }

  // 3. Create the user
  await payload.create({
    collection: 'users',
    data: {
      email: invite.email,
      password,
      role: invite.role,
      workspace: typeof invite.workspace === 'object' ? invite.workspace?.id : invite.workspace,
      name: invite.email.split('@')[0], // Default name
    },
  })

  // 4. Mark invite as accepted
  await payload.update({
    collection: 'invites',
    id: invite.id,
    data: {
      isAccepted: true,
    },
  })

  redirect('/login?message=Account activated successfully. Please log in.')
}
