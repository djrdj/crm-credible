export function canManageWorkspaceUsers(role?: string | null) {
  return role === 'PO' || role === 'AM'
}

export function canReadInternalNotes(role?: string | null) {
  return role !== 'Client'
}

export function clientProjectAccessFilter(userId?: string | number | null) {
  if (!userId) return false

  return {
    clientUser: {
      equals: userId,
    },
  }
}
