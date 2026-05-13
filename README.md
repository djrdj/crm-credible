# CRM Credible

Local-first scaffold for a Payload CMS + Next.js + PostgreSQL workflow app.

## Included

- Next.js app shell
- Payload config
- Core collection modules
- Access helper stubs
- Workflow helper stubs
- Local media storage setup
- Client scoping fix via `projects.clientUser`

## Local setup

1. Copy `.env.example` to `.env`
2. Create a PostgreSQL database named `crm_credible`
3. Install dependencies
4. Run the app

Example commands:

```bash
cp .env.example .env
npm install
npm run dev
```

## Notes

- Dependency versions are set to `latest` because package registry lookup was unavailable during scaffolding.
- Cloud storage is intentionally deferred; local disk is the active storage path for now.
- Notification and workflow side effects are stubbed and ready to be implemented in the next pass.
