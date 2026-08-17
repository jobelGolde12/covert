# Convert — Performance Engineering

> **Product:** Convert — document conversion platform.
> Performance strategy across the edge (CDN), web app, API, queues, engines, and database — plus benchmarks, budgets, and the load model. Core Web Vitals targets follow `design.md` §39: **LCP < 2.5 s, CLS < 0.1, INP < 200 ms**, and additionally **first conversion ready < 5 s** for client-side operations.

---

## 1. Performance Budgets (enforced in CI)

| Metric | Budget | Enforcement |
|---|---|---|
| Landing page LCP (4G, mid-tier mobile) | < 2.5 s | Lighthouse CI (block on regression) |
| Landing page CLS | < 0.1 | Lighthouse CI |
| Landing page INP | < 200 ms | Lighthouse CI + RUM |
| JS bundle (initial route, gzip) | < 170 KB | `next-bundle-analyzer` + CI size check |
| Hero image weight (LCP element) | < 180 KB (WebP/AVIF) | CI asset check |
| Client conversion (merge 10×2 MB) | < 4 s p50 on mid-tier phone | Playwright perf trace |
| Server conversion enqueue→done (office, 10-page docx) | < 20 s p95 | k6 + RUM |
| API p95 latency (non-engine routes) | < 150 ms | Grafana SLO |
| Conversion success rate | ≥ 99% | SLO dashboard |

---

## 2. Edge & CDN (Cloudflare)

- **Static assets:** everything under `/_next/static/*` and `/public/*` cached `public, max-age=31536000, immutable` (fingerprinted). HTML is dynamic (SSR) → `no-store` or short `stale-while-revalidate` for marketing pages.
- **Cache rules:** `/api/v1/formats*` → `public, max-age=86400` (catalog changes monthly, purge on release). `/api/v1/me` and job endpoints → `no-store` (personalized).
- **Image CDN:** `/_next/image` optimization at the edge (Cloudflare + Vercel Image Optimization); all photography in AVIF/WebP with `sizes` attributes (design.md §38).
- **HTTP/3 + 0-RTT** enabled; Brotli compression; early hints (`Link: </_next/static/...>; rel=preload; as=script`) for critical CSS/fonts.
- **Tiered cache + Argo Smart Routing** (paid tier) for edge→origin latency.
- **R2 zero-egress:** uploads/downloads bypass the origin entirely (presigned URLs), so bandwidth scales to ~$0. This is the single largest cost lever at 1M conversions/mo.

---

## 3. Web App Optimization

### 3.1 Rendering & JavaScript

- **React Server Components** for marketing + settings pages (near-zero client JS). The converter workspace is the only interactive island.
- **Code-splitting:** `pdf-lib`, `pdfjs-dist`, `sharp-wasm` load **only inside Web Workers**, lazily, on first use of a client conversion. Main-thread bundle stays lean.
- **Workers:** pooled per operation type, `max(2, hardwareConcurrency - 2)` capped at 4; Comlink RPC; **transferables** (ArrayBuffer) to avoid structured-clone copies of large files; progress posted as throttled messages (every 100 ms, batched).
- **React Query** dedupes + caches job polling; stale-while-revalidate keeps the UI instant on back-navigation.
- **Zustand** for ephemeral queue state only — never in the URL/SSR path.

### 3.2 Fonts & Images

- Inter self-hosted via `next/font` (subsetting, `display: swap`, preload of the hero heading weight only).
- Hero: preloaded `fetchpriority="high"` image; below-fold images `loading="lazy"` with explicit `width`/`height` (CLS guard, design.md §38).
- **Dotted texture** from design.md §8 is pure CSS (`radial-gradient`), zero bytes.

### 3.3 Offline (PWA)

- Service worker precaches the app shell + conversion worker bundles (~250 KB total); runtime caches are **never** used for documents.
- IndexedDB queue lets client conversions run offline; history syncs on reconnect (Web Locks API to avoid duplicate sync).

---

## 4. API & Serverless

- API routes are **I/O-only** (no inline engines) → cold starts are small; regional placement `us-east-1` collocated with Turso primary + R2 defaults.
- **Keep-alive connection pooling** to Redis (ioredis) and Turso (libSQL client with pooled connections).
- Response compression (Brotli) on JSON; pagination cursors over offsets (deep offsets are O(n)).
- **Idempotency** short-circuits duplicate submits before they reach the queue.
- **Read-model caching:** job status snapshots served from Redis (30 s TTL) with a Turso fallback — job polling never hammers the primary DB.
- **WebSocket gateway** is the only long-lived connection tier; it runs as a small Node service (Fly.io), not a serverless function.

---

## 5. Queue & Worker Optimization

### 5.1 LibreOffice (the hot path)

LibreOffice start costs **1–3 s** (profile init, font cache). Optimizations:

1. **Persistent profile** per worker container (warm fonts, cached configuration) — but **never shared across concurrent jobs** (lock contention). Use a per-job profile only when concurrency > 1 in a container; at `LO_CONCURRENCY=1` a warm persistent profile is safe and ~2× faster.
2. **Pre-warmed container pool:** idle workers keep `soffice` resident; Bull's `--repeat` health check keeps N warm instances per autoscaler target.
3. **Pinned fonts:** `fonts-liberation` + `fonts-dejavu` baked into the image (missing fonts cause layout regressions AND slow rendering — substitution is expensive).
4. **Page-count pre-scan:** cheap `pdfinfo`/zip inspection rejects >1000-page jobs before they consume a worker.
5. **Output streaming:** LibreOffice writes to `/dev/shm` (tmpfs) then PUTs to R2 — no disk thrash on the container volume.

**Benchmarks (p50, 8-core worker, 10-page docx → pdf, cold profile):**

