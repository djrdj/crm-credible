'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <Link 
      href="/notifications" 
      style={{ 
        position: 'relative', 
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'var(--surface-strong)',
        border: '1px solid var(--line)'
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>🔔</span>
      {unreadCount > 0 && (
        <span 
          style={{ 
            position: 'absolute', 
            top: '-4px', 
            right: '-4px', 
            background: 'var(--accent)', 
            color: 'white', 
            fontSize: '0.7rem', 
            fontWeight: 700, 
            padding: '2px 6px', 
            borderRadius: '10px',
            border: '2px solid var(--bg)'
          }}
        >
          {unreadCount}
        </span>
      )}
    </Link>
  )
}
