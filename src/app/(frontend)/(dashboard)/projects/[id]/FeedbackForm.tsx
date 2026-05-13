'use client'

import { useState } from 'react'
import { submitFeedback } from './feedback-actions'

export default function FeedbackForm({ 
  projectId, 
  assetId 
}: { 
  projectId: string, 
  assetId: string 
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    const timestampLabel = formData.get('timestampLabel') as string
    const comment = formData.get('comment') as string

    try {
      await submitFeedback(projectId, assetId, { timestampLabel, comment })
      // Clear form
      const form = document.getElementById('feedback-form') as HTMLFormElement
      form?.reset()
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="panel" style={{ marginTop: '32px' }}>
      <h3>Submit Feedback</h3>
      <p className="lede" style={{ fontSize: '0.9rem', marginBottom: '20px' }}>
        Point out specific changes needed using MM:SS timestamps.
      </p>
      
      <form id="feedback-form" action={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px' }}>
          <div className="form-group">
            <label htmlFor="timestampLabel">Time (MM:SS)</label>
            <input
              id="timestampLabel"
              name="timestampLabel"
              type="text"
              required
              placeholder="01:23"
              pattern="^\d{1,2}:[0-5]\d$"
            />
          </div>
          <div className="form-group">
            <label htmlFor="comment">Comment</label>
            <input
              id="comment"
              name="comment"
              type="text"
              required
              placeholder="Describe the change needed..."
            />
          </div>
        </div>

        <button type="submit" disabled={pending}>
          {pending ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  )
}
