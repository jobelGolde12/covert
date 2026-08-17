# Convert — API Documentation

> **Base URL:** `https://api.convert.app/v1` — regional endpoints: `https://us-east.api.convert.app/v1`, `https://eu-central.api.convert.app/v1`, `https://ap-southeast.api.convert.app/v1`
> **Sandbox:** `https://sandbox.api.convert.app/v1` (unlimited jobs, whitelisted sample files, no credits consumed)
> **WebSocket:** `wss://api.convert.app/v1/ws`
> **Docs:** `docs.convert.app` · **OpenAPI spec:** `https://api.convert.app/v1/openapi.json`
>
> All requests and responses are `application/json` unless noted. Timestamps are ISO-8601 UTC. The API is versioned via the URL prefix; breaking changes bump to `/v2` with a 12-month deprecation window.
>
> **Design compliance:** the developer dashboard (`app.convert.app/settings` — API keys, webhooks, usage) implements the `design.md` design system (Inter, `#FFFFFF`/`#F7F7F5` surfaces, `#171717` text, `#C8102E` accent, 12-col grid, 0–4px radii).

---

## 1. Authentication

### 1.1 API Keys (recommended for servers)

```
Authorization: Bearer convert_live_2x9k...full-key
```

- Keys are minted in the dashboard: `POST /v1/api-keys`. Format: `convert_live_<32 random bytes base62>` (~40 chars). Sandbox keys: `convert_test_...`.
- **Scopes** restrict what a key can do:

| Scope | Grants |
|---|---|
| `jobs:read` | Read jobs/tasks, list jobs |
| `jobs:write` | Create/cancel jobs, create tasks |
| `files:read` | Request upload URLs, read file metadata |
| `files:write` | Create files, delete own files |
| `webhooks:read` / `webhooks:write` | Manage webhook endpoints |
| `usage:read` | Read usage/quotas |

- The full key is shown **once** at creation. We store only the SHA-256 hash (see `documentation/security.md` §API Keys). Rotate keys in the dashboard; old keys are revoked instantly.
- JWT access for end-user accounts is documented in `documentation/security.md`; the API accepts the NextAuth session cookie for first-party requests.

### 1.2 Errors

| Status | Code | Meaning |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Missing/invalid/expired key or session |
| 403 | `PERMISSION_DENIED` | Key lacks required scope |

```json
{ "error": { "code": "UNAUTHENTICATED", "message": "Missing bearer token" } }
```

---

## 2. Rate Limits

Rate limits are **per API key** (or per anonymous IP for first-party flows), enforced with a Redis sliding-window counter.

| Tier | Create job (burst) | Create job (sustained) | All other endpoints | Concurrent jobs |
|---|---|---|---|---|
| Anonymous (web) | — | 5 conversions/day | 60 req/min/IP | 3 |
| Free (web) | — | 20 conversions/day | 120 req/min | 5 |
| Pro (web + API) | 10 req/s | 300 req/min | 600 req/min | 20 |
| Business | 25 req/s | 900 req/min | 1800 req/min | 100 |
| Enterprise | custom | custom | custom | custom |

**Headers on every response:**

```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 299
X-RateLimit-Reset: 1699999999     (epoch seconds)
```

On breach: `429 Too Many Requests` with `Retry-After: 60` (seconds) — **honor it; do not retry immediately.**

```json
HTTP/1.1 429 Too Many Requests
Retry-After: 60
{ "error": { "code": "TOO_MANY_REQUESTS", "message": "Rate limit exceeded", "retryAfter": 60 } }
```

