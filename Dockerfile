# Debian (glibc), not Alpine: the server's own glibc is too old for the
# prebuilt @next/swc-linux-x64-gnu binary ("GLIBC_2.29 not found"), and the
# musl fallback doesn't run on a glibc host either ("invalid ELF header").
# Building and running inside this image sidesteps that entirely — every
# stage has its own matching, modern glibc, native SWC works, and the host's
# glibc version stops mattering.
FROM node:22-bookworm-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, and
# MEYDAN_API_BASE_URL is read by next.config.ts (image remotePatterns) while
# `next build` runs — all three must be available now, not just at `docker run`.
ARG MEYDAN_API_BASE_URL
ARG NEXT_PUBLIC_MEYDAN_API_BASE_URL
ARG NEXT_PUBLIC_SITE_URL
ENV MEYDAN_API_BASE_URL=$MEYDAN_API_BASE_URL \
    NEXT_PUBLIC_MEYDAN_API_BASE_URL=$NEXT_PUBLIC_MEYDAN_API_BASE_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

# `output: "standalone"` (next.config.ts) traces only the modules the server
# actually needs, so this is the entire runtime image — no node_modules copy.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
