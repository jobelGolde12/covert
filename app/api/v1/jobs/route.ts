import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiJson, getIdentity, guardRateLimit, rateHeaders, uuid } from "@/lib/api";
import { prisma } from "@/lib/db";
import { createServerJob } from "@/lib/jobs";
import { processOfficeJob } from "@/lib/jobs";
import { enqueueOfficeJob } from "@/lib/queue";
import { incrementDaily } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const taskSchema = z.object({
  operation: z.literal("convert"),
  input: z.string().uuid(),
  outputFormat: z.string().min(1).max(10),
  options: z.record(z.unknown()).optional(),
});

const schema = z.object({
  tasks: z.array(taskSchema).min(1).max(1),
});

/** POST /api/v1/jobs — create a server-side conversion job and enqueue it. */
export async function POST(request: NextRequest) {
  const guard = await guardRateLimit(request);
  if (guard instanceof Response) return guard;

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return apiError("INVALID_DATA", "Invalid job payload — expected one convert task", 422);
  }

  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (idempotencyKey) {
    const existing = await prisma.job.findUnique({ where: { idempotencyKey } });
    if (existing) {
      return apiJson({ id: existing.id, status: existing.status, idempotent: true });
    }
  }

  // Validate job spec first before consuming quota
  let created;
  try {
    created = await createServerJob(body.tasks, { idempotencyKey: idempotencyKey ?? undefined });
  } catch (err) {
    if (err instanceof Error) {
      const code = (err as { code?: string }).code;
      if (code === "NOT_FOUND") return apiError("NOT_FOUND", err.message, 404);
      if (code === "UNSUPPORTED_FORMAT") return apiError("UNSUPPORTED_FORMAT", err.message, 415);
      if (code === "UNSUPPORTED_CONVERSION") return apiError("UNSUPPORTED_CONVERSION", err.message, 422);
      if (code === "CONFLICT_STATE") return apiError("CONFLICT_STATE", err.message, 409);
      if (code === "INVALID_DATA") return apiError("INVALID_DATA", err.message, 422);
    }
    return apiError("INVALID_DATA", err instanceof Error ? err.message : "Invalid job", 422);
  }

  // anonymous daily conversion quota (documentation/api-documentation.md §2)
  const daily = await incrementDaily(guard.identity.guestId);
  if (!daily.ok) {
    return apiError("QUOTA_EXCEEDED", `Daily conversion limit reached (${daily.remaining} remaining)`, 402, {
      remaining: daily.remaining,
    });
  }

  const { job } = created;
  const enqueued = await enqueueOfficeJob(job.id, { jobId: job.id, guestId: guard.identity.guestId });

  // Always run inline as a fallback — if a BullMQ worker picks it up first,
  // processOfficeJob will see status !== "queued" and exit immediately.
  // This ensures the demo works end-to-end without a separate worker process.
  void processOfficeJob(job.id, guard.identity.guestId).catch(async (err) => {
    // If the inline processing crashes before updating the job, mark it as failed
    // so the UI doesn't spin forever.
    try {
      const current = await prisma.job.findUnique({ where: { id: job.id } });
      if (current && current.status === "queued") {
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: "error",
            errorCode: "INTERNAL",
            errorMessage: err instanceof Error ? err.message : "Conversion failed",
            endedAt: new Date(),
          },
        });
      }
    } catch {
      /* best-effort — nothing more we can do */
    }
  });

  return apiJson(
    {
      id: job.id,
      status: "queued",
      queueMode: enqueued.mode,
      conversion: {
        id: created.conversion.id,
        label: created.conversion.label,
        location: created.conversion.location,
      },
      createdAt: job.createdAt,
    },
    { headers: rateHeaders(guard.rate) }
  );
}

/** GET /api/v1/jobs?limit=&cursor= — paged list (newest first). */
export async function GET(request: NextRequest) {
  const guard = await guardRateLimit(request);
  if (guard instanceof Response) return guard;

  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? "20") || 20, 50);
  const cursor = request.nextUrl.searchParams.get("cursor");

  let cursorWhere = {};
  if (cursor) {
    const [ts, id] = cursor.split(":");
    const time = Number(ts);
    if (Number.isFinite(time) && id) {
      cursorWhere = { OR: [{ createdAt: { lt: new Date(time) } }, { createdAt: new Date(time), id: { lt: id } }] };
    }
  }

  const jobs = await prisma.job.findMany({
    where: cursorWhere,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: { tasks: { select: { id: true, operation: true, status: true, progress: true } } },
  });

  const hasMore = jobs.length > limit;
  const page = hasMore ? jobs.slice(0, limit) : jobs;
  const last = page[page.length - 1];

  return apiJson(
    {
      jobs: page.map((j) => ({
        id: j.id,
        status: j.status,
        error: j.errorCode ? { code: j.errorCode, message: j.errorMessage } : null,
        createdAt: j.createdAt,
        tasks: j.tasks,
      })),
      nextCursor: hasMore && last ? `${last.createdAt.getTime()}:${last.id}` : null,
    },
    { headers: rateHeaders(guard.rate) }
  );
}
