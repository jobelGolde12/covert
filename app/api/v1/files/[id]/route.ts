import { NextRequest } from "next/server";
import { apiError, apiJson, getIdentity, guardRateLimit } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/v1/files/:id — metadata + short-lived download URL. */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardRateLimit(request);
  if (guard instanceof Response) return guard;

  const file = await prisma.file.findUnique({ where: { id: params.id } });
  if (!file) return apiError("NOT_FOUND", "File not found", 404);

  return apiJson({
    id: file.id,
    filename: file.filename,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    status: file.status,
    format: file.filename.split(".").pop(),
    createdAt: file.createdAt,
    retentionUntil: file.retentionUntil,
    downloadUrl: file.status === "done" ? await getStorage().createDownloadUrl(file.storageKey, 60) : null,
  });
}

/** DELETE /api/v1/files/:id — immediate deletion. */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardRateLimit(request);
  if (guard instanceof Response) return guard;

  const file = await prisma.file.findUnique({ where: { id: params.id } });
  if (!file) return apiError("NOT_FOUND", "File not found", 404);

  await getStorage().deleteObject(file.storageKey);
  await prisma.file.update({ where: { id: file.id }, data: { deletedAt: new Date(), status: "expired" } });
  return apiJson({ deleted: true });
}
