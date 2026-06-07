# Railway deploy — WC GEO Web (Next.js)

## Login stuck on "Please wait…"

**Cause:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` were not set during **Docker build**. Next.js bakes them into client JS at build time — runtime-only vars on Railway are too late.

**Fix:**

1. Railway → **Variables** → add (if missing):

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   NEXT_PUBLIC_APP_URL=https://your-app.up.railway.app
   ```

2. **Redeploy** (must rebuild — changing vars triggers new build).

3. Build logs must **not** show `ERROR: NEXT_PUBLIC_SUPABASE_URL missing at build`.

## Supabase Auth URLs

Supabase Dashboard → **Authentication** → **URL Configuration**:

| Field | Value | Common mistake |
|-------|--------|----------------|
| **Site URL** | `https://your-app.up.railway.app` | Do NOT use `*.supabase.co` here |
| **Redirect URLs** | `https://your-app.up.railway.app/auth/callback` | Must match exactly (add `http://localhost:3000/auth/callback` for local) |

Also add wildcard for previews if needed: `https://your-app.up.railway.app/**`

### `NEXT_PUBLIC_SUPABASE_URL` format

Must be **only** the project root — no path suffix:

```env
# Correct
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co

# Wrong — causes "Invalid path specified in request URL"
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co/
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co/auth/v1
NEXT_PUBLIC_SUPABASE_URL=https://your-app.up.railway.app
```

Find the correct value in Supabase → **Project Settings** → **API** → **Project URL**.

## Server-only variables (runtime OK)

These do **not** need to be present at build:

```env
SUPABASE_SERVICE_ROLE_KEY=...
OPS_API_BASE_URL=https://wc-geo-ops-production.up.railway.app
OPS_API_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

## Networking

Railway sets `$PORT` automatically. Dockerfile uses `node server.js` (Next standalone on port 3000). Match **Networking → Port** to what the app listens on (usually **3000** for this Dockerfile, not 8080).

## Verify

```bash
curl https://your-app.up.railway.app/api/health
```

After login, browser Network tab should show `POST` to `https://xxxx.supabase.co/auth/v1/token` returning **200**.
