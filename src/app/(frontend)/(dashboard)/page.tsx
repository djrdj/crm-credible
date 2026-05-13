import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const payload = await getPayload({ config })

  // Fetch real stats
  const { totalDocs: activeProjects } = await payload.find({
    collection: 'projects',
    where: {
      status: { not_equals: 'delivered' },
    },
    user,
    overrideAccess: false,
    limit: 0,
  })

  const { totalDocs: pendingInvites } = await payload.find({
    collection: 'invites',
    where: {
      isAccepted: { equals: false },
    },
    user,
    overrideAccess: false,
    limit: 0,
  })

  return (
    <section className="panel" style={{ width: '100%', maxWidth: 'none' }}>
      <p className="eyebrow">Dashboard Overview</p>
      <h1>Welcome back, {user.name || user.email.split('@')[0]}</h1>
      <p className="lede">
        This is your central hub for video production. Use the sidebar to navigate between
        projects, clients, and workspace settings.
      </p>

      <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="panel" style={{ padding: '24px', borderRadius: '20px' }}>
          <h3>Active Projects</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, margin: '12px 0' }}>{activeProjects}</p>
          <p className="lede" style={{ fontSize: '0.9rem' }}>Projects currently in production</p>
        </div>
        {['PO', 'AM'].includes(user.role) && (
          <div className="panel" style={{ padding: '24px', borderRadius: '20px' }}>
            <h3>Pending Invites</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700, margin: '12px 0' }}>{pendingInvites}</p>
            <p className="lede" style={{ fontSize: '0.9rem' }}>Users waiting to join</p>
          </div>
        )}
      </div>
    </section>
  )
}
