import { NextRequest } from "next/server";
import { apiError, apiJson, guardRateLimit, rateHeaders } from "@/lib/api";
import { getJobForApi } from "@/lib/jobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/v1/jobs/:id — job + task status, outputs with 60 s download URLs. */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardRateLimit(request);
  if (guard instanceof Response) return guard;

  const job = await getJobForApi(params.id);
  if (!job) return apiError("NOT_FOUND", "Job not found", 404);

  return apiJson(job, { headers: rateHeaders(guard.rate) });
}
