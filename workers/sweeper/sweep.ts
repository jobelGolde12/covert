import { prisma } from "../../lib/db";
import { getStorage } from "../../lib/storage";

/**
 * Retention sweep — documentation/database-schema.md §6, security.md §7.1.
 * Deletes expired files (object + row) and archives old job records.
 */
export async function runRetentionSweep(opts: { now?: Date } = {}): Promise<number> {
  const now = opts.now ?? new Date();
  const storage = getStorage();

  // 1. Expired files (status ready/done/error past retentionUntil)
  const expired = await prisma.file.findMany({
    where: {
      status: { in: ["ready", "done", "error"] },
      retentionUntil: { lt: now },
      deletedAt: null,
    },
    take: 500,
    select: { id: true, storageKey: true },
  });

  for (const file of expired) {
    await storage.deleteObject(file.storageKey).catch(() => {});
    await prisma.file.update({ where: { id: file.id }, data: { status: "expired", deletedAt: now } }).catch(() => {});
  }

  // 2. Old terminal jobs (90 days) — hard delete rows + their tasks
  const cutoff = new Date(now.getTime() - 90 * 24 * 3600_000);
  const oldJobs = await prisma.job.findMany({
    where: { status: { in: ["done", "error", "cancelled"] }, endedAt: { lt: cutoff } },
    take: 200,
    select: { id: true },
  });
  for (const job of oldJobs) {
    await prisma.task.deleteMany({ where: { jobId: job.id } }).catch(() => {});
    await prisma.job.delete({ where: { id: job.id } }).catch(() => {});
  }

  return expired.length + oldJobs.length;
}
