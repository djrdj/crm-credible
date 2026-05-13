import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth/get-user'

export default async function AssetList({ projectId }: { projectId: string }) {
  const user = await getCurrentUser()
  if (!user) return null

  const payload = await getPayload({ config })

  const { docs: assets } = await payload.find({
    collection: 'assets',
    where: {
      project: { equals: projectId },
    },
    user,
    overrideAccess: false,
    sort: '-createdAt',
  })

  return (
    <div className="table-container" style={{ marginTop: '24px' }}>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>File</th>
            <th>Uploaded By</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset: any) => (
            <tr key={asset.id}>
              <td>
                <span className="badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  {asset.assetType.replace('_', ' ')}
                </span>
              </td>
              <td>
                <a 
                  href={asset.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
                >
                  {asset.filename}
                </a>
              </td>
              <td>{asset.uploadedBy?.name || asset.uploadedBy?.email || 'Unknown'}</td>
              <td>{new Date(asset.createdAt).toLocaleDateString()}</td>
              <td>
                {asset.assetType === 'final_video' && (
                  <span className={`badge ${asset.isApproved ? 'status-approved' : 'status-review'}`}>
                    {asset.isApproved ? 'Approved' : 'Pending Review'}
                  </span>
                )}
                {asset.assetType === 'raw_clip' && (
                  <span className="badge status-recording">Uploaded</span>
                )}
              </td>
            </tr>
          ))}
          {assets.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                No assets uploaded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
