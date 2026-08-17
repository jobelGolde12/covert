# Folio — Technical Specifications

> **Product:** Folio — document conversion platform.
> This document is the authoritative reference for the technology stack: versions, dependencies, configuration, and environment variables. It pairs with `architecture.md` (system design), `database-schema.md` (schema), and `deployment.md` (environments).

---

## 1. Stack Summary

| Layer | Technology | Version (pinned) | Notes |
|---|---|---|---|
| Framework | Next.js (App Router) | 14.2.x | Server components by default; API routes in `app/api/v1/**` |
| Language | TypeScript | 5.5.x | `strict: true`, `noUncheckedIndexedAccess` |
| Styling | Tailwind CSS | 3.4.x | Tokens from `design.md` (see §6) |
| Upload UI | react-dropzone | 14.x | Drag-and-drop + paste + file picker |
| State | Zustand | 4.5.x | Convert queue, UI state |
| Data fetching | TanStack Query | 5.x | Server state, caching, retries |
| PWA | next-pwa / Workbox | 5.6.x | Offline queue, app shell |
| Workers | Web Workers + Comlink | 4.x | Client-side processing |
| ORM | Prisma | 5.22.x | `@prisma/adapter-libsql` |
| Database | Turso (libSQL/SQLite) | libsql 0.4.x | WAL mode |
| Queue | BullMQ | 5.x | Redis-backed; typed jobs |
| Cache/rate-limit | Redis (Upstash) | 7.x | Also pub/sub for WS |
| Office engine | LibreOffice (headless) | 7.6.x (pinned) | `soffice --headless` |
| PDF ops | pdf-lib | 1.17.x | Merge/split/rotate/watermark/compress |
| PDF parse/render | PDF.js | 4.x | pdf→text/image/markdown |
| Images | Sharp | 0.33.x | Image→PDF, thumbnails, HEIC |
| OCR | Tesseract.js + `tesseract` CLI | 5.x | Server worker uses native binary |
| HTML→PDF | Puppeteer | 22.x | HTML/Markdown→PDF |
| DOCX→HTML | mammoth.js | 1.8.x | Word→HTML previews |
| DOCX preview | docx-preview | 0.3.x | Client-side rendering |
| Auth | NextAuth.js (Auth.js) | 5.x | OAuth + JWT sessions |
| Payments | Stripe | 15.x | Subscriptions + metered credits |
| Email | Resend | 3.x | Magic links, receipts |
| Observability | Sentry + OpenTelemetry | latest | Errors + traces/metrics |
| Container | Docker | 24+ | Worker images |
| CI/CD | GitHub Actions | — | Lint → test → build → migrate → deploy |
| Hosting | Vercel (app/API) + Fly.io (workers) | — | See `deployment.md` |
| Storage | Cloudflare R2 | — | S3-compatible, zero egress |
| CDN | Cloudflare | — | Cache, WAF, DDoS |

**Engine/version policy:** every engine is **pinned** (LibreOffice, Puppeteer/Chromium, Tesseract). Engine upgrades are opt-in per job via `engineVersion` and rolled out canary-first — a regression in an engine upgrade must never silently change output for all users (see `plan/risk-assessment.md`).

---

## 2. Repository Structure

```text
folio/
├── app/
│   ├── (marketing)/          # Landing page — design.md implementation
│   │   ├── page.tsx          # Hero, categories, brand story, showcase, CTA
│   ├── (app)/
│   │   ├── convert/          # Converter workspace
│   │   ├── history/          # Conversion history
│   │   ├── settings/         # Profile, API keys, webhooks
│   ├── api/v1/               # REST API (route handlers)
│   │   ├── jobs/route.ts
│   │   ├── files/route.ts
│   │   ├── formats/route.ts
│   │   └── ...
│   └── ws/route.ts           # WebSocket gateway (custom server)
├── components/               # design.md component map (§35)
├── lib/
│   ├── conversions.ts        # Conversion catalog (source of truth)
│   ├── engines/              # Worker engine adapters (lo.ts, puppeteer.ts, tesseract.ts, sharp.ts)
│   ├── queue/                # BullMQ queues, worker bootstrap
│   ├── rate-limit.ts         # Redis sliding window
│   ├── r2.ts                 # Presigned URL helpers
│   └── auth.ts               # NextAuth config + guards
├── workers/                  # Separate worker entrypoints (deployed as own image)
│   ├── office/               # LibreOffice worker (Docker)
│   ├── html/                 # Puppeteer worker
│   ├── ocr/                  # Tesseract worker
│   └── sweeper/              # Retention + webhook retry cron
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/                   # Images (WebP/AVIF), fonts, manifest.json
└── documentation/ · plan/    # This documentation set
```

**Monorepo:** `npm workspaces` with `apps/web`, `packages/sdk`, `packages/client` (browser converter), `packages/config` (shared tsconfig/eslint). Workers live in `apps/workers`.

---

## 3. Dependencies (package.json, abridged)

