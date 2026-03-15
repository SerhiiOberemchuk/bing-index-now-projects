# Bing IndexNow Projects Platform

SaaS platform for managing client projects and submitting URLs to Bing IndexNow.

## Stack

- SvelteKit + endpoints (no separate backend)
- Neon Postgres
- Drizzle ORM + Drizzle Kit
- Vercel adapter

## 1) Install

```bash
npm install
```

## 2) Configure env

Copy `.env.example` to `.env` and set `DATABASE_URL`.

```bash
cp .env.example .env
```

## 3) Migrations

```bash
npm run db:generate
npm run db:migrate
```

## 4) Run locally

```bash
npm run dev
```

## API (MVP)

- `GET /api/health` - server + database health check
- `GET /api/projects` - get projects list
- `POST /api/projects` - create project
- `POST /api/indexnow/submit` - submit URLs to Bing IndexNow

## Useful scripts

```bash
npm run check
npm run build
npm run db:push
npm run db:studio
```
