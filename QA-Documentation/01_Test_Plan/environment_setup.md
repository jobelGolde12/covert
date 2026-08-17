# Environment Setup

Reproducible steps for replicating this QA run.

## 1. Prerequisites

- Node.js ≥ 20 (run verified on v22.23.1)
- pnpm (verified v11.20.0)
- LibreOffice headless (`soffice`) on PATH — verified 24.2.7.2
- Redis server (verified 7.0.15) reachable on `REDIS_URL` (default `redis://127.0.0.1:6379`)

## 2. Install & initialize

```bash
pnpm install                 # postinstall copies the pdfjs worker
pnpm db:generate             # prisma generate
pnpm db:migrate              # prisma migrate dev (or db:push for schema-only)
```

`predev`/`prebuild` run `node scripts/copy-pdfjs-worker.mjs` automatically.

> **Note for this machine**: `DATABASE_URL` must resolve the SQLite file relative to the Prisma schema directory. The correct value is `file:./dev.db` (resolves to `prisma/dev.db`). A value of `file:./prisma/dev.db` causes Prisma to look in `prisma/prisma/dev.db` and fail all database access with `PrismaClientInitializationError` (code 14). This was the environment bug fixed before this QA run began.

## 3. Start services

```bash
# dev server
nohup pnpm dev > /tmp/convert-dev.log 2>&1 & disown

# queue worker (requires Redis + soffice)
nohup pnpm worker:office > /tmp/convert-office.log 2>&1 & disown

# retention sweeper
nohup pnpm worker:sweeper > /tmp/convert-sweeper.log 2>&1 & disown
```

Readiness checks:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/          # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/convert   # 200
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/v1/formats  # 200
redis-cli ping                                                           # PONG
soffice --version                                                        # LibreOffice 24.2...
```

Expected worker logs:

```
[office] worker started — concurrency 1, redis redis://127.0.0.1:6379
[sweeper] removed N expired records
```

## 4. Verification gates

```bash
CI=true pnpm typecheck   # tsc --noEmit — clean
CI=true pnpm lint        # next lint — 0 warnings
CI=true pnpm test        # Vitest — 35 passed (5 files, 16.36 s)
CI=true pnpm build       # next build — compiled, 6 static pages, no warnings
CI=true pnpm audit --json
```

> `CI=true` is required in this environment: bare pnpm aborts on module-directory touches without a TTY.
> **Do not run `next build` while `next dev` is running** — the build replaces `.next`, and the running dev server then serves stale/404 chunk paths until restarted (observed during this run; a dev-server restart resolved it).

## 5. Test identity / rate-limit hygiene

- Anonymous throttles are keyed per IP (`ANON_REQ_PER_MIN=60`) and per day (`ANON_CONVERSIONS_PER_DAY=5`), persisted in Redis under `daily:*` / `rl:*`.
- A long session accumulates quota; to reset between browser/API passes:
  ```bash
  redis-cli --scan --pattern 'daily:*' | xargs -r redis-cli del
  redis-cli --scan --pattern 'rl:*'    | xargs -r redis-cli del
  ```
- Local browser requests present as IPv6 loopback (`::1`); curl as `::1` too. Spoofed `X-Forwarded-For` values create independent buckets (see security findings).

## 6. Known environment quirks

- Shell commands containing `pkill`/`fuser` occasionally hang in this environment; use short timeouts or `pgrep` + targeted `kill`.
- `agent-browser click` by accessibility ref sometimes fails to register on buttons that are followed by dynamic re-renders; the DOM `.click()` path via `eval` is a reliable fallback and was used for the conversion-flow tests.