**Best practices** (mirrors CloudConvert's documented behavior):
- Implement **exponential backoff with jitter** (e.g., `min(60, 2^n + rand(0,1000))ms`), max 4 attempts.
- **Do not auto-retry** non-retryable errors (4xx). We internally retry retryable engine failures (5xx, timeouts) once with backoff — see `X-Convert-Retry-Count` on jobs.
- Respect `Retry-After`; hammering after 429 may escalate to temporary key suspension (first offense: 15 min).

---

## 3. Idempotency

All mutating endpoints accept an `Idempotency-Key` header (UUID, ≤ 64 chars). Within 24 h, a repeated request with the same key **returns the original resource** without re-executing or double-charging credits.

```
POST /v1/jobs
Idempotency-Key: 8a1f...-uuid
```

---

## 4. Conversion Catalog

### `GET /v1/formats`

Lists every supported conversion with engine, limits, and options — the source of truth for clients. **Cache client-side for 24 h** (`Cache-Control: public, max-age=86400`).

```json
{
  "data": [
    {
      "id": "docx-pdf",
      "from": ["docx", "doc"],
      "to": "pdf",
      "engine": "libreoffice",
      "location": "server",
      "maxSizeMB": 100,
      "maxPages": 1000,
      "priceCredits": 1,
      "options": {
        "pdfExport": { "embedFonts": true, "reduceImageResolution": false },
        "filters": { "conversionMode": ["default", "flattenLayout"] }
      }
    }
  ],
  "meta": { "count": 28 }
}
```

### `GET /v1/formats/:from` · `GET /v1/formats/:from/:to`

Filter the catalog (e.g., `GET /v1/formats/pdf` → everything PDF can become; `GET /v1/formats/docx/pdf` → the single conversion with engine defaults).

---

## 5. Files

### `POST /v1/files/upload` — request an upload URL

```json
// request
{
  "filename": "report.docx",
  "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "sizeBytes": 482913,
  "checksumSha256": "9f86d08...",   // optional, enables dedupe
  "source": "upload"                 // upload | drive | dropbox | url
}
```

```json
// response 201
{
  "data": {
    "fileId": "01HZX...",
    "uploadUrl": "https://convert-files.<region>.r2.cloudflarestorage.com/files/01HZX.../01HZX....docx?X-Amz-Signature=...",
    "expiresAt": "2026-08-16T12:05:00Z",
    "storageKey": "files/01HZX.../01HZX....docx"
  }
}
```

- `uploadUrl` is a **presigned PUT**, valid 15 min, max size per plan (anon 25 MB / free 100 MB / paid 500 MB). Upload the body directly with `PUT` (no auth header needed).
- On checksum match, we dedupe: the response returns the **existing** `fileId` with `"deduped": true` and no `uploadUrl` — your file was never stored twice.
- After upload, `GET /v1/files/:id` reports `status: "ready"`.

### `GET /v1/files/:id` — metadata + download link

```json
{
  "data": {
    "id": "01HZX...",
    "filename": "report.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "sizeBytes": 482913,
    "status": "done",
    "pageCount": 12,
    "createdAt": "2026-08-16T12:00:00Z",
    "retentionUntil": "2026-08-17T12:00:00Z",
    "downloadUrl": "https://.../files/...?X-Amz-Signature=...&X-Amz-Expires=60"
  }
}
```

- `downloadUrl` is a presigned GET, **60 s TTL**, returned only when `status = done`.
- Files are deleted after `retentionUntil` (anon 1 h / free 24 h / paid 7 d) — **download your outputs before then**.

### `DELETE /v1/files/:id` — delete immediately

Deletes the object + row. Also removes from an in-flight job's inputs (job will fail with `FILE_DELETED`).

### `POST /v1/files/import-url` — server-side import from a public URL

`{ "url": "https://example.com/file.docx", "filename": "file.docx" }` → worker downloads (max 100 MB, 30 s timeout, blocks private IP ranges — SSRF guard, see `documentation/security.md` §SSRF). Supports Google Drive / Dropbox public share links.

---

## 6. Jobs

Jobs are DAGs of tasks. A simple conversion is a one-task job; a watermark+compress pipeline is a three-task job.

### `POST /v1/jobs` — create a job

```json
// Word → PDF
{
  "tasks": [
    { "operation": "convert", "input": "01HZX-in", "outputFormat": "pdf" }
  ]
}
```

```json
// Chained: PDF → DOCX with OCR, then compress the DOCX
{
  "tasks": [
    { "operation": "convert", "input": "01HZX-a", "outputFormat": "docx", "options": { "ocr": true } },
    { "operation": "optimize", "input": "01HZX-a-converted", "outputFormat": "docx" }
  ]
}
```

```json
// PDF merge (multi-input)
{
  "tasks": [
    { "operation": "merge", "input": ["01HZX-a", "01HZX-b", "01HZX-c"], "outputFormat": "pdf" }
  ]
}
```

```json
// Split with ranges
{
  "tasks": [
    { "operation": "split", "input": "01HZX-a", "outputFormat": "pdf", "options": { "ranges": ["1-3", "4-5", "6"] } }
  ]
}
```

**Response `201 Created`:**

```json
{
  "data": {
    "id": "01HZY-job...",
    "status": "queued",
    "tasks": [
      { "id": "01HZZ-t1...", "operation": "convert", "status": "waiting", "progress": 0 }
    ],
    "creditsCharged": 2,
    "createdAt": "2026-08-16T12:00:00Z"
  }
}
```

**Task operations:** `import`, `convert`, `optimize` (compress), `merge`, `split`, `rotate`, `watermark`, `ocr`, `export`, `thumbnail`, `preview`.

**Common task options:**

| Option | Applies to | Values |
|---|---|---|
| `outputFormat` | convert/optimize/… | catalog `to` |
| `ocr` | convert (pdf→docx/xlsx) | `true` \| `false` (adds tesseract task, +2 credits) |
| `ranges` | split | `["1-3","4-5"]` (1-indexed, inclusive) |
| `angle` | rotate | `90` \| `180` \| `270` |
| `watermark.text` / `watermark.fontSize` / `watermark.opacity` / `watermark.rotation` | watermark | string / 8–72 / 0.1–1.0 / degrees |
| `compress.level` | optimize | `low` \| `medium` \| `high` \| `lossless` |
| `password` | convert (pdf in) | string (opens encrypted PDFs) |
| `protectPassword` | convert (pdf out) | string (encrypts output; **passwords are never logged or stored**) |

### `GET /v1/jobs/:id` — job status

```json
{
  "data": {
    "id": "01HZY-job...",
    "status": "processing",
    "progress": 42,
    "tasks": [
      { "id": "01HZZ-t1...", "operation": "convert", "engine": "libreoffice", "engineVersion": "7.6.5", "status": "processing", "progress": 42 }
    ],
    "outputs": [],
    "timings": { "enqueueMs": 12, "claimMs": 340, "engineMs": 4800 },
    "creditsCharged": 2,
    "createdAt": "2026-08-16T12:00:00Z"
  }
}
```

**Job statuses:** `queued → processing → done | error | cancelled`

### `GET /v1/jobs` — list (paged)

`?status=done&limit=20&cursor=<opaque>` — cursor pagination (stable, O(1) seek via `createdAt` index).

### `POST /v1/jobs/:id/cancel` — cancel

Only cancels jobs still `queued`/`processing`. In-flight engine work is killed via job token; already-produced outputs are discarded. Returns `409 JOB_NOT_CANCELLABLE` for terminal jobs. **Canceled jobs are not charged.**

### `DELETE /v1/jobs/:id` — delete record + outputs

---

## 7. Real-Time Progress (WebSocket)

```
wss://api.convert.app/v1/ws?token=<jwt-or-apikey>
```

```json
// client → server
{ "type": "subscribe", "jobId": "01HZY-job..." }
{ "type": "unsubscribe", "jobId": "01HZY-job..." }
```

```json
// server → client
{ "type": "task.progress", "jobId": "...", "taskId": "...", "percent": 42 }
{ "type": "task.finished", "jobId": "...", "taskId": "...", "outputFileId": "..." }
{ "type": "job.finished",  "jobId": "...", "downloadUrl": "https://...", "sizeBytes": 1024 }
{ "type": "job.error",     "jobId": "...", "code": "CONVERSION_FAILED", "message": "..." }
{ "type": "job.cancelled", "jobId": "..." }
```

- Ping/pong every 30 s; server drops idle connections after 90 s (clients auto-reconnect with exponential backoff).
- On reconnect, re-subscribe; the gateway replays the last event for each subscribed job from Redis (30 s buffer).
- **Fallback:** `GET /v1/jobs/:id` polling (2 s) is the documented degradation path.

---

## 8. Webhooks

Fire `job.finished`, `job.error`, `job.cancelled` (and optionally `task.*`) to your endpoint.

### `POST /v1/webhooks`

```json
{ "url": "https://app.example.com/hooks/convert", "events": ["job.finished", "job.error"] }
```

**Response includes `secret` once:**

```json
{ "data": { "id": "01H...", "url": "...", "events": [...], "secret": "whsec_9f86d..." } }
```

### Delivery

- `POST` with `Content-Type: application/json`, body = the same event objects as the WS stream, plus `jobId`.
- **Signature:** `X-Convert-Signature: t=1699999999,v1=<HMAC-SHA256(secret, t + "." + body)>`. Verify with a constant-time compare; tolerate ±5 min clock skew (replay window).
- **Retries:** exponential backoff `2^n` min (max 16 h), up to 8 attempts; a `409`/`410`/`422` response is treated as permanent failure and stops retries.
- **Batching:** a job with many task events delivers one `job.finished` payload containing all task summaries. Delivery history at `GET /v1/webhooks/:id/deliveries`.

### `GET /v1/webhooks` · `GET /v1/webhooks/:id` · `DELETE /v1/webhooks/:id` · `PATCH /v1/webhooks/:id`

Standard CRUD. Disable (`active: false`) instead of deleting to preserve delivery history.

---

## 9. Usage & Account

| Endpoint | Description |
|---|---|
| `GET /v1/me` | Plan, credits remaining, quota reset time, rate-limit tier |
| `GET /v1/usage?from=2026-08-01&to=2026-08-16` | Daily conversion counts, bytes, credits per format |
| `GET /v1/conversions` | History (same shape as `GET /v1/jobs`, paged) |
| `GET /v1/api-keys` / `POST /v1/api-keys` / `DELETE /v1/api-keys/:id` | Key management (scopes, rotate, revoke) |

---

## 10. Error Reference

Every error: `{ "error": { "code": "...", "message": "...", "details?": {...} } }`

| HTTP | Code | When |
|---|---|---|
| 400 | `INVALID_REQUEST` | Malformed JSON / query params |
| 401 | `UNAUTHENTICATED` | Missing or invalid credentials |
| 401 | `KEY_REVOKED` / `KEY_EXPIRED` | Key no longer valid |
| 402 | `QUOTA_EXCEEDED` | Daily conversion limit reached; resets at UTC midnight |
| 402 | `INSUFFICIENT_CREDITS` | Metered credits exhausted (API plans) |
| 403 | `PERMISSION_DENIED` | Scope missing |
| 404 | `NOT_FOUND` | Job/file/endpoint unknown |
| 409 | `JOB_NOT_CANCELLABLE` | Cancel on terminal job |
| 409 | `CONFLICT_STATE` | File not `ready`, job in wrong state |
| 413 | `FILE_TOO_LARGE` | Exceeds plan size cap |
| 415 | `UNSUPPORTED_FORMAT` | Format/extension not in catalog |
| 422 | `INVALID_DATA` | Task validation failed (see `details.errors`) |
| 422 | `UNSUPPORTED_CONVERSION` | Valid inputs but no catalog entry (e.g., `pptx → xlsx`) |
| 429 | `TOO_MANY_REQUESTS` | Rate limited (see §2) |
| 500 | `INTERNAL` | Unexpected server failure |
| 502 | `CONVERSION_FAILED` | Engine ran but produced no/invalid output |
| 503 | `ENGINE_UNAVAILABLE` | Worker fleet saturated/upgrading — retry after `Retry-After` |
| 504 | `TIMEOUT` | Engine exceeded job timeout (office: 15 min; ocr: 30 min) |

**Task-level engine codes** (appear on the task, job status = `error`):

| Code | Meaning |
|---|---|
| `OPEN_FAILED` | Engine could not open the file (corrupt or unsupported variant) |
| `CORRUPT_FILE` | Structure invalid / truncated upload (checksum mismatch) |
| `PASSWORD_REQUIRED` | PDF encrypted, no `password` given |
| `PASSWORD_INCORRECT` | Wrong decryption password |
| `EMPTY_DOCUMENT` | Zero pages / empty sheet |
| `OUTPUT_TOO_LARGE` | Result exceeds plan limits (e.g., 1000-page PDF) |
| `FONT_MISSING` | LibreOffice missing required font (see troubleshooting) |
| `FILE_DELETED` | Input removed before processing |

---

## 11. Example Flows

### 11.1 Convert Word → PDF and download (Node)

```js
// 1. Presign upload
const up = await fetch(`${BASE}/v1/files/upload`, {
  method: "POST",
  headers: { authorization: `Bearer ${KEY}`, "content-type": "application/json" },
  body: JSON.stringify({ filename: "report.docx", mimeType: "...", sizeBytes: file.size }),
}).then(r => r.json());

// 2. Upload directly to R2
await fetch(up.data.uploadUrl, { method: "PUT", body: file });

// 3. Create job
const job = await fetch(`${BASE}/v1/jobs`, {
  method: "POST",
  headers: { authorization: `Bearer ${KEY}`, "idempotency-key": crypto.randomUUID() },
  body: JSON.stringify({ tasks: [{ operation: "convert", input: up.data.fileId, outputFormat: "pdf" }] }),
}).then(r => r.json());

// 4. Poll (or subscribe via WS)
let state = job.data;
while (!["done", "error", "cancelled"].includes(state.status)) {
  await new Promise(r => setTimeout(r, 2000));
  state = await fetch(`${BASE}/v1/jobs/${job.data.id}`, { headers: { authorization: `Bearer ${KEY}` } }).then(r => r.json()).then(r => r.data);
}

// 5. Download (60 s presigned URL)
const { downloadUrl } = await fetch(`${BASE}/v1/jobs/${job.data.id}`, { headers: { authorization: `Bearer ${KEY}` } })
  .then(r => r.json()).then(r => r.data.outputs[0]);
```

### 11.2 Webhook verification (Node)

```js
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyWebhook(req, secret) {
  const sig = req.headers["x-convert-signature"];
  const [t, v1] = sig.split(",").map(s => s.split("=")[1]);
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${req.rawBody}`).digest("hex");
  const a = Buffer.from(v1), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
