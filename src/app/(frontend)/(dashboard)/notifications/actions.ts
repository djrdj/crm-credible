'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'

export async function markNotificationAsRead(id: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const payload = await getPayload({ config })

  await payload.update({
    collection: 'notifications',
    id,
    user,
    data: {
      isRead: true,
    },
  })

  revalidatePath('/notifications')
  revalidatePath('/', 'layout')
}

export async function markAllAsRead() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')

  const payload = await getPayload({ config })

  await payload.update({
    collection: 'notifications',
    where: {
      recipient: { equals: user.id },
      isRead: { equals: false },
    },
    user,
    data: {
      isRead: true,
    },
  })

  revalidatePath('/notifications')
  revalidatePath('/', 'layout')
}
