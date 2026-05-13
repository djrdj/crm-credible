import type { UserRole } from '@/lib/access/roles'

export const PROJECT_STATUSES = [
  'drafting',
  'recording',
  'editing',
  'review',
  'approved',
  'in_revision',
  'delivered',
] as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

const TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  drafting: ['recording'],
  recording: ['editing'],
  editing: ['review'],
  review: ['approved', 'in_revision'],
  approved: ['in_revision', 'delivered'],
  in_revision: ['editing'],
  delivered: [],
}

const ROLE_PERMISSIONS: Record<ProjectStatus, UserRole[]> = {
  recording: ['PO', 'AM', 'Scriptwriter'], // From drafting
  editing: ['PO', 'AM', 'Editor'], // From recording or in_revision
  review: ['PO', 'AM', 'Editor'], // From editing
  approved: ['PO', 'AM'], // From review
  in_revision: ['PO', 'AM', 'Client'], // From review or approved
  delivered: ['PO', 'AM'], // From approved
  drafting: ['PO', 'AM'], // Initial state
}

export function canTransitionTo(
  from: ProjectStatus,
  to: ProjectStatus,
  userRole: UserRole
): { allowed: boolean; reason?: string } {
  // 1. Check if transition exists in state machine
  const allowedNextStatuses = TRANSITIONS[from]
  if (!allowedNextStatuses.includes(to)) {
    return { allowed: false, reason: `Invalid transition from ${from} to ${to}` }
  }

  // 2. Check role permissions for the target status
  const allowedRoles = ROLE_PERMISSIONS[to]
  if (!allowedRoles.includes(userRole)) {
    return { allowed: false, reason: `Role ${userRole} is not allowed to trigger transition to ${to}` }
  }

  return { allowed: true }
}
