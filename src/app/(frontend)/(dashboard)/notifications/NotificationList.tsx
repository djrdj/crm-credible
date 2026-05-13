'use client'

import { markNotificationAsRead } from './actions'
import Link from 'next/link'

export default function NotificationList({ notifications }: { notifications: any[] }) {
  return (
    <div className="nav-group" style={{ gap: '16px' }}>
      {notifications.map((n) => (
        <div 
          key={n.id} 
          className="panel" 
          style={{ 
            padding: '20px', 
            borderRadius: '20px', 
            opacity: n.isRead ? 0.7 : 1,
            borderLeft: n.isRead ? '1px solid var(--line)' : '4px solid var(--accent)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <p className="eyebrow" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>
              {n.type.replace('_', ' ')} • {new Date(n.createdAt).toLocaleDateString()}
            </p>
            <p style={{ margin: '0 0 8px', fontWeight: n.isRead ? 400 : 600 }}>{n.message}</p>
            {n.project && (
              <Link 
                href={`/projects/${typeof n.project === 'object' ? n.project.id : n.project}`}
                style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
              >
                View Project →
              </Link>
            )}
          </div>
          {!n.isRead && (
            <button 
              onClick={() => markNotificationAsRead(n.id)}
              style={{ 
                background: 'transparent', 
                color: 'var(--muted)', 
                fontSize: '0.8rem',
                border: '1px solid var(--line)',
                padding: '4px 12px',
                borderRadius: '8px'
              }}
            >
              Mark as read
            </button>
          )}
        </div>
      ))}
      {notifications.length === 0 && (
        <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="lede">You have no notifications.</p>
        </div>
      )}
    </div>
  )
}
