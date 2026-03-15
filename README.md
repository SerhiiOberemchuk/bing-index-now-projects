# Bing IndexNow Projects Platform

SaaS platform for managing client projects and submitting URLs to Bing IndexNow.

## Stack

- SvelteKit + endpoints (no separate backend)
- Better Auth (email/password)
- Neon Postgres
- Drizzle ORM + Drizzle Kit
- Vercel adapter

## 1) Install

```bash
npm install
```

## 2) Configure env

Copy `.env.example` to `.env` and set all required values.

```bash
cp .env.example .env
```

Required:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` (for local dev: `http://localhost:5173`)
- SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) for verification emails
- `CRON_SECRET` (for protected Vercel Cron endpoint)

## 3) Migrations

```bash
npm run db:generate
npm run db:migrate
```

## 4) Run locally

```bash
npm run dev
```

## 5) First access

1. Open `/sign-up`
2. Register owner account
3. Sign in and continue in `/dashboard`

## Dashboard flow (end-to-end)

1. Open `/dashboard/projects/new` and create a project (name, domain, IndexNow key).
2. Open `/dashboard/projects` and click `Open` on your project.
3. On project details page, paste URLs and click `Submit URLs`.
4. Review the latest records on:
   - `/dashboard/projects/[projectId]` (project timeline)
   - `/dashboard/submissions` (global log)

## API

- `GET /api/health` - server + database health check
- `GET /api/projects` - get projects list
- `POST /api/projects` - create project
- `POST /api/indexnow/submit` - submit URLs to Bing IndexNow
- `GET /api/cron/indexnow` - protected automation endpoint (sitemap sync + IndexNow for selected URLs)

## Vercel Cron automation

- `vercel.json` includes a cron job that calls `/api/cron/indexnow` every 6 hours.
- Set `CRON_SECRET` in Vercel project env variables.
- Vercel sends this token as `Authorization: Bearer <CRON_SECRET>`.
- The cron run (for projects with schedule enabled and due):
1. Discovers sitemap candidates per active project.
2. Parses sitemap files and upserts discovered URLs.
3. Submits selected URLs that were never submitted or changed after last submission.
4. Stores full Bing response in `index_now_submissions` and logs run details to `audit_log`.
5. Updates `nextRunAt` based on project schedule.


## Operational pages

- `/dashboard/projects` - project inventory with health, pending URLs, last error, schedule
- `/dashboard/projects/[projectId]` - project operations and health
- `/dashboard/projects/[projectId]/history` - unified timeline (submissions + automation + sitemap failures)
- `/dashboard/automation` - automation runs log
- `/dashboard/alerts` - active/ack/resolved incidents with quick actions
- `/dashboard/submissions` - full IndexNow response log and retry actions
## Useful scripts

```bash
npm run check
npm run build
npm run db:push
npm run db:studio
```




