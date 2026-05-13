'use client'

import { useState, useRef } from 'react'

export default function ProjectUpload({ 
  projectId,
  onUploadSuccess 
}: { 
  projectId: string,
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
    formData.append('assetType', 'final_video')
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
    <div className="panel" style={{ padding: '24px', borderStyle: 'dashed', textAlign: 'center' }}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleUpload} 
        style={{ display: 'none' }} 
        accept="video/*"
      />
      <h3 style={{ margin: '0 0 8px' }}>Upload Final Video</h3>
      <p className="lede" style={{ fontSize: '0.9rem', marginBottom: '20px' }}>
        Once uploaded, the project status will move to Review and the AM will be notified.
      </p>
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="button"
      >
        {uploading ? 'Uploading Final...' : 'Select Final Video File'}
      </button>
    </div>
  )
}
