// Runs before each test file imports modules — set env first so Prisma and
// the storage layer pick up the test configuration.
process.env.DATABASE_URL = "file:./tests/test.db";
process.env.UPLOAD_SECRET = "test-secret";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.REDIS_URL = process.env.TEST_REDIS_URL ?? "redis://127.0.0.1:6399";
process.env.LO_PROFILE_ROOT = "/tmp/lo-test-profiles";
