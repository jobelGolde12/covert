# Test Scope

## In scope

### Application under test
- **Product**: Convert — document conversion service (browser-first converter with a LibreOffice-backed server pipeline).
- **Stack (production profile)**: Next.js 14.2.28 (App Router), React 18.3.1, TypeScript (strict), Tailwind CSS 3.4.13, Prisma 5.22 / SQLite (prod: Turso), Redis 7.0.15 + BullMQ 5.34, ioredis, zod 3.23, @tanstack/react-query 5.59, zustand 4.5, pdf-lib 1.17, pdfjs-dist 4.7.76, react-dropzone 14.3.5.
- **Environment tested**: local dev server (`http://localhost:3000`, `next dev`), real LibreOffice 24.2.7.2, real Redis on `127.0.0.1:6379`, SQLite `prisma/dev.db`, office worker concurrency 1, sweeper interval 15 min.

### Routes under test (all `http://localhost:3000/api/v1`)
| Route | Methods | Purpose |
|---|---|---|
| `/formats` | GET | Conversion catalogue (cacheable 24 h) |
| `/files/upload` | POST | Validate + create File row, return presigned PUT URL |
| `/files/upload/put` | PUT | Stream body to storage (HMAC token) |
| `/files/upload/complete` | POST | Verify object exists, mark `ready` |
| `/files/[id]` | GET, DELETE | Metadata + 60 s download URL; immediate deletion |
| `/files/download` | GET | Serve stored object (HMAC token, 60 s) |
| `/jobs` | POST, GET | Create+enqueue job; paged list |
| `/jobs/[id]` | GET | Job + task status, output download URLs |
| `/jobs/[id]/cancel` | POST | Cancel queued/processing job |
| `/jobs/[id]/events` | GET | SSE stream (job state, heartbeat) |

### Web pages under test
- `/` (home: hero, privacy claims, conversion catalogue grid)
- `/convert` (dropzone → format picker → options → convert → session queue)

### Supporting code reviewed
- `lib/api.ts`, `lib/env.ts`, `lib/rate-limit.ts`, `lib/storage/index.ts`, `lib/queue.ts`, `lib/jobs.ts`, `lib/retention.ts`, `lib/conversions.ts`, `lib/office.ts`, `lib/id.ts`, `lib/db.ts`
- `workers/office/index.ts`, `workers/sweeper/sweep.ts`
- `prisma/schema.prisma` + migration `20260816103701_init`
- `components/convert/*`, `components/home/*`, `components/ui/*`, `components/Header.tsx`, `app/layout.tsx`, `next.config.mjs`

### Verification gates
- `CI=true pnpm test` (35 tests), `lint`, `typecheck`, `build`
- Browser Core Web Vitals (LCP/CLS/FCP/TTFB)

## Out of scope (this run)

- **Cloud R2 / production storage path** — `R2StorageAdapter` is exercised only by source inspection; all runtime tests use the local filesystem adapter (R2 env vars are commented out in `.env.example`).
- **Paid/authenticated features** — no `User`, `ApiKey`, or paid-tier flows exist in the MVP codebase yet; retention tiers beyond anonymous (`RETENTION_ANON_HOURS=1`) were not runtime-tested.
- **Load / soak testing** beyond the concurrency probe (20 parallel uploads) and rate-limit burst (61 requests).
- **Visual pixel QA** — the reviewing model cannot view screenshots; responsive review is structural + behavioral (DOM/accessibility tree, viewport emulation, interaction tests).
- **`.env` contents** — explicitly out of scope by policy (see `strategy.md` §3).

## Environment inventory (captured 2026-08-16)

| Component | Version / value | Status |
|---|---|---|
| Node.js | v22.23.1 | ✓ |
| pnpm | 11.20.0 | ✓ |
| LibreOffice | 24.2.7.2 (`soffice` on PATH) | ✓ |
| Redis | 7.0.15, `127.0.0.1:6379` (PONG) | ✓ |
| SQLite | `prisma/dev.db` (migrated) | ✓ |
| Dev server | `:3000` HTTP 200 on `/`, `/convert` | ✓ |
| Office worker | running, concurrency 1 | ✓ |
| Sweeper | running, 15 min interval | ✓ |

### Configuration under test (from `.env.example`, not `.env`)
- `ANON_CONVERSIONS_PER_DAY=5`, `ANON_REQ_PER_MIN=60`
- `RETENTION_ANON_HOURS=1`, `RETENTION_FREE_HOURS=24`, `RETENTION_PAID_HOURS=168`
- `UPLOAD_SECRET` (no default documented in `.env.example`; code fallback exists — see `03_Security_Audit/vulnerability_assessment.md` §SEC-03)
- Storage: local adapter (keys `files/<id>/<id>.<ext>`), 1 GB hard cap on PUT
