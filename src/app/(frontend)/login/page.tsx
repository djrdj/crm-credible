import { Suspense } from 'react'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <main className="shell">
      <section className="panel">
        <p className="eyebrow">Authentication</p>
        <h1>Login</h1>
        <p className="lede">
          Welcome back. Please enter your credentials to access your workspace.
        </p>
        <Suspense fallback={<p>Loading...</p>}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  )
}
