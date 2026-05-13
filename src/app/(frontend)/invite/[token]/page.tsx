import InviteForm from './InviteForm'

type InvitePageProps = {
  params: Promise<{
    token: string
  }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params

  return (
    <main className="shell">
      <section className="panel">
        <p className="eyebrow">Invite Acceptance</p>
        <h1>Activate your account</h1>
        <p className="lede">
          Set your password below to join the platform and start collaborating.
        </p>
        <InviteForm token={token} />
      </section>
    </main>
  )
}
