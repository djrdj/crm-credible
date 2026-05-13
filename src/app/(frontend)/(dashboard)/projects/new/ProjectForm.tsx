'use client'

import { useState } from 'react'
import { createProject } from '../actions'

export default function ProjectForm({ clients }: { clients: any[] }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    try {
      await createProject(formData)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setPending(false)
    }
  }

  return (
    <form action={handleSubmit} className="panel" style={{ width: '100%', maxWidth: '600px' }}>
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="name">Project Name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. Summer Brand Video"
        />
      </div>

      <div className="form-group">
        <label htmlFor="clientId">Client</label>
        <select
          id="clientId"
          name="clientId"
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
          <option value="">Select a client...</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name} {client.company ? `(${client.company})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="dueDate">Due Date</label>
        <input
          id="dueDate"
          name="dueDate"
          type="date"
        />
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="submit" disabled={pending} style={{ flex: 1 }}>
          {pending ? 'Creating...' : 'Create Project'}
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
