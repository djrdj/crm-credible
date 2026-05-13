import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth/get-user'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function WorkspacesPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'PO') redirect('/')

  const payload = await getPayload({ config })

  const { docs: workspaces } = await payload.find({
    collection: 'workspaces',
    user,
    overrideAccess: false,
  })

  return (
    <section>
      <div className="dashboard-header">
        <h1>Workspaces</h1>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
                <th>Name</th>
                <th>Owner</th>
                <th>Storage Limit</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
          </thead>
          <tbody>
            {workspaces.map((ws: any) => (
              <tr key={ws.id}>
                <td style={{ fontWeight: 600 }}>{ws.name}</td>
                <td>{ws.owner?.name || ws.owner?.email || ws.owner}</td>
                <td>{ws.storageLimitGb} GB</td>
                <td>{new Date(ws.createdAt).toLocaleDateString()}</td>
                <td>
                  <Link href={`/workspaces/${ws.id}`} style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                    Settings
                  </Link>
                </td>
              </tr>
            ))}
            {workspaces.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                  No workspaces found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
