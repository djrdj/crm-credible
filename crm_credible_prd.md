# CRM Credible
## Product Requirements Document (PRD)
**Version:** 1.0
**Status:** Draft
**Last Updated:** 2026-05-11
**Owner:** [Your Name / PO]
**Team:** [Dev Team Names]

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [User Roles & Permissions (RBAC)](#3-user-roles--permissions-rbac)
4. [Database Design](#4-database-design)
5. [Core Feature: Smart Script](#5-core-feature-smart-script)
6. [Workflow & State Machine](#6-workflow--state-machine)
7. [File Hierarchy & Storage](#7-file-hierarchy--storage)
8. [Notifications](#8-notifications)
9. [API Endpoints Overview](#9-api-endpoints-overview)
10. [Open Questions](#10-open-questions)

---

## 1. Project Overview

### 1.1 Summary
**CRM Credible** (working title: *ScriptSync*) is an end-to-end content collaboration platform that centralizes video production workflows. It connects clients, scriptwriters, editors, and account managers through a structured, role-aware interface built around a living document called the **Smart Script**.

### 1.2 Problem Statement
Video production teams currently rely on scattered tools — email threads, shared Google Drive folders with unclear naming conventions, and manual follow-up — to coordinate between clients and internal staff. This creates:
- Version confusion and lost footage
- Internal notes accidentally exposed to clients
- No clear audit trail of approvals or revisions
- Hours of manual logistics per project

### 1.3 Solution
A centralized platform where every project has a Smart Script that serves as the single source of truth — mapping each script segment directly to its raw footage slot, editor note, and final output, while enforcing role-based visibility at every layer.

### 1.4 Goals
| Goal | Metric |
|------|--------|
| Eliminate "Drive Chaos" | 0 mismatched clips per project |
| Reduce manager follow-up time | < 10 min/project on logistics |
| Enforce internal/external visibility | 100% of editor notes hidden from clients |
| Automate approval notifications | Email triggered within 60s of approval action |

### 1.5 Out of Scope (v1)
- Video editing inside the platform (no in-browser editor)
- Real-time collaboration / live co-editing of scripts
- Billing / payment processing (platform is free, no subscription tiers)
- Mobile native app
- Multi-role users (one role per user, strictly enforced)

---

## 2. Tech Stack

### 2.1 Recommended CMS / Backend
After evaluating Strapi, Payload CMS, and Directus, the recommendation per role:

| CMS | Strengths | Best Fit For |
|-----|-----------|--------------|
| **Payload CMS** | TypeScript-first, code-defined schema, fine-grained access control hooks, built-in auth | **Recommended for CRM Credible** — RBAC complexity and custom field-level visibility make code-defined config preferable over UI-driven |
| Strapi | Great UI, plugin ecosystem, faster prototyping | Simpler content-heavy apps; RBAC is less granular |
| Directus | SQL-first, strong permissions system, good for data-heavy admin | Good alternative if team prefers SQL-native config |

> **Decision required:** Confirm Payload CMS as the primary backend, or choose an alternative. See [Section 10](#10-open-questions).

### 2.2 Full Stack
| Layer | Technology |
|-------|------------|
| Backend / CMS | Payload CMS (Node.js + TypeScript) |
| Database | PostgreSQL |
| Frontend | Next.js (App Router) |
| Auth | Payload built-in JWT + refresh tokens |
| File Storage | S3-compatible (AWS S3, Cloudflare R2, or Backblaze B2) |
| Cloud Integration (optional) | Google Drive API / Mega SDK |
| Email Notifications | Resend or SendGrid (via Payload hooks) |
| Deployment | Railway / Render / VPS (Docker) |
| MCP Integration | Payload MCP server for AI-assisted tooling |

---

## 3. User Roles & Permissions (RBAC)

### 3.1 Role Definitions
| Role | Scope | Key Responsibility |
|------|-------|--------------------|
| **Product Owner (PO)** | Global | Creates/manages workspaces, invites users, manages subscriptions |
| **Account Manager (AM)** | Workspace | Client communication, final approval gate before client sees output |
| **Scriptwriter** | Project | Creates and edits Smart Scripts, writes editor notes |
| **Editor** | Project | Downloads raw footage, uploads final video cuts |
| **Client** | Project (own only) | Records footage, uploads clips, reviews final approved videos, leaves timestamped feedback |

### 3.3 Scoping Rules
- **One role per user** — strictly enforced at the data model level. A user cannot hold multiple roles in the same workspace.
- **Editor project scoping** — Editors only see projects they are explicitly `assigned_editor_id` on. Cross-project asset queries are blocked at the API layer by filtering on `assigned_editor_id = current_user.id`.
- **Client project scoping** — Clients only see their own projects (filtered by `client_id` linked to their `client_user_id`).
| Action | PO | AM | Scriptwriter | Editor | Client |
|--------|----|----|-------------|--------|--------|
| Create Workspace | ✅ | ❌ | ❌ | ❌ | ❌ |
| Invite Users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Project | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create/Edit Script | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Editor Notes | ✅ | ✅ | ✅ | ✅ | ❌ |
| Upload Raw Footage | ✅ | ❌ | ❌ | ❌ | ✅ |
| Download Raw Footage | ✅ | ✅ | ❌ | ✅ | ❌ |
| Upload Final Video | ✅ | ❌ | ❌ | ✅ | ❌ |
| Approve Final Video | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Final Video | ✅ | ✅ | ✅ | ✅ | ✅ (post-approval only) |
| Leave Timestamped Feedback | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage Subscriptions | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Database Design

### 4.1 Entity Overview
The database is organized around 7 core entities:

```
Users → Workspaces → Clients → Projects → Scripts → ScriptRows → Assets
```

### 4.2 Entity Definitions

#### `users`
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| name | String | |
| email | String | Unique |
| password_hash | String | |
| role | Enum | PO, AM, Scriptwriter, Editor, Client |
| workspace_id | FK → workspaces | Null for PO |
| created_at | Timestamp | |

#### `workspaces`
Represents a "server" — the top-level organizational unit, typically one per production company or brand.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| name | String | |
| owner_id | FK → users | PO who created it |
| subscription_tier | Enum | ~~free, pro, enterprise~~ — **not used, platform is free** |
| storage_limit_gb | Integer | Platform-wide default (e.g. 50GB per workspace) |
| created_at | Timestamp | |

#### `clients`
A client entity separate from users — represents the business/individual being served.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| workspace_id | FK → workspaces | |
| name | String | |
| company | String | Optional |
| client_user_id | FK → users | The user account for this client |
| created_at | Timestamp | |

#### `projects`
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| workspace_id | FK → workspaces | |
| client_id | FK → clients | |
| name | String | |
| status | Enum | drafting, recording, editing, review, approved, in_revision, delivered |
| assigned_am_id | FK → users | Account Manager |
| assigned_editor_id | FK → users | |
| assigned_writer_id | FK → users | |
| due_date | Date | Optional |
| created_at | Timestamp | |
| updated_at | Timestamp | |

#### `scripts`
One script per project (extendable to multiple versions later).

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| project_id | FK → projects | |
| title | String | |
| version | Integer | Starts at 1, increments on revision |
| created_by | FK → users | Scriptwriter |
| created_at | Timestamp | |
| updated_at | Timestamp | |

#### `script_rows`
Each row is one segment/scene in the script. This is the core of the Smart Script.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| script_id | FK → scripts | |
| order_index | Integer | For manual reordering |
| action_instruction | Text | Visible to all — what the client must do |
| script_text | Text | Visible to all — lines the client must say |
| editor_note | Text | **Internal only** — hidden from Client role |
| upload_slot_status | Enum | empty, uploaded, reviewed |
| created_at | Timestamp | |

#### `assets`
Handles all file uploads: raw footage, final videos, and other attachments.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| project_id | FK → projects | |
| script_row_id | FK → script_rows | Null for project-level assets |
| uploaded_by | FK → users | |
| asset_type | Enum | raw_clip, final_video, attachment |
| file_name | String | |
| file_url | String | S3/CDN URL |
| storage_provider | Enum | s3, gdrive, mega, local |
| external_file_id | String | For Google Drive / Mega references |
| file_size_mb | Float | |
| mime_type | String | |
| sequence_index | Integer | For bulk upload auto-mapping |
| created_at | Timestamp | |

#### `feedback`
Timestamped feedback left by the client on a final video. Each revision cycle creates new asset records — previous final videos are retained for history.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| project_id | FK → projects | |
| asset_id | FK → assets | The specific final video version being reviewed |
| submitted_by | FK → users | Client only |
| timestamp_label | String | Human-readable e.g. "03:34" — stored as entered |
| timestamp_seconds | Integer | Parsed integer for sorting (e.g. 214) |
| comment | Text | |
| status | Enum | open, resolved |
| revision_round | Integer | Increments each cycle (1, 2, 3…) — unlimited |
| created_at | Timestamp | |

#### `notifications`
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| user_id | FK → users | Recipient |
| project_id | FK → projects | Context |
| type | Enum | script_ready, footage_uploaded, video_approved, revision_requested, general |
| message | Text | |
| is_read | Boolean | |
| created_at | Timestamp | |

### 4.3 Key Relationships Diagram (Text)
```
Workspace
 └── Clients
 └── Projects
      ├── Script
      │    └── ScriptRows (n)
      │         └── Assets (raw_clips per row)
      ├── Assets (final_video at project level)
      ├── Feedback (timestamped, on final video)
      └── Notifications (triggered by status changes)
```

---

## 5. Core Feature: Smart Script

### 5.1 Column Definitions
| Column | Visible To | Description |
|--------|-----------|-------------|
| # | Everyone | Row number / sequence index |
| Action / Instruction | Everyone | What the client physically needs to do (e.g., "Stand facing camera — profile shot") |
| Script Text | Everyone | The exact lines or talking points for that segment |
| Upload Slot | Everyone | A per-row file upload button; shows status (empty / uploaded / reviewed) |
| Editor Notes | Internal Only (PO, AM, Writer, Editor) | Private instructions to the editor (e.g., "Cut to mountain B-roll at 0:04") |

### 5.2 Visibility Enforcement
Field-level visibility must be enforced at the **API layer**, not just the frontend. When a Client role fetches a script, the `editor_note` field must be stripped server-side before the response is returned.

### 5.3 Bulk Upload Logic
- Client can upload multiple files at once via a bulk upload interface.
- **Auto-mapping strategy (in priority order):**
  1. **Default order:** Map files to script rows by the order the client selects/drops them.
  2. **Sorted filename fallback:** If order is ambiguous or client triggers "auto-sort," files are sorted alphanumerically by filename and mapped sequentially to `order_index`.
  3. **Manual fallback:** If mapping still looks wrong, client is shown a drag-to-assign UI to correct before confirming.
- Each clip is linked to its `script_row_id` in the `assets` table upon confirmation.

### 5.4 Partial Upload & AM Override
- If not all script row slots are filled, the project remains in `recording` status.
- The **AM can manually advance** the project to `editing` at any time (e.g., client can only deliver partial footage).
- The Editor can begin working on whatever footage is available — they are not blocked by empty slots.
- Empty slots are clearly flagged in the UI as "Missing" for the Editor's awareness.

---

## 6. Workflow & State Machine

### 6.1 Project Statuses
```
drafting → recording → editing → review → approved → delivered
                                     ↑           ↓
                                 in_revision ←←←←
```

### 6.2 Transitions & Triggers
| From | To | Triggered By | Side Effects |
|------|----|-------------|--------------|
| — | `drafting` | AM/PO creates project | — |
| `drafting` | `recording` | Scriptwriter marks script complete | Email to Client: "Your script is ready" |
| `recording` | `editing` | All upload slots filled **OR AM manually advances** | Notification to Editor: "Footage ready to download" |
| `editing` | `review` | Editor uploads final video | Notification to AM: "Video ready for review" |
| `review` | `approved` | AM clicks "Approve" | Email to Client: final video unlocked on dashboard |
| `review` | `in_revision` | AM sends back to editor | Notification to Editor: "Changes requested" |
| `approved` | `in_revision` | Client submits timestamped feedback | Email to Editor + AM: "Client requested revision"; `revision_round` increments |
| `in_revision` | `editing` | Editor picks up revision | New asset record created for new final video version |
| `approved` | `delivered` | AM/PO marks delivered | Optional: delivery confirmation email to client |

> **Revision policy:** Unlimited revision cycles. Each round creates a new `asset` record (type: `final_video`) with an incremented `revision_round`. Previous versions are preserved for audit history.

### 6.3 The "Approval Gate"
This is a critical business rule: **the final video is never visible to the Client until the AM explicitly approves it.** The `asset.is_approved` flag (or project status `approved`) gates the client-facing API query. Even if the client guesses the asset URL, direct S3 links must be signed/temporary (pre-signed URLs with expiry).

---

## 7. File Hierarchy & Storage

### 7.1 Logical Folder Structure
```
Workspace: [WorkspaceName]
 └── Client: [ClientName]
      └── Project: [ProjectName] (YYYY-MM-DD)
           ├── /scripts         ← Script exports (PDF/JSON)
           ├── /raw             ← Client uploaded footage (per row)
           │    ├── row_01_clip.mp4
           │    ├── row_02_clip.mp4
           │    └── ...
           ├── /finals          ← Editor uploaded final videos
           └── /assets          ← Miscellaneous attachments
```

### 7.2 Storage Provider
Provider is **TBD** — will be confirmed later. Must be S3-compatible with a usable free tier. Top candidate is **Cloudflare R2** (10GB free storage, zero egress fees). All storage logic will be abstracted behind a single storage service interface so the provider can be swapped without touching business logic.

**Google Drive integration is included in v1** as an optional link/sync layer on top of the primary storage.

### 7.3 File Access Security
- All asset URLs are **pre-signed S3 URLs** with a 1-hour expiry.
- No public bucket access — all reads go through the API which checks role permissions before generating a signed URL.
- Editor Notes attachments follow the same access control as the `editor_note` field.

---

## 8. Notifications

### 8.1 Notification Types
| Event | In-App | Email | Recipients |
|-------|--------|-------|------------|
| Script marked ready | ✅ | ✅ | Client |
| All footage uploaded | ✅ | ✅ | Editor, AM |
| Final video uploaded | ✅ | ✅ | AM |
| Video approved | ✅ | ✅ | Client |
| Revision requested (AM→Editor) | ✅ | ✅ | Editor |
| Timestamped feedback submitted | ✅ | ✅ | Editor, AM |
| Project delivered | ✅ | ✅ | Client |

### 8.2 Email Provider
Use **Resend** (recommended) or SendGrid. Payload CMS hooks fire on collection `afterChange` events to trigger emails.

---

## 9. API Endpoints Overview

### Projects
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/projects` | PO, AM (own workspace) |
| GET | `/api/projects/:id` | All roles (own project) |
| POST | `/api/projects` | PO, AM |
| PATCH | `/api/projects/:id/status` | Role-gated per transition |

### Scripts & Rows
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/scripts/:id` | All roles (editor_note stripped for Client) |
| POST | `/api/scripts` | Scriptwriter, AM, PO |
| PATCH | `/api/script-rows/:id` | Scriptwriter, AM, PO |
| POST | `/api/script-rows/:id/upload` | Client |

### Assets
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/assets/bulk-upload` | Client |
| GET | `/api/assets/:id/signed-url` | Role-gated |
| POST | `/api/assets/final` | Editor |

### Feedback
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/feedback` | Client (approved projects only) |
| GET | `/api/feedback/:projectId` | PO, AM, Editor |
| PATCH | `/api/feedback/:id/resolve` | Editor, AM |

---

## 10. Decisions Log

All questions resolved. No open blockers.

| # | Question | Decision |
|---|----------|----------|
| 1 | CMS choice | ✅ **Payload CMS** |
| 2 | Storage provider | ✅ **TBD — free tier S3-compatible** (Cloudflare R2 free tier recommended; provider confirmed later) |
| 3 | Google Drive integration | ✅ **v1** |
| 4 | Multi-script per project | ✅ **One script per project** |
| 5 | Client signup flow | ✅ **Invite-only** — AM/PO sends invite, no self-registration |
| 6 | Asset deletion policy | ✅ **Soft delete / archive** — files are never permanently wiped on project delete |
| 7 | Subscription/billing | ✅ **Not needed — platform is free** |
| 8 | Feedback scope | ✅ **Final video only** — timestamped comments on the final cut |
| 9 | Script PDF export | ✅ **Out of scope for v1** |
| 10 | Deployment | ✅ **Self-hosted** (Docker on VPS) |

---

*End of Document — v1.0 Final*
*Status: ✅ All decisions locked. Ready for Technical Architecture & Sprint Planning.*
