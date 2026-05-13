'use client'

import { useState } from 'react'
import { createClient } from '../actions'

export default function ClientForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    try {
      await createClient(formData)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setPending(false)
    }
  }

  return (
    <form action={handleSubmit} className="panel" style={{ width: '100%', maxWidth: '600px' }}>
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="name">Client Name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. John Doe"
        />
      </div>

      <div className="form-group">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          placeholder="e.g. Acme Corp"
        />
      </div>

      <div className="form-group">
        <label htmlFor="clientUserEmail">Client User Email</label>
        <input
          id="clientUserEmail"
          name="clientUserEmail"
          type="email"
          required
          placeholder="client@email.com"
        />
        <p className="lede" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
          The user must already be invited to the platform.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="submit" disabled={pending} style={{ flex: 1 }}>
          {pending ? 'Saving...' : 'Create Client'}
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
