import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

export async function getCurrentUser() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  return user
}
