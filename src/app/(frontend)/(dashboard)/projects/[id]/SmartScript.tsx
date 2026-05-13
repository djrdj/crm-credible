'use client'

import { useState, useEffect } from 'react'
import RowUpload from './RowUpload'
import BulkUpload from './BulkUpload'
import { 
  createScript,
  addScriptRow, 
  updateScriptRow, 
  deleteScriptRow, 
  toggleScriptReady,
  reorderScriptRows 
} from './script-actions'
import type { UserRole } from '@/lib/access/roles'

type Row = {
  id: string
  orderIndex: number
  actionInstruction: string
  scriptText: string
  editorNote?: string
  uploadSlotStatus: 'empty' | 'uploaded' | 'reviewed'
}

type Script = {
  id: string
  isReady: boolean
  rows: Row[]
}

export default function SmartScript({ 
  script: initialScript, 
  userRole,
  projectId
}: { 
  script: Script | null, 
  userRole: UserRole,
  projectId: string
}) {
  const [script, setScript] = useState<Script | null>(initialScript)
  const [loading, setLoading] = useState(false)
  const isInternal = ['PO', 'AM', 'Scriptwriter', 'Editor'].includes(userRole)
  const canEdit = ['PO', 'AM', 'Scriptwriter'].includes(userRole)

  const handleInitScript = async () => {
    if (!canEdit) return
    setLoading(true)
    try {
      const newScript = await createScript(projectId)
      setScript({
        id: String(newScript.id),
        isReady: false,
        rows: []
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!script) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
        <p className="lede">No script has been created for this project yet.</p>
        {canEdit && (
          <button 
            onClick={handleInitScript}
            disabled={loading}
            className="button"
            style={{ marginTop: '20px' }}
          >
            {loading ? 'Initializing...' : 'Initialize Script'}
          </button>
        )}
      </div>
    )
  }

  const sortedRows = [...script.rows].sort((a, b) => a.orderIndex - b.orderIndex)

  const handleMoveRow = async (index: number, direction: 'up' | 'down') => {
    if (!canEdit || script.isReady) return
    const newRows = [...sortedRows]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newRows.length) return

    const temp = newRows[index].orderIndex
    newRows[index].orderIndex = newRows[targetIndex].orderIndex
    newRows[targetIndex].orderIndex = temp

    setScript({ ...script, rows: [...newRows] })

    try {
      await reorderScriptRows([
        { id: newRows[index].id, orderIndex: newRows[index].orderIndex },
        { id: newRows[targetIndex].id, orderIndex: newRows[targetIndex].orderIndex }
      ])
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddRow = async () => {
    if (!canEdit) return
    setLoading(true)
    try {
      const nextIndex = sortedRows.length > 0 
        ? Math.max(...sortedRows.map(r => r.orderIndex)) + 1 
        : 1
      const newRow = await addScriptRow(script.id, nextIndex)
      setScript({
        ...script,
        rows: [...script.rows, newRow as any]
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRow = async (rowId: string, data: Partial<Row>) => {
    if (!canEdit) return
    try {
      await updateScriptRow(rowId, data)
      setScript({
        ...script,
        rows: script.rows.map(r => r.id === rowId ? { ...r, ...data } : r)
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteRow = async (rowId: string) => {
    if (!canEdit) return
    if (!confirm('Are you sure you want to delete this row?')) return
    setLoading(true)
    try {
      await deleteScriptRow(rowId)
      setScript({
        ...script,
        rows: script.rows.filter(r => r.id !== rowId)
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleReady = async () => {
    if (!canEdit) return
    setLoading(true)
    try {
      const newReadyState = !script.isReady
      await toggleScriptReady(script.id, newReadyState)
      setScript({ ...script, isReady: newReadyState })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="script-container">
      {userRole === 'Client' && (
        <BulkUpload 
          projectId={projectId} 
          rows={script.rows} 
          onUploadComplete={() => window.location.reload()} 
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0 }}>Smart Script</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          {canEdit && (
            <>
              <button 
                onClick={handleToggleReady} 
                disabled={loading}
                style={{ 
                  background: script.isReady ? 'var(--surface)' : 'var(--accent)',
                  color: script.isReady ? 'var(--text)' : 'white',
                  border: script.isReady ? '1px solid var(--line)' : 'none'
                }}
              >
                {script.isReady ? 'Edit Script' : 'Mark as Ready'}
              </button>
              <button onClick={handleAddRow} disabled={loading || script.isReady}>
                + Add Row
              </button>
            </>
          )}
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th>Action / Instruction</th>
              <th>Script Text</th>
              {isInternal && <th>Editor Note</th>}
              <th style={{ width: '120px' }}>Status</th>
              {canEdit && !script.isReady && <th style={{ width: '80px' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, index) => (
              <tr key={row.id}>
                <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{index + 1}</td>
                <td>
                  {canEdit && !script.isReady ? (
                    <textarea 
                      defaultValue={row.actionInstruction}
                      onBlur={(e) => handleUpdateRow(row.id, { actionInstruction: e.target.value })}
                      style={{ width: '100%', border: 'none', background: 'transparent', resize: 'vertical' }}
                      placeholder="What should the client do?"
                    />
                  ) : (
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{row.actionInstruction || '-'}</p>
                  )}
                </td>
                <td>
                  {canEdit && !script.isReady ? (
                    <textarea 
                      defaultValue={row.scriptText}
                      onBlur={(e) => handleUpdateRow(row.id, { scriptText: e.target.value })}
                      style={{ width: '100%', border: 'none', background: 'transparent', resize: 'vertical', fontWeight: 600 }}
                      placeholder="What should the client say?"
                    />
                  ) : (
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontWeight: 600 }}>{row.scriptText || '-'}</p>
                  )}
                </td>
                {isInternal && (
                  <td>
                    {canEdit && !script.isReady ? (
                      <textarea 
                        defaultValue={row.editorNote}
                        onBlur={(e) => handleUpdateRow(row.id, { editorNote: e.target.value })}
                        style={{ width: '100%', border: 'none', background: 'transparent', resize: 'vertical', fontSize: '0.9rem', color: 'var(--muted)' }}
                        placeholder="Internal notes for editor..."
                      />
                    ) : (
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: 'var(--muted)' }}>{row.editorNote || '-'}</p>
                    )}
                  </td>
                )}
                <td>
                  <RowUpload 
                    projectId={projectId}
                    scriptRowId={row.id}
                    status={row.uploadSlotStatus}
                    onUploadSuccess={() => {
                      setScript({
                        ...script,
                        rows: script.rows.map(r => r.id === row.id ? { ...r, uploadSlotStatus: 'uploaded' } : r)
                      })
                    }}
                  />
                </td>
                {canEdit && !script.isReady && (
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleMoveRow(index, 'up')}
                        disabled={index === 0}
                        style={{ background: 'transparent', padding: '4px', fontSize: '1rem' }}
                      >
                        ↑
                      </button>
                      <button 
                        onClick={() => handleMoveRow(index, 'down')}
                        disabled={index === sortedRows.length - 1}
                        style={{ background: 'transparent', padding: '4px', fontSize: '1rem' }}
                      >
                        ↓
                      </button>
                      <button 
                        onClick={() => handleDeleteRow(row.id)}
                        style={{ background: 'transparent', color: '#b91c1c', padding: '4px 8px', fontSize: '0.8rem' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {sortedRows.length === 0 && (
              <tr>
                <td colSpan={isInternal ? 6 : 5} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                  No rows added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
