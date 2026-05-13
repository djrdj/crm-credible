import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth/get-user'
import { redirect, notFound } from 'next/navigation'
import WorkspaceForm from './WorkspaceForm'

type WorkspacePageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function WorkspaceSettingsPage({ params }: WorkspacePageProps) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user || user.role !== 'PO') redirect('/')

  const payload = await getPayload({ config })

  try {
    const workspace = await payload.findByID({
      collection: 'workspaces',
      id,
      user,
      overrideAccess: false,
    })

    if (!workspace) return notFound()

    return (
      <section>
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Settings</p>
            <h1>Workspace Settings</h1>
          </div>
        </div>
        <WorkspaceForm workspace={workspace} />
      </section>
    )
  } catch (err) {
    return notFound()
  }
}
