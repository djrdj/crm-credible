# CRM Credible — Clean Implementation Checklist

## Progress Snapshot

Last updated: 2026-05-13

Legend:

- `[x]` done
- `[-]` in progress
- `[ ]` not started

Current state:

- `[x]` planning documents consolidated
- `[x]` local-first storage decision locked
- `[x]` client-project scoping fix chosen and scaffolded
- `[x]` repo scaffold created
- `[x]` collection files split out from the schema draft
- `[x]` Payload/Next integration aligned at config level
- `[x]` Payload route structure added
- `[x]` core workflow hooks started
- `[x]` invite flow scaffold started
- `[x]` Payload admin/API route files added
- `[x]` dependencies installed and app boot verified
- `[x]` import map generation working
- `[x]` TypeScript check passing
- `[x]` local Postgres bootstrapped for development
- `[x]` auth flows connected end to end
- `[x]` dashboard shell implemented
- `[x]` CRUD UI implemented
- `[x]` email notifications implemented

## Decisions Locked

These decisions are now treated as implementation truth for the first build:

- Storage for v1 local development: `local`
- Storage path for v1: `/media` in project root
- Cloud storage later: abstract storage behind a service so Cloudflare R2 can replace local disk without rewriting business logic
- Backend/CMS: Payload CMS
- Frontend: Next.js App Router
- Database: PostgreSQL
- Auth model: Payload auth with invite-only signup
- One role per user: enforced
- One script per project: enforced

## Key Corrections To Carry Into Build

### 1. Project-to-client scoping fix

The current `Projects` access sketch has a mismatch:

- `projects.client` points to the `clients` collection
- `users.id` is not equal to `projects.client`

So this is incorrect:

```ts
if (user?.role === 'Client') return { client: { equals: user?.id } }
```

Implementation direction:

- Keep `projects.client -> clients`
- Keep `clients.clientUser -> users`
- For client access, resolve the current user's client record first, then filter projects by that client ID

Expected behavior:

- A Client user can only read projects where `project.client.id === client.id` for the `clients` record linked to `client.clientUser === currentUser.id`

Recommended implementation options:

1. Use an access function that looks up the `clients` record for `req.user.id` and returns a filter on `client`.
2. If Payload access composition becomes awkward, add a denormalized `clientUser` relationship directly on `projects` and keep it synced in hooks.

Recommended choice for v1:

- Add `clientUser` directly to `projects` as a denormalized field.

Reason:

- Simpler access rules
- Simpler frontend filtering
- Fewer nested relation edge cases
- Easier to audit for security

### 2. Local storage now, cloud later

The PRD mentions S3-style signed URLs, but your current delivery decision is local storage first.

For v1 local:

- Use Payload local upload handling
- Serve files from `/media`
- Enforce permissions before exposing asset URLs in app flows
- Do not build signed-URL logic yet

For cloud migration later:

- Introduce a storage service interface from day one
- Keep provider-specific logic out of collections and route handlers
- Map `local` and future `r2` providers behind the same service methods

### 3. Schema file is a blueprint, not runnable app code

`payload_schema.ts` is useful, but should be treated as a spec draft.

Before implementation, split it into real files:

- `payload.config.ts`
- `src/collections/Users.ts`
- `src/collections/Workspaces.ts`
- `src/collections/Clients.ts`
- `src/collections/Projects.ts`
- `src/collections/Scripts.ts`
- `src/collections/ScriptRows.ts`
- `src/collections/Assets.ts`
- `src/collections/Feedback.ts`
- `src/collections/Notifications.ts`
- `src/collections/Invites.ts`
- `src/lib/workflows/*`
- `src/lib/access/*`

### 4. Missing helper logic must become explicit modules

These functions are referenced but not defined:

- `triggerStatusNotification`
- `handleFeedbackSubmitted`

Add real modules for:

- project status transition rules
- notification creation
- email sending
- revision round handling
- invite token generation and expiry
- timestamp parsing

## Build Order

## Phase 0 — Project Foundation

- `[x]` Initialize a single Next.js + Payload repo
- `[x]` Install Payload, Postgres adapter, and required auth dependencies
- `[x]` Configure PostgreSQL connection
- `[x]` Add `.env.example`
- `[x]` Add `.gitignore` entries for `.env` and `/media`
- `[x]` Set up local `/media` directory
- `[x]` Confirm app boots locally

Definition of done:

- `[x]` `payload.config.ts` loads
- `[x]` Database connects
- `[x]` Admin panel opens
- `[x]` Upload directory is writable

## Phase 1 — Core Data Model

