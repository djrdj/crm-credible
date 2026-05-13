import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth/get-user'

function ActivitySkeleton() {
  return (
    <div className="nav-group" style={{ gap: '12px' }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ display: 'flex', gap: '16px', padding: '16px', borderBottom: '1px solid var(--line)' }}>
          <div className="skeleton" style={{ width: '8px', height: '8px', borderRadius: '50%', marginTop: '6px' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: '20px', width: '60%', marginBottom: '8px' }} />
            <div className="skeleton" style={{ height: '14px', width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function ActivityTab({ projectId }: { projectId: string }) {
  const user = await getCurrentUser()
  if (!user) return null

  const payload = await getPayload({ config })

  const { docs: activities } = await payload.find({
    collection: 'activity' as any,
    where: {
      project: { equals: projectId },
    },
    user,
    overrideAccess: false,
    sort: '-createdAt',
    limit: 50,
  })

  return (
    <div className="nav-group" style={{ gap: '12px' }}>
      {activities.map((activity: any) => (
        <div 
          key={activity.id} 
          style={{ 
            display: 'flex', 
            gap: '16px', 
            padding: '16px', 
            borderBottom: '1px solid var(--line)',
            alignItems: 'flex-start'
          }}
        >
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: activity.type === 'status_change' ? 'var(--accent)' : 'var(--muted)',
            marginTop: '6px'
          }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 500 }}>{activity.message}</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
              {new Date(activity.createdAt).toLocaleString()} 
              {activity.user && ` • by ${activity.user.name || activity.user.email || 'System'}`}
              {activity.isInternal && <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: '#e5e7eb', padding: '2px 6px', borderRadius: '4px' }}>Internal</span>}
            </p>
          </div>
        </div>
      ))}
      {activities.length === 0 && (
        <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="lede">No activity logged yet.</p>
        </div>
      )}
    </div>
  )
}