```

### 11.3 Client-side conversion (no upload — private by default)

`location: "client"` conversions (merge, split, rotate, watermark, compress, image→PDF, PDF→image/text/md) are executed by the browser library (`@convert/client`). The library posts only a history record when the user is signed in:

```js
import { convert } from "@convert/client";
const result = await convert("pdf-compress", file, { compress: { level: "high" } });
// result.blob — saved locally; never uploaded
```

---

## 12. SDKs & Tooling

- **Official SDKs:** `@convert/sdk` (Node/TS), `@convert/sdk-python`, `@convert/client` (browser). Auto-generated from the OpenAPI spec with typed clients + retry/backoff built in.
- **CLI:** `convert-cli convert report.docx --to pdf --key $CONVERT_API_KEY` (wraps the SDK; supports batch globs).
- **Zapier / n8n / Make:** certified integrations triggering jobs from email, cloud storage, and spreadsheets.
- **Postman collection** and **OpenAPI JSON** published at `docs.convert.app`.

---

## 13. API Design Principles (Senior-Developer Notes)

1. **Resource-oriented, not action-oriented.** Everything is a resource (`job`, `task`, `file`) with state transitions; no `POST /convert` fire-and-forget.
2. **DAG jobs, not one-shot calls.** Chained operations are atomic: one job, one bill, one idempotency key (CloudConvert's model, proven at scale).
3. **Async everywhere.** No request blocks longer than ~500 ms of server work; heavy work is queued and observable.
4. **Rate limits with headers + `Retry-After`.** Clients can self-throttle; never silent-drop.
5. **Errors are structured and documented.** Machine-readable `code` + human `message` + optional `details`; stable codes are part of the API contract and covered by contract tests.
6. **Idempotency keys** on all mutations — the #1 fix for double-charge bugs in distributed conversion APIs.
7. **Paginate with cursors**, never offset (deep-offset scans are O(n) on SQLite).
8. **Deprecation policy:** endpoints are documented with `deprecated: true`, kept for 12 months, then removed with 90 days' notice to affected keys.
