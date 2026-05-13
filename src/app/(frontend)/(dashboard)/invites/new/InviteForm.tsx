'use client'

import { useState } from 'react'
import { createInvite } from '../actions'

export default function InviteForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    try {
      await createInvite(formData)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setPending(false)
    }
  }

  return (
    <form action={handleSubmit} className="panel" style={{ width: '100%', maxWidth: '600px' }}>
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="colleague@company.com"
        />
      </div>

      <div className="form-group">
        <label htmlFor="role">Role</label>
        <select
          id="role"
          name="role"
          required
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid var(--line)',
            background: 'var(--surface-strong)',
            color: 'var(--text)',
            fontFamily: 'inherit',
            fontSize: '1rem',
          }}
        >
          <option value="">Select a role...</option>
          <option value="AM">Account Manager</option>
          <option value="Scriptwriter">Scriptwriter</option>
          <option value="Editor">Editor</option>
          <option value="Client">Client</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="submit" disabled={pending} style={{ flex: 1 }}>
          {pending ? 'Sending...' : 'Send Invite'}
        </button>
        <button 
          type="button" 
          onClick={() => window.history.back()} 
          style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--line)', flex: 1 }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
