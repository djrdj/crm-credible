import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth/get-user'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isInviteExpired } from '@/lib/auth/invites'

export default async function InvitesPage() {
  const user = await getCurrentUser()
  if (!user || !['PO', 'AM'].includes(user.role)) {
    redirect('/')
  }

  const payload = await getPayload({ config })

  const { docs: invites } = await payload.find({
    collection: 'invites',
    user,
    overrideAccess: false,
    depth: 1,
  })

  return (
    <section>
      <div className="dashboard-header">
        <h1>Invites</h1>
        <Link href="/invites/new" className="button" style={{ textDecoration: 'none' }}>
          Send Invite
        </Link>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Token</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((invite: any) => {
              const expired = isInviteExpired(invite.expiresAt)
              return (
                <tr key={invite.id}>
                  <td style={{ fontWeight: 600 }}>{invite.email}</td>
                  <td>
                    <span className="badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                      {invite.role}
                    </span>
                  </td>
                  <td>
                    {invite.isAccepted ? (
                      <span className="badge status-approved">Accepted</span>
                    ) : expired ? (
                      <span className="badge status-drafting" style={{ background: '#fee2e2', color: '#b91c1c' }}>Expired</span>
                    ) : (
                      <span className="badge status-recording">Pending</span>
                    )}
                  </td>
                  <td>{new Date(invite.expiresAt).toLocaleDateString()}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                    {invite.token}
                  </td>
                </tr>
              )
            })}
            {invites.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                  No invites sent yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
