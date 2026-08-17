# Runtime Bottlenecks

Source review + live observations. Severity is relative to a single-container deployment with the 1 GB upload cap.

---

## PERF-01 — `completeUpload` loads the entire object into memory to checksum it — **Medium**

- **File:** `lib/storage/index.ts:75-84` (local adapter)

**Description**
`POST /files/upload/complete` calls `getStorage().completeUpload(...)`, which on the local adapter does `fs.readFile(p)` on the whole object to compute SHA-256. Combined with the 1 GB PUT hard cap, a single large upload can pull **up to ~1 GB into RAM** in the API process at completion time. `completeUpload` is the hot path of every upload.

**Mitigations in place**
- The PUT itself streams to disk (`app/api/v1/files/upload/put/route.ts`) — good.
- The memory spike is transient (checksum → release).

**Remediation**
- Stream the file in chunks through `createHash` (or checksum incrementally during the PUT), instead of buffering.

---

## PERF-02 — SSE polling regenerates fresh 60 s download URLs every 600 ms — **Low**

- **Files:** `lib/sse.ts` → `lib/jobs.ts:304-317` (`getJobForApi` calls `createDownloadUrl` per poll), `app/api/v1/jobs/[id]/events/route.ts:75`

**Description**
While a job is converting, the SSE handler polls the job every 600 ms, and every poll computes a fresh HMAC download URL per output. This is cheap on the local adapter but redundant (URLs are only meaningful after `done`), and it serializes DB + storage work into the polling loop.

**Remediation**
- Only generate download URLs when the job is terminal, or cache the last payload.

---

## PERF-03 — Download route buffers the full file into memory — **Low**

- **File:** `app/api/v1/files/download/route.ts:31-42`

**Description**
`fs.readFile(target)` reads the whole object into a `Buffer` before streaming the response. For outputs up to the 100 MB format cap (1 GB upload cap), this doubles memory per concurrent download.

**Remediation**
- Stream via `fs.createReadStream` into the `Response` body with `Content-Length` from `fs.stat`.

---

## PERF-04 — Concurrency ceiling: single LibreOffice worker — **Info**

- **File:** `workers/office/index.ts:28` (`concurrency: LO_CONCURRENCY`, default 1)

**Description**
Conversions serialize at one soffice process per container (default). This bounds throughput to ~1 conversion at a time regardless of the queue. Appropriate for the local profile; production must scale workers horizontally (the BullMQ queue is designed for that) or raise `LO_CONCURRENCY` on beefier hosts with per-job profile isolation.

---

## PERF-05 — Healthy patterns observed — **Info**

- **Jobs list:** single `findMany` with `take: limit+1` cursor pagination + indexed relations — no N+1 (`app/api/v1/jobs/route.ts:108-117`; `@@index([status, createdAt])`).
- **SSE:** change-detection (payload diff) suppresses redundant frames (`app/api/v1/jobs/[id]/events/route.ts:52-55`).
- **Rate limiter:** Redis sliding window via `MULTI` (`lib/rate-limit.ts:65-83`), memory fallback when Redis is down.
- **Catalog:** `Cache-Control: public, max-age=86400`; browser caches the format list; React Query keyed fetch.
- **Retention sweep:** bounded batches (`take: 500` / `take: 200`) so a backlog doesn't stall a single pass.

## Runtime timings observed

| Operation | Time |
|---|---|
| md→pdf (small, real LibreOffice) | ~1 s (job `done` in 1 s end-to-end incl. queue) |
| txt→pdf (test suite) | 1 968 ms |
| markdown→pdf via HTML render (test suite) | 1 936 ms |
| docx→pdf (docx first produced by LibreOffice) | 4 552 ms |
| Test suite total (35 tests) | 16.36 s |

## Memory/cost ceiling summary

Worst case per container: 1 upload checksum in progress (up to 1 GB — PERF-01) + 1 conversion buffering input/output + concurrent downloads buffering (PERF-03). On memory-constrained hosts, PERF-01 and PERF-03 are the ones to fix before scaling.
