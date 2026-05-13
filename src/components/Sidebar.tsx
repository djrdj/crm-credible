'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UserRole } from '@/lib/access/roles'
import { logout } from '@/app/(frontend)/login/actions'

type NavItem = {
  label: string
  href: string
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/', roles: ['PO', 'AM', 'Scriptwriter', 'Editor', 'Client'] },
  { label: 'Workspaces', href: '/workspaces', roles: ['PO'] },
  { label: 'Clients', href: '/clients', roles: ['PO', 'AM'] },
  { label: 'Projects', href: '/projects', roles: ['PO', 'AM', 'Scriptwriter', 'Editor', 'Client'] },
  { label: 'Invites', href: '/invites', roles: ['PO', 'AM'] },
]

export default function Sidebar({ userRole }: { userRole: UserRole }) {
  const pathname = usePathname()

  const filteredNav = NAV_ITEMS.filter((item) => item.roles.includes(userRole))

  return (
    <aside className="sidebar">
      <Link href="/" className="sidebar-logo">
        CRM Credible
      </Link>

      <nav className="nav-group">
        <p className="nav-label">Menu</p>
        {filteredNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${pathname === item.href ? 'active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div style={{ marginTop: 'auto' }} className="nav-group">
        <button 
          onClick={() => logout()}
          style={{ 
            background: 'transparent', 
            color: 'var(--muted)', 
            textAlign: 'left',
            padding: '12px',
            fontSize: '0.9rem'
          }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
