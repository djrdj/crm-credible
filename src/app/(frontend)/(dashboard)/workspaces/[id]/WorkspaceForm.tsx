'use client'

import { useState } from 'react'
import { updateWorkspace } from '../actions'

export default function WorkspaceForm({ workspace }: { workspace: any }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    setSuccess(false)
    try {
      await updateWorkspace(workspace.id, formData)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setPending(false)
    }
  }

  return (
    <form action={handleSubmit} className="panel" style={{ width: '100%', maxWidth: '600px' }}>
      {error && <div className="error-message">{error}</div>}
      {success && (
        <div className="badge status-approved" style={{ marginBottom: '16px', padding: '12px', width: '100%', textAlign: 'center' }}>
          Workspace updated successfully.
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="name">Workspace Name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={workspace.name}
          placeholder="e.g. Acme Productions"
        />
      </div>

      <div className="form-group">
        <label htmlFor="storageLimitGb">Storage Limit (GB)</label>
        <input
          id="storageLimitGb"
          name="storageLimitGb"
          type="number"
          required
          defaultValue={workspace.storageLimitGb}
          placeholder="50"
        />
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="submit" disabled={pending} style={{ flex: 1 }}>
          {pending ? 'Saving...' : 'Update Workspace'}
        </button>
        <button 
          type="button" 
          onClick={() => window.history.back()} 
          style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--line)', flex: 1 }}
        >
          Back
        </button>
      </div>
    </form>
  )
}
