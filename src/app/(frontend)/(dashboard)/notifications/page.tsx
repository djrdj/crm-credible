import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import NotificationList from './NotificationList'
import { markAllAsRead } from './actions'

export default async function NotificationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const payload = await getPayload({ config })

  const { docs: notifications } = await payload.find({
    collection: 'notifications',
    where: {
      recipient: { equals: user.id },
    },
    user,
    overrideAccess: false,
    sort: '-createdAt',
    limit: 50,
  })

  return (
    <section>
      <div className="dashboard-header">
        <h1>Notifications</h1>
        {notifications.some(n => !n.isRead) && (
          <form action={markAllAsRead}>
            <button type="submit" style={{ background: 'transparent', color: 'var(--accent)', fontWeight: 600 }}>
              Mark all as read
            </button>
          </form>
        )}
      </div>
      <NotificationList notifications={notifications} />
    </section>
  )
}
