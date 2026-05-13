import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth/get-user'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import SmartScript from './SmartScript'
import ProjectUpload from './ProjectUpload'
import AssetList from './AssetList'
import FeedbackForm from './FeedbackForm'
import FeedbackList from './FeedbackList'
import ActivityTab from './ActivityTab'
import TeamManagement from './TeamManagement'
import { updateProjectStatus, archiveProject } from './workflow-actions'
import type { UserRole } from '@/lib/access/roles'

function TabLoading() {
  return (
    <div className="panel" style={{ width: '100%', maxWidth: 'none', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="button-loading" style={{ color: 'var(--muted)' }}>Loading...</div>
    </div>
  )
}

type ProjectPageProps = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    tab?: string
  }>
}

export default async function ProjectDetailPage({ params, searchParams }: ProjectPageProps) {
  const { id } = await params
  const { tab = 'script' } = await searchParams
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const payload = await getPayload({ config })

  try {
    const project = await payload.findByID({
      collection: 'projects',
      id,
      user,
      overrideAccess: false,
      depth: 1,
    })

    if (!project) return notFound()

    // Fetch script for this project
    const { docs: scripts } = await payload.find({
      collection: 'scripts',
      where: {
        project: { equals: id },
      },
      user,
      overrideAccess: false,
      depth: 1,
    })

    const scriptDoc = scripts[0]
    let scriptData = null

    if (scriptDoc) {
      // Fetch rows for the script
      const { docs: rows } = await payload.find({
        collection: 'script-rows',
        where: {
          script: { equals: scriptDoc.id },
        },
        user,
        overrideAccess: false,
        limit: 100,
        sort: 'orderIndex',
      })

      scriptData = {
        id: String(scriptDoc.id),
        isReady: scriptDoc.isReady ?? false,
        rows: rows.map((row: any) => ({
          id: String(row.id),
          orderIndex: row.orderIndex,
          actionInstruction: row.actionInstruction || '',
          scriptText: row.scriptText || '',
          editorNote: row.editorNote || '',
          uploadSlotStatus: row.uploadSlotStatus || 'empty',
        })),
      }
    }

    // Fetch feedback for the project
    const { docs: feedback } = await payload.find({
      collection: 'feedback',
      where: {
        project: { equals: id },
      },
      user,
      overrideAccess: false,
      limit: 100,
    })

    // Find latest approved final video for Client feedback
    const { docs: approvedAssets } = await payload.find({
      collection: 'assets',
      where: {
        project: { equals: id },
        assetType: { equals: 'final_video' },
        isApproved: { equals: true },
      },
      sort: '-createdAt',
      limit: 1,
    })
    const latestApprovedAsset = approvedAssets[0]

    // Fetch potential team members (Editors and Scriptwriters)
    let editors: any[] = []
    let writers: any[] = []

    if (['PO', 'AM'].includes(user.role)) {
      const { docs: teamMembers } = await payload.find({
        collection: 'users',
        where: {
          and: [
            { role: { in: ['Editor', 'Scriptwriter'] } },
            { workspace: { equals: typeof project.workspace === 'object' ? project.workspace.id : project.workspace } },
          ],
        },
        limit: 100,
      })
      editors = teamMembers.filter(u => u.role === 'Editor')
      writers = teamMembers.filter(u => u.role === 'Scriptwriter')
    }

    return (
      <section>
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Project Details</p>
            <h1>{project.name}</h1>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span className={`badge status-${project.status}`}>
              {project.status.replace('_', ' ')}
            </span>
            
            {project.status === 'recording' && ['PO', 'AM'].includes(user.role) && (
              <form action={async () => {
                'use server'
                await updateProjectStatus(id, 'editing')
              }}>
                <button type="submit" className="badge status-editing" style={{ border: 'none', cursor: 'pointer' }}>
                  Force Edit Mode
                </button>
              </form>
            )}

            {project.status === 'review' && ['PO', 'AM'].includes(user.role) && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <form action={async () => {
                  'use server'
                  await updateProjectStatus(id, 'approved')
                }}>
                  <button type="submit" className="badge status-approved" style={{ border: 'none', cursor: 'pointer' }}>
                    Approve
                  </button>
                </form>
                <form action={async () => {
                  'use server'
                  await updateProjectStatus(id, 'in_revision')
                }}>
                  <button type="submit" className="badge status-recording" style={{ border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#b91c1c' }}>
                    Request Revision
                  </button>
                </form>
              </div>
            )}

            {project.status === 'approved' && ['PO', 'AM'].includes(user.role) && (
              <form action={async () => {
                'use server'
                await updateProjectStatus(id, 'delivered')
              }}>
                <button type="submit" className="badge status-delivered" style={{ border: 'none', cursor: 'pointer' }}>
                  Mark Delivered
                </button>
              </form>
            )}

            {['PO', 'AM'].includes(user.role) && (
              <form action={async () => {
                'use server'
                await archiveProject(id)
              }}>
                <button type="submit" className="badge" style={{ border: '1px solid #fee2e2', color: '#b91c1c', cursor: 'pointer', background: 'transparent' }}>
                  Archive Project
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="panel" style={{ width: '100%', maxWidth: 'none', marginBottom: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
            <div>
              <p className="nav-label">Client</p>
              <p style={{ fontWeight: 600 }}>{typeof project.client === 'object' ? project.client?.name : 'No Client'}</p>
              <p className="lede" style={{ fontSize: '0.9rem' }}>{typeof project.client === 'object' ? project.client?.company : ''}</p>
            </div>
            <div>
              <p className="nav-label">Due Date</p>
              <p style={{ fontWeight: 600 }}>{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Not set'}</p>
            </div>
            <div>
              <p className="nav-label">Team</p>
              <p style={{ fontSize: '0.9rem' }}>AM: <strong>{typeof project.assignedAM === 'object' ? project.assignedAM?.name : 'Unassigned'}</strong></p>
              <p style={{ fontSize: '0.9rem' }}>Editor: <strong>{typeof project.assignedEditor === 'object' ? project.assignedEditor?.name : 'Unassigned'}</strong></p>
            </div>
          </div>
        </div>

        <div className="nav-group" style={{ flexDirection: 'row', borderBottom: '1px solid var(--line)', marginBottom: '32px', gap: '32px' }}>
          <Link 
            href={`/projects/${id}?tab=script`}
            style={{ 
              padding: '12px 0', 
              borderBottom: tab === 'script' ? '2px solid var(--accent)' : 'none', 
              color: tab === 'script' ? 'var(--accent)' : 'var(--muted)', 
              fontWeight: 600, 
              textDecoration: 'none' 
            }}
          >
            Smart Script
          </Link>
          <Link 
            href={`/projects/${id}?tab=assets`}
            style={{ 
              padding: '12px 0', 
              borderBottom: tab === 'assets' ? '2px solid var(--accent)' : 'none', 
              color: tab === 'assets' ? 'var(--accent)' : 'var(--muted)', 
              fontWeight: 600, 
            textDecoration: 'none' 
          }}
        >
          Assets
        </Link>
        <Link 
          href={`/projects/${id}?tab=feedback`}
          style={{ 
            padding: '12px 0', 
            borderBottom: tab === 'feedback' ? '2px solid var(--accent)' : 'none', 
            color: tab === 'feedback' ? 'var(--accent)' : 'var(--muted)', 
            fontWeight: 600, 
          textDecoration: 'none' 
        }}
      >
        Feedback
      </Link>
      <Link 
        href={`/projects/${id}?tab=activity`}
        style={{ 
          padding: '12px 0', 
          borderBottom: tab === 'activity' ? '2px solid var(--accent)' : 'none', 
          color: tab === 'activity' ? 'var(--accent)' : 'var(--muted)', 
          fontWeight: 600, 
          textDecoration: 'none' 
        }}
      >
        Activity
      </Link>
    </div>

        {tab === 'script' && (
          <Suspense fallback={<TabLoading />}>
            <SmartScript 
              script={scriptData} 
              userRole={user.role as UserRole} 
              projectId={id}
            />
          </Suspense>
        )}

        {tab === 'assets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {user.role === 'Editor' && (
              <ProjectUpload projectId={id} onUploadSuccess={() => redirect(`/projects/${id}?tab=assets`)} />
            )}
            <Suspense fallback={<TabLoading />}>
              <AssetList projectId={id} />
            </Suspense>
          </div>
        )}

        {tab === 'feedback' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {user.role === 'Client' && latestApprovedAsset && (
              <FeedbackForm projectId={id} assetId={String(latestApprovedAsset.id)} />
            )}
            {user.role === 'Client' && !latestApprovedAsset && (
              <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
                <p className="lede">Feedback can only be submitted on approved final videos.</p>
              </div>
            )}
            <Suspense fallback={<TabLoading />}>
              <FeedbackList feedback={feedback} userRole={user.role as string} />
            </Suspense>
          </div>
        )}

        {tab === 'activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {['PO', 'AM'].includes(user.role) && (
              <TeamManagement 
                projectId={id}
                assignedEditor={project.assignedEditor}
                assignedWriter={project.assignedWriter}
                editors={editors}
                writers={writers}
              />
            )}
            <Suspense fallback={<TabLoading />}>
              <ActivityTab projectId={id} />
            </Suspense>
          </div>
        )}
      </section>
    )
  } catch (err) {
    console.error(err)
    return notFound()
  }
}
