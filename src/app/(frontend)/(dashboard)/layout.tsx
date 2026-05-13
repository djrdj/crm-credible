import { getCurrentUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import NotificationBell from '@/components/NotificationBell'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { UserRole } from '@/lib/access/roles'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const payload = await getPayload({ config })
  const { totalDocs: unreadCount } = await payload.find({
    collection: 'notifications',
    where: {
      recipient: { equals: user.id },
      isRead: { equals: false },
    },
    limit: 0,
  })

  return (
    <div className="dashboard-container">
      <Sidebar userRole={user.role as UserRole} />
      <main className="main-content">
        <header className="dashboard-header">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Workspace</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <NotificationBell unreadCount={unreadCount} />
            <div className="user-badge">
              <span className="role">{user.role}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user.email}</span>
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}
