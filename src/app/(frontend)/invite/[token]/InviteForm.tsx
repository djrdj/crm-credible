'use client'

import { useState } from 'react'
import { acceptInvite } from '../actions'

export default function InviteForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    try {
      await acceptInvite(token, formData)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setPending(false)
    }
  }

  return (
    <form action={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="••••••••"
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          placeholder="••••••••"
        />
      </div>

      <button type="submit" disabled={pending} className={pending ? 'button-loading' : ''}>
        {pending ? 'Activating...' : 'Activate Account'}
      </button>
    </form>
  )
}
