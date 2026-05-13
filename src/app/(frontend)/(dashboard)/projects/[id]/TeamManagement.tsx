'use client'

import { useState } from 'react'
import { updateProjectTeam } from './team-actions'

export default function TeamManagement({ 
  projectId, 
  assignedEditor, 
  assignedWriter,
  editors,
  writers
}: { 
  projectId: string, 
  assignedEditor: any, 
  assignedWriter: any,
  editors: any[],
  writers: any[]
}) {
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (field: 'assignedEditor' | 'assignedWriter', value: string) => {
    setLoading(true)
    try {
      await updateProjectTeam(projectId, { [field]: value || null })
    } catch (err) {
      console.error(err)
      alert('Failed to update team.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel" style={{ marginTop: '32px' }}>
      <h3>Team Management</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '20px' }}>
        <div className="form-group">
          <label>Assigned Editor</label>
          <select 
            disabled={loading}
            defaultValue={assignedEditor?.id || ''}
            onChange={(e) => handleUpdate('assignedEditor', e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--surface-strong)' }}
          >
            <option value="">Unassigned</option>
            {editors.map(u => (
              <option key={u.id} value={u.id}>{u.name || u.email}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Assigned Scriptwriter</label>
          <select 
            disabled={loading}
            defaultValue={assignedWriter?.id || ''}
            onChange={(e) => handleUpdate('assignedWriter', e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', background: 'var(--surface-strong)' }}
          >
            <option value="">Unassigned</option>
            {writers.map(u => (
              <option key={u.id} value={u.id}>{u.name || u.email}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
