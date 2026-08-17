# Folio

**Document conversion with style and substance.** A browser-first document converter supporting 25 conversions between Word, PDF, PowerPoint, Excel, images, HTML, Markdown and text — plus PDF utilities (merge, split, rotate, watermark, compress) that run **entirely on your device**.

This repository is the working implementation of the documentation set in [`documentation/`](documentation/) and the roadmap in [`plan/`](plan/). The UI implements the design system in [`design.md`](design.md) (premium editorial, restrained black/white/red palette, Inter typography).

---

## What's implemented (MVP — Phases 1 of the roadmap)

| Area | Status |
|---|---|
| Landing page per `design.md` (single art-directed hero visual, editorial conversion directory, brand story, CTA, footer) | ✅ |
| Converter workspace: drag-and-drop (react-dropzone), format picker, per-tool options, live queue | ✅ |
| **Client-side engine** (Web Worker): merge, split, rotate, watermark, compress (incl. re-encode), image → PDF, PDF → text/markdown/image — files never leave the device | ✅ |
| **Server pipeline**: upload (presigned-style signed URLs) → Bull queue (Redis) → **LibreOffice headless worker** → download; progress via **SSE** + polling | ✅ |
| REST API `/api/v1/*`: formats, files (upload/complete/download), jobs (create/list/status/cancel), error envelope per `api-documentation.md` | ✅ |
| Rate limiting (Redis sliding window, in-memory fallback), anonymous 5 conversions/day quota, guest cookies | ✅ |
| Retention sweeper (files auto-deleted; jobs archived at 90 days) | ✅ |
| Turso/SQLite + Prisma schema per `database-schema.md` (SQLite locally, libSQL-ready) | ✅ |
| Tests: 35 Vitest suites incl. **real LibreOffice conversions** through the full job pipeline | ✅ |
| Phase 2+ (accounts, OCR, cloud storage, webhooks, API keys, billing) | 📋 planned — see `plan/implementation-roadmap.md` |

## Quick start

Prerequisites: Node 20+, Redis (`redis-server`), LibreOffice (`soffice` on PATH), pnpm.

```bash
pnpm install                 # installs deps + copies the pdfjs worker to public/
cp .env.example .env         # adjust DATABASE_URL / ports
pnpm db:migrate              # create prisma/dev.db schema
redis-server --daemonize yes # or run in a separate terminal
pnpm dev                     # Next.js on http://localhost:3000 (or .env port)

# in a second terminal — the conversion worker (required for server-side jobs):
pnpm worker:office
```

Open http://localhost:3000 → drop a file → pick a format.

- **On-device tools** (Merge, Split, Rotate, Watermark, Compress, Image→PDF, PDF→Text/Markdown/Image) run in a Web Worker — no upload, works offline, instant.
- **Server conversions** (Office ↔ PDF etc.) upload the file, queue it, convert with LibreOffice, and auto-delete per retention (1 h anonymous).

### Tests & checks

```bash
pnpm test            # vitest — catalog, rate limits, storage, pdf-lib ops, LibreOffice pipeline
pnpm typecheck       # tsc --noEmit
pnpm build           # production build
pnpm worker:sweeper  # run the retention sweep once (cron in production)
```

> Note: pnpm 11 may print an `ERR_PNPM_IGNORED_BUILDS` warning during install — cosmetic; the native binaries (Prisma, esbuild) are already present. If scripts were skipped on a fresh checkout, run `pnpm rebuild @prisma/client @prisma/engines prisma esbuild`.

## Architecture (→ docs)

```text
Browser ── client engine (Web Worker) ──► on-device conversions (private)
   │
   └──► API /api/v1 ──► Turso (Prisma) ──► Bull queue (Redis) ──► LibreOffice worker ──► storage ──► download
                 └──► SSE /api/v1/jobs/:id/events  (progress)
```

- `lib/conversions.ts` — **conversion catalog**, the single source of truth driving UI, API validation and docs (`documentation/architecture.md` §2).
- `lib/storage/` — storage abstraction: local filesystem adapter (signed upload/download URLs) + **Cloudflare R2 adapter** (real presigned URLs) behind the same interface. Set `R2_ACCOUNT_ID`/`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`/`R2_BUCKET` to switch.
- `lib/jobs.ts` — job orchestration shared by the API and the worker (`documentation/architecture.md` §3).
- `lib/client-engine/` — Web Worker engine (`documentation/architecture.md` §4).
- `workers/` — Bull office worker + retention sweeper.

## Documented deviations (local MVP vs. production docs)

| Docs (target) | This implementation | Reason |
|---|---|---|
| WebSocket progress (`architecture.md` §6) | **SSE** (`/api/v1/jobs/:id/events`) + 2 s polling fallback | SSE is simpler and robust on Next.js route handlers; the docs already specify polling as the degradation path |
| Cloudflare R2 presigned URLs | Local filesystem adapter with HMAC-signed URLs, **plus a real R2 adapter** behind `R2_*` env vars | No cloud credentials in local dev; the interface and API shape are identical |
| NextAuth + accounts (Phase 2) | Anonymous guest sessions (cookie) + rate limits | Accounts are Phase 2 per `plan/implementation-roadmap.md` |
| PDF.js 4.x pinned | pdfjs-dist 4.10.x, worker served from `public/vendor/pdfjs/` | webpack `?url` asset imports are unreliable for `.mjs` in Next dev; static copy is deterministic |
| Monorepo (`apps/web`, `packages/*`) | Single Next.js app with clean `lib/`/`components/`/`workers/` layout | Simpler to run; monorepo split is a Phase 2/3 refactor |

## API quick reference

See `documentation/api-documentation.md` for the full contract.

```text
GET  /api/v1/formats                      conversion catalog (cacheable)
POST /api/v1/files/upload                 → { fileId, uploadUrl, ... }
PUT  <uploadUrl>                          direct upload (signed, 15 min)
POST /api/v1/files/upload/complete        verify + mark ready
GET  /api/v1/files/:id                    metadata + 60 s download URL
DELETE /api/v1/files/:id                  delete now
POST /api/v1/jobs                         { tasks: [{ operation: "convert", input, outputFormat }] }
GET  /api/v1/jobs/:id                     status + outputs
POST /api/v1/jobs/:id/cancel              cancel queued/processing
GET  /api/v1/jobs/:id/events              SSE progress stream
```

Error envelope: `{ "error": { "code", "message" } }` — codes per `api-documentation.md` §10 (`UNSUPPORTED_FORMAT` 415, `QUOTA_EXCEEDED` 402, `TOO_MANY_REQUESTS` 429, `CONVERSION_FAILED` 502, …). Mutating endpoints accept `Idempotency-Key`; rate-limit headers `X-RateLimit-*` on guarded routes.

```bash
# one-shot server conversion (txt → pdf) from the CLI
curl -X POST localhost:3000/api/v1/files/upload -H 'content-type: application/json' \
  -d '{"filename":"a.txt","mimeType":"text/plain","sizeBytes":5}'
```

## Project structure

```text
app/                 Next.js App Router — landing (design.md), /convert, /api/v1/*
components/          Header/Footer, home sections, converter workspace
components/ui/       design-system primitives (Button, Icon, Field, Skeleton, StatusPill, Reveal)
lib/                 conversions catalog, jobs, storage, queue, rate-limit, client engine
workers/             Bull office worker + retention sweeper
prisma/              schema + migrations (SQLite local / Turso in production)
public/images/       hero artwork (architectural SVG, brand palette)
public/vendor/pdfjs/ pdf.js worker (copied at install)
tests/               Vitest suites
documentation/ · plan/     the design docs this implements
```
