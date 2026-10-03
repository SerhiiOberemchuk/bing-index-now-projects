# Bing IndexNow Projects Platform

SaaS platform for managing client projects and submitting URLs to Bing IndexNow.

## Stack

- SvelteKit + endpoints (no separate backend)
- Better Auth (email/password)
- Neon Postgres
- Drizzle ORM + Drizzle Kit
- Vercel adapter

## Requirements

- Node.js 22.17 or newer (SvelteKit 3; `.npmrc` has `engine-strict=true`, so older Node fails at install).
  On Vercel: Project Settings → Build and Deployment → Node.js Version must be 22.x or 24.x.

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

## How it works

1. **Add site** (`/dashboard/projects/new`): name, domain and IndexNow key. The key file
   `https://<domain>/<key>.txt` must exist and contain only the key; it is checked before saving.
   The domain must match the URLs in the sitemap exactly (with or without `www`).
2. **Check**: the app reads the sitemaps listed in `robots.txt` (or `/sitemap.xml` if none are listed),
   including sitemap indexes and `.xml.gz` files, and stores the page list.
3. **Send**: pages that are new, or whose `<lastmod>` is newer than their last successful send, go to
   `https://www.bing.com/indexnow` in one request (max 10,000 URLs). A `<lastmod>` equal to the fetch
   time is ignored, because it means the sitemap generates it on every request rather than on real edits.
4. **Bing's answer**: `200`/`202` means Bing *received* the URLs, not that they are indexed. Pages Bing
   rejects stay "waiting" and are retried on the next check. Check real indexing in Bing Webmaster Tools.

All of this lives in one function, `syncProject` in `src/lib/server/indexnow/sync.ts`, used by both the
"Check sitemap and send new pages" button and the cron job.

## Pages

- `/dashboard/projects`: all sites with pages in sitemap / sent / waiting, last Bing answer and status.
- `/dashboard/projects/[projectId]`: one site: check button, last check result, auto-check schedule,
  key file and sitemaps, send history (with the URLs in each request), page list, manual send.
- `/dashboard/admin` (owner only): users, invites, audit log.

## API

- `GET /api/health` - server + database health check
- `GET /api/projects` - get projects list
- `POST /api/projects` - create project
- `POST /api/indexnow/submit` - submit URLs to Bing IndexNow
- `GET /api/cron/indexnow` - protected cron endpoint, runs `syncProject` for every due site

## Vercel Cron automation

- `vercel.json` calls `/api/cron/indexnow` every 6 hours with `Authorization: Bearer <CRON_SECRET>`.
- Each run checks the active sites whose auto-check (every 6 hours / daily / weekly) is due.
- Every check writes an `indexnow.sync` row to `audit_log`; the site page shows the latest one as "Last check".

## Useful scripts

```bash
npm run check
npm run build
npm run db:push
npm run db:studio
```




