# PottyPlay Deployment & Infrastructure Architecture

This document defines the deployment model, infrastructure topology, cost-conscious operations, and environment configuration for PottyPlay.

---

## 1. Cost-Conscious Architecture Philosophy

PottyPlay is designed for low operating overhead, robust availability, and studio-grade security.

- **Edge Layer (Cloudflare)**:
  - DNS management and TLS termination.
  - Global edge caching for static assets, JavaScript bundles, fonts, and SVG brand assets.
  - DDoS mitigation and Web Application Firewall (WAF) rate limiting.
- **Application Server (Node.js / Next.js)**:
  - Containerized deployment via Docker (`Dockerfile`).
  - Runs in a standard Linux container environment (Fly.io, Railway, Render, or self-hosted VPS).
  - Next.js server handles API routes, server-authoritative synchronization, and administrative workflows.
- **Database (PostgreSQL)**:
  - Managed PostgreSQL 16 (e.g. Supabase, Neon, AWS Aurora Serverless, or managed VPS).
  - Strong transactional integrity with connection pooling (PgBouncer / Prisma Accelerate).
  - Schema migrations managed via Prisma Migrate.

---

## 2. Environment Variables

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/pottyplay?schema=public` |
| `NEXT_PUBLIC_APP_URL` | Yes | Base public URL | `https://pottyplay.co.tz` |
| `AT_USERNAME` | Production | Africa's Talking SMS username | `pottyplay` |
| `AT_API_KEY` | Production | Africa's Talking API key | Secure secret |
| `AT_SENDER_ID` | Optional | Alphanumeric SMS Sender ID | `PottyPlay` |
| `AT_SIMULATOR_MODE` | No | Enables mock SMS delivery | `true` in dev/staging |
| `MAX_SESSION_DURATION_SECONDS` | No | Session timeout limit | `900` |
| `DEMO_PRICE_PER_SESSION_TZS` | No | Fallback pricing rate | `500` |

---

## 3. Health Checks & Telemetry

- **Endpoint**: `GET /api/health`
- **Response**:
```json
{
  "status": "HEALTHY",
  "database": "CONNECTED",
  "timestamp": "2026-10-27T22:00:00.000Z"
}
```

---

## 4. Secret Management and Assurance

- Production credentials, API keys, and private certificates must never be tracked in version control.
- GitHub Actions CI/CA scans every commit for secret patterns and private agent instructions before build execution.
