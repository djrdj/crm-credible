'use client'

import { resolveFeedback } from './feedback-actions'
import { useState } from 'react'

export default function FeedbackList({ 
  feedback, 
  userRole 
}: { 
  feedback: any[], 
  userRole: string 
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const canResolve = ['PO', 'AM', 'Editor'].includes(userRole)

  const handleResolve = async (id: string) => {
    setLoadingId(id)
    try {
      await resolveFeedback(id)
    } catch (err) {
      console.error(err)
      alert('Failed to resolve feedback.')
    } finally {
      setLoadingId(null)
    }
  }

  const sortedFeedback = [...feedback].sort((a, b) => a.timestampSeconds - b.timestampSeconds)

  return (
    <div className="table-container" style={{ marginTop: '24px' }}>
      <table>
        <thead>
          <tr>
            <th style={{ width: '100px' }}>Timestamp</th>
            <th>Comment</th>
            <th>Round</th>
            <th>Status</th>
            {canResolve && <th style={{ width: '120px' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {sortedFeedback.map((item: any) => (
            <tr key={item.id} style={{ opacity: item.status === 'resolved' ? 0.6 : 1 }}>
              <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{item.timestampLabel}</td>
              <td>{item.comment}</td>
              <td style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Round {item.revisionRound}</td>
              <td>
                <span className={`badge ${item.status === 'resolved' ? 'status-approved' : 'status-recording'}`}>
                  {item.status}
                </span>
              </td>
              {canResolve && (
                <td>
                  {item.status === 'open' && (
                    <button 
                      onClick={() => handleResolve(item.id)}
                      disabled={loadingId === item.id}
                      style={{ 
                        background: 'transparent', 
                        color: 'var(--accent)', 
                        padding: '4px 8px', 
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        border: '1px solid var(--accent)',
                        borderRadius: '8px'
                      }}
                    >
                      {loadingId === item.id ? '...' : 'Resolve'}
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
          {sortedFeedback.length === 0 && (
            <tr>
              <td colSpan={canResolve ? 5 : 4} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                No feedback submitted yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