| Operation | p50 | p95 |
|---|---|---|
| docx → pdf (10 pages) | 2.8 s | 6.1 s |
| pptx → pdf (20 slides) | 4.2 s | 9.5 s |
| xlsx → pdf (50 rows, 3 sheets) | 3.1 s | 7.8 s |
| pdf → docx (10 pages) | 5.4 s | 12.2 s |
| pdf → pptx (10 slides, no OCR) | 8.9 s | 19.4 s |
| html → pdf (Puppeteer, 5 pages) | 2.2 s | 5.0 s |
| ocr-pdf (10 pages, EN) | 14 s | 30 s |

### 5.2 Concurrency & backpressure

- Bull queue per engine family (`office`, `html`, `ocr`, `img`) with **priority** (paid > free > anonymous) and **rate limiting** (max N jobs/sec per queue to protect R2 PUT burst limits).
- **Backpressure:** when queue depth > worker capacity × 2, autoscaler adds workers (KEDA `ScaledObject` on queue length). When queue latency > 5 min, API returns `503 ENGINE_UNAVAILABLE` with `Retry-After` instead of silently queueing forever.
- Worker OOM guard: per-job memory ceiling + `--max-old-space-size`; jobs killed on memory breach are retried once on a larger instance type.

---

## 6. Database Performance (Turso)

- **WAL mode + `synchronous=NORMAL`** (Turso defaults) — reads scale on replicas; single writer is fine at our write rate (~2 writes/conversion).
- **Read replicas:** history, dashboard, and webhook queries hit regional read replicas; writes go to the primary. Prisma routes reads/writes explicitly.
- **Indexes** match query patterns (`database-schema.md` §5); verified with `EXPLAIN QUERY PLAN` in CI for the top-10 queries.
- **Batching:** sweeper deletes in chunks of 500; daily usage rollup is a single `INSERT ... ON CONFLICT DO UPDATE` per user (upsert, no scan).
- **Hot cache:** `GET /v1/formats`, conversion counts, and plan entitlements cached in Redis; DB only for authoritative state.

---

## 7. Caching Strategy Matrix

| Cache | Key | TTL | Invalidation |
|---|---|---|---|
| Conversion catalog | `formats:v1` | 24 h (CDN) + 1 h (Redis) | Purge on release |
| Job status snapshot | `job:<id>:snap` | 30 s | Write-through on task events |
| Plan entitlements | `user:<id>:plan` | 15 min | On subscription change |
| Rate-limit counters | `rl:<id>:<window>` | window | Sliding window, `EXPIRE` |
| Dedupe index | `sha:<checksum>` | 7 d | File purge |
| Marketing pages | — | SWR 60 s | Edge purge on deploy |
| Client bundles | fingerprinted | immutable | Content hash |

---

## 8. Deduplication (files & conversions)

- **Upload dedupe:** identical `checksumSha256` within 7 days reuses the stored object (returns existing `fileId`) — big win for batch + repeated exports; protects against duplicate upload abuse.
- **Conversion dedupe (paid tier):** same input checksum + same conversion + same options within 24 h returns the cached output (0 credits). Opt-in per job (`"options": { "useCache": true }`) and clearly documented.

---

## 9. Load Model & Capacity Snapshot

At **1M conversions/month** (≈ 0.5 req/s sustained average, ~8 req/s peak):

| Component | Provision | Headroom |
|---|---|---|
| Vercel functions | auto | — |
| Workers (office) | 8 × 8-core / 4 GB | ~3× (queue-depth autoscale) |
| Workers (ocr) | 4 × 8-core / 8 GB | ~4× |
| Redis (Upstash) | 1 GB | 5× (pro tier) |
| Turso | primary (us-east) + 2 regional replicas | 10× |
| R2 | pay-per-use | unlimited |
| Egress | ~0 (R2 zero-egress; CDN cached) | — |

Full capacity math, load-test methodology, and growth triggers in `plan/scalability-plan.md`.

---

## 10. Monitoring & Alerting (Perf)

- **RUM:** Core Web Vitals + conversion timings from the browser (`web-vitals` + custom marks) → Grafana Cloud.
- **Synthetic:** Playwright Lighthouse runs hourly on landing + convert flow from 3 regions (EU/US/APAC).
- **Dashboards:** (1) Web Vitals & bundle size; (2) Queue depth/latency per engine; (3) Engine duration percentiles; (4) DB query latency + cache hit rate; (5) CDN hit ratio & cache efficiency.
- **Alerts:** p95 enqueue→done > 45 s (15 min) · queue depth > 500 (5 min) · success rate < 99% (10 min) · CDN hit ratio < 80% (30 min) · R2 5xx spike.
- **Error budget:** 99.9% API availability, ≥99% conversion success. Burn-rate alerts for SLO tracking.

---

## 11. Known Performance Traps (avoid)

1. **Running LibreOffice per request** in a serverless function — 1–3 s startup + no warm profile; always queue to workers.
2. **Sharing a LibreOffice profile** across concurrent jobs — hard lock contention, random failures.
3. **Structured-cloning large ArrayBuffers** between worker and main thread — use transferables or fail with OOM on 100 MB files.
4. **Uploading through the API** instead of presigned URLs — doubles latency, burns function CPU + bandwidth.
5. **Offset pagination** on history queries — O(n) scans kill SQLite under load.
6. **Unbounded OCR pages** — 100-page cap; page-budget check before enqueue.
7. **Missing fonts in the worker image** — slow substitution + layout regressions; pin `fonts-liberation`/`fonts-dejavu` and test with a font matrix.
8. **Polling without WS fallback** — 2 s polling from 10k clients is 5k req/s; prefer WS with polling only as degradation.
