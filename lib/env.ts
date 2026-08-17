/** Centralized config — mirrors documentation/technical-specifications.md §5. */

function int(name: string, fallback: number): number {
  const v = process.env[name];
  const n = v ? Number.parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "file:./dev.db",
  redisUrl: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  uploadSecret: process.env.UPLOAD_SECRET ?? "dev-only-change-me",

  retentionHours: {
    anon: int("RETENTION_ANON_HOURS", 1),
    free: int("RETENTION_FREE_HOURS", 24),
    paid: int("RETENTION_PAID_HOURS", 24 * 7),
  },

  limits: {
    anonConversionsPerDay: int("ANON_CONVERSIONS_PER_DAY", 5),
    anonReqPerMin: int("ANON_REQ_PER_MIN", 60),
  },

  lo: {
    concurrency: int("LO_CONCURRENCY", 1),
    timeoutMs: int("LO_TIMEOUT_MS", 15 * 60 * 1000),
    profileRoot: process.env.LO_PROFILE_ROOT ?? "/tmp/lo-profiles",
  },

  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET ?? "convert-files",
    publicUrl: process.env.R2_PUBLIC_URL,
  },

  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  isProd: process.env.NODE_ENV === "production",
};
