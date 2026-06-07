FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Railway injects service variables into the build environment automatically.
# Do NOT use ARG→ENV here — empty ARG overwrites Railway's build env and breaks client auth.
RUN test -n "$NEXT_PUBLIC_SUPABASE_URL" || (echo "ERROR: NEXT_PUBLIC_SUPABASE_URL missing — set in Railway Variables and redeploy" && exit 1)
RUN test -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" || (echo "ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY missing — set in Railway Variables and redeploy" && exit 1)

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
