import { NextRequest } from "next/server";
import { apiError, apiJson, guardRateLimit, rateHeaders } from "@/lib/api";
import { cancelJob } from "@/lib/jobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/v1/jobs/:id/cancel — only queued/processing jobs can be cancelled. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardRateLimit(request);
  if (guard instanceof Response) return guard;

  const cancelled = await cancelJob(params.id);
  if (!cancelled) return apiError("JOB_NOT_CANCELLABLE", "Job cannot be cancelled in its current state", 409);

  return apiJson({ id: params.id, status: "cancelled" }, { headers: rateHeaders(guard.rate) });
}
