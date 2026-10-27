# Production Dockerfile for PottyPlay
FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

USER node

# Copy pre-built application artifacts and dependencies
COPY --chown=node:node package.json package-lock.json* ./
COPY --chown=node:node public ./public
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node .next ./.next
COPY --chown=node:node node_modules ./node_modules

EXPOSE 3000

# Native Node 24 healthcheck without external curl dependencies
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "run", "start"]


