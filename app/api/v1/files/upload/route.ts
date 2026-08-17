import { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiJson, getIdentity, guardRateLimit, rateHeaders, uuid } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import { detectFormat, conversionsFrom } from "@/lib/conversions";
import { env } from "@/lib/env";
import { retentionUntil } from "@/lib/retention";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().optional().nullable(),
  sizeBytes: z.number().int().positive(),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/i).optional().nullable(),
});

/** POST /api/v1/files/upload — validate, create File row, return presigned upload URL. */
export async function POST(request: NextRequest) {
  const guard = await guardRateLimit(request);
  if (guard instanceof Response) return guard;

  let body;
  try {
    body = schema.parse(await request.json());
  } catch {
    return apiError("INVALID_DATA", "Invalid upload request", 422);
  }

  const format = detectFormat(body.filename, body.mimeType);
  if (!format) {
    return apiError("UNSUPPORTED_FORMAT", `Unsupported file type: ${body.filename}`, 415);
  }

  const maxForFormat = Math.max(...conversionsFrom(format).map((c) => c.maxSizeMB), 25);
  if (body.sizeBytes > maxForFormat * 1024 * 1024) {
    return apiError("FILE_TOO_LARGE", `File exceeds the ${maxForFormat} MB limit for this format`, 413, {
      maxSizeMB: maxForFormat,
    });
  }

  // Generate file ID and storage key upfront to avoid race conditions
  const fileId = uuid();
  const storageKey = `files/${fileId}/${fileId}.${body.filename.split(".").pop()}`;
  
  const file = await prisma.file.create({
    data: {
      id: fileId,
      storageKey,
      filename: body.filename,
      mimeType: body.mimeType ?? mimeFor(format),
      sizeBytes: body.sizeBytes,
      checksumSha256: body.checksumSha256 ?? null,
      status: "uploading",
      retentionUntil: retentionUntil(null),
    },
  });

  const upload = await getStorage().createUploadUrl(storageKey, {
    mimeType: body.mimeType ?? mimeFor(format),
    sizeBytes: body.sizeBytes,
  });

  return apiJson(
    {
      fileId: file.id,
      uploadUrl: upload.uploadUrl,
      method: upload.method,
      headers: upload.headers,
      expiresAt: upload.expiresAt,
      format,
    },
    { headers: rateHeaders(guard.rate) }
  );
}

function mimeFor(format: string): string {
  const map: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ppt: "application/vnd.ms-powerpoint",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel",
    csv: "text/csv",
    txt: "text/plain",
    md: "text/markdown",
    html: "text/html",
    rtf: "application/rtf",
    epub: "application/epub+zip",
    png: "image/png",
    jpg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
  };
  return map[format] ?? "application/octet-stream";
}