```jsonc
{
  "dependencies": {
    "next": "14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "typescript": "^5.5.4",
    "tailwindcss": "^3.4.10",
    "react-dropzone": "^14.2.9",
    "zustand": "^4.5.5",
    "@tanstack/react-query": "^5.51.0",
    "@prisma/client": "^5.22.0",
    "@prisma/adapter-libsql": "^5.22.0",
    "bullmq": "^5.12.0",
    "ioredis": "^5.4.1",
    "pdf-lib": "^1.17.1",
    "pdfjs-dist": "^4.7.76",
    "sharp": "^0.33.4",
    "mammoth": "^1.8.0",
    "docx-preview": "^0.3.2",
    "next-auth": "5.0.0-beta.20",
    "stripe": "^15.12.0",
    "zod": "^3.23.8",
    "comlink": "^4.4.1",
    "pino": "^9.3.0"        // structured logging
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "@playwright/test": "^1.45.0",
    "eslint": "^8.57.0",
    "prettier": "^3.3.3",
    "prisma": "^5.22.0",
    "puppeteer": "^22.15.0",
    "typescript-eslint": "^8.0.0"
  }
}
```

**Browser-side heavy packages (pdf-lib, pdfjs-dist) are dynamically imported inside Web Workers** so the marketing bundle stays lean (see `documentation/performance.md` §Bundle budget).

---

## 4. Configuration Files

### 4.1 `next.config.mjs` (abridged)

```js
const nextConfig = {
  experimental: { typedRoutes: true },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "**.r2.cloudflarestorage.com" }],
  },
  headers: async () => [
    // Security headers — see documentation/security.md §Headers
    { source: "/:path*", headers: [
      { key: "Content-Security-Policy", value: CSP },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ]},
  ],
  webpack: (cfg) => {
    cfg.externals.push({ "sharp": "commonjs sharp" }); // native binding stays server-side
    return cfg;
  },
};
```

### 4.2 Worker Dockerfile (LibreOffice worker, abridged)

```dockerfile
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-core libreoffice-writer libreoffice-calc libreoffice-impress \
    libreoffice-draw fonts-liberation fonts-dejavu fonts-noto-color-emoji \
    ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*
# Fonts matter: missing fonts are the #1 source of layout regressions (see troubleshooting)
WORKDIR /app
COPY --from=builder /app/dist ./dist
ENV LO_CONCURRENCY=1 \
    LO_PROFILE_ROOT=/tmp/lo-profiles \
    NODE_ENV=production
CMD ["node", "dist/workers/office/index.js"]
```

### 4.3 `docker-compose.yml` (local dev)

```yaml
services:
  redis:        { image: redis:7-alpine, ports: ["6379:6379"] }
  turso:        { image: ghcr.io/tursodatabase/libsql-server:latest, ports: ["8080:8080"], command: ["--db-path", "/data/folio.db"] }
  worker-office: { build: { context: . }, command: ["node", "dist/workers/office/index.js"] }
  worker-html:  { build: { context: . }, command: ["node", "dist/workers/html/index.js"] }
  minio:        { image: minio/minio, ports: ["9000:9000"], command: ["server", "/data"] }  # R2 stand-in
  web:          { build: ., ports: ["3000:3000"], environment: { DATABASE_URL: "...", REDIS_URL: "redis://redis:6379", S3_ENDPOINT: "http://minio:9000" } }
```

---

## 5. Environment Variables

### 5.1 Web / API (Vercel)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | ✅ | Canonical public origin (`https://folio.app`) |
| `NEXT_PUBLIC_WS_URL` | ✅ | WebSocket origin (`wss://api.folio.app/v1/ws`) |
| `NEXTAUTH_SECRET` | ✅ | ≥32 random bytes; signs sessions/CSRF |
| `NEXTAUTH_URL` | ✅ | Auth origin |
| `DATABASE_URL` | ✅ | Turso primary URL (`libsql://...turso.io`) |
| `TURSO_AUTH_TOKEN` | ✅ | Turso scoped token (read-write for API) |
| `REDIS_URL` | ✅ | Upstash REST/`ioredis` URL |
| `R2_ACCOUNT_ID` | ✅ | Cloudflare account id |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | ✅ | S3 API credentials (least-privilege, bucket-scoped) |
| `R2_BUCKET` | ✅ | `folio-files` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | dev-only | Google OAuth (web sign-in) |
| `GITHUB_ID` / `GITHUB_SECRET` | dev-only | GitHub OAuth |
| `GOOGLE_DRIVE_CLIENT_ID` / `GOOGLE_DRIVE_CLIENT_SECRET` | feature-gated | Drive import |
| `DROPBOX_CLIENT_ID` / `DROPBOX_CLIENT_SECRET` | feature-gated | Dropbox import |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | feature-gated | Billing |
| `RESEND_API_KEY` | dev-only | Magic-link email |
| `SENTRY_DSN` | optional | Error tracking |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | optional | Traces → Grafana |
| `NEXT_PUBLIC_POSTHOG_KEY` | optional | Product analytics (privacy-mode) |
| `JWT_ISSUER` / `JWT_AUDIENCE` | optional | API JWT claims |