- `[x]` Create `users`
- `[x]` Create `workspaces`
- `[x]` Create `clients`
- `[x]` Create `projects`
- `[x]` Create `scripts`
- `[x]` Create `scriptRows`
- `[x]` Create `assets`
- `[x]` Create `feedback`
- `[x]` Create `notifications`
- `[x]` Create `invites`

Required field decisions:

- `users.role` enum: `PO | AM | Scriptwriter | Editor | Client`
- `users.workspace` nullable only for `PO`
- `projects.client` required
- `projects.clientUser` required denormalized relation for clean client scoping
- `projects.assignedAM`, `assignedEditor`, `assignedWriter` optional at create time
- `scripts.project` unique to enforce one script per project
- `assets.revisionRound` default `1`
- `assets.storageProvider` default `local`

Definition of done:

- `[ ]` Migrations run
- `[ ]` Admin CRUD works
- `[-]` Required relations save correctly

## Phase 2 — RBAC And Access Hardening

### Users

- `[x]` `PO` can manage globally
- `[x]` `AM` can read users in own workspace
- `[x]` Users can update own profile basics
- `[ ]` Role changes limited to privileged users

### Workspaces

- `[x]` `PO` full control
- `[x]` Non-PO users read only their own workspace

### Clients

- `[x]` `PO` and `AM` manage clients in own workspace
- `[x]` `Client` can read only their own client record

### Projects

- `[x]` `PO` global
- `[x]` `AM` workspace-scoped
- `[x]` `Editor` only assigned projects
- `[x]` `Scriptwriter` only assigned projects
- `[x]` `Client` only projects where `project.clientUser === currentUser.id`

### Scripts and rows

- `[x]` Internal users can edit based on role
- `[ ]` Client can read only project-linked records they are allowed to access
- `[x]` `editorNote` stripped server-side for `Client`

### Assets

- `[ ]` Client can upload only `raw_clip`
- `[ ]` Editor can upload only `final_video`
- `[x]` Client can never access unapproved final videos
- `[x]` Asset reads must be project-scoped, not only type-scoped

Important correction:

The current `assets.read` sketch is too broad for clients because it allows approved finals generally and their own raw clips generally. Final implementation must also verify project ownership.

Definition of done:

- `[x]` Every collection has explicit access rules
- `[x]` No client-visible response leaks `editorNote`
- `[ ]` No cross-project reads for Editor, Scriptwriter, or Client

## Phase 3 — Invite-Only Auth

- `[x]` Configure Payload auth on `users`
- `[x]` Create invite token generation flow
- `[x]` Store `expiresAt`
- `[x]` Build invite acceptance page
- `[ ]` Set password on acceptance
- `[ ]` Mark invite accepted
- `[ ]` Reject expired tokens
- `[ ]` Add forgot-password and reset-password flow

Definition of done:

- `[ ]` PO/AM can invite users
- `[ ]` Invited user can activate account once
- `[ ]` Expired invites fail cleanly

## Phase 4 — Dashboard Shell

- `[ ]` App layout with sidebar
- `[ ]` Role-aware nav
- `[ ]` Auth guard
- `[x]` Login page
- `[x]` Post-login redirect by role
- `[x]` Workspace-aware project listing

Definition of done:

- `[x]` Every role lands on a usable dashboard
- `[x]` Navigation hides pages the role cannot use

## Phase 5 — Workspace, Client, And Project Management

- `[x]` Workspace settings page for `PO`
- `[x]` Client list and create flow
- `[x]` Project list with role-aware filters
- `[x]` Create project form
- `[x]` Project detail shell with tabs:
  - Script
  - Files
  - Feedback
  - Activity

Also add:

- `[x]` status badge
- `[x]` audit log or lightweight status history

Definition of done:

- `[x]` PO/AM can create the working project structure end to end

## Phase 6 — Smart Script

- `[x]` Create one script per project
- `[x]` Build script row table UI
- `[x]` Add row create
- `[x]` Add row delete
- `[x]` Add inline edit
- `[x]` Add row reorder
- `[x]` Add `isReady` action

Business rules:

- `editorNote` visible only to internal roles
- Client sees read-only script view
- Upload slot status visible to all allowed project users
- Marking script ready transitions project from `drafting` to `recording`

Definition of done:

- Scriptwriter can produce a full script
- Client sees the correct non-internal view

## Phase 7 — Asset Uploads

### Local-first implementation

- `[x]` Save uploads into `/media`
- `[x]` Use path convention by workspace/client/project
- `[x]` Support row-linked raw clip uploads
- `[x]` Support project-level final video uploads
- `[x]` Add soft archive flag, not hard delete

