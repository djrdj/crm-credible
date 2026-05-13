'use client'

import { useState } from 'react'
import { login } from './actions'
import { useSearchParams } from 'next/navigation'

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    try {
      await login(formData)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setPending(false)
    }
  }

  return (
    <form action={handleSubmit}>
      {message && <div className="lede" style={{ color: 'var(--accent)', marginBottom: '16px' }}>{message}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="name@company.com"
        />
      </div>

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

      <button type="submit" disabled={pending} className={pending ? 'button-loading' : ''}>
        {pending ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
