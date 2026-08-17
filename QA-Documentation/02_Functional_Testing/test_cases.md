# Functional Test Cases

Executed live against `http://localhost:3000/api/v1` with curl (and a real-browser pass for the UI flows). Case IDs are referenced from `execution_results.md` and `bug_reports.md`.

## FMT — Formats catalogue

| ID | Case | Expected |
|---|---|---|
| FMT-01 | `GET /api/v1/formats` | 200, JSON envelope with `data.conversions` and `data.formats` |
| FMT-02 | Response `Cache-Control` | `public, max-age=86400` |
| FMT-03 | Catalogue content | 25 conversion entries; office→pdf, pdf→office, pdf tools present |
| FMT-04 | Format registry | `FORMATS` mirror (format/label/extensions/group) |

## UPL — Upload initiation (`POST /files/upload`)

| ID | Case | Expected |
|---|---|---|
| UPL-01 | Valid `.md` (mime text/markdown, 2048 B) | 200; `fileId` (UUID), presigned `uploadUrl` → `/api/v1/files/upload/put`, `method=PUT`, `expiresAt` ≈ now+15 min |
| UPL-02 | Rate-limit headers | `X-RateLimit-Limit=60`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` present |
| UPL-03 | Empty body `{}` | 422 `INVALID_DATA` |
| UPL-04 | Malformed JSON | 422 |
| UPL-05 | Unsupported extension (`.exe`) | 415 `UNSUPPORTED_FORMAT` |
| UPL-06 | Oversized (`sizeBytes` ≫ format max, pdf=100 MB) | 413 `FILE_TOO_LARGE` + `details.maxSizeMB` |
| UPL-07 | Empty `filename` | 422 |
| UPL-08 | `sizeBytes: 0` | 422 |
| UPL-09 | Concurrent uploads (20 parallel) | All 200 |

## PUT — Storage write (`PUT /files/upload/put`)

| ID | Case | Expected |
|---|---|---|
| PUT-01 | PUT with the returned signed URL + body | 204 |
| PUT-02 | Tampered `token` | 401 |
| PUT-03 | Expired `exp` (epoch 1) | 401 |
| PUT-04 | Path-traversal `key` (`../../etc/passwd`) with bogus token | 400/401 (rejected before write) |

## CMP — Complete upload (`POST /files/upload/complete`)

| ID | Case | Expected |
|---|---|---|
| CMP-01 | Non-UUID `fileId` | 422 |
| CMP-02 | Unknown UUID | 404 |
| CMP-03 | Complete before object PUT | 409 `CONFLICT_STATE` |
| CMP-04 | Complete after object PUT | 200; `status=ready`, `sizeBytes` set |

## FIL — File metadata / deletion (`GET|DELETE /files/[id]`)

| ID | Case | Expected |
|---|---|---|
| FIL-01 | GET known `ready` file | 200; filename, mime, size, status, format, retentionUntil; `downloadUrl=null` (not done) |
| FIL-02 | GET malformed id | 404 |
| FIL-03 | DELETE unknown file | 404 |
| FIL-04 | GET output file (after conversion) | 200; `status=done`, `downloadUrl` present |
| FIL-05 | DELETE output file | 200; `data.deleted=true`; row soft-deleted (`deletedAt`, status `expired`) |

## JOB — Job creation (`POST /jobs`)

| ID | Case | Expected |
|---|---|---|
| JOB-01 | Empty body | 422 |
| JOB-02 | Unknown input file | 404 |
| JOB-03 | Unsupported target (`mp4`) | 422 `UNSUPPORTED_CONVERSION` |
| JOB-04 | Input file not `ready` | 409 `CONFLICT_STATE` |
| JOB-05 | Valid md→pdf | 200; `status=queued`, `queueMode` (queue/inline), conversion metadata |
| JOB-06 | Idempotency: repeat with same `Idempotency-Key` | Same job id, `idempotent:true`, no double-enqueue |
| JOB-07 | Daily quota (`ANON_CONVERSIONS_PER_DAY=5`) | 6th conversion → 402 `QUOTA_EXCEEDED` + `details.remaining` |

## JLIST — Job list (`GET /jobs`)

| ID | Case | Expected |
|---|---|---|
| JLIST-01 | Default page | 200; jobs array (newest first), no outputs leaked |
| JLIST-02 | `limit=1` | 1 row + `nextCursor` (`<ts>:<id>`) |
| JLIST-03 | `limit=1&cursor=<nextCursor>` | Next page, no overlap |
| JLIST-04 | `limit` upper bound | Clamped to 50 |

## JGET — Job status (`GET /jobs/[id]`)

| ID | Case | Expected |
|---|---|---|
| JGET-01 | Completed job | 200; `progress=100`, `creditsCharged`, tasks, 1 output with 60 s `downloadUrl` |
| JGET-02 | Output filename | Friendly name (`qa-sample.pdf`), not storage id |
| JGET-03 | Unknown id | 404 |

## DL — Download (`GET /files/download`)

| ID | Case | Expected |
|---|---|---|
| DL-01 | Valid signed URL | 200; body starts `%PDF`; `Content-Type: application/pdf`; `Content-Disposition: attachment; filename="…"` |
| DL-02 | `Cache-Control` | `private, max-age=60` |
| DL-03 | Traversal `key` + bogus token | 401 |

## SSE — Job events (`GET /jobs/[id]/events`)

| ID | Case | Expected |
|---|---|---|
| SSE-01 | Live job | SSE stream; `event: job` + `data:` payloads; terminal state closes stream |
| SSE-02 | Unknown job | 404 |
| SSE-03 | Headers | `text/event-stream`, `Cache-Control: no-cache`, `X-Accel-Buffering: no` |

## CAN — Cancel (`POST /jobs/[id]/cancel`)

| ID | Case | Expected |
|---|---|---|
| CAN-01 | Queued job | 200; `status=cancelled`; task also `cancelled`; no output produced |
| CAN-02 | Job in-flight (worker already processing) | 200 `cancelled`, and final DB status must **remain** `cancelled` (no output) |
| CAN-03 | Already done/error/cancelled | 409 `JOB_NOT_CANCELLABLE` |

## RL — Rate limiting

| ID | Case | Expected |
|---|---|---|
| RL-01 | 61 requests in a 60 s window (same IP) | ≥1 response 429 `TOO_MANY_REQUESTS` with `Retry-After`, `X-RateLimit-*` |
| RL-02 | Fresh `X-Forwarded-For` during an active 429 window | **Must still be limited** (i.e., not bypassable) |

## E2E — Full conversion path

| ID | Case | Expected |
|---|---|---|
| E2E-01 | md→pdf over HTTP: upload → PUT → complete → create job → poll → download | Job `done`, valid `%PDF` output, friendly filename |
| E2E-02 | Same flow in a real browser (SSE-driven queue) | Session item `DONE`, `Download` link present |
| E2E-03 | Client-side image→pdf in browser | Session item `DONE`, blob download link |
