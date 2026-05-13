import crypto from 'node:crypto'

const INVITE_TTL_HOURS = 48

export function generateInviteToken() {
  return crypto.randomBytes(24).toString('hex')
}

export function generateInviteExpiry(hours = INVITE_TTL_HOURS) {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + hours)
  return expiresAt.toISOString()
}

export function isInviteExpired(expiresAt?: string | Date | null) {
  if (!expiresAt) return true
  return new Date(expiresAt).getTime() <= Date.now()
}
