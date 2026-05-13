import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth/get-user'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ClientsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const payload = await getPayload({ config })

  const { docs: clients } = await payload.find({
    collection: 'clients',
    user,
    overrideAccess: false,
    depth: 1,
  })

  return (
    <section>
      <div className="dashboard-header">
        <h1>Clients</h1>
        {['PO', 'AM'].includes(user.role) && (
          <Link href="/clients/new" className="button" style={{ textDecoration: 'none' }}>
            Add Client
          </Link>
        )}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>User Account</th>
              <th>Workspace</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client: any) => (
              <tr key={client.id}>
                <td style={{ fontWeight: 600 }}>{client.name}</td>
                <td>{client.company || '-'}</td>
                <td>{client.clientUser?.email || '-'}</td>
                <td>{client.workspace?.name || '-'}</td>
                <td>
                  <Link href={`/clients/${client.id}`} style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
