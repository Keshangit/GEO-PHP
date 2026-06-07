# WC GEO Web — Next.js Dashboard

GEO Audit SaaS product layer for [Web Consulting Agency](https://webconsulting.ie).

- **Frontend:** Next.js App Router + Supabase Auth
- **Engine:** [wc-geo-ops](https://wc-geo-ops-production.up.railway.app) on Railway
- **Database:** Supabase PostgreSQL
- **Deploy:** Railway (`Dockerfile` + `railway.toml`)

## Quick start

```bash
cp .env.local.example .env.local
# Fill in Supabase + OPS_API_KEY

npm install
npm run dev
```

Apply migrations via Supabase CLI or SQL editor (`supabase/migrations/`).

Create Storage bucket `reports` (see `003_storage_reports.sql`).

## Routes

| Route | Description |
|-------|-------------|
| `/` | Marketing landing |
| `/login`, `/signup` | Auth |
| `/dashboard` | Audit history |
| `/scan` | Free quick scan |
| `/audits/[id]` | Results + upsell + full report |

## Railway deploy

1. Connect repo to Railway as a new web service
2. Set env vars from `.env.local.example`
3. Custom domain: `app.webconsulting.ie`
4. Stripe webhook: `https://app.webconsulting.ie/api/webhooks/stripe`

## API (BFF)

- `GET /api/health` — Railway healthcheck
- `GET /api/user/status` — Cooldown + unlocked domains
- `POST /api/audits/quick` — Free scan (48h cooldown)
- `POST /api/audits/checkout` — Stripe €9 unlock
- `POST /api/webhooks/stripe` — Payment → full audit
- `GET /api/audits/[id]` — Audit detail + job sync
- `GET /api/audits/[id]/report` — PDF signed URL
