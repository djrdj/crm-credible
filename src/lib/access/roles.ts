export const INTERNAL_ROLES = ['PO', 'AM', 'Scriptwriter', 'Editor'] as const

export const USER_ROLES = [
  'PO',
  'AM',
  'Scriptwriter',
  'Editor',
  'Client',
] as const

export type UserRole = (typeof USER_ROLES)[number]
