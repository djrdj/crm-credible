'use client'

import { useState, useRef } from 'react'

export default function RowUpload({ 
  projectId, 
  scriptRowId, 
  status,
  onUploadSuccess 
}: { 
  projectId: string, 
  scriptRowId: string, 
  status: string,
  onUploadSuccess: () => void 
}) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('project', projectId)
    formData.append('scriptRow', scriptRowId)
    formData.append('assetType', 'raw_clip')
    formData.append('storageProvider', 'local')

    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      onUploadSuccess()
    } catch (err) {
      console.error(err)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleUpload} 
        style={{ display: 'none' }} 
        accept="video/*"
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        style={{ 
          padding: '4px 12px', 
          fontSize: '0.8rem',
          background: status === 'empty' ? 'var(--accent-soft)' : 'var(--surface)',
          color: status === 'empty' ? 'var(--accent)' : 'var(--muted)',
          border: status === 'empty' ? 'none' : '1px solid var(--line)'
        }}
      >
        {uploading ? '...' : status === 'empty' ? 'Upload' : 'Replace'}
      </button>
      {status !== 'empty' && (
        <span style={{ fontSize: '1rem', color: '#166534' }}>✓</span>
      )}
    </div>
  )
}
