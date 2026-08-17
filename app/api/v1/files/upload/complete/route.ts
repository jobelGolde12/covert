import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiJson, guardRateLimit } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({ fileId: z.string().uuid() });

/** POST /api/v1/files/upload/complete — verify the object exists, mark ready. */
export async function POST(request: NextRequest) {
  const guard = await guardRateLimit(request);
  if (guard instanceof Response) return guard;

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return apiError("INVALID_DATA", "Invalid request", 422);
  }

  const file = await prisma.file.findUnique({ where: { id: body.fileId } });
  if (!file) return apiError("NOT_FOUND", "File not found", 404);
  if (file.status === "ready" || file.status === "done") {
    return apiJson({ fileId: file.id, status: file.status });
  }

  const check = await getStorage().completeUpload(file.storageKey);
  if (!check.exists) {
    return apiError("CONFLICT_STATE", "Uploaded object not found — did the upload complete?", 409);
  }

  const updated = await prisma.file.update({
    where: { id: file.id },
    data: {
      status: "ready",
      sizeBytes: check.sizeBytes || file.sizeBytes,
      checksumSha256: check.checksumSha256 || file.checksumSha256 || null,
    },
  });

  return apiJson({ fileId: updated.id, status: updated.status, sizeBytes: updated.sizeBytes });
}