### 5.2 Worker fleet (Fly.io / ECS)

| Variable | Description |
|---|---|
| `DATABASE_URL` / `TURSO_AUTH_TOKEN` | read-only token for workers (they mostly write via Redis/R2) |
| `REDIS_URL` | Bull queue + pub/sub |
| `R2_*` (as above) | input fetch / output put |
| `LO_CONCURRENCY` | default `1` (per container) |
| `LO_PROFILE_ROOT` | isolated LibreOffice profiles dir |
| `LO_TIMEOUT_MS` | 900000 (15 min) |
| `OCR_TIMEOUT_MS` | 1800000 (30 min) |
| `PUPPETEER_LAUNCH_ARGS` | `--no-sandbox --disable-dev-shm-usage` (container) |
| `WORKER_CONCURRENCY` | Bull concurrency per process |
| `MAX_JOB_BYTES` | hard size guard per job |
| `SENTRY_DSN`, `OTEL_*` | observability |

### 5.3 Secrets management

- **Never** commit `.env*`; `.env.example` is committed with placeholders.
- Vercel: project environment variables (production/preview/dev scopes). Fly.io: `fly secrets set`.
- Rotate `NEXTAUTH_SECRET` and R2 keys via the dashboard; **API key hashes** allow instant key revocation without DB migration.
- All secrets are injected at runtime, never baked into Docker images (build args only for non-secret config like `NODE_ENV`).

---

## 6. Design Tokens (Tailwind, from design.md)

```js
// tailwind.config.ts
export default {
  theme: {
    colors: {
      background: "#FFFFFF",
      surface:    "#F7F7F5",
      foreground: "#171717",
      muted:      "#6B6B6B",
      border:     "#DCDCDC",
      accent:     "#C8102E",
      accentDark: "#9F0D24",
      dark:       "#111111",
    },
    fontFamily: { sans: ["Inter", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"] },
    spacing: { /* 4,8,12,16,24,32,48,64,80,96,120,160 (design.md §28) */ },
    borderRadius: { none: "0", sm: "2px", DEFAULT: "3px", md: "4px" },
    maxWidth: { container: "1440px" },
    keyframes: {
      "fade-up": { from: { opacity: 0, transform: "translateY(20px)" }, to: { opacity: 1, transform: "none" } },
    },
  },
  plugins: [require("tailwindcss-animate")], // 150–250ms UI / 400–700ms reveals
};
```

Fonts: **Inter**, self-hosted via `next/font` with `display: swap`, subsets `latin`, `latin-ext` (i18n), weights 400/500/600.

---

## 7. Version & Upgrade Policy

| Component | Cadence | Process |
|---|---|---|
| Next.js / React | minor updates quarterly | Canary flag `new_web_version` for 10% |
| LibreOffice | security + LTS | Engine pinning per job; canary worker pool |
| Puppeteer/Chromium | ~monthly | Version-locked image tag; regression suite on 50 sample docs |
| Tesseract | security only | Same canary pattern |
| Prisma/libSQL | minor | `prisma migrate dev` verified in staging |
| Node runtime | LTS | 22.x baseline; upgrade in staging |

**Dependency hygiene:** Renovate bot with grouped PRs, `npm audit` in CI (block on high/critical), SBOM generated per release (`cyclonedx`), Dependabot for GitHub Actions.

---

## 8. Quality Gates (CI, per PR)

1. `pnpm lint` — ESLint + typescript-eslint (strict).
2. `pnpm typecheck` — `tsc --noEmit` across workspaces.
3. `pnpm test` — Vitest unit + integration (with Minio/Redis/Turso in Docker).
4. `pnpm build` — production build; bundle-size checks fail over budget.
5. `prisma validate` + `prisma migrate diff --from-schema-datasource` (staging).
6. Playwright smoke suite on preview deployment.
7. `npm audit` — no high/critical.

Blocking failures abort the deploy (see `deployment.md` §CI/CD).

---

## 9. Known Constraints & Notes

- **Serverless cold start:** API routes never spawn engines inline (LibreOffice takes 1–3 s to start; spawning per-request would wreck latency and cost). Engines live only in workers.
- **SQLite semantics:** no cross-table transactions beyond a single DB; job creation (job + tasks) is one transaction — fine. Row locking: keep writes short; the sweeper batches deletes.
- **Sharp on serverless:** Sharp runs in workers (native bindings); the browser uses Sharp-WASM only where needed (image→PDF), otherwise pdf-lib.
- **LibreOffice profile lock:** never share a user profile between concurrent conversions; every job gets `-env:UserInstallation=file:///tmp/lo_<jobId>`.
- **Memory ceiling:** worker containers limited to 4 GB; jobs over the cap fail fast with `OUTPUT_TOO_LARGE`/`FILE_TOO_LARGE` rather than OOM-killing the pod.
- **i18n:** `next-intl` with `en`, `de`, `es`, `fr`, `pt`, `ja` at launch (catalog labels + UI); dates/numbers via `Intl`. SEO: per-locale routes `/[locale]`, hreflang, sitemaps.
