'use client'

import { useState, useRef } from 'react'

export default function BulkUpload({ 
  projectId, 
  rows,
  onUploadComplete 
}: { 
  projectId: string, 
  rows: any[],
  onUploadComplete: () => void 
}) {
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    
    // Simple mapping: first file to first empty row, etc.
    const emptyRows = rows.filter(r => r.uploadSlotStatus === 'empty')
    
    try {
      const uploadPromises = files.map(async (file, index) => {
        const targetRow = emptyRows[index] || rows[index % rows.length]
        
        const formData = new FormData()
        formData.append('file', file)
        formData.append('project', projectId)
        formData.append('scriptRow', targetRow.id)
        formData.append('assetType', 'raw_clip')
        formData.append('storageProvider', 'local')
        formData.append('sequenceIndex', String(index))

        const response = await fetch('/api/assets', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) throw new Error(`Failed to upload ${file.name}`)
      })

      await Promise.all(uploadPromises)
      onUploadComplete()
    } catch (err) {
      console.error(err)
      alert('One or more uploads failed.')
    } finally {
      setUploading(false)
      setFiles([])
    }
  }

  return (
    <div className="panel" style={{ padding: '24px', background: 'var(--surface-strong)', marginBottom: '32px' }}>
      <p className="eyebrow">Bulk Footage Upload</p>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '16px' }}>
        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept="video/*"
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--line)' }}
        >
          {files.length > 0 ? `${files.length} files selected` : 'Select Files'}
        </button>
        {files.length > 0 && (
          <button onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Confirm & Upload'}
          </button>
        )}
      </div>
      <p className="lede" style={{ fontSize: '0.8rem', marginTop: '12px' }}>
        Files will be automatically mapped to empty script rows in order.
      </p>
    </div>
  )
}