### UI flows

- `[x]` Single upload per row
- `[x]` Bulk upload flow
- `[x]` Drop-order mapping
- `[x]` Filename-sort fallback
- `[x]` Manual assign fallback

Important rule:

- Upload success should update row slot state and, when appropriate, project readiness state

Definition of done:

- Client can upload raw footage
- Editor can access only assigned project footage
- Editor can upload final cut

## Phase 8 — Workflow Engine

Allowed statuses:

- `drafting`
- `recording`
- `editing`
- `review`
- `approved`
- `in_revision`
- `delivered`

Implement one workflow module that owns:

- `[x]` allowed transitions
- `[x]` actor permissions
- `[x]` side effects
- `[x]` notification triggers

Required transitions:

- `[x]` `drafting -> recording`
- `[x]` `recording -> editing`
- `[x]` `editing -> review`
- `[x]` `review -> approved`
- `[x]` `review -> in_revision`
- `[x]` `approved -> in_revision`
- `[x]` `in_revision -> editing`
- `[x]` `approved -> delivered`

Special rule:

- `[x]` AM can force `recording -> editing` even if not all rows have uploads

Definition of done:

- Invalid transitions are rejected consistently
- Transition logic is not duplicated across routes and hooks

## Phase 9 — Approval Gate

- `[x]` Final video stays hidden from Client until AM approval
- `[x]` AM review screen shows latest final video
- `[x]` Approve action sets approval state and updates project
- `[x]` Revision request sends project to `in_revision`

Important implementation rule:

- `[x]` Client-facing final video access must require both:
  - correct project ownership
  - approved state

Definition of done:

- Client cannot access unapproved final content through UI or direct API queries

## Phase 10 — Feedback And Revision Loop

- `[x]` Client submits timestamped feedback only on approved final video
- `[x]` Parse `MM:SS` into seconds
- `[x]` Store both label and numeric value
- `[x]` Sort feedback by numeric timestamp
- `[x]` Allow AM/Editor to resolve feedback
- `[x]` New revision round increments on next final upload

Definition of done:

- Multiple revision cycles work without overwriting prior history

## Phase 11 — Notifications And Email

- `[x]` In-app notifications collection
- `[x]` Bell/unread count UI
- `[x]` Email sending abstraction
- `[x]` Event wiring for:
  - script ready
  - footage ready
  - final uploaded
  - approved
  - revision requested
  - client feedback submitted
  - delivered

For local development:

- Use Resend only if API key is available
- Otherwise allow a console/dev transport mode so the app remains testable

Definition of done:

- Important workflow events create a notification record
- Email sending failure does not break the main transaction

## Phase 12 — Security And QA

- `[x]` Audit all collection access rules
- `[x]` Audit route handlers for project scoping
- `[x]` Confirm no client can read internal notes
- `[x]` Confirm no client can access other clients' files
- `[x]` Add input sanitization for user-entered text
- `[x]` Add rate limiting on auth endpoints
- `[ ]` Add end-to-end happy path test
- `[ ]` Add revision loop regression test
- `[ ]` Add invite expiry test
- `[ ]` Add client scoping test

Definition of done:

- Core data isolation and approval rules are covered by tests

## Recommended File And Module Layout

```text
src/
  app/
    (frontend routes)
  collections/
    Users.ts
    Workspaces.ts
    Clients.ts
    Projects.ts
    Scripts.ts
    ScriptRows.ts
    Assets.ts
    Feedback.ts
    Notifications.ts
    Invites.ts
  lib/
    access/
      projects.ts
      assets.ts
      scripts.ts
    workflows/
      projectStatus.ts
      notifications.ts
      revisions.ts
    storage/
      index.ts
      local.ts
      r2.ts
    auth/
      invites.ts
    utils/
      timestamps.ts
      roles.ts
```

## First Real Implementation Sequence

Build in this order:

1. Foundation
2. Collections
3. Access control
4. Auth and invites
5. Project/client management UI
6. Smart Script
7. Uploads
8. Workflow engine
9. Approval gate
10. Feedback and notifications
11. Security pass

## What To Ignore For Now

Do not build in the first pass:

- Cloudflare R2 integration
- Signed URLs
- Google Drive integration
- ZIP download packaging
- PDF script export
- Docker and deployment automation
- Real-time collaboration

## Practical Next Step

The best next move is Milestone 0 plus the normalized data model:

- scaffold the Next.js + Payload app
- split `payload_schema.ts` into real collection files
- add the `projects.clientUser` fix now
- set storage provider default to `local`
- wire the access layer before any frontend CRUD

That order avoids rebuilding access rules later.
