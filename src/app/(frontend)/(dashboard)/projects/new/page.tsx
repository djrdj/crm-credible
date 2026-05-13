import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import ProjectForm from './ProjectForm'

export default async function NewProjectPage() {
  const user = await getCurrentUser()
  if (!user || !['PO', 'AM'].includes(user.role)) {
    redirect('/')
  }

  const payload = await getPayload({ config })

  const { docs: clients } = await payload.find({
    collection: 'clients',
    user,
    overrideAccess: false,
    depth: 0,
  })

  return (
    <section>
      <div className="dashboard-header">
        <h1>New Project</h1>
      </div>
      <ProjectForm clients={clients} />
    </section>
  )
}
