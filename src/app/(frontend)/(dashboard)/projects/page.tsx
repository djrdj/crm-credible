import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth/get-user'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ProjectsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const payload = await getPayload({ config })

  const { docs: projects } = await payload.find({
    collection: 'projects',
    where: {
      isArchived: { equals: false },
    },
    user,
    overrideAccess: false,
    depth: 1,
  })

  return (
    <section>
      <div className="dashboard-header">
        <h1>Projects</h1>
        {['PO', 'AM'].includes(user.role) && (
          <Link href="/projects/new" className="button" style={{ textDecoration: 'none' }}>
            New Project
          </Link>
        )}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Client</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project: any) => (
              <tr key={project.id}>
                <td style={{ fontWeight: 600 }}>{project.name}</td>
                <td>{project.client?.name || project.client || '-'}</td>
                <td>
                  <span className={`badge status-${project.status}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </td>
                <td>{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : '-'}</td>
                <td>
                  <Link href={`/projects/${project.id}`} style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                  No projects found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
