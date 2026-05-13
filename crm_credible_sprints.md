# CRM Credible — Sprint Planning & Task Breakdown
**Total Milestones:** 6
**Methodology:** Iterative — each milestone is a shippable increment
**Stack:** Payload CMS · PostgreSQL · Next.js · Cloudflare R2 · Docker

---

## Milestone 0 — Local Setup
> Goal: App runs fully on your Linux machine. No Docker, no cloud, no cost.

- [ ] Install Node.js (v20+) via `nvm` if not already installed
- [ ] Install PostgreSQL locally (`sudo apt install postgresql`)
- [ ] Create local database: `createdb crm_credible`
- [ ] Initialize monorepo (Next.js + Payload CMS in one repo)
- [ ] Configure Payload CMS with PostgreSQL adapter
- [ ] Set up `.env` file (see variables below)
- [ ] Configure local file storage (uploads saved to `/media` folder on disk)
- [ ] Set up Resend free tier (100 emails/day free) + test send
- [ ] Initialize Git repository (`main` branch only for now)

**.env variables needed locally:**
```
DATABASE_URI=postgresql://localhost:5432/crm_credible
PAYLOAD_SECRET=any-long-random-string
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
STORAGE=local
RESEND_API_KEY=re_xxxx
```

---

## Milestone 1 — Auth & User Management
> Goal: All 5 roles can be created, invited, and logged in. Access is scoped correctly.

### Payload Collections
- [ ] Create `users` collection with role enum (PO, AM, Scriptwriter, Editor, Client)
- [ ] Enforce one-role-per-user constraint
- [ ] Configure Payload JWT auth (login, logout, refresh token)
- [ ] Create `workspaces` collection
- [ ] Link users to workspaces via `workspace_id`

### Invite System
- [ ] Build invite flow: AM/PO enters email + role → system sends invite email
- [ ] Create `invites` collection (token, email, role, workspace, expiry)
- [ ] Build invite acceptance page (Next.js) — sets password, activates account
- [ ] Expire invite tokens after 48 hours

### Frontend
- [ ] Login page
- [ ] Forgot password / reset password flow
- [ ] Basic dashboard shell (sidebar + role-aware nav)
- [ ] Redirect logic based on role after login

---

## Milestone 2 — Workspaces, Clients & Projects
> Goal: PO/AM can create a workspace, add a client, and create a project. All visible in the dashboard.

### Payload Collections
- [ ] Create `clients` collection (linked to workspace + client user)
- [ ] Create `projects` collection with status enum
- [ ] Enforce project scoping: Editor sees only assigned projects; Client sees only own projects
- [ ] Add `assigned_am`, `assigned_editor`, `assigned_writer` relations to projects

### Frontend
- [ ] Workspace settings page (PO only)
- [ ] Clients list page + create client form
- [ ] Projects list page (filtered by role)
- [ ] Create project form (select client, assign team members)
- [ ] Project detail page shell (tabs: Script / Files / Feedback / Activity)
- [ ] Project status badge + status history log

---

## Milestone 3 — Smart Script
> Goal: Scriptwriter can build a script. Client sees it correctly. Editor notes are hidden from client.

### Payload Collections
- [ ] Create `scripts` collection (one per project)
- [ ] Create `script_rows` collection with all columns:
  - `action_instruction`, `script_text`, `editor_note`, `upload_slot_status`, `order_index`
- [ ] API-layer field stripping: `editor_note` removed from response when `role === Client`
- [ ] Row reordering endpoint (PATCH order_index)

### Frontend
- [ ] Smart Script grid UI (table layout, inline editing per row)
- [ ] Role-aware column rendering (Editor Notes column hidden for Client)
- [ ] Add / delete / reorder rows
- [ ] Script status: Draft → Ready (triggers notification)
- [ ] Client view: read-only script with upload slot per row

---

## Milestone 4 — File Uploads & Asset Management
> Goal: Client can upload footage per row. Editor can download and upload final video. All files are scoped and secure.

### Storage
- [ ] Use **local disk storage** — uploads saved to `/media` in project root
- [ ] Organize upload paths mirroring the folder hierarchy: `/media/[workspaceId]/[clientId]/[projectId]/raw/` etc.
- [ ] ~~Pre-signed URLs~~ — not needed locally; files served directly by Payload's static handler
- [ ] Add `/media` to `.gitignore` so uploaded files are not committed

