import { Queue } from "bullmq";
import Redis from "ioredis";
import { env } from "@/lib/env";

/**
 * Bull queue for the office worker — documentation/architecture.md §3.
 * API routes only persist intent and enqueue; workers claim and convert.
 * If Redis is unreachable we fall back to inline execution so the whole
 * system still works in a bare local environment.
 */

let connection: Redis | null = null;
let queue: Queue | null = null;
let queueFailed = false;

function getConnection(): Redis | null {
  if (connection) return connection;
  if (queueFailed) return null;
  try {
    connection = new Redis(env.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      connectTimeout: 1500,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });
    connection.on("error", () => {
      queueFailed = true;
    });
    return connection;
  } catch {
    queueFailed = true;
    return null;
  }
}

export function getQueue(): Queue | null {
  if (queue) return queue;
  const conn = getConnection();
  if (!conn) return null;
  try {
    queue = new Queue("office", { connection: conn });
    return queue;
  } catch {
    return null;
  }
}

export interface EnqueueResult {
  mode: "queue" | "inline";
}

/**
 * Enqueue a job for the office worker. On Redis failure, resolves with
 * mode "inline" — callers then run the job in-process.
 */
export async function enqueueOfficeJob(jobId: string, payload: Record<string, unknown>): Promise<EnqueueResult> {
  const q = getQueue();
  if (q) {
    try {
      await q.add("convert", { jobId, ...payload }, { jobId, priority: 0, removeOnComplete: 1000, removeOnFail: 1000 });
      return { mode: "queue" };
    } catch {
      /* fall through */
    }
  }
  return { mode: "inline" };
}

/** True when a Bull worker is expected to be running (Redis reachable). */
export function queueAvailable(): boolean {
  return getQueue() !== null;
}
