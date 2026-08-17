import "dotenv/config";
import { Worker } from "bullmq";
import Redis from "ioredis";
import { processOfficeJob } from "../../lib/jobs";
import { runRetentionSweep } from "../sweeper/sweep";

/**
 * Office worker — documentation/architecture.md §5.
 * One LibreOffice conversion at a time per container (LO_CONCURRENCY=1).
 * Also runs the retention sweeper on an interval.
 *
 * Run: pnpm worker:office   (requires Redis; soffice on PATH)
 */

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const CONCURRENCY = Number(process.env.LO_CONCURRENCY ?? "1");
const SWEEP_INTERVAL_MS = Number(process.env.SWEEP_INTERVAL_MS ?? (15 * 60 * 1000));

const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

const worker = new Worker(
  "office",
  async (job) => {
    console.log(`[office] job ${job.id} started (${job.data.jobId})`);
    await processOfficeJob(job.data.jobId as string, job.data.guestId as string | undefined);
    console.log(`[office] job ${job.id} finished`);
  },
  { connection, concurrency: CONCURRENCY }
);

worker.on("failed", (job, err) => {
  console.error(`[office] job ${job?.id} failed:`, err.message);
});
worker.on("error", (err) => {
  console.error("[office] worker error:", err.message);
});

console.log(`[office] worker started — concurrency ${CONCURRENCY}, redis ${REDIS_URL}`);

// retention sweeper (documentation/database-schema.md §6)
setInterval(async () => {
  try {
    const n = await runRetentionSweep();
    if (n) console.log(`[office] retention sweep removed ${n} expired files`);
  } catch (err) {
    console.error("[office] retention sweep failed:", err);
  }
}, SWEEP_INTERVAL_MS).unref();

process.on("SIGTERM", async () => {
  console.log("[office] shutting down");
  await worker.close();
  process.exit(0);
});