### Payload Collections
- [ ] Create `assets` collection (raw_clip, final_video, attachment)
- [ ] Link assets to `script_row_id` (raw clips) or `project_id` (final video)
- [ ] Add `revision_round` field to final video assets
- [ ] Soft-delete logic: deleted projects archive assets, not wipe

### Upload Flows
- [ ] Per-row single upload (Client → raw clip)
- [ ] Bulk upload UI:
  - [ ] Multi-file selector
  - [ ] Default order mapping (drop order → script row order)
  - [ ] Alphanumeric sort fallback
  - [ ] Manual drag-to-assign fallback UI
  - [ ] Confirm & upload
- [ ] Final video upload (Editor → project level)
- [ ] Asset download (Editor downloads raw clips as zip or individually)

### Google Drive Integration
- [ ] OAuth2 connect flow (user links their Google Drive)
- [ ] Browse & select files from Drive as upload source
- [ ] Store `external_file_id` + `storage_provider = gdrive` on asset record

---

## Milestone 5 — Workflow, Approvals & Feedback
> Goal: Full end-to-end workflow works. AM approves. Client sees video. Client gives timestamped feedback. Revision loop works.

### Workflow Engine
- [ ] Status transition endpoint (`PATCH /projects/:id/status`)
- [ ] Role-gate each transition (only AM can approve, only Editor can submit final, etc.)
- [ ] AM manual override: advance project from `recording` → `editing` even with empty slots
- [ ] Final video locked from Client until `status === approved`

### Approval Gate
- [ ] AM review page: watch final video, approve or request revision
- [ ] On approval: unlock video for Client, trigger email notification
- [ ] On revision request: notify Editor, increment `revision_round`

### Timestamped Feedback
- [ ] Client feedback form: input time (MM:SS format) + comment text
- [ ] Parse `MM:SS` → seconds for sorting
- [ ] Feedback list view for AM + Editor (sorted by timestamp)
- [ ] Mark feedback item as resolved
- [ ] Submitting feedback triggers status → `in_revision` + notifies Editor + AM

### Notifications
- [ ] In-app notifications (bell icon, unread count)
- [ ] Notification triggers wired to all status transitions (see PRD Section 8)
- [ ] Email notifications via Resend for: script ready, video approved, revision requested
- [ ] Mark notifications as read

---

## Milestone 6 — Polish, Testing & Launch
> Goal: App is stable, secure, and ready for real users.

### Security
- [ ] Audit all API endpoints for role enforcement
- [ ] Confirm `editor_note` never leaks to Client in any response
- [ ] Confirm pre-signed URL expiry works correctly
- [ ] Rate limiting on auth endpoints
- [ ] Input sanitization on all text fields

### QA
- [ ] End-to-end test: full workflow from project creation → delivery
- [ ] Test bulk upload edge cases (out-of-order files, duplicate names)
- [ ] Test revision loop (3+ rounds)
- [ ] Test invite expiry and re-invite flow
- [ ] Cross-browser check (Chrome, Firefox, Safari)

### DevOps
- [ ] Add `.env.example` with all required variable names (no values)
- [ ] Add `README.md` with local setup instructions
- [ ] Add `/media` and `.env` to `.gitignore`

> ⏭️ Docker, VPS, CI/CD, SSL, backups, and monitoring are deferred to the deployment milestone.

### UX Polish
- [ ] Loading states on all async actions
- [ ] Empty states for all list views
- [ ] Error messages that are human-readable (not "500 Internal Server Error")
- [ ] Mobile-responsive layout check
- [ ] Onboarding flow for first-time PO (create workspace → invite first AM)

---

## Task Summary

| Milestone | Focus | Rough Effort |
|-----------|-------|-------------|
| 0 | Infrastructure | 2–3 days |
| 1 | Auth & Users | 4–5 days |
| 2 | Workspaces & Projects | 3–4 days |
| 3 | Smart Script | 4–5 days |
| 4 | File Uploads & Storage | 5–7 days |
| 5 | Workflow & Feedback | 5–7 days |
| 6 | Polish & Launch | 3–5 days |
| **Total** | | **~26–36 dev days** |

---

*Estimates assume 1 full-stack developer. Parallelize Milestones 3 & 4 if you have 2+ devs.*
